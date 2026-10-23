// routes/sedes.js
const express = require('express');
const router = express.Router();
const sedeController = require('../controllers/sedeController');
const { requireAdmin, requireAnyRole } = require('../middleware/auth');

// Todos pueden listar y ver
router.get('/', requireAnyRole, sedeController.getAll);
router.get('/:id', requireAnyRole, sedeController.getById);

// Solo admin: crear, editar, verificar y eliminar
router.post('/', requireAdmin, sedeController.create);
router.put('/:id', requireAdmin, sedeController.update);
router.get('/:id/check-delete', requireAdmin, sedeController.checkDelete);
router.delete('/:id', requireAdmin, sedeController.delete);

module.exports = router;