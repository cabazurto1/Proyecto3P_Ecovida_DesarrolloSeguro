const { Client } = require('pg');
const wsdl = require('./wsdl');

// Conexión a la base de datos PostgreSQL
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

client.connect().catch((error) => {
  console.error('Error al conectar a la base de datos:', error);
  process.exit(1);
});

// Validación de enteros
const validateInteger = (value, fieldName) => {
  if (!Number.isInteger(parseInt(value))) {
    throw new Error(`${fieldName} inválido. Debe ser un número entero.`);
  }
};

// Definimos las funciones del servicio SOAP
const serviceFunctions = {
  ProductoService: {
    ProductoPort: {
      getProductStock: async ({ id }) => {
        try {
          validateInteger(id, 'ID');

          const query = 'SELECT stock FROM productos WHERE id = $1';
          const result = await client.query(query, [id]);

          if (result.rows.length === 0) {
            return { stock: 'Producto no encontrado' };
          }

          return { stock: result.rows[0].stock.toString() };
        } catch (error) {
          console.error('Error en la consulta:', error);
          return { stock: error.message };
        }
      },

      updateProductStock: async ({ id, stock }) => {
        try {
          validateInteger(id, 'ID');
          validateInteger(stock, 'Stock');

          const query = 'UPDATE productos SET stock = $1 WHERE id = $2 RETURNING id';
          const result = await client.query(query, [stock, id]);

          if (result.rows.length === 0) {
            return { message: 'Producto no encontrado' };
          }

          if (stock < 0){
            return {message: 'El stock ingresado debe de ser positivo y entero '};
          }

          return { message: `Stock actualizado para el producto con ID: ${id}` };
        } catch (error) {
          console.error('Error al actualizar el stock:', error);
          return { message: error.message };
        }
      },

      getProductLogs: async ({ id }) => {
        try {
          validateInteger(id, 'ID');

          const query = 'SELECT * FROM logs_productos WHERE producto_id = $1 ORDER BY fecha DESC';
          const result = await client.query(query, [id]);

          if (result.rows.length === 0) {
            return { logs: [] };
          }

          return {
            logs: result.rows.map((log) => ({
              accion: log.accion,
              stock_anterior: log.stock_anterior,
              stock_nuevo: log.stock_nuevo,
              fecha: log.fecha.toISOString(),
            })),
          };
        } catch (error) {
          console.error('Error al obtener los logs:', error);
          return { logs: error.message };
        }
      },

      notifyStockChange: async ({ id }) => {
        try {
          validateInteger(id, 'ID');

          const query = 'SELECT * FROM logs_productos WHERE producto_id = $1 ORDER BY fecha DESC LIMIT 1';
          const result = await client.query(query, [id]);

          if (result.rows.length === 0) {
            return { message: 'No se encontraron registros de cambios para este producto.' };
          }

          const log = result.rows[0];
          return {
            producto_id: id,
            accion: log.accion,
            stock_anterior: log.stock_anterior,
            stock_nuevo: log.stock_nuevo,
            fecha: log.fecha.toISOString(),
          };
        } catch (error) {
          console.error('Error al obtener el log de cambios:', error);
          return { message: error.message };
        }
      },
    },
  },
};

// Cerrar conexión al salir
process.on('SIGINT', async () => {
  await client.end();
  console.log('Conexión a PostgreSQL cerrada.');
  process.exit(0);
});

module.exports = { serviceFunctions, wsdl };
