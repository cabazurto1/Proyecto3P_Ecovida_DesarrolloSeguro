import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import Registro from "./pages/Registro";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminProducts from "./pages/AdminProducts";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders"; // Importar tu Orders.jsx
import OrderConfirmation from "./pages/OrderConfirmation"; // Importar la nueva
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/cart" element={<Cart />} />

          {/* NUEVAS RUTAS */}
          <Route path="/my-orders" element={<Orders />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
        </Routes>
        <Footer />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
