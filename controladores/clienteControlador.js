// Importaciones
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ClienteModelo = require('../modelos/clienteModelo');

// Función Flecha - Generar token JWT
const generarToken = (cliente) =>
    jwt.sign(
        { id: cliente.id, nombre: cliente.nombre, correo: cliente.correo },
        process.env.JWT_SECRETO,
        { expiresIn: '2h' }
    );

// Función Flecha - Quitar la clave
const sinClave = ({ clave, ...resto }) => resto;

// Función Flecha - Validar texto
const esTexto = (valor) => typeof valor === 'string' && valor.trim() !== '';

// Función Flecha - Verificar dueño
const esDueno = (req) => Number(req.params.id) === req.cliente.id;

// Función Flecha - Registro (POST)
const registrar = async (req, res) => {
    const { nombre, correo, clave } = req.body;
    if (!esTexto(nombre) || !esTexto(correo) || !esTexto(clave)) {
        return res.status(400).json({ error: 'Nombre, correo y clave son obligatorios' });
    }

    const existente = await ClienteModelo.obtenerPorCorreo(correo);
    if (existente) return res.status(409).json({ error: 'El correo ya está registrado' });

    const claveCifrada = await bcrypt.hash(clave, 10);
    const cliente = await ClienteModelo.crear({ nombre, correo, clave: claveCifrada });
    res.status(201).json({ token: generarToken(cliente), cliente: sinClave(cliente) });
};

// Función Flecha - Inicio de sesión (POST)
const iniciarSesion = async (req, res) => {
    const { correo, clave } = req.body;
    if (!esTexto(correo) || !esTexto(clave)) {
        return res.status(400).json({ error: 'Correo y clave son obligatorios' });
    }

    const cliente = await ClienteModelo.obtenerPorCorreo(correo);
    const claveCorrecta = cliente && await bcrypt.compare(clave, cliente.clave);
    if (!claveCorrecta) return res.status(401).json({ error: 'Correo o clave incorrectos' });

    res.json({ token: generarToken(cliente), cliente: sinClave(cliente) });
};

// Función Flecha - Obtener (GET)
const obtener = async (req, res) => {
    if (!esDueno(req)) return res.status(403).json({ error: 'No autorizado' });
    const cliente = await ClienteModelo.obtenerPorId(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(sinClave(cliente));
};

// Función Flecha - Actualizar (PUT)
const actualizar = async (req, res) => {
    if (!esDueno(req)) return res.status(403).json({ error: 'No autorizado' });
    const { nombre, correo } = req.body;
    const nombreValido = nombre === undefined || esTexto(nombre);
    const correoValido = correo === undefined || esTexto(correo);
    if ((nombre === undefined && correo === undefined) || !nombreValido || !correoValido) {
        return res.status(400).json({ error: 'Envía un nombre o un correo válido' });
    }

    if (correo) {
        const existente = await ClienteModelo.obtenerPorCorreo(correo);
        if (existente && existente.id !== req.cliente.id) {
            return res.status(409).json({ error: 'El correo ya está registrado' });
        }
    }

    const cliente = await ClienteModelo.actualizar(req.params.id, { nombre, correo });
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(sinClave(cliente));
};

// Función Flecha - Eliminar (DELETE)
const eliminar = async (req, res) => {
    if (!esDueno(req)) return res.status(403).json({ error: 'No autorizado' });
    const eliminado = await ClienteModelo.eliminar(req.params.id);
    if (!eliminado) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ mensaje: 'Cliente eliminado' });
};

module.exports = { registrar, iniciarSesion, obtener, actualizar, eliminar };
