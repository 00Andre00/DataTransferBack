// routes/regimenes.js
const express = require('express');
const router = express.Router();
const regimenController = require('../controllers/regimenController');
const { requireAdmin, requireAnyRole } = require('../middleware/auth');

// Todos pueden listar (para selects en formularios)
router.get('/', requireAnyRole, regimenController.getAll);
router.get('/:codigo', requireAnyRole, regimenController.getByCodigo);

// Solo admin: crear, editar, renombrar, eliminar
router.post('/', requireAdmin, regimenController.create);
router.put('/:codigo', requireAdmin, regimenController.update);
router.patch('/:codigo/rename', requireAdmin, regimenController.rename);
router.get('/:codigo/check-delete', requireAdmin, regimenController.checkDelete);
router.delete('/:codigo', requireAdmin, regimenController.delete);

module.exports = router;