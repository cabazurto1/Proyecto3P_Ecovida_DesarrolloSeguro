const express = require('express');
const jwt = require('jsonwebtoken'); // Para manejar tokens
const axios = require('axios'); // Para solicitudes HTTP
const Joi = require('joi'); // Validación de datos
const router = express.Router();
const { Client } = require('pg');

let jwtSecret; // Variable para almacenar la clave JWT dinámica

// Configuración para la conexión a PostgreSQL
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
client.connect();

// Función para obtener la clave JWT dinámica desde usuarios_service
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

// Middleware para autorizar roles
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).send('Acceso denegado. No tienes permiso para realizar esta acción.');
    }
    next();
  };
};

// Ruta para obtener todos los envíos (solo administradores)
router.get('/', authenticateToken, authorizeRoles(['Administrador']), async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM envios');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener los envíos:', err);
    res.status(500).send('Error en el servidor.');
  }
});

// Ruta para crear un envío
router.post('/', authenticateToken, authorizeRoles(['Administrador']), async (req, res) => {
  const envioSchema = Joi.object({
    pedido_id: Joi.number().integer().required(),
    direccion: Joi.string().min(5).required(),
  });

  const { error } = envioSchema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { pedido_id, direccion } = req.body;

  try {
    const result = await client.query(
      'INSERT INTO envios (pedido_id, direccion, estado) VALUES ($1, $2, $3) RETURNING *',
      [pedido_id, direccion, 'En Proceso']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al crear el envío:', err);
    res.status(500).send('Error en el servidor.');
  }
});

// Ruta para actualizar un estado de envío
router.put('/:id', authenticateToken, authorizeRoles(['Administrador']), async (req, res) => {
  const estadoSchema = Joi.object({
    estado: Joi.string().valid('En Proceso', 'Enviado', 'Entregado').required(),
  });

  const { error } = estadoSchema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { id } = req.params;
  const { estado } = req.body;

  try {
    const result = await client.query(
      'UPDATE envios SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Envío no encontrado.');
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar el envío:', err);
    res.status(500).send('Error en el servidor.');
  }
});

module.exports = router;
