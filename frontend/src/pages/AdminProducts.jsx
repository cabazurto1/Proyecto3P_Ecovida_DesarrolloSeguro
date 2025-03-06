import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import DOMPurify from 'dompurify';
import '../styles/AdminProducts.css';

const AdminProducts = () => {
  const { token } = useContext(AuthContext);
  
  // Lista de productos
  const [products, setProducts] = useState([]);
  // Error general (al cargar la lista)
  const [error, setError] = useState(null);

  // Para el form de "Agregar"
  const [showForm, setShowForm] = useState(false);
  // Error dentro del form de "Agregar"
  const [addProductError, setAddProductError] = useState("");

  // Para el form de "Editar"
  const [showEditModal, setShowEditModal] = useState(false);
  // Error dentro del form de "Editar"
  const [editProductError, setEditProductError] = useState("");

  // Para el modal de eliminar
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);

  // Estado del formulario (sirve para ambos: agregar/editar)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '',
    stock: '',
    imagenes: ''
  });

  // Tu variable de entorno
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  // Estado inicial para resetear
  const initialFormState = {
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '',
    stock: '',
    imagenes: ''
  };

  // Cargar la lista de productos
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/productos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error('Error al cargar productos.');
      }
      const data = await res.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error("Error al cargar productos:", err);
      setError("Error al cargar productos.");
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [token]);

  // Para prevenir XSS en inputs
  const escapeHTML = (input) => DOMPurify.sanitize(input);

  // Manejar cambios en el form (agregar/editar)
  const handleChange = e => {
    const { name, value } = e.target;
    let sanitizedValue = escapeHTML(value);
    setFormData({ ...formData, [name]: sanitizedValue });
  };

  // Procesar las imágenes en un array
  const prepareImagesData = (imagesString) => {
    try {
      if (typeof imagesString === 'string') {
        return imagesString
          .split(',')
          .map((url) => url.trim())
          .filter((url) => url);
      }
      if (Array.isArray(imagesString)) {
        return imagesString;
      }
      return [];
    } catch (error) {
      console.error("Error al procesar imágenes:", error);
      return [];
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData(initialFormState);
  };

  // Abrir modal de Agregar
  const handleAddButtonClick = () => {
    resetForm();
    setAddProductError("");
    setShowForm(true);
  };

  // Lógica para AGREGAR producto
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setAddProductError("");

    const productData = {
      ...formData,
      precio: parseFloat(formData.precio),
      stock: parseInt(formData.stock, 10),
      imagenes: prepareImagesData(formData.imagenes),
    };

    try {
      const response = await fetch(`${API_URL}/productos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      // Si no es ok, intentamos parsear el error
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data.error) {
            throw new Error(data.error); // Ej. "El stock debe ser mayor que 0."
          }
          throw new Error("Error desconocido al agregar.");
        } else {
          // Error sin JSON, tratamos como texto
          const errorText = await response.text();
          throw new Error(errorText);
        }
      }

      // Exito
      setShowForm(false);
      resetForm();
      await fetchProducts();
    } catch (err) {
      console.error("Error al agregar producto:", err);
      setAddProductError(err.message);
    }
  };

  // Abrir modal de Editar con datos del producto
  const handleEditProduct = (product) => {
    const imagesValue = Array.isArray(product.imagenes)
      ? product.imagenes.join(', ')
      : typeof product.imagenes === 'string'
      ? product.imagenes
      : '';

    setSelectedProduct(product);
    setFormData({
      ...product,
      imagenes: imagesValue,
    });
    setEditProductError("");
    setShowEditModal(true);
  };

  // Enviar actualización de producto
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setEditProductError("");

    const { id, ...rest } = formData;
    const productData = {
      ...rest,
      precio: parseFloat(rest.precio),
      stock: parseInt(rest.stock, 10),
      imagenes: prepareImagesData(rest.imagenes),
    };

    try {
      const response = await fetch(`${API_URL}/productos/${selectedProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data.error) {
            throw new Error(data.error);
          }
          throw new Error("Error desconocido al editar.");
        } else {
          const errorText = await response.text();
          throw new Error(errorText);
        }
      }

      // Exito
      setShowEditModal(false);
      resetForm();
      await fetchProducts();
    } catch (err) {
      console.error("Error al editar producto:", err);
      setEditProductError(err.message);
    }
  };

  // Abrir modal de Eliminar
  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const handleDeleteProduct = async () => {
    try {
      const response = await fetch(`${API_URL}/productos/${selectedProduct.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data.error) {
            throw new Error(data.error);
          }
          throw new Error("Error desconocido al eliminar.");
        } else {
          const errorText = await response.text();
          throw new Error(errorText);
        }
      }

      // Éxito
      setShowDeleteModal(false);
      await fetchProducts();
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      setError(err.message); // Este sí podemos mostrarlo como error general
    }
  };

  // Cerrar formularios
  const handleCloseForm = () => {
    setShowForm(false);
    resetForm();
  };
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    resetForm();
  };

  return (
    <div className="admin-products">
      <h1>Administrar Productos</h1>

      {/* Error general (p.e. al cargar la lista) */}
      {error && <p className="error">{error}</p>}

      <button className="add-product-btn" onClick={handleAddButtonClick}>
        <FaPlus className="icon" /> Agregar Producto
      </button>

      {/* MODAL AGREGAR PRODUCTO */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Agregar Producto</h2>

            {/* Mensaje de error al agregar */}
            {addProductError && (
              <div className="error" style={{ marginBottom: "1rem" }}>
                {addProductError}
              </div>
            )}

            <form onSubmit={handleAddProduct} className="product-form">
              <div className="form-group">
                <label htmlFor="nombre">Nombre:</label>
                <input
                  id="nombre"
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  maxLength="50"
                  placeholder="Nombre del producto"
                />
              </div>

              <div className="form-group">
                <label htmlFor="descripcion">Descripción:</label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  maxLength="200"
                  placeholder="Descripción del producto"
                />
              </div>

              <div className="form-group">
                <label htmlFor="precio">Precio:</label>
                <input
                  id="precio"
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  required
                  max="999999.99"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="categoria">Categoría:</label>
                <input
                  id="categoria"
                  type="text"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  placeholder="Categoría"
                />
              </div>

              <div className="form-group">
                <label htmlFor="stock">Stock:</label>
                <input
                  id="stock"
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  max="99999"
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="imagenes">
                  Imágenes (URLs separadas por comas):
                </label>
                <input
                  id="imagenes"
                  type="text"
                  name="imagenes"
                  value={formData.imagenes}
                  onChange={handleChange}
                  placeholder="URL1, URL2, URL3"
                />
              </div>

              <div className="button-group">
                <button type="submit">Agregar Producto</button>
                <button type="button" onClick={handleCloseForm}>
                  Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR PRODUCTO */}
      {showEditModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Editar Producto</h2>

            {/* Mensaje de error al editar */}
            {editProductError && (
              <div className="error" style={{ marginBottom: "1rem" }}>
                {editProductError}
              </div>
            )}

            <form onSubmit={handleUpdateProduct} className="product-form">
              <div className="form-group">
                <label htmlFor="edit-nombre">Nombre:</label>
                <input
                  id="edit-nombre"
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  maxLength="50"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-descripcion">Descripción:</label>
                <textarea
                  id="edit-descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  maxLength="200"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-precio">Precio:</label>
                <input
                  id="edit-precio"
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  required
                  max="999999.99"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-categoria">Categoría:</label>
                <input
                  id="edit-categoria"
                  type="text"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-stock">Stock:</label>
                <input
                  id="edit-stock"
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  max="99999"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-imagenes">
                  Imágenes (URLs separadas por comas):
                </label>
                <input
                  id="edit-imagenes"
                  type="text"
                  name="imagenes"
                  value={formData.imagenes}
                  onChange={handleChange}
                />
              </div>

              <div className="button-group">
                <button type="submit">Actualizar Producto</button>
                <button type="button" onClick={handleCloseEditModal}>
                  Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR PRODUCTO */}
      {showDeleteModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <h2>Confirmar Eliminación</h2>
            <p>
              ¿Estás seguro de que deseas eliminar el producto "
              {selectedProduct.nombre}"?
            </p>
            <div className="button-group">
              <button className="delete-btn" onClick={handleDeleteProduct}>
                Eliminar
              </button>
              <button onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <h2>Lista de Productos</h2>
      {products.length === 0 ? (
        <p>No hay productos disponibles.</p>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <img
                src={
                  Array.isArray(product.imagenes) && product.imagenes.length > 0
                    ? product.imagenes[0]
                    : typeof product.imagenes === "string" && product.imagenes
                    ? product.imagenes
                    : "https://via.placeholder.com/150"
                }
                alt={product.nombre}
                className="product-image"
              />
              <h3>{product.nombre}</h3>
              <p>Precio: ${parseFloat(product.precio).toFixed(2)}</p>
              <p>Stock: {product.stock}</p>
              <div className="actions">
                <FaEdit
                  className="icon edit"
                  onClick={() => handleEditProduct(product)}
                />
                <FaTrash
                  className="icon delete"
                  onClick={() => handleDeleteClick(product)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
