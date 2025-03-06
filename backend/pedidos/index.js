const express = require('express');
const { Client } = require('pg');
const app = express();
const port = 3003;
const cors = require('cors');
app.use(cors({
  origin: "*", // Permite solicitudes desde cualquier origen
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
// Conexión a la base de datos PostgreSQL
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
client.connect();

app.use(express.json());

// Importar rutas de pedidos
const pedidosRoutes = require('./routes/pedidos');
app.use('/pedidos', pedidosRoutes); // Ruta base para pedidos

app.listen(port, () => {
  console.log(`Microservicio de pedidos corriendo en http://localhost:${port}`);
});
