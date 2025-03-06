import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

// Definir la URL de la API mediante una variable de entorno
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3004";

const Registro = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "Cliente",
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch(`${API_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.text(); // Captura la respuesta del backend como texto

      if (!res.ok) {
        console.error("Error en la respuesta del backend:", data);
        throw new Error(`Error ${res.status}: ${data}`);
      }

      navigate("/login");
    } catch (err) {
      console.error("Error en el registro:", err.message);
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Registro</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" name="nombre" placeholder="Nombre" required onChange={handleChange} />
        <input type="email" name="email" placeholder="Correo" required onChange={handleChange} />
        <input type="password" name="password" placeholder="Contraseña" required onChange={handleChange} />
        <select name="rol" onChange={handleChange}>
          <option value="Cliente">Cliente</option>
          <option value="Vendedor">Vendedor</option>
        </select>
        <button type="submit">Registrarse</button>
      </form>
    </div>
  );
};

export default Registro;
