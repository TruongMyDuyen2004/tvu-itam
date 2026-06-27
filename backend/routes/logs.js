const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const logCtrl = require('../controllers/logController');

router.get('/', authenticate, requireRole('admin', 'superadmin'), logCtrl.getAll);
router.get('/:id', authenticate, requireRole('admin', 'superadmin'), logCtrl.getOne);

module.exports = router;