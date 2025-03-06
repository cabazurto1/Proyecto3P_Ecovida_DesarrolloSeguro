// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // Corrección de importación

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Obtener la URL del backend desde variables de entorno
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3004";

  // Intentar cargar el token almacenado en localStorage (si existe)
  const storedToken = localStorage.getItem("token");
  const [token, setToken] = useState(storedToken);
  const [user, setUser] = useState(storedToken ? jwtDecode(storedToken) : null);

  // Cuando el token cambie, actualizar localStorage y el estado del usuario
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      setUser(jwtDecode(token)); // Corrección del uso de jwtDecode
    } else {
      localStorage.removeItem("token");
      setUser(null);
    }
  }, [token]);

  // Función para iniciar sesión
  const login = async (credentials) => {
    const response = await fetch(`${API_URL}/usuarios/login`, { // URL corregida
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(errorMsg);
    }

    const data = await response.json();
    setToken(data.token);
  };

  // Función para cerrar sesión
  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
