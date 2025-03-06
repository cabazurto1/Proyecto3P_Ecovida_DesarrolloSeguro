// src/pages/Envios.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/envios.css';

const Envios = () => {
  const { token } = useContext(AuthContext);
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar envíos (solo accesible para Administrador)
  useEffect(() => {
    fetch('/envios', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => {
        if (!response.ok) throw new Error('Error al cargar los envíos.');
        return response.json();
      })
      .then(data => {
        setEnvios(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <div>Cargando envíos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="envios-container">
      <h1>Administrar Envíos</h1>
      {envios.length === 0 ? (
        <p>No se encontraron envíos.</p>
      ) : (
        <table className="envios-table">
          <thead>
            <tr>
              <th>ID Envío</th>
              <th>ID Pedido</th>
              <th>Dirección</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {envios.map(envio => (
              <tr key={envio.id}>
                <td>{envio.id}</td>
                <td>{envio.pedido_id}</td>
                <td>{envio.direccion}</td>
                <td>{envio.estado}</td>
                <td>{envio.fecha ? new Date(envio.fecha).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Envios;
