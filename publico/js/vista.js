// VISTA: manipulación del DOM
const Vista = {
    // Función Flecha - Crear elemento
    crear: (etiqueta, clase = '', texto = '') => {
        const elemento = document.createElement(etiqueta);
        if (clase) elemento.className = clase;
        if (texto) elemento.textContent = texto;
        return elemento;
    },

    // Función Flecha - Formato de precio
    precio: (valor) => `$${Number(valor).toFixed(2)}`,

    // Función Flecha - Etiqueta de stock
    crearStock: (stock) => {
        if (stock <= 0) return Vista.crear('span', 'etiqueta etiqueta-error', 'Sin stock');
        if (stock <= 5) return Vista.crear('span', 'etiqueta etiqueta-advertencia', `Pocas unidades (${stock})`);
        return Vista.crear('span', 'etiqueta etiqueta-exito', 'Disponible');
    },

    // ---------- Estados ----------

    // Estado: cargando
    mostrarCargando: (texto) => {
        const estado = document.getElementById('estado');
        estado.replaceChildren(Vista.crear('span', 'girador'), Vista.crear('span', '', texto));
        estado.className = 'estado estado-cargando';
        estado.hidden = false;
    },

    // Estado: éxito
    mostrarExito: (texto) => {
        const estado = document.getElementById('estado');
        estado.replaceChildren(Vista.crear('span', '', texto));
        estado.className = 'estado estado-exito';
        estado.hidden = false;
    },

    // Estado: error
    mostrarError: (texto) => {
        const estado = document.getElementById('estado');
        const boton = Vista.crear('button', 'boton boton-info', 'Reintentar');
        boton.type = 'button';
        boton.id = 'botonReintentar';
        estado.replaceChildren(Vista.crear('span', '', `No se pudo cargar: ${texto}`), boton);
        estado.className = 'estado estado-error';
        estado.hidden = false;
    },

    ocultarEstado: () => {
        document.getElementById('estado').hidden = true;
    },

    // Manipulación del DOM - Tarjetas esqueleto
    mostrarEsqueletos: (cantidad) => {
        const rejilla = document.getElementById('rejilla');
        rejilla.replaceChildren();
        for (let i = 0; i < cantidad; i++) {
            const tarjeta = Vista.crear('div', 'tarjeta esqueleto');
            tarjeta.append(Vista.crear('div', 'esqueleto-portada'), Vista.crear('div', 'esqueleto-linea'), Vista.crear('div', 'esqueleto-linea corta'));
            rejilla.appendChild(tarjeta);
        }
    },

    // Manipulación del DOM - Aviso flotante
    mostrarAviso: (tipo, texto) => {
        const aviso = Vista.crear('p', `aviso aviso-${tipo}`, texto);
        document.getElementById('avisos').appendChild(aviso);
        setTimeout(() => aviso.remove(), 3500);
    },

    // ---------- Productos ----------

    // Manipulación del DOM - Tarjeta de producto
    crearTarjeta: (producto) => {
        const tarjeta = Vista.crear('article', 'tarjeta');

        const enlace = Vista.crear('a', 'tarjeta-portada');
        enlace.href = `detalle.html?id=${encodeURIComponent(producto.id)}`;
        const imagen = Vista.crear('img');
        imagen.src = producto.imagen;
        imagen.alt = `Portada de ${producto.album}, de ${producto.artista}`;
        imagen.loading = 'lazy';
        enlace.append(imagen, Vista.crear('span', 'formato', producto.formato));

        const cuerpo = Vista.crear('div', 'tarjeta-cuerpo');
        const titulo = Vista.crear('h3');
        const enlaceTitulo = Vista.crear('a', '', producto.album);
        enlaceTitulo.href = enlace.href;
        titulo.appendChild(enlaceTitulo);

        const fila = Vista.crear('div', 'tarjeta-fila');
        fila.append(Vista.crear('span', 'precio', Vista.precio(producto.precio)), Vista.crearStock(producto.stock));

        const boton = Vista.crear('button', 'boton boton-principal', 'Agregar al carrito');
        boton.type = 'button';
        boton.dataset.id = producto.id;
        boton.disabled = producto.stock <= 0;

        cuerpo.append(titulo, Vista.crear('p', 'artista', producto.artista), fila, boton);
        tarjeta.append(enlace, cuerpo);
        return tarjeta;
    },

    // Manipulación del DOM - Rejilla de productos
    mostrarProductos: (productos) => {
        const rejilla = document.getElementById('rejilla');
        rejilla.replaceChildren(...productos.map(Vista.crearTarjeta));
    },

    limpiarProductos: () => {
        document.getElementById('rejilla').replaceChildren();
    },

    // Manipulación del DOM - Resultado de búsqueda
    mostrarConteo: (cantidad, total) => {
        const conteo = document.getElementById('conteo');
        conteo.textContent = cantidad === 0
            ? 'No hay discos que coincidan con la búsqueda.'
            : `Mostrando ${cantidad} de ${total} discos`;
    },

    // Manipulación del DOM - Filtro activo
    marcarFiltro: (formato) => {
        document.querySelectorAll('.filtro').forEach((boton) => {
            boton.setAttribute('aria-pressed', boton.dataset.formato === formato);
        });
    },

    // Manipulación del DOM - Detalle
    mostrarDetalle: (producto) => {
        const detalle = document.getElementById('detalle');

        const portada = Vista.crear('div', 'detalle-portada');
        const imagen = Vista.crear('img');
        imagen.src = producto.imagen;
        imagen.alt = `Portada de ${producto.album}, de ${producto.artista}`;
        portada.appendChild(imagen);

        const info = Vista.crear('div', 'detalle-info');
        const fila = Vista.crear('div', 'tarjeta-fila');
        fila.append(Vista.crear('span', 'precio precio-grande', Vista.precio(producto.precio)), Vista.crearStock(producto.stock));

        const compra = Vista.crear('div', 'detalle-compra');
        const etiqueta = Vista.crear('label', '', 'Cantidad');
        etiqueta.htmlFor = 'cantidadDetalle';
        const selector = Vista.crear('div', 'cantidad');
        const menos = Vista.crear('button', '', '−');
        menos.type = 'button';
        menos.id = 'botonMenos';
        menos.setAttribute('aria-label', 'Restar una unidad');
        const campo = Vista.crear('input');
        campo.type = 'number';
        campo.id = 'cantidadDetalle';
        campo.min = 1;
        campo.max = Math.max(producto.stock, 1);
        campo.value = 1;
        const mas = Vista.crear('button', '', '+');
        mas.type = 'button';
        mas.id = 'botonMas';
        mas.setAttribute('aria-label', 'Sumar una unidad');
        selector.append(menos, campo, mas);

        const boton = Vista.crear('button', 'boton boton-principal boton-grande', 'Agregar al carrito');
        boton.type = 'button';
        boton.id = 'botonAgregarDetalle';
        if (producto.stock <= 0) [menos, campo, mas, boton].forEach((control) => { control.disabled = true; });
        compra.append(etiqueta, selector, boton);

        info.append(
            Vista.crear('span', 'formato formato-fijo', producto.formato),
            Vista.crear('h1', '', producto.album),
            Vista.crear('p', 'artista artista-grande', producto.artista),
            fila,
            Vista.crear('p', 'unidades', `Unidades en stock: ${producto.stock}`),
            Vista.crear('p', 'descripcion', producto.descripcion),
            compra
        );

        detalle.replaceChildren(portada, info);
        detalle.hidden = false;
        document.title = `${producto.album} — Replay`;
    },

    ocultarDetalle: () => {
        document.getElementById('detalle').hidden = true;
    },

    obtenerCantidadDetalle: () => {
        const campo = document.getElementById('cantidadDetalle');
        const cantidad = Math.max(1, Math.min(Math.floor(Number(campo.value)) || 1, Number(campo.max)));
        campo.value = cantidad;
        return cantidad;
    },

    cambiarCantidadDetalle: (cambio) => {
        const campo = document.getElementById('cantidadDetalle');
        campo.value = Vista.obtenerCantidadDetalle() + cambio;
        Vista.obtenerCantidadDetalle();
    },

    // ---------- Carrito lateral ----------

    abrirCarrito: () => {
        document.getElementById('carrito').classList.add('abierto');
        document.getElementById('carrito').setAttribute('aria-hidden', 'false');
        document.getElementById('fondoCarrito').classList.add('visible');
        document.getElementById('botonCarrito').setAttribute('aria-expanded', 'true');
        document.body.classList.add('sin-desplazamiento');
        document.getElementById('botonCerrarCarrito').focus();
    },

    cerrarCarrito: () => {
        document.getElementById('carrito').classList.remove('abierto');
        document.getElementById('carrito').setAttribute('aria-hidden', 'true');
        document.getElementById('fondoCarrito').classList.remove('visible');
        document.getElementById('botonCarrito').setAttribute('aria-expanded', 'false');
        document.body.classList.remove('sin-desplazamiento');
    },

    carritoAbierto: () => document.getElementById('carrito').classList.contains('abierto'),

    // Manipulación del DOM - Producto del carrito
    crearItemCarrito: (item) => {
        const fila = Vista.crear('li', 'item-carrito');
        fila.dataset.id = item.id;

        const imagen = Vista.crear('img');
        imagen.src = item.imagen;
        imagen.alt = '';

        const info = Vista.crear('div', 'item-info');
        info.append(
            Vista.crear('strong', '', item.album),
            Vista.crear('span', 'artista', `${item.artista} · ${item.formato}`),
            Vista.crear('span', 'precio', Vista.precio(item.precio))
        );

        const controles = Vista.crear('div', 'item-controles');
        const selector = Vista.crear('div', 'cantidad cantidad-chica');
        const menos = Vista.crear('button', '', '−');
        menos.type = 'button';
        menos.dataset.accion = 'restar';
        menos.disabled = item.cantidad <= 1;
        menos.setAttribute('aria-label', `Restar una unidad de ${item.album}`);
        const numero = Vista.crear('span', 'cantidad-numero', String(item.cantidad));
        const mas = Vista.crear('button', '', '+');
        mas.type = 'button';
        mas.dataset.accion = 'sumar';
        mas.disabled = item.cantidad >= item.stock;
        mas.setAttribute('aria-label', `Sumar una unidad de ${item.album}`);
        selector.append(menos, numero, mas);

        const quitar = Vista.crear('button', 'boton-quitar', 'Quitar');
        quitar.type = 'button';
        quitar.dataset.accion = 'quitar';
        quitar.setAttribute('aria-label', `Quitar ${item.album} del carrito`);

        controles.append(selector, Vista.crear('span', 'subtotal', Vista.precio(item.precio * item.cantidad)), quitar);
        info.appendChild(controles);
        fila.append(imagen, info);
        return fila;
    },

    // Manipulación del DOM - Pintar carrito
    pintarCarrito: (carrito, cantidad, total) => {
        document.getElementById('listaCarrito').replaceChildren(...carrito.map(Vista.crearItemCarrito));
        document.getElementById('carritoVacio').hidden = carrito.length > 0;
        document.getElementById('contadorCarrito').textContent = cantidad;
        document.getElementById('cantidadCarrito').textContent = cantidad;
        document.getElementById('totalCarrito').textContent = Vista.precio(total);
        document.getElementById('botonVaciar').disabled = carrito.length === 0;
        document.getElementById('botonComprar').disabled = carrito.length === 0;
    },

    // Manipulación del DOM - Mensaje del carrito
    mostrarMensajeCarrito: (tipo, texto) => {
        const mensaje = document.getElementById('mensajeCarrito');
        mensaje.replaceChildren();
        if (tipo === 'cargando') mensaje.appendChild(Vista.crear('span', 'girador'));
        mensaje.appendChild(Vista.crear('span', '', texto));
        mensaje.className = `mensaje mensaje-${tipo}`;
        mensaje.hidden = false;
    },

    ocultarMensajeCarrito: () => {
        document.getElementById('mensajeCarrito').hidden = true;
    },

    // Manipulación del DOM - Bloquear botones mientras se envía
    bloquearCarrito: (bloqueado) => {
        document.querySelectorAll('#carrito button, #carrito input').forEach((control) => {
            if (control.id !== 'botonCerrarCarrito') control.disabled = bloqueado;
        });
    },

    // ---------- Sesión ----------

    // Manipulación del DOM - Cliente en la cabecera y en el panel
    mostrarSesion: (cliente) => {
        const saludo = document.getElementById('saludoCliente');
        const salir = document.getElementById('botonCerrarSesion');
        const enPanel = document.getElementById('sesionCarrito');
        saludo.textContent = cliente ? `Hola, ${cliente.nombre}` : '';
        enPanel.textContent = cliente ? `Comprando como ${cliente.nombre} (${cliente.correo})` : '';
        saludo.hidden = !cliente;
        salir.hidden = !cliente;
        enPanel.hidden = !cliente;
    },

    // Manipulación del DOM - Formulario de sesión
    mostrarFormularioSesion: (modo) => {
        const esRegistro = modo === 'registro';
        document.getElementById('formularioSesion').hidden = false;
        document.getElementById('pieCarrito').hidden = true;
        document.getElementById('campoNombre').hidden = !esRegistro;
        document.getElementById('nombreCliente').required = esRegistro;
        document.getElementById('claveCliente').autocomplete = esRegistro ? 'new-password' : 'current-password';
        document.getElementById('botonEnviarSesion').textContent = esRegistro ? 'Registrarme y comprar' : 'Entrar y comprar';
        document.getElementById('modoLogin').setAttribute('aria-pressed', !esRegistro);
        document.getElementById('modoRegistro').setAttribute('aria-pressed', esRegistro);
        document.getElementById(esRegistro ? 'nombreCliente' : 'correoCliente').focus();
    },

    ocultarFormularioSesion: () => {
        document.getElementById('formularioSesion').hidden = true;
        document.getElementById('formularioSesion').reset();
        document.getElementById('pieCarrito').hidden = false;
    },

    obtenerDatosSesion: () => ({
        nombre: document.getElementById('nombreCliente').value.trim(),
        correo: document.getElementById('correoCliente').value.trim(),
        clave: document.getElementById('claveCliente').value
    })
};
