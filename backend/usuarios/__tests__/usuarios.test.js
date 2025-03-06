// __tests__/usuarios.test.js
const { GenericContainer } = require('testcontainers');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Variables globales
let container;
let app;
let client;
let jwtSecret;

describe('Pruebas del servicio de usuarios', () => {
  beforeAll(async () => {
    try {
      // Iniciar contenedor PostgreSQL
      container = await new GenericContainer('postgres:14')
        .withExposedPorts(5432)
        .withEnv('POSTGRES_DB', 'testdb')
        .withEnv('POSTGRES_USER', 'testuser')
        .withEnv('POSTGRES_PASSWORD', 'testpass')
        .start();

      const port = container.getMappedPort(5432);
      const host = container.getHost();

      // Configurar la variable de entorno para la conexión a la BD
      process.env.DATABASE_URL = `postgresql://testuser:testpass@${host}:${port}/testdb`;
      
      // Establecer JWT_SECRET para pruebas
      process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';

      // Cargar la aplicación después de configurar las variables de entorno
      // Asumiendo que tienes un archivo app.js que exporta la app Express
      const express = require('express');
      const usuariosRouter = require('../routes/usuarios');
      
      // Crear una mini-app si no tienes un app.js separado
      const testApp = express();
      testApp.use(express.json());
      testApp.use('/usuarios', usuariosRouter);
      app = testApp;
      
      // Inicializar la base de datos de prueba
      const { Client } = require('pg');
      client = new Client({
        connectionString: process.env.DATABASE_URL
      });
      await client.connect();
      
      // Crear tabla de usuarios para las pruebas
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

  // Limpiar tabla de usuarios antes de cada prueba
  beforeEach(async () => {
    await client.query('DELETE FROM usuarios');
  });

  describe('POST /usuarios', () => {
    test('debe registrar un nuevo usuario correctamente', async () => {
      const nuevoUsuario = {
        nombre: 'Usuario Test',
        email: 'test@example.com',
        password: 'password123',
        rol: 'Cliente'
      };

      const res = await request(app)
        .post('/usuarios')
        .send(nuevoUsuario);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.nombre).toBe(nuevoUsuario.nombre);
      expect(res.body.email).toBe(nuevoUsuario.email);
      expect(res.body).not.toHaveProperty('password'); // No debe retornar la contraseña
    });

    test('debe rechazar un registro con email ya existente', async () => {
      // Primero creamos un usuario
      const usuario = {
        nombre: 'Usuario Existente',
        email: 'existente@example.com',
        password: 'password123',
        rol: 'Cliente'
      };

      await request(app)
        .post('/usuarios')
        .send(usuario);

      // Intentamos crear otro usuario con el mismo email
      const res = await request(app)
        .post('/usuarios')
        .send(usuario);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('email ya está registrado');
    });

    test('debe validar los campos requeridos', async () => {
      const usuarioInvalido = {
        nombre: 'Us', // Muy corto
        email: 'invalid-email', // Email inválido
        password: '123', // Contraseña muy corta
        rol: 'RolInexistente' // Rol no permitido
      };

      const res = await request(app)
        .post('/usuarios')
        .send(usuarioInvalido);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /usuarios/login', () => {
    test('debe iniciar sesión correctamente y devolver un token JWT', async () => {
      // Crear un usuario para la prueba
      const hashedPassword = await bcrypt.hash('password123', 10);
      await client.query(
        'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4)',
        ['Usuario Login', 'login@example.com', hashedPassword, 'Cliente']
      );

      const res = await request(app)
        .post('/usuarios/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      
      // Verificar que el token sea válido
      const decodedToken = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decodedToken).toHaveProperty('id');
      expect(decodedToken).toHaveProperty('role');
      expect(decodedToken.role).toBe('Cliente');
    });

    test('debe rechazar credenciales inválidas', async () => {
      const res = await request(app)
        .post('/usuarios/login')
        .send({
          email: 'noexiste@example.com',
          password: 'wrongpassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Credenciales inválidas');
    });

    test('debe rechazar si falta email o password', async () => {
      const res = await request(app)
        .post('/usuarios/login')
        .send({
          email: 'test@example.com'
          // Sin password
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /usuarios/jwt-secret', () => {
    test('debe devolver el secret JWT', async () => {
      const res = await request(app)
        .get('/usuarios/jwt-secret');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('secret');
      expect(res.body.secret).toBe(process.env.JWT_SECRET);
    });
  });
});