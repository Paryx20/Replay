// Importaciones
const pool = require('../configuracion/postgres');

// Función Flecha - Obtener por id
const obtenerPorId = async (id) => {
    // Consulta
    const resultado = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
    return resultado.rows[0] || null;
};

// Función Flecha - Obtener por correo
const obtenerPorCorreo = async (correo) => {
    // Consulta
    const resultado = await pool.query('SELECT * FROM clientes WHERE correo = $1', [correo]);
    return resultado.rows[0] || null;
};

// Función Flecha - Crear
const crear = async ({ nombre, correo, clave }) => {
    // Consulta
    const resultado = await pool.query(
        'INSERT INTO clientes (nombre, correo, clave) VALUES ($1, $2, $3) RETURNING *',
        [nombre, correo, clave]
    );
    return resultado.rows[0];
};

// Función Flecha - Actualizar
const actualizar = async (id, { nombre, correo }) => {
    // Consulta
    const resultado = await pool.query(
        `UPDATE clientes
         SET nombre = COALESCE($1, nombre), correo = COALESCE($2, correo)
         WHERE id = $3 RETURNING *`,
        [nombre ?? null, correo ?? null, id]
    );
    return resultado.rows[0] || null;
};

// Función Flecha - Eliminar
const eliminar = async (id) => {
    // Consulta
    const resultado = await pool.query('DELETE FROM clientes WHERE id = $1', [id]);
    return resultado.rowCount > 0;
};

// Exportación
module.exports = { obtenerPorId, obtenerPorCorreo, crear, actualizar, eliminar };
