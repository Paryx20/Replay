// Importaciones
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path');

// Configuración
const PUERTO = 3400;
const URL_BASE = `http://localhost:${PUERTO}`;
const MOTIVO = 'Supabase sin configurar';

// Datos de prueba
const correo = `prueba_${Date.now()}@replay.test`;
const clave = 'clave_prueba_123';
const nombre = 'Cliente Prueba';

// Estado compartido
let servidor = null;
let hayProductos = false;
let token = '';
let clienteId = 0;
let clienteEliminado = false;
let productos = [];
const pedidosCreados = [];

// Función Flecha - Esperar
const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

// Función Flecha - Petición
const pedir = async (ruta, { metodo = 'GET', cuerpo, credencial } = {}) => {
    const cabeceras = {};
    if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
    if (credencial) cabeceras['Authorization'] = `Bearer ${credencial}`;

    const respuesta = await fetch(`${URL_BASE}${ruta}`, {
        method: metodo,
        headers: cabeceras,
        body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined
    });
    const texto = await respuesta.text();
    let datos = null;
    try { datos = JSON.parse(texto); } catch (error) { datos = null; }
    return { estado: respuesta.status, tipo: respuesta.headers.get('content-type') || '', texto, datos };
};

// Función Flecha - Esperar al servidor
const esperarServidor = async () => {
    for (let intento = 0; intento < 50; intento++) {
        try {
            await fetch(`${URL_BASE}/`);
            return true;
        } catch (error) {
            await esperar(200);
        }
    }
    throw new Error('El servidor no respondió a tiempo');
};

// Función Flecha - Detener el servidor
const detenerServidor = () => new Promise((resolver) => {
    if (!servidor || servidor.exitCode !== null) return resolver();
    servidor.once('exit', resolver);
    servidor.kill();
});

// Función Flecha - Rutas protegidas
const rutasProtegidas = () => [
    { metodo: 'GET', ruta: '/api/clientes/1' },
    { metodo: 'PUT', ruta: '/api/clientes/1', cuerpo: { nombre: 'X' } },
    { metodo: 'DELETE', ruta: '/api/clientes/1' },
    { metodo: 'GET', ruta: '/api/pedidos' },
    { metodo: 'POST', ruta: '/api/pedidos', cuerpo: { productos: [] } },
    { metodo: 'PUT', ruta: '/api/pedidos/1', cuerpo: { estado: 'pagado' } },
    { metodo: 'DELETE', ruta: '/api/pedidos/1' },
    { metodo: 'POST', ruta: '/api/productos', cuerpo: {} },
    { metodo: 'PUT', ruta: '/api/productos/1', cuerpo: {} },
    { metodo: 'DELETE', ruta: '/api/productos/1' }
];

describe('API Replay', () => {
    // Inicio
    before(async () => {
        servidor = spawn(process.execPath, ['servidor.js'], {
            cwd: path.join(__dirname, '..'),
            env: { ...process.env, PUERTO: String(PUERTO) },
            stdio: 'ignore'
        });
        await esperarServidor();

        // Detección de Supabase
        const respuesta = await pedir('/api/productos');
        hayProductos = respuesta.estado === 200;
    });

    // Limpieza
    after(async () => {
        if (token) {
            for (const id of pedidosCreados) {
                await pedir(`/api/pedidos/${id}`, { metodo: 'DELETE', credencial: token });
            }
            if (!clienteEliminado) {
                await pedir(`/api/clientes/${clienteId}`, { metodo: 'DELETE', credencial: token });
            }
        }
        await detenerServidor();
    });

    describe('Páginas estáticas', () => {
        for (const ruta of ['/', '/catalogo.html', '/detalle.html']) {
            // Prueba
            test(`GET ${ruta} devuelve 200 y HTML`, async () => {
                const respuesta = await pedir(ruta);
                assert.strictEqual(respuesta.estado, 200);
                assert.match(respuesta.tipo, /text\/html/);
                assert.match(respuesta.texto, /<html/i);
            });
        }

        // Prueba
        test('Ruta inexistente devuelve 404', async () => {
            const respuesta = await pedir('/api/no-existe');
            assert.strictEqual(respuesta.estado, 404);
            assert.ok(respuesta.datos.error);
        });
    });

    describe('Registro', () => {
        // Prueba
        test('Datos incompletos devuelve 400', async () => {
            const respuesta = await pedir('/api/clientes/registro', { metodo: 'POST', cuerpo: { correo } });
            assert.strictEqual(respuesta.estado, 400);
        });

        // Prueba
        test('Registro correcto devuelve 201 con token', async () => {
            const respuesta = await pedir('/api/clientes/registro', {
                metodo: 'POST',
                cuerpo: { nombre, correo, clave }
            });
            assert.strictEqual(respuesta.estado, 201);
            assert.ok(respuesta.datos.token);
            assert.strictEqual(respuesta.datos.cliente.correo, correo);
            assert.strictEqual(respuesta.datos.cliente.clave, undefined);
            token = respuesta.datos.token;
            clienteId = respuesta.datos.cliente.id;
        });

        // Prueba
        test('Correo repetido devuelve 409', async () => {
            const respuesta = await pedir('/api/clientes/registro', {
                metodo: 'POST',
                cuerpo: { nombre, correo, clave }
            });
            assert.strictEqual(respuesta.estado, 409);
        });
    });

    describe('Login', () => {
        // Prueba
        test('Login correcto devuelve 200 con token', async () => {
            const respuesta = await pedir('/api/clientes/login', { metodo: 'POST', cuerpo: { correo, clave } });
            assert.strictEqual(respuesta.estado, 200);
            assert.ok(respuesta.datos.token);
            assert.strictEqual(respuesta.datos.cliente.id, clienteId);
        });

        // Prueba
        test('Clave incorrecta devuelve 401', async () => {
            const respuesta = await pedir('/api/clientes/login', {
                metodo: 'POST',
                cuerpo: { correo, clave: 'clave_equivocada' }
            });
            assert.strictEqual(respuesta.estado, 401);
        });
    });

    describe('Rutas protegidas', () => {
        for (const { metodo, ruta, cuerpo } of rutasProtegidas()) {
            // Prueba
            test(`${metodo} ${ruta} sin token devuelve 401`, async () => {
                const respuesta = await pedir(ruta, { metodo, cuerpo });
                assert.strictEqual(respuesta.estado, 401);
            });

            // Prueba
            test(`${metodo} ${ruta} con token inválido devuelve 401`, async () => {
                const respuesta = await pedir(ruta, { metodo, cuerpo, credencial: 'token.falso.123' });
                assert.strictEqual(respuesta.estado, 401);
            });
        }
    });

    describe('Clientes', () => {
        // Prueba
        test('GET del cliente propio devuelve 200', async () => {
            const respuesta = await pedir(`/api/clientes/${clienteId}`, { credencial: token });
            assert.strictEqual(respuesta.estado, 200);
            assert.strictEqual(respuesta.datos.correo, correo);
            assert.strictEqual(respuesta.datos.clave, undefined);
        });

        // Prueba
        test('PUT del cliente propio devuelve 200', async () => {
            const respuesta = await pedir(`/api/clientes/${clienteId}`, {
                metodo: 'PUT',
                cuerpo: { nombre: 'Cliente Editado' },
                credencial: token
            });
            assert.strictEqual(respuesta.estado, 200);
            assert.strictEqual(respuesta.datos.nombre, 'Cliente Editado');
        });

        // Prueba
        test('PUT sin datos devuelve 400', async () => {
            const respuesta = await pedir(`/api/clientes/${clienteId}`, {
                metodo: 'PUT',
                cuerpo: {},
                credencial: token
            });
            assert.strictEqual(respuesta.estado, 400);
        });

        // Prueba
        test('Id ajeno devuelve 403', async () => {
            const ajeno = `/api/clientes/${clienteId + 1}`;
            const lectura = await pedir(ajeno, { credencial: token });
            const edicion = await pedir(ajeno, { metodo: 'PUT', cuerpo: { nombre: 'X' }, credencial: token });
            const borrado = await pedir(ajeno, { metodo: 'DELETE', credencial: token });
            assert.strictEqual(lectura.estado, 403);
            assert.strictEqual(edicion.estado, 403);
            assert.strictEqual(borrado.estado, 403);
        });
    });

    describe('Productos', () => {
        // Prueba
        test('Lista 20 productos: 10 Vinilo y 10 CD', async (t) => {
            if (!hayProductos) return t.skip(MOTIVO);
            const respuesta = await pedir('/api/productos');
            productos = respuesta.datos;
            assert.strictEqual(respuesta.estado, 200);
            assert.strictEqual(productos.length, 20);
            assert.strictEqual(productos.filter((producto) => producto.formato === 'Vinilo').length, 10);
            assert.strictEqual(productos.filter((producto) => producto.formato === 'CD').length, 10);
        });

        // Prueba
        test('Obtiene un producto por id', async (t) => {
            if (!hayProductos) return t.skip(MOTIVO);
            const respuesta = await pedir(`/api/productos/${productos[0].id}`);
            assert.strictEqual(respuesta.estado, 200);
            assert.strictEqual(respuesta.datos.id, productos[0].id);
            assert.ok(respuesta.datos.album);
        });

        // Prueba
        test('Producto inexistente devuelve 404', async (t) => {
            if (!hayProductos) return t.skip(MOTIVO);
            const respuesta = await pedir('/api/productos/99999999');
            assert.strictEqual(respuesta.estado, 404);
        });
    });

    describe('Pedidos', () => {
        let pedidoId = 0;

        // Prueba
        test('Lista vacía devuelve 400', async () => {
            const respuesta = await pedir('/api/pedidos', {
                metodo: 'POST',
                cuerpo: { productos: [] },
                credencial: token
            });
            assert.strictEqual(respuesta.estado, 400);
        });

        // Prueba
        test('Estado inválido devuelve 400', async () => {
            const respuesta = await pedir('/api/pedidos/1', {
                metodo: 'PUT',
                cuerpo: { estado: 'inventado' },
                credencial: token
            });
            assert.strictEqual(respuesta.estado, 400);
        });

        // Prueba
        test('Listar pedidos devuelve 200 y una lista', async () => {
            const respuesta = await pedir('/api/pedidos', { credencial: token });
            assert.strictEqual(respuesta.estado, 200);
            assert.ok(Array.isArray(respuesta.datos));
        });

        // Prueba
        test('Crear pedido devuelve 201 con total del servidor', async (t) => {
            if (!hayProductos) return t.skip(MOTIVO);
            const producto = productos.find((item) => item.stock >= 2);
            const respuesta = await pedir('/api/pedidos', {
                metodo: 'POST',
                cuerpo: { productos: [{ id: producto.id, cantidad: 2 }], total: 0.01 },
                credencial: token
            });
            assert.strictEqual(respuesta.estado, 201);
            pedidoId = respuesta.datos.id;
            pedidosCreados.push(pedidoId);
            assert.strictEqual(respuesta.datos.total, Number((Number(producto.precio) * 2).toFixed(2)));
            assert.strictEqual(respuesta.datos.estado, 'pendiente');
            assert.strictEqual(respuesta.datos.cliente_id, clienteId);
        });

        // Prueba
        test('El pedido aparece en la lista', async (t) => {
            if (!hayProductos) return t.skip(MOTIVO);
            const respuesta = await pedir('/api/pedidos', { credencial: token });
            assert.strictEqual(respuesta.estado, 200);
            assert.ok(respuesta.datos.some((pedido) => pedido.id === pedidoId));
        });

        // Prueba
        test('Cambiar estado devuelve 200', async (t) => {
            if (!hayProductos) return t.skip(MOTIVO);
            const respuesta = await pedir(`/api/pedidos/${pedidoId}`, {
                metodo: 'PUT',
                cuerpo: { estado: 'pagado' },
                credencial: token
            });
            assert.strictEqual(respuesta.estado, 200);
            assert.strictEqual(respuesta.datos.estado, 'pagado');
        });

        // Prueba
        test('Eliminar pedido devuelve 200', async (t) => {
            if (!hayProductos) return t.skip(MOTIVO);
            const respuesta = await pedir(`/api/pedidos/${pedidoId}`, { metodo: 'DELETE', credencial: token });
            assert.strictEqual(respuesta.estado, 200);
            const lista = await pedir('/api/pedidos', { credencial: token });
            assert.ok(!lista.datos.some((pedido) => pedido.id === pedidoId));
        });
    });

    describe('Baja del cliente', () => {
        // Prueba
        test('DELETE del cliente propio devuelve 200', async () => {
            const respuesta = await pedir(`/api/clientes/${clienteId}`, { metodo: 'DELETE', credencial: token });
            assert.strictEqual(respuesta.estado, 200);
            clienteEliminado = true;
        });

        // Prueba
        test('El cliente eliminado ya no puede entrar', async () => {
            const respuesta = await pedir('/api/clientes/login', { metodo: 'POST', cuerpo: { correo, clave } });
            assert.strictEqual(respuesta.estado, 401);
        });
    });
});
