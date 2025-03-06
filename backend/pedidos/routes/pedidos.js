// pedidos/routes/pedidos.js
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

// Obtener clave JWT
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
      return res.status(500).json({ error: 'Error interno al verificar token.' });
    }
  }
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'No se proporcionó token.' });

  jwt.verify(token.split(' ')[1], jwtSecret, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido.' });
    req.user = user; // user.id, user.role, etc.
    next();
  });
};

const pedidoSchema = Joi.object({
  direccion_envio: Joi.string().min(5).required(),
});

// GET /pedidos – Retorna pedidos junto con sus productos
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query;
    let params;
    
    // Si es Cliente, solo sus pedidos; si es Admin, todos
    if (req.user.role === 'Cliente') {
      query = `
        SELECT p.*,
          -- Agrupamos detalles en un array JSON
          COALESCE(json_agg(
            json_build_object(
              'producto_id', d.producto_id,
              'cantidad', d.cantidad,
              'precio_unitario', d.precio,
              'nombre', prod.nombre
            )
          ) FILTER (WHERE d.id IS NOT NULL), '[]') AS items
        FROM pedidos p
        LEFT JOIN pedido_detalles d ON p.id = d.pedido_id
        LEFT JOIN productos prod ON d.producto_id = prod.id
        WHERE p.usuario_id = $1
        GROUP BY p.id
        ORDER BY p.id;
      `;
      params = [req.user.id];
    } else if (req.user.role === 'Administrador') {
      query = `
        SELECT p.*,
          COALESCE(json_agg(
            json_build_object(
              'producto_id', d.producto_id,
              'cantidad', d.cantidad,
              'precio_unitario', d.precio,
              'nombre', prod.nombre
            )
          ) FILTER (WHERE d.id IS NOT NULL), '[]') AS items
        FROM pedidos p
        LEFT JOIN pedido_detalles d ON p.id = d.pedido_id
        LEFT JOIN productos prod ON d.producto_id = prod.id
        GROUP BY p.id
        ORDER BY p.id;
      `;
      params = [];
    } else {
      return res.status(403).json({ error: 'Acceso denegado.' });
    }

    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener pedidos:', err);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

// POST /pedidos – Crear un pedido
router.post('/', authenticateToken, async (req, res) => {
  const { error } = pedidoSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  if (req.user.role !== 'Cliente' && req.user.role !== 'Administrador') {
    return res.status(403).json({ success: false, error: 'No tienes permisos para crear pedidos.' });
  }

  const usuario_id = req.user.id; // lo sacamos del token
  const { direccion_envio } = req.body;

  try {
    await client.query('BEGIN');

    // 1) Obtener carrito del usuario
    const carritoRes = await client.query(`
      SELECT c.producto_id, c.cantidad, p.precio, p.stock 
      FROM carrito c 
      JOIN productos p ON c.producto_id = p.id 
      WHERE c.usuario_id = $1
    `, [usuario_id]);

    if (carritoRes.rows.length === 0) {
      throw new Error('El carrito está vacío. No se puede crear pedido.');
    }

    // 2) Validar stock y calcular total
    let totalPedido = 0;
    for (const item of carritoRes.rows) {
      if (item.stock < item.cantidad) {
        throw new Error(`Stock insuficiente para el producto con ID ${item.producto_id}.`);
      }
      totalPedido += parseFloat(item.precio) * item.cantidad;

      // Descontar stock
      await client.query(
        'UPDATE productos SET stock = stock - $1 WHERE id = $2',
        [item.cantidad, item.producto_id]
      );
    }

    // 3) Crear pedido
    const pedidoRes = await client.query(`
      INSERT INTO pedidos (usuario_id, total, estado) 
      VALUES ($1, $2, $3) 
      RETURNING id
    `, [usuario_id, totalPedido, 'Pendiente']);
    const pedidoId = pedidoRes.rows[0].id;

    // 4) Copiar los items del carrito a pedido_detalles
    for (const item of carritoRes.rows) {
      await client.query(`
        INSERT INTO pedido_detalles (pedido_id, producto_id, cantidad, precio)
        VALUES ($1, $2, $3, $4)
      `, [
        pedidoId,
        item.producto_id,
        item.cantidad,
        item.precio   // precio unitario al momento de la compra
      ]);
    }

    // 5) Vaciar carrito
    await client.query('DELETE FROM carrito WHERE usuario_id = $1', [usuario_id]);

    // 6) Registrar envío
    await client.query(`
      INSERT INTO envios (pedido_id, direccion, estado)
      VALUES ($1, $2, $3)
    `, [pedidoId, direccion_envio, 'En Proceso']);

    await client.query('COMMIT');

    // Retornamos info del pedido
    res.status(201).json({
      success: true,
      pedidoId,
      total: totalPedido
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al crear pedido:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Actualizar pedido (cambia estado, etc.)
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const estadosValidos = ['Pendiente', 'Completado', 'Cancelado'];
  if (estado && !estadosValidos.includes(estado)) {
    return res
      .status(400)
      .json({ error: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}.` });
  }

  try {
    const pedidoResult = await client.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    const pedido = pedidoResult.rows[0];
    if (req.user.role === 'Cliente') {
      if (pedido.usuario_id !== req.user.id) {
        return res.status(403).json({ error: 'Solo puedes editar tus propios pedidos.' });
      }
      if (pedido.estado !== 'Pendiente') {
        return res.status(403).json({ error: 'Solo puedes editar pedidos en estado Pendiente.' });
      }
    }

    const result = await client.query('UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *', [
      estado,
      id,
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar pedido:', err);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

// Eliminar pedido (admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  // Podrías también usar authorizeRoles(['Administrador']) si deseas
  if (req.user.role !== 'Administrador') {
    return res.status(403).json({ error: 'Solo el administrador puede eliminar pedidos.' });
  }

  const { id } = req.params;
  try {
    const result = await client.query('DELETE FROM pedidos WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Error al eliminar pedido:', err);
    res.status(500).json({ error: 'Error en el servidor.' });
  }
});

module.exports = router;
