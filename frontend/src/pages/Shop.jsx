import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { FaPlus, FaMinus, FaShoppingCart } from "react-icons/fa";
import "../styles/shop.css";

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({});
  const { addToCart } = useCart();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  useEffect(() => {
    fetch(`${API_URL}/productos`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        setProducts(data);
        // Inicializar el estado de cantidades para cada producto
        const initialQuantities = {};
        data.forEach(product => {
          initialQuantities[product.id] = 1;
        });
        setQuantities(initialQuantities);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error al cargar productos:", error.message);
        setError("No se pudieron cargar los productos.");
        setLoading(false);
      });
  }, []);

  // Función para manejar cambios en la cantidad
  const handleQuantityChange = (productId, change) => {
    setQuantities(prev => {
      const currentQuantity = prev[productId] || 1;
      const product = products.find(p => p.id === productId);
      const maxStock = product ? product.stock : 0;
      
      // Calcular nueva cantidad asegurándose que esté entre 1 y el stock máximo
      const newQuantity = Math.max(1, Math.min(maxStock, currentQuantity + change));
      
      return { ...prev, [productId]: newQuantity };
    });
  };

  // Función para agregar al carrito con la cantidad seleccionada
  const handleAddToCart = (product) => {
    const quantity = quantities[product.id] || 1;
    
    // Creamos una copia del producto con la cantidad incluida
    const productWithQuantity = {
      ...product,
      quantity: quantity  // Aseguramos que la cantidad se incluya en el objeto
    };
    
    // Pasamos el producto modificado al contexto
    addToCart(productWithQuantity, quantity);
  };

  // Función para procesar el formato de la imagen
  const getProductImage = (product) => {
    if (!product.imagenes) return "/assets/default.jpg";
    
    try {
      // Si imagenes es un string (posiblemente JSON)
      if (typeof product.imagenes === 'string') {
        try {
          const parsed = JSON.parse(product.imagenes);
          return Array.isArray(parsed) && parsed.length > 0 
            ? parsed[0] 
            : "/assets/default.jpg";
        } catch {
          return product.imagenes || "/assets/default.jpg";
        }
      }
      // Si imagenes ya es un array
      else if (Array.isArray(product.imagenes) && product.imagenes.length > 0) {
        return product.imagenes[0];
      }
      return "/assets/default.jpg";
    } catch {
      return "/assets/default.jpg";
    }
  };

  if (loading) {
    return <div className="loading">Cargando productos...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="shop">
      <h1>Tienda Orgánica</h1>
      <div className="product-grid">
        {products.map((product) => (
          <div className="product-card" key={product.id}>
            <img
              src={getProductImage(product)}
              alt={product.nombre}
              className="product-image"
            />
            <div className="product-info">
              <h3>{product.nombre}</h3>
              <p className="product-description">{product.descripcion}</p>
              <p className="product-price">${parseFloat(product.precio).toFixed(2)}</p>
              
              <div className="quantity-controls">
                <button 
                  className="quantity-btn" 
                  onClick={() => handleQuantityChange(product.id, -1)}
                  disabled={quantities[product.id] <= 1}
                >
                  <FaMinus />
                </button>
                <span className="quantity-display">{quantities[product.id] || 1}</span>
                <button 
                  className="quantity-btn" 
                  onClick={() => handleQuantityChange(product.id, 1)}
                  disabled={quantities[product.id] >= product.stock}
                >
                  <FaPlus />
                </button>
              </div>
              
              <div className="stock-info">
                <span className={product.stock > 0 ? "in-stock" : "out-of-stock"}>
                  {product.stock > 0 ? `En stock: ${product.stock}` : "Agotado"}
                </span>
              </div>
              
              <button 
                className="add-to-cart-btn" 
                onClick={() => handleAddToCart(product)}
                disabled={product.stock <= 0}
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