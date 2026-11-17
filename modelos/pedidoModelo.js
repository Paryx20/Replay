// Importaciones
const db = require('../configuracion/sqlite');

// Función Flecha - Formato
const formatear = (fila) => ({
    ...fila,
    id: Number(fila.id),
    cliente_id: Number(fila.cliente_id),
    productos: JSON.parse(fila.productos)
});

// Función Flecha - Obtener por id
const obtenerPorId = (id) => {
    // Consulta
    const fila = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(Number(id));
    return fila ? formatear(fila) : null;
};

// Función Flecha - Obtener todos
const obtenerTodos = async () => {
    // Consulta
    const filas = db.prepare('SELECT * FROM pedidos ORDER BY id').all();
    return filas.map(formatear);
};

// Función Flecha - Obtener por cliente
const obtenerPorCliente = async (clienteId) => {
    // Consulta
    const filas = db.prepare('SELECT * FROM pedidos WHERE cliente_id = ? ORDER BY id').all(Number(clienteId));
    return filas.map(formatear);
};

// Función Flecha - Crear
const crear = async ({ cliente_id, productos, total }) => {
    // Consulta
    const resultado = db
        .prepare('INSERT INTO pedidos (cliente_id, productos, total, estado, fecha) VALUES (?, ?, ?, ?, ?)')
        .run(Number(cliente_id), JSON.stringify(productos), total, 'pendiente', new Date().toISOString());
    return obtenerPorId(resultado.lastInsertRowid);
};

// Función Flecha - Actualizar
const actualizar = async (id, { estado }) => {
    // Consulta
    const resultado = db.prepare('UPDATE pedidos SET estado = ? WHERE id = ?').run(estado, Number(id));
    return resultado.changes > 0 ? obtenerPorId(id) : null;
};

// Función Flecha - Eliminar
const eliminar = async (id) => {
    // Consulta
    const resultado = db.prepare('DELETE FROM pedidos WHERE id = ?').run(Number(id));
    return resultado.changes > 0;
};

// Exportación
module.exports = { obtenerTodos, obtenerPorCliente, crear, actualizar, eliminar };
