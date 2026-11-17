// Importaciones
const PedidoModelo = require('../modelos/pedidoModelo');
const ProductoModelo = require('../modelos/productoModelo');

// Estados permitidos
const ESTADOS = ['pendiente', 'pagado', 'enviado', 'cancelado'];

// Función Flecha - Buscar pedido propio
const buscarPropio = async (req) => {
    const pedidos = await PedidoModelo.obtenerPorCliente(req.cliente.id);
    return pedidos.find((pedido) => pedido.id === Number(req.params.id));
};

// Función Flecha - Listar (GET)
const listar = async (req, res) => {
    const pedidos = await PedidoModelo.obtenerPorCliente(req.cliente.id);
    res.json(pedidos);
};

// Función Flecha - Crear (POST)
const crear = async (req, res) => {
    const { productos } = req.body;
    if (!Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({ error: 'El pedido no tiene productos' });
    }

    // Detalle y total
    const detalle = [];
    for (const item of productos) {
        const cantidad = Number(item?.cantidad);
        const producto = await ProductoModelo.obtenerPorId(item?.id);
        if (!producto || !Number.isInteger(cantidad) || cantidad < 1) {
            return res.status(400).json({ error: 'Producto o cantidad inválida' });
        }
        if (cantidad > producto.stock) {
            return res.status(400).json({ error: `Stock insuficiente de ${producto.album}` });
        }
        detalle.push({
            id: producto.id,
            artista: producto.artista,
            album: producto.album,
            precio: Number(producto.precio),
            cantidad
        });
    }
    const total = detalle.reduce((suma, item) => suma + item.precio * item.cantidad, 0);

    const pedido = await PedidoModelo.crear({
        cliente_id: req.cliente.id,
        productos: detalle,
        total: Number(total.toFixed(2))
    });
    res.status(201).json(pedido);
};

// Función Flecha - Actualizar (PUT)
const actualizar = async (req, res) => {
    const { estado } = req.body;
    if (!ESTADOS.includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido' });
    }
    if (!(await buscarPropio(req))) return res.status(404).json({ error: 'Pedido no encontrado' });

    const pedido = await PedidoModelo.actualizar(req.params.id, { estado });
    res.json(pedido);
};

// Función Flecha - Eliminar (DELETE)
const eliminar = async (req, res) => {
    if (!(await buscarPropio(req))) return res.status(404).json({ error: 'Pedido no encontrado' });

    await PedidoModelo.eliminar(req.params.id);
    res.json({ mensaje: 'Pedido eliminado' });
};

module.exports = { listar, crear, actualizar, eliminar };
