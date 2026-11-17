// CONTROLADOR: eventos y coordinación
const Controlador = {
    productos: [],
    producto: null,
    formato: 'Todos',
    busqueda: '',
    modoSesion: 'login',

    // Función Flecha - Inicio
    iniciar: () => {
        const pantalla = document.body.dataset.pantalla;

        Controlador.actualizarCarrito();
        Controlador.actualizarSesion();
        Controlador.eventosCarrito();
        Controlador.eventosSesion();
        Controlador.eventoReintentar(pantalla);

        if (pantalla === 'inicio') Controlador.iniciarInicio();
        if (pantalla === 'catalogo') Controlador.iniciarCatalogo();
        if (pantalla === 'detalle') Controlador.iniciarDetalle();
    },

    // Función Flecha - Texto sin tildes para buscar
    normalizar: (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(),

    // ---------- Pantalla 1: inicio ----------

    iniciarInicio: () => {
        Controlador.eventosRejilla();
        Controlador.cargarDestacados();
    },

    cargarDestacados: async () => {
        // Estado: cargando
        Vista.mostrarCargando('Cargando discos destacados...');
        Vista.mostrarEsqueletos(4);
        try {
            Controlador.productos = await Modelo.obtenerProductos();
            // Estado: éxito
            Vista.ocultarEstado();
            Vista.mostrarProductos(Controlador.productos.slice(0, 4));
        } catch (error) {
            // Estado: error
            Vista.limpiarProductos();
            Vista.mostrarError(error.message);
        }
    },

    // ---------- Pantalla 2: catálogo ----------

    iniciarCatalogo: () => {
        const formato = new URLSearchParams(location.search).get('formato');
        if (formato === 'Vinilo' || formato === 'CD') Controlador.formato = formato;
        Vista.marcarFiltro(Controlador.formato);

        Controlador.eventosRejilla();

        // Evento - Buscador
        document.getElementById('buscador').addEventListener('input', (evento) => {
            Controlador.busqueda = evento.target.value;
            Controlador.filtrarCatalogo();
        });

        // Evento - Filtros de formato
        document.querySelectorAll('.filtro').forEach((boton) => {
            boton.addEventListener('click', () => {
                Controlador.formato = boton.dataset.formato;
                Vista.marcarFiltro(Controlador.formato);
                Controlador.filtrarCatalogo();
            });
        });

        Controlador.cargarCatalogo();
    },

    cargarCatalogo: async () => {
        // Estado: cargando
        Vista.mostrarCargando('Cargando catálogo...');
        Vista.mostrarEsqueletos(8);
        try {
            Controlador.productos = await Modelo.obtenerProductos();
            // Estado: éxito
            Vista.mostrarExito(`Catálogo cargado: ${Controlador.productos.length} discos`);
            Controlador.filtrarCatalogo();
        } catch (error) {
            // Estado: error
            Vista.limpiarProductos();
            Vista.mostrarError(error.message);
        }
    },

    filtrarCatalogo: () => {
        const texto = Controlador.normalizar(Controlador.busqueda.trim());
        const filtrados = Controlador.productos.filter((producto) => {
            const coincideFormato = Controlador.formato === 'Todos' || producto.formato === Controlador.formato;
            const coincideTexto = Controlador.normalizar(`${producto.artista} ${producto.album}`).includes(texto);
            return coincideFormato && coincideTexto;
        });
        Vista.mostrarProductos(filtrados);
        Vista.mostrarConteo(filtrados.length, Controlador.productos.length);
    },

    // ---------- Pantalla 3: detalle ----------

    iniciarDetalle: () => {
        // Evento - Cantidad y agregar (delegado)
        document.getElementById('detalle').addEventListener('click', (evento) => {
            if (evento.target.id === 'botonMenos') Vista.cambiarCantidadDetalle(-1);
            if (evento.target.id === 'botonMas') Vista.cambiarCantidadDetalle(1);
            if (evento.target.id === 'botonAgregarDetalle') {
                Controlador.agregar(Controlador.producto, Vista.obtenerCantidadDetalle());
            }
        });

        Controlador.cargarDetalle();
    },

    cargarDetalle: async () => {
        const id = new URLSearchParams(location.search).get('id');
        Vista.ocultarDetalle();
        if (!id) {
            Vista.mostrarError('No se indicó ningún producto');
            return;
        }
        // Estado: cargando
        Vista.mostrarCargando('Cargando producto...');
        try {
            Controlador.producto = await Modelo.obtenerProducto(id);
            // Estado: éxito
            Vista.ocultarEstado();
            Vista.mostrarDetalle(Controlador.producto);
        } catch (error) {
            // Estado: error
            Vista.mostrarError(error.message);
        }
    },

    // ---------- Productos (común) ----------

    eventosRejilla: () => {
        // Evento - Agregar desde una tarjeta (delegado)
        document.getElementById('rejilla').addEventListener('click', (evento) => {
            const boton = evento.target.closest('button[data-id]');
            if (!boton) return;
            const producto = Controlador.productos.find((item) => String(item.id) === boton.dataset.id);
            Controlador.agregar(producto, 1);
        });
    },

    eventoReintentar: (pantalla) => {
        // Evento - Reintentar (delegado)
        document.getElementById('estado').addEventListener('click', (evento) => {
            if (evento.target.id !== 'botonReintentar') return;
            if (pantalla === 'inicio') Controlador.cargarDestacados();
            if (pantalla === 'catalogo') Controlador.cargarCatalogo();
            if (pantalla === 'detalle') Controlador.cargarDetalle();
        });
    },

    agregar: (producto, cantidad) => {
        const completo = Modelo.agregarAlCarrito(producto, cantidad);
        Controlador.actualizarCarrito();
        Vista.ocultarMensajeCarrito();
        if (completo) {
            Vista.mostrarAviso('exito', `Producto agregado: ${producto.album}`);
        } else {
            Vista.mostrarAviso('advertencia', `Solo hay ${producto.stock} unidades de ${producto.album}`);
        }
        Vista.abrirCarrito();
    },

    // ---------- Carrito lateral ----------

    actualizarCarrito: () => {
        Vista.pintarCarrito(Modelo.obtenerCarrito(), Modelo.contarProductos(), Modelo.calcularTotal());
    },

    cerrarCarrito: () => {
        Vista.cerrarCarrito();
        Vista.ocultarFormularioSesion();
        document.getElementById('botonCarrito').focus();
    },

    eventosCarrito: () => {
        // Evento - Abrir
        document.getElementById('botonCarrito').addEventListener('click', () => {
            Controlador.actualizarCarrito();
            Vista.abrirCarrito();
        });

        // Evento - Cerrar con X, clic fuera o Escape
        document.getElementById('botonCerrarCarrito').addEventListener('click', Controlador.cerrarCarrito);
        document.getElementById('fondoCarrito').addEventListener('click', Controlador.cerrarCarrito);
        document.addEventListener('keydown', (evento) => {
            if (evento.key === 'Escape' && Vista.carritoAbierto()) Controlador.cerrarCarrito();
        });

        // Evento - Sumar, restar y quitar (delegado)
        document.getElementById('listaCarrito').addEventListener('click', (evento) => {
            const accion = evento.target.dataset.accion;
            if (!accion) return;
            const id = Number(evento.target.closest('li').dataset.id);
            if (accion === 'sumar') Modelo.cambiarCantidad(id, 1);
            if (accion === 'restar') Modelo.cambiarCantidad(id, -1);
            if (accion === 'quitar') {
                Modelo.quitarDelCarrito(id);
                Vista.mostrarAviso('informacion', 'Producto quitado del carrito');
            }
            Vista.ocultarMensajeCarrito();
            Controlador.actualizarCarrito();
        });

        // Evento - Vaciar
        document.getElementById('botonVaciar').addEventListener('click', () => {
            Modelo.vaciarCarrito();
            Controlador.actualizarCarrito();
            Vista.mostrarMensajeCarrito('informacion', 'Se vació el carrito.');
        });

        // Evento - Procesar compra
        document.getElementById('botonComprar').addEventListener('click', Controlador.procesarCompra);

        // Evento - Carrito cambiado en otra pestaña
        window.addEventListener('storage', () => {
            Controlador.actualizarCarrito();
            Controlador.actualizarSesion();
        });
    },

    procesarCompra: async () => {
        if (Modelo.obtenerCarrito().length === 0) return;

        // Sin sesión: pedir login dentro del panel
        if (!Modelo.obtenerSesion()) {
            Vista.mostrarMensajeCarrito('informacion', 'Inicia sesión o regístrate para terminar la compra.');
            Vista.mostrarFormularioSesion(Controlador.modoSesion);
            return;
        }

        // Estado: cargando
        Vista.mostrarMensajeCarrito('cargando', 'Procesando compra...');
        Vista.bloquearCarrito(true);
        try {
            const pedido = await Modelo.crearPedido();
            // Estado: éxito
            Modelo.vaciarCarrito();
            Vista.bloquearCarrito(false);
            Controlador.actualizarCarrito();
            Vista.mostrarMensajeCarrito('exito', `Compra realizada, pedido #${pedido.id}. Total: ${Vista.precio(pedido.total)}`);
            Vista.mostrarAviso('exito', `Compra realizada, pedido #${pedido.id}`);
        } catch (error) {
            // Estado: error
            Vista.bloquearCarrito(false);
            Controlador.actualizarCarrito();
            if (error.estado === 401) {
                // Token vencido
                Modelo.cerrarSesion();
                Controlador.actualizarSesion();
                Vista.mostrarMensajeCarrito('error', 'Tu sesión venció. Inicia sesión otra vez.');
                Vista.mostrarFormularioSesion('login');
            } else {
                Vista.mostrarMensajeCarrito('error', `No se pudo procesar la compra: ${error.message}`);
            }
        }
    },

    // ---------- Sesión ----------

    actualizarSesion: () => {
        const sesion = Modelo.obtenerSesion();
        Vista.mostrarSesion(sesion ? sesion.cliente : null);
    },

    eventosSesion: () => {
        // Evento - Cambiar de modo
        document.getElementById('modoLogin').addEventListener('click', () => {
            Controlador.modoSesion = 'login';
            Vista.mostrarFormularioSesion('login');
        });
        document.getElementById('modoRegistro').addEventListener('click', () => {
            Controlador.modoSesion = 'registro';
            Vista.mostrarFormularioSesion('registro');
        });

        // Evento - Cancelar
        document.getElementById('botonCancelarSesion').addEventListener('click', () => {
            Vista.ocultarFormularioSesion();
            Vista.ocultarMensajeCarrito();
        });

        // Evento - Enviar formulario
        document.getElementById('formularioSesion').addEventListener('submit', async (evento) => {
            evento.preventDefault();
            const { nombre, correo, clave } = Vista.obtenerDatosSesion();
            const esRegistro = Controlador.modoSesion === 'registro';

            // Estado: cargando
            Vista.mostrarMensajeCarrito('cargando', esRegistro ? 'Creando cuenta...' : 'Iniciando sesión...');
            Vista.bloquearCarrito(true);
            try {
                const cliente = esRegistro
                    ? await Modelo.registrar(nombre, correo, clave)
                    : await Modelo.iniciarSesion(correo, clave);
                // Estado: éxito
                Vista.bloquearCarrito(false);
                Vista.ocultarFormularioSesion();
                Controlador.actualizarSesion();
                Controlador.actualizarCarrito();
                Vista.mostrarAviso('exito', `Sesión iniciada: ${cliente.nombre}`);
                Controlador.procesarCompra();
            } catch (error) {
                // Estado: error
                Vista.bloquearCarrito(false);
                Controlador.actualizarCarrito();
                Vista.mostrarMensajeCarrito('error', error.message);
            }
        });

        // Evento - Cerrar sesión
        document.getElementById('botonCerrarSesion').addEventListener('click', () => {
            Modelo.cerrarSesion();
            Controlador.actualizarSesion();
            Vista.ocultarFormularioSesion();
            Vista.mostrarAviso('informacion', 'Sesión cerrada');
        });
    }
};

// Evento - Arranque
document.addEventListener('DOMContentLoaded', Controlador.iniciar);
