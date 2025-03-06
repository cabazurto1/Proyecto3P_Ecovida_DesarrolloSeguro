import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  
  // Cargar el carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error al cargar el carrito:', error);
      }
    }
  }, []);
  
  // Guardar el carrito en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Agregar producto al carrito con cantidad
  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      // Verificar si el producto ya está en el carrito
      const existingItemIndex = prevCart.findIndex(item => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        // El producto ya existe, actualizar la cantidad
        const updatedCart = [...prevCart];
        const newQuantity = updatedCart[existingItemIndex].quantity + quantity;
        
        // Verificar que no exceda el stock disponible
        const maxStock = product.stock;
        updatedCart[existingItemIndex].quantity = Math.min(newQuantity, maxStock);
        
        return updatedCart;
      } else {
        // El producto no existe en el carrito, añadirlo
        return [...prevCart, { ...product, quantity }];
      }
    });
    
    // Mensaje de confirmación
    alert(`${quantity} ${quantity === 1 ? 'unidad' : 'unidades'} de ${product.nombre} ${quantity === 1 ? 'agregada' : 'agregadas'} al carrito`);
  };

  // Remover producto del carrito
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Actualizar cantidad de un producto en el carrito
  const updateQuantity = (productId, newQuantity) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === productId 
          ? { ...item, quantity: Math.max(1, Math.min(item.stock, newQuantity)) } 
          : item
      )
    );
  };

  // Limpiar el carrito
  const clearCart = () => {
    setCart([]);
  };

  // Calcular el total del carrito
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (parseFloat(item.precio) * item.quantity), 0);
  };

  // Obtener el número total de artículos en el carrito
  const getCartItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      getCartTotal,
      getCartItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};