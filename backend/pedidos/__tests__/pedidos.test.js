// __tests__/pedidos.test.js
const request = require('supertest');
const { GenericContainer } = require('testcontainers');
const jwt = require('jsonwebtoken');

// Variables globales
let container;
let app;
let client;
let authToken;
let clienteToken;

describe('Pruebas del servicio de pedidos', () => {
  beforeAll(async () => {
    try {
      // Iniciar contenedor PostgreSQL
      container = await new GenericContainer('postgres:12')
        .withExposedPorts(5432)
        .withEnv('POSTGRES_DB', 'testdb')
        .withEnv('POSTGRES_USER', 'testuser')
        .withEnv('POSTGRES_PASSWORD', 'testpass')
        .start();

      const port = container.getMappedPort(5432);
      const host = container.getHost();

      // Configurar variables de entorno
      process.env.DATABASE_URL = `postgresql://testuser:testpass@${host}:${port}/testdb`;
      process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';
      
      // Cargar la app (ajusta según tu estructura)
      const express = require('express');
      
      // Si tu microservicio tiene un archivo app.js separado, úsalo así:
      // const pedidosApp = require('../app');
      // app = pedidosApp;
      
      // Si no, creamos una app Express para las pruebas
      const testApp = express();
      testApp.use(express.json());
      
      // Si tus rutas están en un archivo separado, cárgalas así:
      // const pedidosRouter = require('../routes/pedidos');
      // testApp.use('/pedidos', pedidosRouter);
      
      app = testApp;
      
      // Inicializar la base de datos de prueba
      const { Client } = require('pg');
      client = new Client({
        connectionString: process.env.DATABASE_URL
      });
      await client.connect();
      
      // Crear tablas necesarias
      await client.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(100) NOT NULL,
          rol VARCHAR(20) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS productos (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          descripcion TEXT,
          precio DECIMAL(10, 2) NOT NULL,
          stock INTEGER NOT NULL DEFAULT 0,
          categoria VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS pedidos (
          id SERIAL PRIMARY KEY,
          usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
          fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
          total DECIMAL(10, 2) NOT NULL,
          direccion_envio TEXT NOT NULL,
          metodo_pago VARCHAR(50) NOT NULL
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS pedidos_detalle (
          id SERIAL PRIMARY KEY,
          pedido_id INTEGER NOT NULL REFERENCES pedidos(id),
          producto_id INTEGER NOT NULL REFERENCES productos(id),
          cantidad INTEGER NOT NULL,
          precio_unitario DECIMAL(10, 2) NOT NULL,
          subtotal DECIMAL(10, 2) NOT NULL
        )
      `);
      
      // Insertar datos de prueba
      await client.query(`
        INSERT INTO usuarios (nombre, email, password, rol) VALUES
        ('Admin Test', 'admin@test.com', 'hashedpassword', 'Administrador'),
        ('Cliente Test', 'cliente@test.com', 'hashedpassword', 'Cliente')
      `);
      
      await client.query(`
        INSERT INTO productos (nombre, descripcion, precio, stock, categoria) VALUES
        ('Producto Test 1', 'Descripción del producto 1', 19.99, 100, 'Categoría Test'),
        ('Producto Test 2', 'Descripción del producto 2', 29.99, 50, 'Categoría Test')
      `);
      
      // Obtener IDs
      const admin = (await client.query('SELECT id FROM usuarios WHERE email = $1', ['admin@test.com'])).rows[0];
      const cliente = (await client.query('SELECT id FROM usuarios WHERE email = $1', ['cliente@test.com'])).rows[0];
      
      // Generar tokens JWT para pruebas
      authToken = jwt.sign({ id: admin.id, role: 'Administrador' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      clienteToken = jwt.sign({ id: cliente.id, role: 'Cliente' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      console.log('Base de datos de prueba inicializada correctamente');
    } catch (error) {
      console.error('Error al configurar el entorno de pruebas:', error);
      throw error;
    }
  }, 60000);

  afterAll(async () => {
    // Limpiar recursos
    if (client) {
      await client.end();
    }
    if (container) {
      await container.stop();
    }
  });

  // Limpiar tablas antes de cada prueba
  beforeEach(async () => {
    await client.query('DELETE FROM pedidos_detalle');
    await client.query('DELETE FROM pedidos');
    
    // Crear un pedido de prueba
    const cliente = (await client.query('SELECT id FROM usuarios WHERE email = $1', ['cliente@test.com'])).rows[0];
    const productos = (await client.query('SELECT id, precio FROM productos')).rows;
    
    // Insertar pedido
    const pedidoResult = await client.query(`
      INSERT INTO pedidos (usuario_id, estado, total, direccion_envio, metodo_pago)
      VALUES ($1, 'Pendiente', $2, 'Calle de prueba 123', 'Tarjeta')
      RETURNING id
    `, [cliente.id, 49.98]);
    
    const pedidoId = pedidoResult.rows[0].id;
    
    // Insertar detalles
    await client.query(`
      INSERT INTO pedidos_detalle (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
      VALUES ($1, $2, 1, $3, $3)
    `, [pedidoId, productos[0].id, productos[0].precio]);
    
    await client.query(`
      INSERT INTO pedidos_detalle (pedido_id, producto_id, cantidad, precio_unitario, subtotal)
      VALUES ($1, $2, 1, $3, $3)
    `, [pedidoId, productos[1].id, productos[1].precio]);
  });

  describe('GET /pedidos', () => {
    test('debe obtener la lista de pedidos (admin)', async () => {
      const res = await request(app)
        .get('/pedidos')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('estado', 'Pendiente');
    });

    test('debe obtener solo los pedidos del cliente (cliente)', async () => {
      const res = await request(app)
        .get('/pedidos')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // Debe ver solo sus propios pedidos
      expect(res.body.length).toBe(1);
    });
  });

  describe('GET /pedidos/:id', () => {
    test('debe obtener un pedido por ID con sus detalles', async () => {
      // Primero obtenemos un ID válido
      const pedidos = await client.query('SELECT id FROM pedidos LIMIT 1');
      const pedidoId = pedidos.rows[0].id;

      const res = await request(app)
        .get(`/pedidos/${pedidoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', pedidoId);
      expect(res.body).toHaveProperty('estado', 'Pendiente');
      expect(res.body).toHaveProperty('detalles');
      expect(Array.isArray(res.body.detalles)).toBe(true);
      expect(res.body.detalles.length).toBe(2);
    });

    test('debe retornar 404 para un pedido inexistente', async () => {
      const res = await request(app)
        .get('/pedidos/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /pedidos', () => {
    test('debe crear un nuevo pedido (cliente autenticado)', async () => {
      const productos = (await client.query('SELECT id, precio FROM productos')).rows;
      
      const nuevoPedido = {
        productos: [
          {
            id: productos[0].id,
            cantidad: 2
          },
          {
            id: productos[1].id,
            cantidad: 1
          }
        ],
        direccion_envio: 'Calle Nueva 456',
        metodo_pago: 'PayPal'
      };

      const res = await request(app)
        .post('/pedidos')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send(nuevoPedido);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('estado', 'Pendiente');
      expect(res.body).toHaveProperty('usuario_id');
      expect(res.body).toHaveProperty('total');
    });

    test('debe rechazar la creación sin autenticación', async () => {
      const nuevoPedido = {
        productos: [{ id: 1, cantidad: 1 }],
        direccion_envio: 'Calle Test',
        metodo_pago: 'Efectivo'
      };

      const res = await request(app)
        .post('/pedidos')
        .send(nuevoPedido);

      expect(res.statusCode).toBe(401);
    });
  });

  describe('PATCH /pedidos/:id/estado', () => {
    test('debe actualizar el estado de un pedido (admin)', async () => {
      // Primero obtenemos un ID válido
      const pedidos = await client.query('SELECT id FROM pedidos LIMIT 1');
      const pedidoId = pedidos.rows[0].id;

      const res = await request(app)
        .patch(`/pedidos/${pedidoId}/estado`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ estado: 'Enviado' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', pedidoId);
      expect(res.body).toHaveProperty('estado', 'Enviado');
    });

    test('debe rechazar la actualización si no es admin', async () => {
      const pedidos = await client.query('SELECT id FROM pedidos LIMIT 1');
      const pedidoId = pedidos.rows[0].id;

      const res = await request(app)
        .patch(`/pedidos/${pedidoId}/estado`)
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ estado: 'Enviado' });

      expect(res.statusCode).toBe(403);
    });
  });
});