const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const crypto = require("crypto");
const router = express.Router();
const { Client } = require("pg");

// Configuración para la conexión a la base de datos PostgreSQL
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
client.connect();

// Generar automáticamente JWT_SECRET si no está definido
const jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(64).toString("hex");

// Definir roles permitidos
const allowedRoles = ["Administrador", "Cliente", "Vendedor"];

// Esquema de validación para registro de usuario
const userSchema = Joi.object({
  nombre: Joi.string().min(3).max(100).required().messages({
    "string.empty": 'El campo "nombre" es obligatorio.',
    "string.min": 'El campo "nombre" debe tener al menos 3 caracteres.',
    "string.max": 'El campo "nombre" no puede exceder los 100 caracteres.',
  }),
  email: Joi.string().email().required().messages({
    "string.email": 'El campo "email" debe ser una dirección de correo válida.',
    "string.empty": 'El campo "email" es obligatorio.',
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": 'El campo "password" es obligatorio.',
    "string.min": 'El campo "password" debe tener al menos 6 caracteres.',
  }),
  rol: Joi.string()
    .valid(...allowedRoles)
    .required()
    .messages({
      "any.only": `El campo "rol" debe ser uno de los siguientes: ${allowedRoles.join(", ")}.`,
      "string.empty": 'El campo "rol" es obligatorio.',
    }),
});

// Ruta para registrar un nuevo usuario con contraseña cifrada
router.post("/", async (req, res) => {
  try {
    const { error } = userSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { nombre, email, password, rol } = req.body;

    // Verificar si el email ya existe
    const existingUser = await client.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "El email ya está registrado." });
    }

    // Cifrar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el nuevo usuario en la base de datos
    const result = await client.query(
      "INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, rol",
      [nombre, email, hashedPassword, rol]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error al registrar el usuario:", err);
    res.status(500).json({ error: "Error en el servidor.", details: err.message });
  }
});

// Ruta para iniciar sesión y generar un token JWT
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "El email y la contraseña son obligatorios." });
    }

    // Buscar al usuario por email
    const result = await client.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    const user = result.rows[0];

    // Comparar la contraseña ingresada con la contraseña cifrada en la base de datos
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    // Generar el token JWT
    const token = jwt.sign({ id: user.id, role: user.rol }, jwtSecret, { expiresIn: "1h" });

    res.json({ token });
  } catch (err) {
    console.error("Error al iniciar sesión:", err);
    res.status(500).json({ error: "Error en el servidor." });
  }
});

// Ruta para obtener la clave JWT dinámica
router.get("/jwt-secret", (req, res) => {
  res.json({ secret: jwtSecret });
});

module.exports = router;
