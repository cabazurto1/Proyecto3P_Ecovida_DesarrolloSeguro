import React, { useEffect, useState } from "react";
import { FaLeaf, FaHeartbeat, FaAppleAlt, FaSpinner } from "react-icons/fa";
import "../styles/Blog.css";

const Blog = () => {
  const [fruits, setFruits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Datos de ejemplo para usar cuando la API no está disponible
  const sampleFruits = [
    {
      id: 1,
      name: "Manzana",
      family: "Rosaceae",
      genus: "Malus",
      nutritions: {
        calories: 52,
        fat: 0.2,
        sugar: 10.3,
        carbohydrates: 13.8,
        protein: 0.3,
        fiber: 2.4
      },
      benefits: "Rica en antioxidantes y fibra, ayuda a la digestión y salud cardiovascular."
    },
    {
      id: 2,
      name: "Plátano",
      family: "Musaceae",
      genus: "Musa",
      nutritions: {
        calories: 96,
        fat: 0.2,
        sugar: 17.2,
        carbohydrates: 22,
        protein: 1.1,
        fiber: 2.6
      },
      benefits: "Alto contenido de potasio, ayuda a regular la presión arterial y proporciona energía."
    },
    {
      id: 3,
      name: "Naranja",
      family: "Rutaceae",
      genus: "Citrus",
      nutritions: {
        calories: 47,
        fat: 0.1,
        sugar: 9.4,
        carbohydrates: 11.8,
        protein: 0.9,
        fiber: 2.4
      },
      benefits: "Alta en vitamina C, fortalece el sistema inmunológico y mejora la absorción de hierro."
    },
    {
      id: 4,
      name: "Fresa",
      family: "Rosaceae",
      genus: "Fragaria",
      nutritions: {
        calories: 32,
        fat: 0.3,
        sugar: 4.9,
        carbohydrates: 7.7,
        protein: 0.7,
        fiber: 2.0
      },
      benefits: "Rica en antioxidantes, ayuda a reducir la inflamación y mejora la salud cardiovascular."
    },
    {
      id: 5,
      name: "Aguacate",
      family: "Lauraceae",
      genus: "Persea",
      nutritions: {
        calories: 160,
        fat: 14.7,
        sugar: 0.7,
        carbohydrates: 8.5,
        protein: 2,
        fiber: 6.7
      },
      benefits: "Alto contenido de grasas saludables, ayuda a reducir el colesterol malo y mejora la salud cerebral."
    },
    {
      id: 6,
      name: "Kiwi",
      family: "Actinidiaceae",
      genus: "Actinidia",
      nutritions: {
        calories: 61,
        fat: 0.5,
        sugar: 9,
        carbohydrates: 14.7,
        protein: 1.1,
        fiber: 2.9
      },
      benefits: "Rico en vitamina C y E, ayuda a la digestión y fortalece el sistema inmunológico."
    },
    {
      id: 7,
      name: "Frambuesa",
      family: "Rosaceae",
      genus: "Rubus",
      nutritions: {
        calories: 52,
        fat: 0.7,
        sugar: 4.4,
        carbohydrates: 11.9,
        protein: 1.2,
        fiber: 6.5
      },
      benefits: "Alta en antioxidantes, ayuda a prevenir enfermedades crónicas y mejora la salud de la piel."
    },
    {
      id: 8,
      name: "Arándano",
      family: "Ericaceae",
      genus: "Vaccinium",
      nutritions: {
        calories: 57,
        fat: 0.3,
        sugar: 9.8,
        carbohydrates: 14.5,
        protein: 0.7,
        fiber: 2.4
      },
      benefits: "Rico en antioxidantes, ayuda a mejorar la memoria y reduce el riesgo de enfermedades cardiovasculares."
    },
    {
      id: 9,
      name: "Piña",
      family: "Bromeliaceae",
      genus: "Ananas",
      nutritions: {
        calories: 50,
        fat: 0.1,
        sugar: 9.8,
        carbohydrates: 13.1,
        protein: 0.5,
        fiber: 1.4
      },
      benefits: "Contiene bromelina, enzima que ayuda a la digestión y reduce la inflamación."
    },
    {
      id: 10,
      name: "Mango",
      family: "Anacardiaceae",
      genus: "Mangifera",
      nutritions: {
        calories: 60,
        fat: 0.4,
        sugar: 13.7,
        carbohydrates: 15,
        protein: 0.8,
        fiber: 1.6
      },
      benefits: "Rico en vitaminas A y C, ayuda a fortalecer el sistema inmunológico y mejora la salud ocular."
    }
  ];

  useEffect(() => {
    const fetchFruits = async () => {
      setLoading(true);
      try {
        // Usamos la URL del proxy
        const response = await fetch("/api/fruit/all");
        
        if (!response.ok) throw new Error("Error al cargar datos de la API");
        
        const data = await response.json();
        setFruits(data.slice(0, 10)); // Tomamos solo 10 frutas para mostrar
      } catch (err) {
        console.error("Error al cargar datos de la API:", err);
        // Usamos datos de ejemplo en caso de error
        setFruits(sampleFruits);
      } finally {
        setLoading(false);
      }
    };

    fetchFruits();
  }, []);

  // Filtramos las frutas según la categoría seleccionada
  const filteredFruits = selectedCategory === "all" 
    ? fruits 
    : fruits.filter(fruit => {
        if (selectedCategory === "lowCalorie") return fruit.nutritions.calories < 60;
        if (selectedCategory === "lowSugar") return fruit.nutritions.sugar < 10;
        return true;
      });

  // Función para obtener una URL de imagen basada en el nombre de la fruta
  const getFruitImage = (fruitName) => {
    const name = fruitName.toLowerCase();
    return `/assets/fruits/${name}.jpg`;
  };

  // Función para crear un color de acento basado en el tipo de fruta
  const getFruitColor = (fruitGenus) => {
    const colorMap = {
      "Malus": "#e74c3c", // Rojo para manzanas
      "Musa": "#f1c40f", // Amarillo para plátanos
      "Citrus": "#e67e22", // Naranja para cítricos
      "Fragaria": "#c0392b", // Rojo oscuro para fresas
      "Persea": "#27ae60", // Verde para aguacates
      "Actinidia": "#2ecc71", // Verde claro para kiwis
      "Rubus": "#9b59b6", // Morado para frambuesas
      "Vaccinium": "#3498db", // Azul para arándanos
      "Ananas": "#f39c12", // Ámbar para piñas
      "Mangifera": "#d35400" // Naranja oscuro para mangos
    };
    
    return colorMap[fruitGenus] || "#16a085"; // Color por defecto
  };

  return (
    <div className="blog-container">
      <header className="blog-header">
        <div className="blog-header-content">
          <h1><FaLeaf className="icon" /> Blog de EcoVida</h1>
          <p className="blog-subtitle">Descubre los beneficios de las frutas para una vida saludable</p>
        </div>
      </header>

      <section className="blog-category-filter">
        <h2>Explora por categorías</h2>
        <div className="category-buttons">
          <button 
            className={selectedCategory === "all" ? "active" : ""} 
            onClick={() => setSelectedCategory("all")}
          >
            <FaAppleAlt /> Todas las frutas
          </button>
          <button 
            className={selectedCategory === "lowCalorie" ? "active" : ""} 
            onClick={() => setSelectedCategory("lowCalorie")}
          >
            <FaHeartbeat /> Bajas en calorías
          </button>
          <button 
            className={selectedCategory === "lowSugar" ? "active" : ""} 
            onClick={() => setSelectedCategory("lowSugar")}
          >
            <FaHeartbeat /> Bajas en azúcar
          </button>
        </div>
      </section>
      
      {error && <div className="error-message" role="alert">
        <p>{error}</p>
        <p>Mostrando información de ejemplo.</p>
      </div>}

      {loading ? (
        <div className="loading-container">
          <FaSpinner className="spinner" />
          <p>Cargando datos de frutas...</p>
        </div>
      ) : (
        <div className="blog-grid">
          {filteredFruits.map((fruit) => (
            <article key={fruit.id || fruit.name} className="blog-card" style={{borderTop: `4px solid ${getFruitColor(fruit.genus)}`}}>
              <div className="blog-card-image">
              </div>
              <div className="blog-card-content">
                <h2>{fruit.name}</h2>
                <p className="fruit-family">{fruit.family} · {fruit.genus}</p>
                
                <div className="nutrition-info">
                  <div className="nutrition-item">
                    <span className="nutrition-label">Calorías: </span>
                    <span className="nutrition-value">{fruit.nutritions.calories} kcal</span>
                  </div>
                  <div className="nutrition-item">
                    <span className="nutrition-label">Azúcar: </span>
                    <span className="nutrition-value">{fruit.nutritions.sugar}g</span>
                  </div>
                  <div className="nutrition-item">
                    <span className="nutrition-label">Carbohidratos: </span>
                    <span className="nutrition-value">{fruit.nutritions.carbohydrates}g</span>
                  </div>
                  <div className="nutrition-item">
                    <span className="nutrition-label">Proteínas: </span>
                    <span className="nutrition-value">{fruit.nutritions.protein}g</span>
                  </div>
                </div>
                
                {fruit.benefits && (
                  <div className="fruit-benefits">
                    <h3>Beneficios: </h3>
                    <p>{fruit.benefits}</p>
                  </div>
                )}
                
              </div>
            </article>
          ))}
        </div>
      )}
      
      <section className="blog-newsletter">
        <div className="newsletter-content">
          <h2>Recibe nuestras novedades</h2>
          <p>Suscríbete para recibir información sobre alimentos orgánicos y consejos de salud</p>
          <form className="newsletter-form">
            <input type="email" placeholder="Tu correo electrónico" aria-label="Correo electrónico" />
            <button type="submit">Suscribirse</button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Blog;
