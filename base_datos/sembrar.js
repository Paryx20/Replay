// Importaciones
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');
const productos = require('./productos');

// Resumen
const resumen = [];

// Función Flecha - Sembrar PostgreSQL
const sembrarPostgres = async () => {
    const nombreBase = process.env.DB_NAME || 'replay';
    const datos = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    };

    // Base de datos
    const servidor = new Client({ ...datos, database: 'postgres' });
    try {
        await servidor.connect();
    } catch (error) {
        const motivo = error.message || error.code || 'sin detalle';
        const ayuda = datos.password ? 'Revisa los datos DB_ del archivo .env' : 'Falta DB_PASSWORD en el archivo .env';
        throw new Error(`No se pudo conectar a PostgreSQL (${motivo}). ${ayuda}`);
    }
    try {
        const existe = await servidor.query('SELECT 1 FROM pg_database WHERE datname = $1', [nombreBase]);
        if (existe.rowCount === 0) await servidor.query(`CREATE DATABASE "${nombreBase}"`);
    } finally {
        await servidor.end();
    }

    // Tabla
    const base = new Client({ ...datos, database: nombreBase });
    await base.connect();
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'postgres.sql'), 'utf8');
        await base.query(sql);
    } finally {
        await base.end();
    }
    return `Base "${nombreBase}" y tabla clientes listas`;
};

// Función Flecha - Sembrar SQLite
const sembrarSqlite = async () => {
    const db = require('../configuracion/sqlite');
    const { total } = db.prepare('SELECT COUNT(*) AS total FROM pedidos').get();
    return `Tabla pedidos lista (${total} pedidos)`;
};

// Función Flecha - Sembrar Supabase
const sembrarSupabase = async () => {
    const supabase = require('../configuracion/supabase');
    if (!supabase) throw new Error('Falta SUPABASE_CLAVE en el archivo .env');

    // Conteo
    const { count, error } = await supabase.from('productos').select('id', { count: 'exact', head: true });
    if (error) {
        throw new Error(`No se pudo leer la tabla productos (${error.message || 'sin detalle'}). Ejecuta base_datos/supabase.sql en el SQL Editor de Supabase`);
    }
    if (count > 0) return `La tabla productos ya tiene ${count} registros, no se insertó nada`;

    // Inserción
    const insercion = await supabase.from('productos').insert(productos);
    if (insercion.error) throw new Error(insercion.error.message);
    return `${productos.length} productos insertados`;
};

// Función Flecha - Ejecutar gestor
const ejecutar = async (gestor, sembrar) => {
    try {
        const mensaje = await sembrar();
        resumen.push(`[CORRECTO] ${gestor}: ${mensaje}`);
    } catch (error) {
        resumen.push(`[AVISO]    ${gestor}: ${error.message || error.code || 'No se pudo conectar'}`);
    }
};

// Función Flecha - Principal
const principal = async () => {
    await ejecutar('PostgreSQL (clientes)', sembrarPostgres);
    await ejecutar('SQLite (pedidos)', sembrarSqlite);
    await ejecutar('Supabase (productos)', sembrarSupabase);

    // Resumen
    console.log('\nResumen de la siembra');
    console.log('---------------------');
    resumen.forEach((linea) => console.log(linea));
};

principal();
