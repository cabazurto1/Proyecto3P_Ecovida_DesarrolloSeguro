const express = require('express');
const { Client } = require('pg');
const soap = require('soap');
const http = require('http');
const SoapService = require('./soapService'); // Importar lógica SOAP
const wsdl = require('./wsdl'); // Importar el WSDL desde wsdl.js
const cors = require('cors');

const app = express();
const port = 3004;
// 🔹 Permitir CORS para cualquier origen y cualquier método
app.use(cors({
  origin: "*", // Permite cualquier origen
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Permitir CORS manualmente en respuestas a preflight (opcional)
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.sendStatus(200);
});
// Conexión a PostgreSQL
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
client.connect();

// Middleware para parsear JSON
app.use(express.json());

// Importar rutas
const usuariosRoutes = require('./routes/usuarios');
const ticketsRoutes = require('./routes/ticket');

app.use('/usuarios', usuariosRoutes); // Ruta base para usuarios
app.use('/tickets', ticketsRoutes); // Ruta base para tickets

// Configuración del servicio SOAP
const soporteFunctions = {
  SoporteService: {
    SoportePort: {
      createTicket: SoapService.createTicket,
      getTicketStatus: SoapService.getTicketStatus,
      closeTicket: SoapService.closeTicket,
      listTickets: SoapService.listTickets,
    },
  },
};

// Crear el servidor SOAP
const soapServer = http.createServer(app);
soap.listen(soapServer, '/soap', soporteFunctions, wsdl);

// Iniciar el servidor
soapServer.listen(port, () => {
  console.log(`Microservicio de usuarios corriendo en http://localhost:${port}`);
  console.log(`Servicio SOAP disponible en http://localhost:${port}/soap?wsdl`);
});
