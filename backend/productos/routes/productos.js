const express = require('express');
const jwt = require('jsonwebtoken'); // Para manejar tokens
const Joi = require('joi'); // Para validar datos de entrada
const axios = require('axios'); // Para solicitudes HTTP
const router = express.Router();
const { Client } = require('pg');

let jwtSecret; // Variable para almacenar la clave JWT dinámica

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

// Middleware para verificar el token
const authenticateToken = async (req, res, next) => {
  if (!jwtSecret) {
    try {
      await fetchJwtSecret(); // Obtener la clave JWT si no está disponible
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

// Middleware para verificar roles
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).send('Acceso denegado. No tienes permiso para realizar esta acción.');
    }
    next();
  };
};

// Validación de datos con Joi
const productSchema = Joi.object({
  nombre: Joi.string().required(),
  descripcion: Joi.string().allow(''),
  precio: Joi.number().positive().required(),
  categoria: Joi.string().allow(''),
  stock: Joi.number().integer().required(),
  imagenes: Joi.array().items(Joi.string()).optional(),
});

// Ruta para obtener todos los productos (acceso público)
router.get('/', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM productos');
    res.json(result.rows);
  } catch (err) {
    console.error('Error en la consulta', err);
    res.status(500).send('Error en el servidor');
  }
});

// Ruta para agregar un nuevo producto (solo Administrador o Vendedor)
router.post('/', authenticateToken, authorizeRoles(['Administrador', 'Vendedor']), async (req, res) => {
  const { error } = productSchema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { nombre, descripcion, precio, categoria, stock, imagenes } = req.body;

  try {
    const result = await client.query(
      'INSERT INTO productos (nombre, descripcion, precio, categoria, stock, imagenes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nombre, descripcion, precio, categoria, stock, JSON.stringify(imagenes)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al insertar el producto', err);
    res.status(500).send('Error en el servidor');
  }
});

// Ruta para actualizar un producto (solo Administrador o Vendedor)
router.put('/:id', authenticateToken, authorizeRoles(['Administrador', 'Vendedor']), async (req, res) => {
  const { id } = req.params;

  const { error } = productSchema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { nombre, descripcion, precio, categoria, stock, imagenes } = req.body;

  try {
    const result = await client.query(
      'UPDATE productos SET nombre = $1, descripcion = $2, precio = $3, categoria = $4, stock = $5, imagenes = $6 WHERE id = $7 RETURNING *',
      [nombre, descripcion, precio, categoria, stock, JSON.stringify(imagenes), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Producto no encontrado');
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar el producto', err);
    res.status(500).send('Error en el servidor');
  }
});

// Ruta para eliminar un producto (solo Administrador)
router.delete('/:id', authenticateToken, authorizeRoles(['Administrador', 'Vendedor']), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await client.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).send('Producto no encontrado');
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error al eliminar el producto', err);
    res.status(500).send('Error en el servidor');
  }
});

// Ruta para obtener un producto por su ID (acceso público)
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await client.query('SELECT * FROM productos WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).send('Producto no encontrado');
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en la consulta', err);
    res.status(500).send('Error en el servidor');
  }
});

module.exports = router;
