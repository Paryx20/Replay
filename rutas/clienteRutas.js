// Importaciones
const express = require('express');
const controlador = require('../controladores/clienteControlador');
const verificarToken = require('../middlewares/verificarToken');

const router = express.Router();

// Rutas públicas
router.post('/registro', controlador.registrar);
router.post('/login', controlador.iniciarSesion);

// Rutas protegidas
router.get('/:id', verificarToken, controlador.obtener);
router.put('/:id', verificarToken, controlador.actualizar);
router.delete('/:id', verificarToken, controlador.eliminar);

module.exports = router;
