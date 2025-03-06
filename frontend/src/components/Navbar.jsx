// src/components/Navbar.jsx
import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "../styles/navbar.css";
import logo from "../img/ecovidalogo.png";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="logo-container">
          <img src={logo} alt="EcoVida Logo" className="logo" />
          <h1>EcoVida</h1>
        </div>
      </div>
      <div className="navbar-center">
        <ul className="navLinks">
          <li><Link to="/">Inicio</Link></li>
          
          {/* TIENDA: solo la mostramos si user no es Vendedor */}
          {user?.role !== "Vendedor" && (
            <li><Link to="/shop">Tienda</Link></li>
          )}
          
          <li><Link to="/blog">Blog</Link></li>
          <li><Link to="/contact">Contacto</Link></li>

          {/* Si es CLIENTE, mostramos Mis Pedidos */}
          {user?.role === "Cliente" && (
            <li><Link to="/my-orders">Mis Pedidos</Link></li>
          )}

          {/* Si es Vendedor, podríamos agregar un link a AdminProducts, si deseas: */}
          {user?.role === "Vendedor" && (
            <li><Link to="/admin/products">Registrar Producto</Link></li>
          )}
        </ul>
      </div>
      <div className="navbar-right">
        {/* ICONO DE CARRITO: solo para CLIENTE */}
        {user?.role === "Cliente" && (
          <Link to="/cart" className="cart-icon">
            🛒 <span className="cart-count">{cart.length}</span>
          </Link>
        )}

        {user ? (
          <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
        ) : (
          <Link to="/login" className="login-btn">Iniciar sesión</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
