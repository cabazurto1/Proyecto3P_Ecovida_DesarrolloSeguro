const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const axios = require('axios');
const router = express.Router();
const { Client } = require('pg');

let jwtSecret;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
client.connect();

// Obtener clave JWT de usuarios_service
const fetchJwtSecret = async () => {
  try {
    const response = await axios.get('http://usuarios_service:3004/usuarios/jwt-secret');
    jwtSecret = response.data.secret;
    console.log('JWT Secret:', jwtSecret);
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
      return res.status(500).json({ error: 'Error interno al verificar token.' });
    }
  }

  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Acceso denegado. No hay token.' });

  jwt.verify(token.split(' ')[1], jwtSecret, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido.' });
    req.user = user;
    next();
  });
};

const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción.' });
    }
    next();
  };
};

// Aseguramos que precio > 0 y stock > 0
const productSchema = Joi.object({
  nombre: Joi.string().min(1).required().messages({
    'string.empty': 'El nombre no puede estar vacío.',
    'any.required': 'El nombre es obligatorio.'
  }),
  descripcion: Joi.string().allow(''),
  precio: Joi.number().greater(0).required().messages({
    'number.base': 'El precio debe ser un número.',
    'number.greater': 'El precio debe ser mayor que 0.',
    'any.required': 'El precio es obligatorio.'
  }),
  categoria: Joi.string().allow(''),
  stock: Joi.number().integer().greater(0).required().messages({
    'number.base': 'El stock debe ser un número entero.',
    'number.greater': 'El stock debe ser mayor que 0.',
    'any.required': 'El stock es obligatorio.'
  }),
  imagenes: Joi.array().items(Joi.string()).optional(),
});

// Obtener todos los productos (público)
router.get('/', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM productos');
    res.json(result.rows);
  } catch (err) {
    console.error('Error en la consulta', err);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

// Crear producto (Administrador / Vendedor)
router.post('/', authenticateToken, authorizeRoles(['Administrador', 'Vendedor']), async (req, res) => {
  const { error } = productSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { nombre, descripcion, precio, categoria, stock, imagenes } = req.body;

  try {
    const result = await client.query(
      'INSERT INTO productos (nombre, descripcion, precio, categoria, stock, imagenes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nombre, descripcion, precio, categoria, stock, JSON.stringify(imagenes)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al insertar producto', err);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

// Actualizar producto (Administrador / Vendedor)
router.put('/:id', authenticateToken, authorizeRoles(['Administrador', 'Vendedor']), async (req, res) => {
  const { id } = req.params;
  const { error } = productSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { nombre, descripcion, precio, categoria, stock, imagenes } = req.body;

  try {
    const result = await client.query(
      'UPDATE productos SET nombre = $1, descripcion = $2, precio = $3, categoria = $4, stock = $5, imagenes = $6 WHERE id = $7 RETURNING *',
      [nombre, descripcion, precio, categoria, stock, JSON.stringify(imagenes), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar producto', err);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

// Eliminar producto (Administrador, Vendedor)
router.delete('/:id', authenticateToken, authorizeRoles(['Administrador', 'Vendedor']), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await client.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error al eliminar producto', err);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

// Obtener producto por ID (público)
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await client.query('SELECT * FROM productos WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error en la consulta', err);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

module.exports = router;
