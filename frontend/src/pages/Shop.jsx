import React, { useEffect, useState, useContext } from "react";
import { FaPlus, FaMinus, FaShoppingCart } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import "../styles/shop.css";

const Shop = () => {
  const { token } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [cartMessage, setCartMessage] = useState("");

  // Si tu Nginx escucha en el puerto 80, la URL base es:
  const API_GATEWAY = "http://localhost";

  useEffect(() => {
    // Cargamos productos desde Nginx: GET http://localhost/productos
    fetch(`${API_GATEWAY}/productos`)
      .then((resp) => {
        if (!resp.ok) {
          throw new Error(`Error ${resp.status}: ${resp.statusText}`);
        }
        return resp.json();
      })
      .then((data) => {
        setProducts(data);
        const initQty = {};
        data.forEach((p) => {
          initQty[p.id] = 1;
        });
        setQuantities(initQty);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al cargar productos:", err);
        setError("No se pudieron cargar los productos.");
        setLoading(false);
      });
  }, []);

  const handleQuantityChange = (productId, change) => {
    setCartMessage("");
    setQuantities((prev) => {
      const current = prev[productId] || 1;
      const prod = products.find((p) => p.id === productId);
      const maxStock = prod ? prod.stock : 0;
      const newQuantity = Math.max(1, Math.min(maxStock, current + change));
      return { ...prev, [productId]: newQuantity };
    });
  };

  const handleAddToCart = async (product) => {
    setCartMessage("");
    if (!token) {
      setCartMessage("Debes iniciar sesión para agregar productos al carrito.");
      return;
    }
    const quantity = quantities[product.id] || 1;
    try {
      // POST http://localhost/carrito
      const res = await fetch(`${API_GATEWAY}/carrito`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          producto_id: product.id,
          cantidad: quantity,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setCartMessage(data.error || "Error al agregar al carrito.");
      } else {
        setCartMessage("Producto agregado correctamente al carrito.");
      }
    } catch (err) {
      console.error("Error al agregar al carrito:", err);
      setCartMessage("Error de conexión. Intenta de nuevo.");
    }
  };

  const getProductImage = (p) => {
    if (!p.imagenes) return "/assets/default.jpg";
    try {
      if (typeof p.imagenes === "string") {
        const arr = JSON.parse(p.imagenes);
        if (Array.isArray(arr) && arr.length > 0) return arr[0];
        return p.imagenes;
      } else if (Array.isArray(p.imagenes) && p.imagenes.length > 0) {
        return p.imagenes[0];
      }
      return "/assets/default.jpg";
    } catch {
      return "/assets/default.jpg";
    }
  };

  if (loading) return <div className="loading">Cargando productos...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="shop">
      <h1>Tienda Orgánica</h1>

      {cartMessage && (
        <div className="server-message" style={{ marginBottom: "1rem" }}>
          {cartMessage}
        </div>
      )}

      <div className="product-grid">
        {products.map((prod) => (
          <div className="product-card" key={prod.id}>
            <img
              src={getProductImage(prod)}
              alt={prod.nombre}
              className="product-image"
            />
            <div className="product-info">
              <h3>{prod.nombre}</h3>
              <p className="product-description">{prod.descripcion}</p>
              <p className="product-price">
                ${parseFloat(prod.precio).toFixed(2)}
              </p>

              <div className="quantity-controls">
                <button
                  className="quantity-btn"
                  onClick={() => handleQuantityChange(prod.id, -1)}
                  disabled={quantities[prod.id] <= 1}
                >
                  <FaMinus />
                </button>
                <span className="quantity-display">
                  {quantities[prod.id] || 1}
                </span>
                <button
                  className="quantity-btn"
                  onClick={() => handleQuantityChange(prod.id, 1)}
                  disabled={quantities[prod.id] >= prod.stock}
                >
                  <FaPlus />
                </button>
              </div>

              <div className="stock-info">
                <span
                  className={prod.stock > 0 ? "in-stock" : "out-of-stock"}
                >
                  {prod.stock > 0 ? `En stock: ${prod.stock}` : "Agotado"}
                </span>
              </div>

              <button
                className="add-to-cart-btn"
                onClick={() => handleAddToCart(prod)}
                disabled={prod.stock <= 0}
              >
                <FaShoppingCart /> Agregar al Carrito
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Shop;
