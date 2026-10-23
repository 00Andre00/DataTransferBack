// routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, userController.getAll);
router.get('/:id', requireAdmin, userController.getById);
router.post('/', requireAdmin, userController.create);
router.put('/:id', requireAdmin, userController.update);
router.delete('/:id', requireAdmin, userController.delete);

module.exports = router;