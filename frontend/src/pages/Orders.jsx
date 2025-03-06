// src/pages/Orders.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/orders.css';

const Orders = () => {
  const { token } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ajusta la URL si tu front no está dockerizado
  const API_GATEWAY = "http://localhost";

  useEffect(() => {
    if (!token) {
      setOrders([]);
      setLoading(false);
      return;
    }
    fetch(`${API_GATEWAY}/pedidos`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(response => {
        if (!response.ok) throw new Error('Error al cargar los pedidos.');
        return response.json();
      })
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <div className="orders-loading">Cargando pedidos...</div>;
  if (error) return <div className="orders-error">Error: {error}</div>;
  if (orders.length === 0) {
    return (
      <div className="orders-container">
        <h1>Mis Pedidos</h1>
        <p>No tienes pedidos.</p>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <h1>Mis Pedidos</h1>

      {orders.map((order) => (
        <div key={order.id} className="order-card">
          <h2>Pedido #{order.id}</h2>
          <p><strong>Estado:</strong> {order.estado}</p>
          <p><strong>Total:</strong> ${parseFloat(order.total).toFixed(2)}</p>
          <p><strong>Fecha:</strong> {order.fecha ? new Date(order.fecha).toLocaleDateString() : 'N/A'}</p>

          <h3>Productos:</h3>
          {Array.isArray(order.items) && order.items.length > 0 ? (
            <table className="order-items-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.nombre || `ID:${item.producto_id}`}</td>
                    <td>{item.cantidad}</td>
                    <td>${parseFloat(item.precio_unitario).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No se encontraron productos en este pedido.</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default Orders;
