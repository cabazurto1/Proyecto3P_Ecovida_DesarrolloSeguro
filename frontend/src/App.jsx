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
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext"; // Importar el proveedor del carrito

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
          <Route path="/cart" element={<Cart />} /> {/* Nueva ruta del carrito */}
        </Routes>
        <Footer />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
