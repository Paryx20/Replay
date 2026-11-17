// Importaciones
require('dotenv').config();
const express = require('express');
const path = require('path');

const productoRutas = require('./rutas/productoRutas');
const clienteRutas = require('./rutas/clienteRutas');
const pedidoRutas = require('./rutas/pedidoRutas');

// Aplicación
const app = express();
const PUERTO = process.env.PUERTO || 3000;

// Middleware JSON
app.use(express.json());

// Middleware cuerpo vacío
app.use((req, res, next) => {
    req.body = req.body || {};
    next();
});

// Middleware de registro
app.use((req, res, next) => {
    console.log(`${req.method} - ${req.url}`);
    next();
});

// Archivos estáticos (Vista)
app.use(express.static(path.join(__dirname, 'publico'), { index: 'inicio.html' }));

// Rutas de la API
app.use('/api/productos', productoRutas);
app.use('/api/clientes', clienteRutas);
app.use('/api/pedidos', pedidoRutas);

// Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    // JSON mal formado
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'El cuerpo no es un JSON válido' });
    }
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Inicio del servidor
app.listen(PUERTO, () => {
    console.log(`Replay corriendo en http://localhost:${PUERTO}`);
});
