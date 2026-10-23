// routes/areas.js
const express = require('express');
const router = express.Router();
const areaController = require('../controllers/areaController');
const { requireAdmin, requireAnyRole } = require('../middleware/auth');

// Todos pueden listar (necesario para selects)
router.get('/', requireAnyRole, areaController.getAll);
router.get('/:id', requireAnyRole, areaController.getById);

// Solo admin: crear, editar, verificar y eliminar
router.post('/', requireAdmin, areaController.create);
router.put('/:id', requireAdmin, areaController.update);
router.get('/:id/check-delete', requireAdmin, areaController.checkDelete);
router.delete('/:id', requireAdmin, areaController.delete);

module.exports = router;