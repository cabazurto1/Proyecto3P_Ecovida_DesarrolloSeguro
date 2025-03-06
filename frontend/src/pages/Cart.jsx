import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaTrash, FaArrowLeft, FaPlus, FaMinus, FaShoppingCart } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import "../styles/cart.css";

const Cart = () => {
  const { token } = useContext(AuthContext);

  const [cart, setCart] = useState([]);
  const [shippingAddress, setShippingAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState("");
  const navigate = useNavigate();

  // Si no dockerizas el front, apunta a la URL de Nginx
  const API_GATEWAY = "http://localhost";

  // Función para parsear la imagen
  const getItemImage = (item) => {
    if (!item.imagenes) return "/assets/default.jpg";
    try {
      if (typeof item.imagenes === "string") {
        const arr = JSON.parse(item.imagenes);
        if (Array.isArray(arr) && arr.length > 0) return arr[0];
        return item.imagenes;
      } else if (Array.isArray(item.imagenes) && item.imagenes.length > 0) {
        return item.imagenes[0];
      }
      return "/assets/default.jpg";
    } catch {
      return "/assets/default.jpg";
    }
  };

  const fetchCart = async () => {
    if (!token) {
      setCart([]);
      return;
    }
    try {
      const res = await fetch(`${API_GATEWAY}/carrito`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setCart([]);
      } else {
        const data = await res.json();
        setCart(data);
      }
    } catch (err) {
      console.error("Error al obtener carrito:", err);
      setCart([]);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [token]);

  const getCartTotal = () => {
    return cart.reduce((acc, item) => {
      const price = parseFloat(item.precio) || 0;
      return acc + price * item.cantidad;
    }, 0);
  };

  // Cambiar cantidad
  const handleQuantityChange = async (item, change) => {
    setOrderError("");
    if (!token) {
      setOrderError("Debes iniciar sesión para cambiar cantidad.");
      return;
    }
    const newQty = item.cantidad + change;
    if (newQty < 1) return;
    if (newQty > item.stock) {
      setOrderError(`No puedes exceder el stock (${item.stock}).`);
      return;
    }
    try {
      const res = await fetch(`${API_GATEWAY}/carrito/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cantidad: newQty }),
      });
      if (!res.ok) {
        const data = await res.json();
        setOrderError(data.error || "Error al actualizar la cantidad.");
      } else {
        fetchCart();
      }
    } catch (err) {
      console.error("Error al actualizar cantidad:", err);
      setOrderError("Error de conexión. Intenta nuevamente.");
    }
  };

  // Eliminar producto
  const removeFromCart = async (cartItemId) => {
    setOrderError("");
    if (!token) {
      setOrderError("Debes iniciar sesión para eliminar del carrito.");
      return;
    }
    try {
      const res = await fetch(`${API_GATEWAY}/carrito/${cartItemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        setOrderError(data.error || "Error al eliminar producto.");
      } else {
        fetchCart();
      }
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      setOrderError("Error de conexión. Intenta nuevamente.");
    }
  };

  // Vaciar carrito
  const clearCart = async () => {
    setOrderError("");
    if (!token) {
      setOrderError("Debes iniciar sesión para vaciar el carrito.");
      return;
    }
    for (const item of cart) {
      try {
        await fetch(`${API_GATEWAY}/carrito/${item.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Error al vaciar carrito:", err);
      }
    }
    fetchCart();
  };

  // Checkout -> POST /pedidos
  const handleCheckout = async () => {
    setOrderError("");
    if (!shippingAddress.trim()) {
      setOrderError("Por favor ingresa una dirección de envío");
      return;
    }
    if (!token) {
      setOrderError("Debes iniciar sesión para completar la compra");
      return;
    }
    setIsProcessing(true);

    try {
      const res = await fetch(`${API_GATEWAY}/pedidos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          direccion_envio: shippingAddress,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrderSuccess(true);
        setCart([]);
        // redirigir a la confirmación
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
                    src={getItemImage(item)}
                    alt={item.nombre}
                    className="item-image"
                  />
                  <div className="item-details">
                    <h3>{item.nombre}</h3>
                    <p className="item-category">
                      {item.categoria || "Sin categoría"}
                    </p>
                  </div>
                </div>

                <div className="item-price">
                  ${parseFloat(item.precio).toFixed(2)}
                </div>

                <div className="item-quantity">
                  <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item, -1)}
                    disabled={item.cantidad <= 1}
                  >
                    <FaMinus />
                  </button>
                  <span className="quantity-number">{item.cantidad}</span>
                  <button
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(item, 1)}
                    disabled={item.cantidad >= item.stock}
                  >
                    <FaPlus />
                  </button>
                </div>

                <div className="item-subtotal">
                  {(parseFloat(item.precio) * item.cantidad).toFixed(2)}
                </div>

                <div className="item-actions">
                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(item.id)}
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

            <div className="shipping-address">
              <h3>Dirección de envío</h3>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Ingresa tu dirección completa de envío"
              />
            </div>

            <button
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={isProcessing || !shippingAddress.trim()}
            >
              {isProcessing ? "Procesando..." : "Proceder al pago"}
            </button>

            <button className="clear-cart-btn" onClick={clearCart}>
              Vaciar carrito
            </button>

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
