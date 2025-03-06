const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // Para comunicación con otros microservicios
const Joi = require('joi'); // Para validaciones
const router = express.Router();
const { Client } = require('pg');

let jwtSecret; // Almacenar dinámicamente el JWT_SECRET

// Configuración para la conexión a la base de datos PostgreSQL
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
client.connect();

// Función para obtener la clave JWT desde usuarios_service
const fetchJwtSecret = async () => {
  try {
    const response = await axios.get('http://usuarios_service:3004/usuarios/jwt-secret');
    jwtSecret = response.data.secret;
    console.log('JWT Secret obtenido dinámicamente:', jwtSecret);
  } catch (error) {
    console.error('Error al obtener JWT Secret desde usuarios_service:', error.message);
    throw new Error('No se pudo obtener el JWT Secret');
  }
};

// Middleware para autenticar el token
const authenticateToken = async (req, res, next) => {
  if (!jwtSecret) {
    try {
      await fetchJwtSecret(); // Obtener el JWT_SECRET si no está disponible
    } catch (error) {
      return res.status(500).send('Error interno al verificar el token.');
    }
  }

  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Acceso denegado. No se proporcionó un token.');

  jwt.verify(token.split(' ')[1], jwtSecret, (err, user) => {
    if (err) return res.status(403).send('Token inválido.');
    req.user = user; // Adjuntar el usuario decodificado al objeto `req`
    next();
  });
};

// Validación de datos con Joi
const carritoSchema = Joi.object({
  producto_id: Joi.number().integer().positive().required().messages({
    'number.base': 'El campo "producto_id" debe ser un número entero.',
    'number.integer': 'El campo "producto_id" debe ser un número entero.',
    'number.positive': 'El campo "producto_id" debe ser mayor a 0.',
    'any.required': 'El campo "producto_id" es obligatorio.',
  }),
  cantidad: Joi.number().integer().positive().min(1).required().messages({
    'number.base': 'El campo "cantidad" debe ser un número entero.',
    'number.integer': 'El campo "cantidad" debe ser un número entero.',
    'number.positive': 'El campo "cantidad" debe ser mayor a 0.',
    'number.min': 'El campo "cantidad" debe ser al menos 1.',
    'any.required': 'El campo "cantidad" es obligatorio.',
  }),
});

// Ruta para obtener todos los items del carrito del usuario autenticado
router.get('/', authenticateToken, async (req, res) => {
  try {
    const carritoItems = await client.query(
      'SELECT carrito.*, productos.nombre, productos.precio FROM carrito JOIN productos ON carrito.producto_id = productos.id WHERE usuario_id = $1',
      [req.user.id]
    );

    // Calcular el precio total dinámicamente
    const items = carritoItems.rows.map(item => ({
      ...item,
      precio_total: item.precio * item.cantidad,
    }));

    res.json(items);
  } catch (err) {
    console.error('Error al obtener el carrito', err);
    res.status(500).send('Error en el servidor.');
  }
});

// Ruta para agregar un producto al carrito
router.post('/', authenticateToken, async (req, res) => {
  const { error } = carritoSchema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { producto_id, cantidad } = req.body;

  try {
    // Verificar si el producto existe y tiene suficiente stock
    const productoResponse = await axios.get(`http://productos_service:3001/productos/${producto_id}`);
    const producto = productoResponse.data;

    if (producto.stock < cantidad) {
      return res.status(400).send('No hay suficiente stock disponible.');
    }

    // Verificar si el producto ya está en el carrito
    const existingItem = await client.query(
      'SELECT * FROM carrito WHERE usuario_id = $1 AND producto_id = $2',
      [req.user.id, producto_id]
    );

    if (existingItem.rows.length > 0) {
      // Actualizar la cantidad del producto existente
      const newQuantity = existingItem.rows[0].cantidad + cantidad;

      await client.query(
        'UPDATE carrito SET cantidad = $1 WHERE usuario_id = $2 AND producto_id = $3',
        [newQuantity, req.user.id, producto_id]
      );
      return res.status(200).send('Cantidad actualizada en el carrito.');
    }

    // Agregar el producto al carrito
    await client.query(
      'INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES ($1, $2, $3)',
      [req.user.id, producto_id, cantidad]
    );

    res.status(201).send('Producto agregado al carrito.');
  } catch (err) {
    console.error('Error al agregar al carrito', err);
    res.status(500).send('Error en el servidor.');
  }
});

// Ruta para actualizar un producto en el carrito
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  const { error } = carritoSchema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { cantidad } = req.body;

  try {
    const carritoItem = await client.query('SELECT * FROM carrito WHERE id = $1 AND usuario_id = $2', [id, req.user.id]);

    if (carritoItem.rows.length === 0) {
      return res.status(404).send('Producto no encontrado en el carrito.');
    }

    const productoResponse = await axios.get(`http://productos_service:3001/productos/${carritoItem.rows[0].producto_id}`);
    const producto = productoResponse.data;

    if (producto.stock < cantidad) {
      return res.status(400).send('No hay suficiente stock disponible.');
    }

    await client.query(
      'UPDATE carrito SET cantidad = $1 WHERE id = $2',
      [cantidad, id]
    );

    res.status(200).send('Carrito actualizado.');
  } catch (err) {
    console.error('Error al actualizar el carrito', err);
    res.status(500).send('Error en el servidor.');
  }
});

// Ruta para eliminar un producto del carrito
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await client.query('DELETE FROM carrito WHERE id = $1 AND usuario_id = $2 RETURNING *', [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).send('Producto no encontrado en el carrito.');
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error al eliminar el producto del carrito', err);
    res.status(500).send('Error en el servidor.');
  }
});

module.exports = router;
