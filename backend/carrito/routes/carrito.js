const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const Joi = require('joi');
const router = express.Router();
const { Client } = require('pg');

let jwtSecret;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
client.connect();

const fetchJwtSecret = async () => {
  try {
    const response = await axios.get('http://usuarios_service:3004/usuarios/jwt-secret');
    jwtSecret = response.data.secret;
  } catch (error) {
    console.error('Error al obtener JWT Secret:', error.message);
    throw new Error('No se pudo obtener el JWT Secret');
  }
};

const authenticateToken = async (req, res, next) => {
  if (!jwtSecret) {
    try {
      await fetchJwtSecret();
    } catch (error) {
      return res.status(500).json({ error: 'Error interno al verificar el token.' });
    }
  }

  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'No se proporcionó token.' });

  jwt.verify(token.split(' ')[1], jwtSecret, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido.' });
    req.user = user;
    next();
  });
};

// Validar datos al agregar/actualizar
const carritoSchema = Joi.object({
  producto_id: Joi.number().integer().positive().required(),
  cantidad: Joi.number().integer().positive().min(1).required(),
});

// Obtener items del carrito
// Ejemplo: GET /carrito
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT c.id, c.usuario_id, c.producto_id, c.cantidad,
             p.nombre, p.precio, p.stock, p.categoria, p.imagenes
      FROM carrito c
      JOIN productos p ON c.producto_id = p.id
      WHERE c.usuario_id = $1
    `;
    const result = await client.query(query, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener carrito', err);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

// Agregar producto al carrito
router.post('/', authenticateToken, async (req, res) => {
  const { error } = carritoSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { producto_id, cantidad } = req.body;

  try {
    // Verificar stock en productos
    const productoRes = await client.query('SELECT * FROM productos WHERE id = $1', [producto_id]);
    if (productoRes.rows.length === 0) {
      return res.status(404).json({ error: 'El producto no existe.' });
    }
    const producto = productoRes.rows[0];
    if (producto.stock < cantidad) {
      return res.status(400).json({ error: `No hay suficiente stock. Stock disponible: ${producto.stock}` });
    }

    // Ver si ya está en el carrito
    const existe = await client.query(
      'SELECT * FROM carrito WHERE usuario_id = $1 AND producto_id = $2',
      [req.user.id, producto_id]
    );
    if (existe.rows.length > 0) {
      // Actualizamos la cantidad
      const nuevaCantidad = existe.rows[0].cantidad + cantidad;
      if (nuevaCantidad > producto.stock) {
        return res
          .status(400)
          .json({ error: `No hay suficiente stock para sumar esa cantidad. Stock disponible: ${producto.stock}` });
      }

      await client.query(
        'UPDATE carrito SET cantidad = $1 WHERE id = $2',
        [nuevaCantidad, existe.rows[0].id]
      );
      return res.status(200).json({ message: 'Cantidad actualizada en el carrito.' });
    }

    // Insertar nuevo
    await client.query(
      'INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES ($1, $2, $3)',
      [req.user.id, producto_id, cantidad]
    );

    res.status(201).json({ message: 'Producto agregado al carrito.' });
  } catch (err) {
    console.error('Error al agregar al carrito:', err);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

// Actualizar cantidad
router.put('/:id', authenticateToken, async (req, res) => {
  // Aquí reutilizamos carritoSchema pero sin "producto_id"
  const { cantidad } = req.body;
  const schema = Joi.object({
    cantidad: Joi.number().integer().positive().required(),
  });
  const { error } = schema.validate({ cantidad });
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    // Primero buscamos el registro de carrito
    const cartItemRes = await client.query('SELECT * FROM carrito WHERE id = $1 AND usuario_id = $2', [req.params.id, req.user.id]);
    if (cartItemRes.rows.length === 0) {
      return res.status(404).json({ error: 'No se encontró el producto en tu carrito.' });
    }

    const cartItem = cartItemRes.rows[0];
    const productoRes = await client.query('SELECT * FROM productos WHERE id = $1', [cartItem.producto_id]);
    if (productoRes.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    const producto = productoRes.rows[0];

    if (cantidad > producto.stock) {
      return res.status(400).json({ error: `No hay suficiente stock. Stock disponible: ${producto.stock}` });
    }

    await client.query('UPDATE carrito SET cantidad = $1 WHERE id = $2', [cantidad, req.params.id]);
    res.json({ message: 'Carrito actualizado.' });
  } catch (err) {
    console.error('Error al actualizar el carrito', err);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

// Eliminar producto del carrito
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await client.query(
      'DELETE FROM carrito WHERE id = $1 AND usuario_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado en tu carrito.' });
    }
    res.status(200).json({ message: 'Producto eliminado del carrito.' });
  } catch (err) {
    console.error('Error al eliminar producto del carrito', err);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

module.exports = router;
