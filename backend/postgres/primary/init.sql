-- Crear roles
CREATE ROLE administrador;
CREATE ROLE cliente;
CREATE ROLE vendedor;

-- Crear tablas principales y logs (incluyendo triggers)
CREATE TABLE logs_usuarios (
    id SERIAL PRIMARY KEY,
    usuario_id INT,
    accion VARCHAR(50),
    fecha TIMESTAMP
);

CREATE TABLE logs_productos (
    id SERIAL PRIMARY KEY,
    producto_id INT,
    accion VARCHAR(50),
    stock_anterior INT,
    stock_nuevo INT,
    fecha TIMESTAMP
);

CREATE OR REPLACE FUNCTION log_changes_usuarios()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO logs_usuarios (usuario_id, accion, fecha)
    VALUES (NEW.id, TG_OP, CURRENT_TIMESTAMP);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_changes_productos()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO logs_productos (producto_id, accion, stock_anterior, stock_nuevo, fecha)
    VALUES (
        NEW.id, 
        TG_OP, 
        OLD.stock, 
        NEW.stock, 
        CURRENT_TIMESTAMP
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) CHECK (rol IN ('Administrador', 'Cliente','Vendedor', 'Soporte'))
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    categoria VARCHAR(50),
    stock INT NOT NULL,
    imagenes JSONB
);

CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id),
    fecha TIMESTAMP DEFAULT NOW(),
    total DECIMAL(10, 2) NOT NULL,
    estado VARCHAR(20) CHECK (estado IN ('Pendiente', 'Completado', 'Cancelado'))
);

CREATE TABLE carrito (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id),
    producto_id INT REFERENCES productos(id),
    cantidad INT NOT NULL
);

CREATE TABLE envios (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id),
    direccion TEXT NOT NULL,
    estado VARCHAR(20) CHECK (estado IN ('En Proceso', 'Enviado', 'Entregado'))
);

CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id),
    metodo_pago VARCHAR(50),
    estado VARCHAR(20) CHECK (estado IN ('Pendiente', 'Aprobado', 'Rechazado')),
    fecha TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id),
    mensaje TEXT NOT NULL,
    estado VARCHAR(20) CHECK (estado IN ('Abierto', 'Cerrado'))
);

-- Tabla para almacenar los productos que lleva cada pedido
CREATE TABLE pedido_detalles (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id),
    producto_id INT REFERENCES productos(id),
    cantidad INT NOT NULL,
    precio DECIMAL(10, 2) NOT NULL  -- Se guarda el precio unitario al momento de la compra
);


-- Disparadores
CREATE TRIGGER after_usuarios_changes
AFTER INSERT OR UPDATE OR DELETE ON usuarios
FOR EACH ROW EXECUTE FUNCTION log_changes_usuarios();

CREATE TRIGGER after_productos_changes
AFTER INSERT OR UPDATE OR DELETE ON productos
FOR EACH ROW EXECUTE FUNCTION log_changes_productos();

-- Asignar todos los permisos sobre todas las tablas de la base de datos al rol 'administrador'
GRANT ALL PRIVILEGES ON DATABASE primary_db TO administrador;

-- Asignar permisos completos sobre las tablas
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO administrador;

-- Asignar permisos sobre secuencias (si las usas para autoincrementar)
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO administrador;

-- Asignar permisos de lectura sobre las tablas de productos, pedidos, y carrito
GRANT SELECT ON productos, pedidos, carrito TO cliente;

-- Asignar permisos de lectura sobre productos
GRANT SELECT ON productos TO vendedor;

-- Permitir al vendedor actualizar productos e inventario
GRANT UPDATE ON productos TO vendedor;

-- Permitir al vendedor ver y actualizar pedidos
GRANT SELECT, UPDATE ON pedidos TO vendedor;

-- Asignar roles a usuarios
-- GRANT administrador TO nombre_usuario;
-- GRANT cliente TO nombre_usuario;
-- GRANT vendedor TO nombre_usuario;
