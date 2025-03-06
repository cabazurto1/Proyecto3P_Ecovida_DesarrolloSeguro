// src/pages/Home.jsx
import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/home.css";

const Home = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="home">
      <header className={`hero ${user ? "" : "no-user"}`}>
        <div className="hero-overlay">
          <h1>Bienvenidos a EcoVida</h1>
          <p>Fomentando la agricultura orgánica y la sostenibilidad</p>

          {user ? (
            <>
              <h3>Hola, {user.nombre} 👋</h3>
              <p>Gracias por ser parte de nuestra comunidad sostenible.</p>
              <div className="home-buttons">
                {/* Si es CLIENTE, mostramos “Explorar Productos” */}
                {user.role === "Cliente" && (
                  <Link to="/shop" className="btn">Explorar Productos</Link>
                )}

                {/* Solo Vendedor => Registrar producto */}
                {user.role === "Vendedor" && (
                  <Link to="/admin/products" className="btn">Registrar Producto</Link>
                )}

                {/* Link a My Orders solo para CLIENTE */}
                {user.role === "Cliente" && (
                  <Link to="/my-orders" className="btn">Ver Mis Pedidos</Link>
                )}
              </div>
            </>
          ) : (
            <>
              <p>Regístrate o inicia sesión para acceder a nuestra tienda.</p>
              <div className="auth-buttons">
                <Link to="/registro" className="btn">Registrarse</Link>
                <Link to="/login" className="btn">Iniciar Sesión</Link>
              </div>
            </>
          )}
        </div>
      </header>

      {user && (
        <>
          <section id="about" className="about fade-in">
            <h2>Nuestra Misión</h2>
            <p>
              Apoyamos a pequeños agricultores...
            </p>
          </section>

          <section id="featured" className="featured-products fade-in">
            <h2>Productos Destacados</h2>
            <div className="product-grid">
              <div className="product">
                <img src="/assets/frutas.jpg" alt="Frutas Orgánicas" />
                <h3>Frutas Orgánicas</h3>
              </div>
              <div className="product">
                <img src="/assets/granos.jpg" alt="Granos y Cereales" />
                <h3>Granos y Cereales</h3>
              </div>
              <div className="product">
                <img src="/assets/cuidado-personal.jpg" alt="Cuidado Personal" />
                <h3>Cuidado Personal</h3>
              </div>
            </div>
          </section>

          <section id="education" className="education fade-in">
            <h2>Aprende sobre Sostenibilidad</h2>
            <p>Visita nuestro blog para conocer más...</p>
            <Link to="/blog" className="btn">Visitar Blog</Link>
          </section>
        </>
      )}
    </div>
  );
};

export default Home;
