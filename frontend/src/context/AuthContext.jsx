// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
// IMPORTANTE: usar import jwtDecode from "jwt-decode";
import {jwtDecode} from "jwt-decode";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // URL de usuarios (para login). A veces puedes usar solo "/usuarios/login"
  // si tu Nginx reescribe /usuarios -> usuarios_service:3004
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3004";

  // Leemos token existente en localStorage
  const storedToken = localStorage.getItem("token");
  const [token, setToken] = useState(storedToken || null);

  // Decodificamos token si existe
  const [user, setUser] = useState(() => {
    if (storedToken) {
      try {
        return jwtDecode(storedToken);
      } catch (err) {
        console.error("Error al decodificar token almacenado:", err);
        return null;
      }
    }
    return null;
  });

  // Cada vez que token cambie, lo guardamos
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (err) {
        console.error("Error al decodificar nuevo token:", err);
        setUser(null);
      }
    } else {
      localStorage.removeItem("token");
      setUser(null);
    }
  }, [token]);

  // Iniciar sesión => POST /usuarios/login
  const login = async (credentials) => {
    const response = await fetch(`${API_URL}/usuarios/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(errorMsg);
    }

    // Esperamos que retorne { token: "..." }
    const data = await response.json();
    setToken(data.token);
  };

  // Cerrar sesión
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
