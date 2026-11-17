// Importaciones
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

// Archivo
const archivo = path.join(__dirname, '..', process.env.SQLITE_ARCHIVO || 'pedidos.db');

// Conexión
const db = new DatabaseSync(archivo);

// Tabla
db.exec(`
    CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_id INTEGER NOT NULL,
        productos TEXT NOT NULL,
        total REAL NOT NULL,
        estado TEXT NOT NULL DEFAULT 'pendiente',
        fecha TEXT NOT NULL
    )
`);

// Exportación
module.exports = db;
