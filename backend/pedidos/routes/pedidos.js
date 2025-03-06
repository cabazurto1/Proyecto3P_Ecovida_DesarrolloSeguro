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

// Validación de datos con Joi
const pedidoSchema = Joi.object({
  usuario_id: Joi.number().integer().required(),
  direccion_envio: Joi.string().min(5).required(),
});

// Ruta para obtener todos los pedidos
router.get('/', authenticateToken, async (req, res) => {
  try {
    let pedidos;

    if (req.user.role === 'Cliente') {
      pedidos = await client.query('SELECT * FROM pedidos WHERE usuario_id = $1', [req.user.id]);
    } else if (req.user.role === 'Administrador') {
      pedidos = await client.query('SELECT * FROM pedidos');
    } else {
      return res.status(403).send('Acceso denegado.');
    }

    res.json(pedidos.rows);
  } catch (err) {
    console.error('Error al obtener pedidos:', err);
    res.status(500).send('Error en el servidor.');
  }
});

// Ruta para crear un pedido
router.post('/', authenticateToken, async (req, res) => {
  const { error } = pedidoSchema.validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { usuario_id, direccion_envio } = req.body;

  if (req.user.role !== 'Cliente' && req.user.role !== 'Administrador') {
    return res.status(403).send('Acceso denegado. Solo clientes o administradores pueden crear pedidos.');
  }

  try {
    await client.query('BEGIN');

    // Obtener productos del carrito del usuario
    const carritoResult = await client.query(
      'SELECT producto_id, cantidad FROM carrito WHERE usuario_id = $1',
      [usuario_id]
    );

    if (carritoResult.rows.length === 0) {
      throw new Error('El carrito está vacío. No se puede crear un pedido.');
    }

    const carritoItems = carritoResult.rows;

    // Validar stock y calcular el total
    const productIds = carritoItems.map(item => item.producto_id);
    const productosResult = await client.query(
      'SELECT id, stock, precio FROM productos WHERE id = ANY($1)',
      [productIds]
    );

    const productosInfo = productosResult.rows.reduce((acc, producto) => {
      acc[producto.id] = producto;
      return acc;
    }, {});

    let totalPedido = 0;
    for (const item of carritoItems) {
      const producto = productosInfo[item.producto_id];
      if (!producto) throw new Error(`Producto con ID ${item.producto_id} no encontrado.`);
      if (producto.stock < item.cantidad) throw new Error(`Stock insuficiente para el producto con ID ${item.producto_id}.`);

      totalPedido += producto.precio * item.cantidad;

      await client.query(
        'UPDATE productos SET stock = stock - $1 WHERE id = $2',
        [item.cantidad, item.producto_id]
      );
    }

    // Crear el pedido
    const pedidoResult = await client.query(
      'INSERT INTO pedidos (usuario_id, total, estado) VALUES ($1, $2, $3) RETURNING id',
      [usuario_id, totalPedido, 'Pendiente']
    );

    const pedidoId = pedidoResult.rows[0].id;

    // Vaciar carrito
    await client.query('DELETE FROM carrito WHERE usuario_id = $1', [usuario_id]);

    // Registrar dirección de envío
    await client.query(
      'INSERT INTO envios (pedido_id, direccion, estado) VALUES ($1, $2, $3)',
      [pedidoId, direccion_envio, 'En Proceso']
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, pedidoId, total: totalPedido });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear el pedido:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Ruta para actualizar un pedido
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const estadosValidos = ['Pendiente', 'Completado', 'Cancelado'];
  if (estado && !estadosValidos.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}` });
  }

  try {
    const pedidoResult = await client.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado.' });
    }

    const pedido = pedidoResult.rows[0];

    if (req.user.role === 'Cliente') {
      if (pedido.usuario_id !== req.user.id) {
        return res.status(403).send('Acceso denegado. Solo puedes editar tus propios pedidos.');
      }
      if (pedido.estado !== 'Pendiente') {
        return res.status(403).send('Solo puedes editar pedidos que están en estado "Pendiente".');
      }
    }

    const result = await client.query(
      'UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar pedido:', err);
    res.status(500).send('Error en el servidor.');
  }
});

// Ruta para eliminar un pedido
router.delete('/:id', authenticateToken, authorizeRoles(['Administrador']), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await client.query('DELETE FROM pedidos WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Pedido no encontrado.');
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error al eliminar pedido:', err);
    res.status(500).send('Error en el servidor.');
  }
});

module.exports = router;
