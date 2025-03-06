const { Client } = require('pg');

// Configuración de PostgreSQL
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
client.connect();

// Clase para manejar la lógica SOAP
class SoapService {
  // Crear un ticket
  static async createTicket({ usuario_id, mensaje }) {
    try {
      const query = `
        INSERT INTO tickets (usuario_id, mensaje, estado)
        VALUES ($1, $2, 'Abierto') RETURNING id
      `;
      const result = await client.query(query, [usuario_id, mensaje]);
      return { message: `Ticket creado con ID: ${result.rows[0].id}` };
    } catch (error) {
      console.error('Error al crear ticket:', error);
      return { message: 'Error al crear el ticket' };
    }
  }

  // Obtener el estado de un ticket con historial
  static async getTicketStatus({ id }) {
    try {
      const ticketQuery = 'SELECT mensaje, estado FROM tickets WHERE id = $1';
      const ticketResult = await client.query(ticketQuery, [id]);

      if (ticketResult.rows.length === 0) {
        return { estado: 'Ticket no encontrado', mensaje: '', historial: '' };
      }

      const { mensaje, estado } = ticketResult.rows[0];

      const historialQuery = `
        SELECT accion, fecha 
        FROM logs_usuarios 
        WHERE usuario_id = (SELECT usuario_id FROM tickets WHERE id = $1) 
        ORDER BY fecha DESC
      `;
      const historialResult = await client.query(historialQuery, [id]);

      const historial = historialResult.rows.map((registro) => ({
        fecha: registro.fecha.toISOString(),
        accion: registro.accion,
      }));

      return {
        estado,
        mensaje,
        historial: historial.length > 0 ? historial : 'No hay historial disponible',
      };
    } catch (error) {
      console.error('Error en getTicketStatus:', error);
      return { estado: 'Error al consultar el estado', mensaje: '', historial: '' };
    }
  }

  // Cerrar un ticket
  static async closeTicket({ id }) {
    try {
      const query = `
        UPDATE tickets SET estado = 'Cerrado'
        WHERE id = $1 AND estado = 'Abierto' RETURNING id
      `;
      const result = await client.query(query, [id]);

      if (result.rows.length === 0) {
        return { message: 'Ticket no encontrado o ya cerrado' };
      }

      return { message: `Ticket con ID: ${id} cerrado exitosamente` };
    } catch (error) {
      console.error('Error al cerrar ticket:', error);
      return { message: 'Error al cerrar el ticket' };
    }
  }

  // Listar tickets abiertos por usuario
  static async listTickets({ usuario_id }) {
    try {
      const query = `
        SELECT id, mensaje, estado 
        FROM tickets 
        WHERE usuario_id = $1 AND estado = 'Abierto'
      `;
      const result = await client.query(query, [usuario_id]);

      return {
        tickets: result.rows.map((ticket) => ({
          id: ticket.id,
          mensaje: ticket.mensaje,
          estado: ticket.estado,
        })),
      };
    } catch (error) {
      console.error('Error en listTickets:', error);
      return { tickets: 'Error al listar los tickets' };
    }
  }
}

module.exports = SoapService;
