// Importaciones
const { createClient } = require('@supabase/supabase-js');

// Credenciales
const url = process.env.SUPABASE_URL;
const clave = process.env.SUPABASE_CLAVE;

// Conexión
const supabase = url && clave ? createClient(url, clave) : null;

// Exportación
module.exports = supabase;
