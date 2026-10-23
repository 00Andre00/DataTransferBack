// routes/workers.js
const express = require('express');
const router = express.Router();
const workerController = require('../controllers/workerController');
const { validarWorker } = require('../middleware/validation');
const { requireAdminOrRRHH, requireAnyRole } = require('../middleware/auth');

// Listar y ver (admin, encargado, rrhh, area_user autenticados)
router.get('/', requireAnyRole, workerController.getAll);
router.get('/:id', requireAnyRole, workerController.getById);
router.get('/:id/sede-history', requireAnyRole, workerController.getSedeHistory);

// Crear/editar/eliminar (admin y rrhh)
router.post('/', requireAdminOrRRHH, validarWorker, workerController.create);
router.put('/:id', requireAdminOrRRHH, workerController.update);
router.delete('/:id', requireAdminOrRRHH, workerController.delete);

// Cambiar sede (admin y rrhh)
router.post('/:id/change-sede', requireAdminOrRRHH, workerController.changeSede);

module.exports = router;