// MODELO: API, carrito y sesión
const Modelo = {
    claveCarrito: 'replay_carrito',
    claveSesion: 'replay_sesion',

    // Función Flecha - Petición fetch
    pedir: async (ruta, metodo = 'GET', cuerpo = null) => {
        const cabeceras = { 'Content-Type': 'application/json' };
        const sesion = Modelo.obtenerSesion();
        if (sesion) cabeceras.Authorization = `Bearer ${sesion.token}`;

        let respuesta;
        try {
            respuesta = await fetch(ruta, {
                method: metodo,
                headers: cabeceras,
                body: cuerpo ? JSON.stringify(cuerpo) : undefined
            });
        } catch (error) {
            throw new Error('No se pudo conectar con el servidor');
        }

        const datos = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) {
            const error = new Error(datos.error || `Error ${respuesta.status}`);
            error.estado = respuesta.status;
            throw error;
        }
        return datos;
    },

    // Función Flecha - Precio a número
    prepararProducto: (producto) => ({ ...producto, precio: Number(producto.precio), stock: Number(producto.stock) }),

    // Petición fetch - Productos
    obtenerProductos: async () => {
        const productos = await Modelo.pedir('/api/productos');
        return productos.map(Modelo.prepararProducto);
    },

    // Petición fetch - Un producto
    obtenerProducto: async (id) => {
        const producto = await Modelo.pedir(`/api/productos/${encodeURIComponent(id)}`);
        return Modelo.prepararProducto(producto);
    },

    // Petición fetch - Registro
    registrar: async (nombre, correo, clave) => {
        const datos = await Modelo.pedir('/api/clientes/registro', 'POST', { nombre, correo, clave });
        Modelo.guardarSesion(datos);
        return datos.cliente;
    },

    // Petición fetch - Inicio de sesión
    iniciarSesion: async (correo, clave) => {
        const datos = await Modelo.pedir('/api/clientes/login', 'POST', { correo, clave });
        Modelo.guardarSesion(datos);
        return datos.cliente;
    },

    // Petición fetch - Crear pedido
    crearPedido: async () => {
        const productos = Modelo.obtenerCarrito().map((item) => ({ id: item.id, cantidad: item.cantidad }));
        return Modelo.pedir('/api/pedidos', 'POST', { productos });
    },

    // LocalStorage - Sesión
    guardarSesion: (datos) => {
        localStorage.setItem(Modelo.claveSesion, JSON.stringify({ token: datos.token, cliente: datos.cliente }));
    },

    obtenerSesion: () => {
        const datos = localStorage.getItem(Modelo.claveSesion);
        return datos ? JSON.parse(datos) : null;
    },

    cerrarSesion: () => {
        localStorage.removeItem(Modelo.claveSesion);
    },

    // LocalStorage - Carrito
    obtenerCarrito: () => {
        const datos = localStorage.getItem(Modelo.claveCarrito);
        return datos ? JSON.parse(datos) : [];
    },

    guardarCarrito: (carrito) => {
        localStorage.setItem(Modelo.claveCarrito, JSON.stringify(carrito));
    },

    // Función Flecha - Agregar (devuelve false si se topa con el stock)
    agregarAlCarrito: (producto, cantidad = 1) => {
        const carrito = Modelo.obtenerCarrito();
        let item = carrito.find((elemento) => elemento.id === producto.id);
        if (!item) {
            item = {
                id: producto.id,
                artista: producto.artista,
                album: producto.album,
                formato: producto.formato,
                precio: producto.precio,
                imagen: producto.imagen,
                stock: producto.stock,
                cantidad: 0
            };
            carrito.push(item);
        }
        const deseada = item.cantidad + cantidad;
        item.cantidad = Math.min(deseada, producto.stock);
        Modelo.guardarCarrito(carrito);
        return deseada <= producto.stock;
    },

    // Función Flecha - Sumar o restar
    cambiarCantidad: (id, cambio) => {
        const carrito = Modelo.obtenerCarrito();
        const item = carrito.find((elemento) => elemento.id === id);
        if (!item) return;
        item.cantidad = Math.max(1, Math.min(item.cantidad + cambio, item.stock));
        Modelo.guardarCarrito(carrito);
    },

    // Función Flecha - Quitar
    quitarDelCarrito: (id) => {
        Modelo.guardarCarrito(Modelo.obtenerCarrito().filter((item) => item.id !== id));
    },

    // Función Flecha - Vaciar
    vaciarCarrito: () => {
        localStorage.removeItem(Modelo.claveCarrito);
    },

    // Función Flecha - Cantidad de productos
    contarProductos: () => Modelo.obtenerCarrito().reduce((suma, item) => suma + item.cantidad, 0),

    // Función Flecha - Total
    calcularTotal: () => Modelo.obtenerCarrito().reduce((suma, item) => suma + item.precio * item.cantidad, 0)
};
