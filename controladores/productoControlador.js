// Importaciones
const ProductoModelo = require('../modelos/productoModelo');

// Función Flecha - Validación
const datosValidos = ({ artista, album, formato, precio }) =>
    artista && album && ['Vinilo', 'CD'].includes(formato) && Number(precio) > 0;

// Función Flecha - Listar (GET)
const listar = async (req, res) => {
    const productos = await ProductoModelo.obtenerTodos();
    res.json(productos);
};

// Función Flecha - Obtener uno (GET)
const obtener = async (req, res) => {
    const producto = await ProductoModelo.obtenerPorId(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
};

// Función Flecha - Crear (POST)
const crear = async (req, res) => {
    if (!datosValidos(req.body)) {
        return res.status(400).json({ error: 'Datos del producto incompletos o inválidos' });
    }
    const producto = await ProductoModelo.crear(req.body);
    res.status(201).json(producto);
};

// Función Flecha - Actualizar (PUT)
const actualizar = async (req, res) => {
    const { formato, precio } = req.body;
    const formatoValido = formato === undefined || ['Vinilo', 'CD'].includes(formato);
    const precioValido = precio === undefined || Number(precio) > 0;
    if (!formatoValido || !precioValido) {
        return res.status(400).json({ error: 'Datos del producto incompletos o inválidos' });
    }
    const producto = await ProductoModelo.actualizar(req.params.id, req.body);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
};

// Función Flecha - Eliminar (DELETE)
const eliminar = async (req, res) => {
    const eliminado = await ProductoModelo.eliminar(req.params.id);
    if (!eliminado) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto eliminado' });
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
