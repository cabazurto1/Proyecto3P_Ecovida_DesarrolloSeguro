import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useCart } from "../context/CartContext"; // Importar el contexto del carrito
import "../styles/navbar.css";
import logo from "../img/ecovidalogo.png";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useCart(); // Obtener el carrito para mostrar la cantidad de productos
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
          <li><Link to="/shop">Tienda</Link></li>
          <li><Link to="/blog">Blog</Link></li>
          <li><Link to="/contact">Contacto</Link></li>
        </ul>
      </div>
      <div className="navbar-right">
        {/* Icono del carrito movido a la izquierda */}
        <Link to="/cart" className="cart-icon">
          🛒 <span className="cart-count">{cart.length}</span>
        </Link>

        {/* Botón de cerrar sesión o iniciar sesión */}
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