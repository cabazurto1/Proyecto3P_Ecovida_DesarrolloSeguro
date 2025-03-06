// __tests__/carrito.test.js
const { GenericContainer, PostgreSqlContainer } = require('testcontainers');
const request = require('supertest');

// Definimos variables globales para la prueba
let container;
let app;

describe('Pruebas con Postgres efímero', () => {
  beforeAll(async () => {
    try {
      // Corrección: En las versiones más recientes de testcontainers, 
      // la importación es diferente
      const { PostgreSqlContainer } = await import('testcontainers');
      
      // Iniciar el contenedor de PostgreSQL
      container = await new PostgreSqlContainer()
        .withDatabase('testdb')
        .withUsername('testuser')
        .withPassword('testpass')
        .start();

      const port = container.getMappedPort(5432);
      const host = container.getHost();
      const database = container.getDatabase();
      const user = container.getUsername();
      const password = container.getPassword();

      console.log(`PostgreSQL iniciado en ${host}:${port}`);

      // Configurar la variable de entorno antes de cargar la app
      process.env.DATABASE_URL = `postgresql://${user}:${password}@${host}:${port}/${database}`;
      
      // Importante: cargar la app DESPUÉS de configurar las variables de entorno
      app = require('../app');
      
      // Inicializar la base de datos de prueba
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL
      });
      
      // Crear tablas necesarias para las pruebas
      await pool.query(`
        CREATE TABLE IF NOT EXISTS carrito (
          id SERIAL PRIMARY KEY,
          usuario_id INTEGER NOT NULL,
          producto_id INTEGER NOT NULL,
          cantidad INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insertar datos de prueba si es necesario
      await pool.query(`
        INSERT INTO carrito (usuario_id, producto_id, cantidad)
        VALUES (1, 1, 2), (1, 2, 1)
      `);
    } catch (error) {
      console.error('Error al configurar el contenedor:', error);
      throw error;
    }
  }, 60000); // Timeout más amplio para la inicialización

  afterAll(async () => {
    // Limpiar recursos
    if (container) {
      await container.stop();
    }
  });

  test('GET /carrito sin token debe retornar 401', async () => {
    const res = await request(app).get('/carrito');
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('mensaje');
  });

  test('GET /carrito con token debe retornar los items del carrito', async () => {
    const res = await request(app)
      .get('/carrito')
      .set('Authorization', 'Bearer test-token'); // Token de prueba
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('POST /carrito/agregar debe añadir un producto al carrito', async () => {
    const productoNuevo = {
      producto_id: 3,
      cantidad: 1
    };

    const res = await request(app)
      .post('/carrito/agregar')
      .set('Authorization', 'Bearer test-token')
      .send(productoNuevo);
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
  });
});