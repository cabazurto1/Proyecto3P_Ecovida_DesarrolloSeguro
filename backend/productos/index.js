const express = require('express');
const http = require('http');
const soap = require('soap');
const cors = require('cors');

const app = express();
const port = 3001;
app.use(cors({
  origin: "*", // Permite solicitudes desde cualquier origen
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
// Middleware para parsear JSON
app.use(express.json());

// Importar las rutas de productos
const productosRoutes = require('./routes/productos');
app.use('/productos', productosRoutes);

// Importar el servicio SOAP
const { serviceFunctions, wsdl } = require('./soapService');

// Crear el servidor SOAP
const soapServer = http.createServer(app);
soap.listen(soapServer, '/soap', serviceFunctions, wsdl);

// Iniciar el servidor
soapServer.listen(port, () => {
  console.log(`Microservicio de productos corriendo en http://localhost:${port}`);
  console.log(`Servicio SOAP disponible en http://localhost:${port}/soap?wsdl`);
});
