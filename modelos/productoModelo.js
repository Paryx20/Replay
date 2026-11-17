// Importaciones
const supabase = require('../configuracion/supabase');

// Campos permitidos
const CAMPOS = ['artista', 'album', 'formato', 'precio', 'stock', 'imagen', 'descripcion'];

// Función Flecha - Conexión
const conexion = () => {
    if (!supabase) throw new Error('Falta SUPABASE_CLAVE en el archivo .env');
    return supabase.from('productos');
};

// Función Flecha - Filtrar campos
const filtrar = (datos) => {
    const limpio = {};
    for (const campo of CAMPOS) {
        if (datos[campo] !== undefined) limpio[campo] = datos[campo];
    }
    return limpio;
};

// Función Flecha - Obtener todos
const obtenerTodos = async () => {
    // Consulta
    const { data, error } = await conexion().select('*').order('id');
    if (error) throw new Error(error.message);
    return data;
};

// Función Flecha - Obtener por id
const obtenerPorId = async (id) => {
    if (!Number.isInteger(Number(id))) return null;
    // Consulta
    const { data, error } = await conexion().select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
};

// Función Flecha - Crear
const crear = async (datos) => {
    // Consulta
    const { data, error } = await conexion().insert(filtrar(datos)).select().single();
    if (error) throw new Error(error.message);
    return data;
};

// Función Flecha - Actualizar
const actualizar = async (id, datos) => {
    // Consulta
    const { data, error } = await conexion().update(filtrar(datos)).eq('id', id).select().maybeSingle();
    if (error) throw new Error(error.message);
    return data;
};

// Función Flecha - Eliminar
const eliminar = async (id) => {
    // Consulta
    const { data, error } = await conexion().delete().eq('id', id).select();
    if (error) throw new Error(error.message);
    return data.length > 0;
};

// Exportación
module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, eliminar };
