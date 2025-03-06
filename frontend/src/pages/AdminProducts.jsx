import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import DOMPurify from 'dompurify';
import '../styles/AdminProducts.css';

const AdminProducts = () => {
  const { token } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '',
    stock: '',
    imagenes: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  // Estado inicial del formulario para resetear
  const initialFormState = {
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '',
    stock: '',
    imagenes: ''
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/productos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Error al cargar productos:", err);
      setError("Error al cargar productos");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token, API_URL]);

  const escapeHTML = (input) => DOMPurify.sanitize(input);

  const handleChange = e => {
    const { name, value } = e.target;
    let sanitizedValue = escapeHTML(value);
    setFormData({ ...formData, [name]: sanitizedValue });
  };

  const prepareImagesData = (imagesString) => {
    try {
      // Si es una cadena con URLs separadas por comas
      if (typeof imagesString === 'string') {
        // Dividir por comas y eliminar espacios en blanco
        return imagesString.split(',').map(url => url.trim()).filter(url => url);
      }
      // Si ya es un array, devolverlo tal cual
      if (Array.isArray(imagesString)) {
        return imagesString;
      }
      // En cualquier otro caso, devolver un array vacío
      return [];
    } catch (error) {
      console.error("Error al procesar imágenes:", error);
      return [];
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
  };

  const handleAddButtonClick = () => {
    resetForm(); // Aseguramos que el formulario esté limpio
    setShowForm(true);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Creamos una copia del formData sin incluir el ID
    const { id, ...productDataWithoutId } = formData;
    
    const productData = {
      ...productDataWithoutId,
      precio: parseFloat(formData.precio),
      stock: parseInt(formData.stock, 10),
      imagenes: prepareImagesData(formData.imagenes)
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
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      setShowForm(false);
      resetForm(); // Limpiamos el formulario después de agregar
      await fetchProducts(); // Recargar productos en lugar de recargar la página
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditProduct = (product) => {
    // Convertir las imágenes a un formato adecuado para el input
    const imagesValue = Array.isArray(product.imagenes) 
      ? product.imagenes.join(', ') 
      : typeof product.imagenes === 'string' 
        ? product.imagenes 
        : '';
        
    setSelectedProduct(product);
    setFormData({ 
      ...product,
      imagenes: imagesValue
    });
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Extraer el ID y preparar los datos para la actualización
    const { id, ...updatedProductData } = formData;
    
    // Convertir los valores numéricos y procesar imágenes
    const productData = {
      ...updatedProductData,
      precio: parseFloat(updatedProductData.precio),
      stock: parseInt(updatedProductData.stock, 10),
      imagenes: prepareImagesData(updatedProductData.imagenes)
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
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      setShowEditModal(false);
      resetForm(); // Limpiamos el formulario después de editar
      await fetchProducts(); // Recargar productos en lugar de recargar la página
    } catch (err) {
      setError(err.message);
    }
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
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      setShowDeleteModal(false);
      await fetchProducts(); // Recargar productos en lugar de recargar la página
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    resetForm(); // Limpiamos el formulario al cerrar
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    resetForm(); // Limpiamos el formulario al cerrar
  };

  return (
    <div className="admin-products">
      <h1>Administrar Productos</h1>
      {error && <p className="error">{error}</p>}
      <button className="add-product-btn" onClick={handleAddButtonClick}>
        <FaPlus className="icon" /> Agregar Producto
      </button>


      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Agregar Producto</h2>
            <form onSubmit={handleAddProduct} className="product-form">
              <div className="form-group">
                <label htmlFor="nombre">Nombre:</label>
                <input id="nombre" type="text" name="nombre" value={formData.nombre} onChange={handleChange} required maxLength="50" placeholder="Nombre del producto" />
              </div>
              
              <div className="form-group">
                <label htmlFor="descripcion">Descripción:</label>
                <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} maxLength="200" placeholder="Descripción del producto" />
              </div>
              
              <div className="form-group">
                <label htmlFor="precio">Precio:</label>
                <input id="precio" type="number" name="precio" value={formData.precio} onChange={handleChange} required max="999999.99" step="0.01" placeholder="0.00" />
              </div>
              
              <div className="form-group">
                <label htmlFor="categoria">Categoría:</label>
                <input id="categoria" type="text" name="categoria" value={formData.categoria} onChange={handleChange} placeholder="Categoría" />
              </div>
              
              <div className="form-group">
                <label htmlFor="stock">Stock:</label>
                <input id="stock" type="number" name="stock" value={formData.stock} onChange={handleChange} required max="99999" placeholder="0" />
              </div>
              
              <div className="form-group">
                <label htmlFor="imagenes">Imágenes (URLs separadas por comas):</label>
                <input id="imagenes" type="text" name="imagenes" value={formData.imagenes} onChange={handleChange} placeholder="URL1, URL2, URL3" />
              </div>
              
              <div className="button-group">
                <button type="submit">Agregar Producto</button>
                <button type="button" onClick={handleCloseForm}>Cerrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Editar Producto</h2>
            <form onSubmit={handleUpdateProduct} className="product-form">
              <div className="form-group">
                <label htmlFor="edit-nombre">Nombre:</label>
                <input id="edit-nombre" type="text" name="nombre" value={formData.nombre} onChange={handleChange} required maxLength="50" />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-descripcion">Descripción:</label>
                <textarea id="edit-descripcion" name="descripcion" value={formData.descripcion} onChange={handleChange} maxLength="200" />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-precio">Precio:</label>
                <input id="edit-precio" type="number" name="precio" value={formData.precio} onChange={handleChange} required max="999999.99" step="0.01" />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-categoria">Categoría:</label>
                <input id="edit-categoria" type="text" name="categoria" value={formData.categoria} onChange={handleChange} />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-stock">Stock:</label>
                <input id="edit-stock" type="number" name="stock" value={formData.stock} onChange={handleChange} required max="99999" />
              </div>
              
              <div className="form-group">
                <label htmlFor="edit-imagenes">Imágenes (URLs separadas por comas):</label>
                <input id="edit-imagenes" type="text" name="imagenes" value={formData.imagenes} onChange={handleChange} />
              </div>
              
              <div className="button-group">
                <button type="submit">Actualizar Producto</button>
                <button type="button" onClick={handleCloseEditModal}>Cerrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <h2>Confirmar Eliminación</h2>
            <p>¿Estás seguro de que deseas eliminar el producto "{selectedProduct.nombre}"?</p>
            <div className="button-group">
              <button className="delete-btn" onClick={handleDeleteProduct}>Eliminar</button>
              <button onClick={() => setShowDeleteModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <h2>Lista de Productos</h2>
      {products.length === 0 ? (
        <p>No hay productos disponibles.</p>
      ) : (
        <div className="product-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <img 
                src={Array.isArray(product.imagenes) && product.imagenes.length > 0 
                  ? product.imagenes[0] 
                  : typeof product.imagenes === 'string' && product.imagenes
                    ? product.imagenes
                    : 'https://via.placeholder.com/150'} 
                alt={product.nombre} 
                className="product-image" 
              />
              <h3>{product.nombre}</h3>
              <p>Precio: ${parseFloat(product.precio).toFixed(2)}</p>
              <p>Stock: {product.stock}</p>
              <div className="actions">
                <FaEdit className="icon edit" onClick={() => handleEditProduct(product)} />
                <FaTrash className="icon delete" onClick={() => { setSelectedProduct(product); setShowDeleteModal(true); }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProducts;