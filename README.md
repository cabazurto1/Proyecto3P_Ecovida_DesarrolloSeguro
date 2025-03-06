=============== README PROYECTO ECOVIDA ===============

Proyecto: EcoVida
Materia: Desarrollo de Software Seguro

Autores:
- Ricardo Rivadeneira
- Christopher Bazurto

--------------------------------------------
1. DESCRIPCIÓN GENERAL
--------------------------------------------
EcoVida es una plataforma de comercio electrónico centrada en la agricultura orgánica y sostenible. El proyecto busca facilitar la compra y venta de productos orgánicos, tales como frutas, verduras, granos y artículos de cuidado personal amigables con el ambiente, apoyando así a pequeños agricultores y promoviendo prácticas saludables.

Esta solución se basa en una arquitectura de microservicios (Node.js + Express) y un frontend construido con React + Vite. Además, se implementan pruebas unitarias en el backend (Jest + Supertest) y pruebas E2E en el frontend (Cypress). La base de datos principal es PostgreSQL, contenida y orquestada con Docker Compose.

--------------------------------------------
2. CARACTERÍSTICAS CLAVE
--------------------------------------------
- **Microservicios**: Usuarios, Productos, Carrito, Pedidos y Envíos (REST).
- **Base de datos**: PostgreSQL para datos transaccionales (stock, usuarios, pedidos, etc.).
- **Navegación**: Frontend con React Router para las páginas Home, Registro, Login, Tienda, etc.
- **Pruebas**:
  - **Backend**: Pruebas unitarias con Jest y Supertest para endpoints y lógica de negocio.
  - **Frontend**: Pruebas E2E con Cypress para cubrir flujos de registro, login, gestión de productos, carrito y pedidos.
- **Docker Compose**: Orquesta los contenedores de microservicios, la base de datos, NGINX (API Gateway) y los contenedores de pruebas.
- **Seguridad**: Uso de JWT para autenticar a los usuarios y proteger rutas. Validaciones de inputs y roles (Cliente/Vendedor).

--------------------------------------------
3. ESTRUCTURA DEL PROYECTO
--------------------------------------------
El proyecto está dividido en dos repositorios:

a) **Backend** (Carpeta “backend/” o repositorio dedicado)
   - **productos/**
     - routes/ (Rutas de Express para CRUD de productos)
     - __tests__/ (Pruebas unitarias con Jest)
     - Dockerfile
     - package.json
   - **carrito/**
   - **pedidos/**
   - **usuarios/**
   - **envios/**
   - docker-compose.yml
   - .env (Variables de entorno como DATABASE_URL)
   - ...

b) **Frontend** (Carpeta “frontend/” o repositorio separado)
   - /src
     - components/
     - pages/
     - context/
   - cypress/
     - e2e/ (Archivos .cy.js para pruebas E2E)
     - cypress.config.js
   - vite.config.js
   - package.json

--------------------------------------------
4. BACKEND - CONFIGURACIÓN Y USO
--------------------------------------------
1. **Instalación de dependencias**:
   - Ubicarse en la carpeta de cada microservicio (por ejemplo, “productos”):
     npm install
   - Repetir para “carrito”, “usuarios”, etc.

2. **Docker Compose**:
   - En la carpeta raíz del backend se encuentra “docker-compose.yml”.
   - Para construir y levantar la aplicación (base de datos y microservicios):
     docker-compose up --build
   - Esto levanta:
     - `postgres_primary` (DB en el puerto 5432)
     - `productos_service` (puerto 3001)
     - `carrito_service` (puerto 3002)
     - `pedidos_service` (puerto 3003)
     - `usuarios_service` (puerto 3004)
     - `envios_service` (puerto 3005)
     - `nginx` (puerto 80) como API Gateway.
   - Confirmar que la DB y microservicios estén disponibles en cada puerto.

3. **Pruebas Unitarias en cada microservicio**:
   - Ejemplo para carrito:
     docker-compose up --build carrito_tests
   - Similar para productos_tests, pedidos_tests, usuarios_tests, etc.
   - Cada contenedor de prueba primero espera a que la DB y los servicios dependientes estén listos, luego ejecuta npm run test.

--------------------------------------------
5. FRONTEND - CONFIGURACIÓN Y USO
--------------------------------------------
1. **Instalación de dependencias**:
   - En la carpeta “frontend/”:
     npm install

2. **Arranque en modo desarrollo**:
   npm run dev
   - Por defecto, Vite corre en http://localhost:5173 (ver vite.config.js).
   - Ajustar el proxy si se requiere apuntar al API Gateway en otro puerto.

3. **Pruebas E2E con Cypress**:
   - Se puede configurar un script en package.json como:
     "test:e2e": "cypress open"
   - Ejecutar:
     npm run test:e2e
   - Esto abrirá la interfaz de Cypress, donde se pueden seleccionar los archivos de prueba en cypress/e2e/.
   - En modo headless:
     npx cypress run

--------------------------------------------
6. EJEMPLOS DE PRUEBAS
--------------------------------------------
a) **Backend** (Carrito):
   /carrito/__tests__/carrito.test.js
   ---
   const request = require('supertest');
   const app = require('../index');

   describe('Carrito Tests', () => {
     it('Agrega un producto al carrito', async () => {
       const res = await request(app)
         .post('/carrito')
         .set('Authorization', 'Bearer <token-usuario>')
         .send({ producto_id: 1, cantidad: 2 });
       expect(res.statusCode).toBe(201);
     });
   });

b) **Frontend** (E2E con Cypress):
   /cypress/e2e/login.cy.js
   ---
   describe('Login E2E', () => {
     it('Debería iniciar sesión con credenciales válidas', () => {
       cy.visit('/login');
       cy.get('input[name="email"]').type('test@example.com');
       cy.get('input[name="password"]').type('123456');
       cy.get('button[type="submit"]').click();
       cy.url().should('include', '/');
     });
   });

--------------------------------------------
7. PRÁCTICAS DE SEGURIDAD Y CALIDAD
--------------------------------------------
- **JWT**: Generación y validación en el microservicio de usuarios para proteger endpoints de productos, carrito, pedidos, etc.
- **Validaciones**: Uso de librerías como Joi para sanitizar y validar datos.
- **Cobertura de Pruebas**: Adicionalmente, se puede usar `npm run test -- --coverage` en backend para obtener métricas de cobertura.
- **SonarQube / SonarCloud (opcional)**: Integración para análisis estático, detección de vulnerabilidades y reducción de code smells.

--------------------------------------------
8. LICENCIA Y CRÉDITOS
--------------------------------------------
Este proyecto se desarrolla como parte de la materia **Desarrollo de Software Seguro**, con fines educativos y de concientización sobre la agricultura sostenible.

Autores:
- Ricardo Rivadeneira
- Christopher Bazurto

--------------------------------------------
9. CONTACTO
--------------------------------------------
Para comentarios o aportes:
- Ricardo Rivadeneira (GitHub: @RicardoRivadeneira)
- Christopher Bazurto (GitHub: @cabazurto1)

¡Gracias por apoyar la misión de EcoVida!
