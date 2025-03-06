// src/pages/OrderConfirmation.jsx
import React, { useEffect, useState, useContext } from "react";
import { useLocation, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function OrderConfirmation() {
  const location = useLocation();
  const { token } = useContext(AuthContext);

  const [orderInfo, setOrderInfo] = useState(null);
  const [error, setError] = useState(null);

  // Tomamos el orderId que pasamos desde Cart.jsx
  const orderId = location.state?.orderId;

  // URL gateway
  const API_GATEWAY = "http://localhost";

  useEffect(() => {
    if (!orderId) return;
    // Llamar GET /pedidos, filtrar por orderId
    fetch(`${API_GATEWAY}/pedidos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener pedidos.");
        return res.json();
      })
      .then((orders) => {
        const found = orders.find((o) => o.id === orderId);
        if (!found) {
          setError("No se encontró el pedido en tu lista de pedidos.");
        } else {
          setOrderInfo(found);
        }
      })
      .catch((err) => setError(err.message));
  }, [orderId, token]);

  if (!orderId) {
    return (
      <div style={{ padding: "2rem" }}>
        <h2>Orden no especificada</h2>
        <p>No se recibió el ID del pedido.</p>
        <Link to="/shop">Regresar a la tienda</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>¡Pedido realizado!</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!error && !orderInfo && <p>Cargando información de tu pedido...</p>}

      {orderInfo && (
        <div>
          <p>
            Tu pedido <strong>#{orderInfo.id}</strong> se creó correctamente.
          </p>
          <p>
            Estado: <strong>{orderInfo.estado}</strong>
          </p>
          <p>
            Total: <strong>${parseFloat(orderInfo.total).toFixed(2)}</strong>
          </p>
          <p>
            Fecha: {orderInfo.fecha
              ? new Date(orderInfo.fecha).toLocaleString()
              : "N/A"}
          </p>
          <Link to="/my-orders">Ver todos mis pedidos</Link>
        </div>
      )}
    </div>
  );
}
