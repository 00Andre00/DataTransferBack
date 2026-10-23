// routes/tickets.js
const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { upload } = require('../utils/upload');
const { requireAdminOrEncargado, requireAnyRole } = require('../middleware/auth');

// Listar y ver
router.get('/', requireAnyRole, ticketController.getAll);
router.get('/:id', requireAnyRole, ticketController.getById);
router.get('/:id/pdf', requireAnyRole, ticketController.getPdf);

// Crear (rrhh y area_user pueden crear)
router.post('/', requireAnyRole, upload.single('pdf'), ticketController.create);

// Reenviar (solo creador)
router.patch('/:id/reenviar', requireAnyRole, upload.single('pdf'), ticketController.reenviar);

// Revisión (solo admin y encargado)
router.patch('/:id/completar', requireAdminOrEncargado, ticketController.completar);
router.patch('/:id/observar', requireAdminOrEncargado, ticketController.observar);

// Eliminar (admin o creador)
router.delete('/:id', requireAnyRole, ticketController.delete);

module.exports = router;