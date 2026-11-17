-- Tabla clientes (PostgreSQL)
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    clave VARCHAR(255) NOT NULL,
    creado TIMESTAMP DEFAULT NOW()
);
