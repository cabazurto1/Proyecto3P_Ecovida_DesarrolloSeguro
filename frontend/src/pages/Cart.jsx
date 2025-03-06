import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { FaTrash, FaArrowLeft, FaPlus, FaMinus, FaShoppingCart } from "react-icons/fa";
import "../styles/cart.css";

const Cart = () => {
  const { 
    cart, 
    removeFromCart, 
    updateQuantity, 
    getCartTotal,
    clearCart 
  } = useCart();
  
  const [shippingAddress, setShippingAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState("");
  
  const navigate = useNavigate();

  // Función para manejar el cambio de cantidad
  const handleQuantityChange = (item, change) => {
    const newQuantity = item.quantity + change;
    if (newQuantity > 0 && newQuantity <= item.stock) {
      updateQuantity(item.id, newQuantity);
    }
  };

  // Función para manejar el checkout
  const handleCheckout = async () => {
    if (!shippingAddress.trim()) {
      setOrderError("Por favor ingresa una dirección de envío");
      return;
    }

    setIsProcessing(true);
    setOrderError("");

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setOrderError("Debes iniciar sesión para completar la compra");
        setIsProcessing(false);
        return;
      }

      const userData = JSON.parse(localStorage.getItem("userData"));
      const userId = userData?.id;

      const response = await fetch("/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          usuario_id: userId,
          direccion_envio: shippingAddress,
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOrderSuccess(true);
        clearCart();
        
        setTimeout(() => {
          navigate("/order-confirmation", { state: { orderId: data.pedidoId } });
        }, 3000);
      } else {
        setOrderError(data.error || "Error al procesar el pedido");
      }
    } catch (error) {
      console.error("Error al realizar la compra:", error);
      setOrderError("Error de conexión. Intenta nuevamente más tarde.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>
          <FaShoppingCart className="cart-header-icon" /> Carrito de Compras
        </h1>
        <Link to="/shop" className="back-to-shop">
          <FaArrowLeft /> Seguir comprando
        </Link>
      </div>

      {cart.length === 0 ? (
        <div className="empty-cart-message">
          <div className="empty-cart-icon">🛒</div>
          <p>Tu carrito está vacío</p>
          <Link to="/shop" className="continue-shopping-btn">
            Explorar productos
          </Link>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            <div className="cart-headers">
              <span className="header-product">Producto</span>
              <span className="header-price">Precio</span>
              <span className="header-quantity">Cantidad</span>
              <span className="header-subtotal">Subtotal</span>
              <span className="header-actions">Acciones</span>
            </div>

            {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <img
                    src={
                      Array.isArray(item.imagenes) && item.imagenes.length > 0
                        ? item.imagenes[0]
                        : typeof item.imagenes === 'string' && item.imagenes
                          ? item.imagenes
                          : '/assets/default.jpg'
                    }
                    alt={item.nombre}
                    className="item-image"
                  />
                  <div className="item-details">
                    <h3>{item.nombre}</h3>
                    <p className="item-category">{item.categoria || 'Sin categoría'}</p>
                  </div>
                </div>

                <div className="item-price">${parseFloat(item.precio).toFixed(2)}</div>

                <div className="item-quantity">
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item, -1)}
                    disabled={item.quantity <= 1}
                    aria-label="Reducir cantidad"
                  >
                    <FaMinus />
                  </button>
                  <span className="quantity-number">{item.quantity}</span>
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item, 1)}
                    disabled={item.quantity >= item.stock}
                    aria-label="Aumentar cantidad"
                  >
                    <FaPlus />
                  </button>
                </div>

                <div className="item-subtotal">
                  ${(parseFloat(item.precio) * item.quantity).toFixed(2)}
                </div>

                <div className="item-actions">
                  <button 
                    className="remove-btn"
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Eliminar del carrito"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Resumen</h2>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>${getCartTotal().toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Envío:</span>
              <span>$0.00</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>${getCartTotal().toFixed(2)}</span>
            </div>

            {/* Dirección de envío */}
            <div className="shipping-address">
              <h3>Dirección de envío</h3>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Ingresa tu dirección completa de envío"
                required
                className="address-input"
              />
            </div>

            {/* Botón de Checkout */}
            <button 
              className="checkout-btn" 
              onClick={handleCheckout} 
              disabled={isProcessing || !shippingAddress.trim()}
            >
              {isProcessing ? "Procesando..." : "Proceder al pago"}
            </button>

            <button className="clear-cart-btn" onClick={() => clearCart()}>
              Vaciar carrito
            </button>

            {/* Mensajes de éxito o error */}
            {orderSuccess && (
              <div className="order-success">
                <div className="success-icon">✓</div>
                <h3>¡Pedido realizado con éxito!</h3>
                <p>Tu pedido ha sido procesado correctamente.</p>
                <Link to="/my-orders" className="view-orders-btn">
                  Ver mis pedidos
                </Link>
              </div>
            )}

            {orderError && (
              <div className="order-error">
                <p>{orderError}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
