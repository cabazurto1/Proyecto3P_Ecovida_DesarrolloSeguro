import React, { useState } from 'react';
import '../styles/contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({ nombre: '', email: '', mensaje: '' });
  const [responseMsg, setResponseMsg] = useState('');
  const [errors, setErrors] = useState({});
  const [submitCount, setSubmitCount] = useState(0);
  const MAX_SUBMISSIONS = 5; // Limita envíos para prevenir spam

  const validateForm = () => {
    let errors = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    const forbiddenWords = /(SELECT|INSERT|DELETE|UPDATE|DROP|ALTER|CREATE|TRUNCATE|UNION|--|;|\*|'|")/gi;
    const xssRegex = /(<|>|script|javascript|onerror|onload)/gi;

    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio';
    } else if (forbiddenWords.test(formData.nombre) || xssRegex.test(formData.nombre)) {
      errors.nombre = 'Entrada inválida';
    }

    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      errors.email = 'Correo electrónico inválido';
    }

    if (!formData.mensaje.trim() || formData.mensaje.length < 10) {
      errors.mensaje = 'El mensaje debe tener al menos 10 caracteres';
    } else if (forbiddenWords.test(formData.mensaje) || xssRegex.test(formData.mensaje)) {
      errors.mensaje = 'Entrada inválida';
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const sanitizeInput = (input) => {
    return input.replace(/[<>"']/g, "").replace(/\s+/g, ' ').trim();
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;

    if (submitCount >= MAX_SUBMISSIONS) {
      setResponseMsg('Has superado el límite de envíos. Inténtalo más tarde.');
      return;
    }

    try {
      setSubmitCount(submitCount + 1);

      const sanitizedData = {
        usuario_id: 1, // En producción, obtener del contexto de usuario
        nombre: sanitizeInput(formData.nombre),
        email: sanitizeInput(formData.email),
        mensaje: sanitizeInput(formData.mensaje)
      };

      const res = await fetch('http://localhost:3004/tickets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        },
        body: JSON.stringify(sanitizedData)
      });

      if (res.ok) {
        setResponseMsg('Tu mensaje ha sido enviado. Pronto nos pondremos en contacto.');
        setFormData({ nombre: '', email: '', mensaje: '' });
        setErrors({});
      } else {
        setResponseMsg('Hubo un error al enviar el mensaje.');
      }
    } catch (error) {
      setResponseMsg('Error en el servidor. Inténtalo más tarde.');
    }
  };

  return (
    <div className="contact">
      <h1>Contáctanos</h1>
      {responseMsg && <p className="response-message">{responseMsg}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" name="nombre" placeholder="Tu nombre" value={formData.nombre} onChange={handleChange} required/>
        {errors.nombre && <p className="error">{errors.nombre}</p>}
        
        <input type="email" name="email" placeholder="Tu correo" value={formData.email} onChange={handleChange} required/>
        {errors.email && <p className="error">{errors.email}</p>}
        
        <textarea name="mensaje" placeholder="Tu mensaje" value={formData.mensaje} onChange={handleChange} required></textarea>
        {errors.mensaje && <p className="error">{errors.mensaje}</p>}
        
        <button type="submit" disabled={submitCount >= MAX_SUBMISSIONS}>Enviar Mensaje</button>
      </form>
    </div>
  );
};

export default Contact;
