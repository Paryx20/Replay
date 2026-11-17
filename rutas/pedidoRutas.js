// Importaciones
const express = require('express');
const controlador = require('../controladores/pedidoControlador');
const verificarToken = require('../middlewares/verificarToken');

const router = express.Router();

// Rutas protegidas
router.get('/', verificarToken, controlador.listar);
router.post('/', verificarToken, controlador.crear);
router.put('/:id', verificarToken, controlador.actualizar);
router.delete('/:id', verificarToken, controlador.eliminar);

module.exports = router;
