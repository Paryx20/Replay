// Importaciones
const express = require('express');
const controlador = require('../controladores/productoControlador');
const verificarToken = require('../middlewares/verificarToken');

const router = express.Router();

// Rutas públicas
router.get('/', controlador.listar);
router.get('/:id', controlador.obtener);

// Rutas protegidas
router.post('/', verificarToken, controlador.crear);
router.put('/:id', verificarToken, controlador.actualizar);
router.delete('/:id', verificarToken, controlador.eliminar);

module.exports = router;
