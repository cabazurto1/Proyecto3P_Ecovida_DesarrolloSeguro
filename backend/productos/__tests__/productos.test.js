// __tests__/productos.test.js
const request = require('supertest');
const { GenericContainer } = require('testcontainers');
const jwt = require('jsonwebtoken');

// Variables globales
let container;
let app;
let client;
let authToken;

describe('Pruebas del servicio de productos', () => {
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
      // const productosApp = require('../app');
      // app = productosApp;
      
      // Si no, creamos una app Express para las pruebas
      const testApp = express();
      testApp.use(express.json());
      
      // Si tus rutas están en un archivo separado, cárgalas así:
      // const productosRouter = require('../routes/productos');
      // testApp.use('/productos', productosRouter);
      
      app = testApp;
      
      // Inicializar la base de datos de prueba
      const { Client } = require('pg');
      client = new Client({
        connectionString: process.env.DATABASE_URL
      });
      await client.connect();
      
      // Crear tablas necesarias
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
      
      // Crear usuario de prueba para autenticación
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
      
      // Insertar usuario administrador para pruebas
      await client.query(`
        INSERT INTO usuarios (nombre, email, password, rol) 
        VALUES ('Admin Test', 'admin@test.com', 'hashedpassword', 'Administrador')
      `);
      
      // Generar token JWT para pruebas
      const adminUser = (await client.query('SELECT id FROM usuarios WHERE email = $1', ['admin@test.com'])).rows[0];
      authToken = jwt.sign({ id: adminUser.id, role: 'Administrador' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
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

  // Limpiar tabla de productos antes de cada prueba
  beforeEach(async () => {
    await client.query('DELETE FROM productos');
    
    // Insertar algunos productos de prueba
    await client.query(`
      INSERT INTO productos (nombre, descripcion, precio, stock, categoria) VALUES
      ('Producto Test 1', 'Descripción del producto 1', 19.99, 100, 'Categoría Test'),
      ('Producto Test 2', 'Descripción del producto 2', 29.99, 50, 'Categoría Test')
    `);
  });

  describe('GET /productos', () => {
    test('debe obtener la lista de productos', async () => {
      const res = await request(app)
        .get('/productos');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toHaveProperty('nombre', 'Producto Test 1');
      expect(res.body[1]).toHaveProperty('nombre', 'Producto Test 2');
    });

    test('debe filtrar productos por categoría', async () => {
      const res = await request(app)
        .get('/productos?categoria=Categoría Test');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });
  });

  describe('GET /productos/:id', () => {
    test('debe obtener un producto por ID', async () => {
      // Primero obtenemos un ID válido
      const productos = await client.query('SELECT id FROM productos LIMIT 1');
      const productoId = productos.rows[0].id;

      const res = await request(app)
        .get(`/productos/${productoId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', productoId);
      expect(res.body).toHaveProperty('nombre');
      expect(res.body).toHaveProperty('precio');
    });

    test('debe retornar 404 para un producto inexistente', async () => {
      const res = await request(app)
        .get('/productos/99999');

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /productos', () => {
    test('debe crear un nuevo producto (con autenticación)', async () => {
      const nuevoProducto = {
        nombre: 'Producto Nuevo',
        descripcion: 'Descripción del producto nuevo',
        precio: 39.99,
        stock: 25,
        categoria: 'Categoría Nueva'
      };

      const res = await request(app)
        .post('/productos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(nuevoProducto);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.nombre).toBe(nuevoProducto.nombre);
      expect(parseFloat(res.body.precio)).toBe(nuevoProducto.precio);
    });

    test('debe rechazar la creación sin autenticación', async () => {
      const nuevoProducto = {
        nombre: 'Producto Sin Auth',
        descripcion: 'Descripción',
        precio: 39.99,
        stock: 25
      };

      const res = await request(app)
        .post('/productos')
        .send(nuevoProducto);

      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /productos/:id', () => {
    test('debe actualizar un producto existente (con autenticación)', async () => {
      // Primero obtenemos un ID válido
      const productos = await client.query('SELECT id FROM productos LIMIT 1');
      const productoId = productos.rows[0].id;

      const actualizacion = {
        nombre: 'Producto Actualizado',
        precio: 49.99
      };

      const res = await request(app)
        .put(`/productos/${productoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(actualizacion);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', productoId);
      expect(res.body.nombre).toBe(actualizacion.nombre);
      expect(parseFloat(res.body.precio)).toBe(actualizacion.precio);
    });
  });

  describe('DELETE /productos/:id', () => {
    test('debe eliminar un producto (con autenticación)', async () => {
      // Primero obtenemos un ID válido
      const productos = await client.query('SELECT id FROM productos LIMIT 1');
      const productoId = productos.rows[0].id;

      const res = await request(app)
        .delete(`/productos/${productoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      
      // Verificar que el producto ya no existe
      const checkRes = await request(app)
        .get(`/productos/${productoId}`);
      expect(checkRes.statusCode).toBe(404);
    });
  });
});