const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const settingsCtrl = require('../controllers/settingsController');

router.get('/', authenticate, requireRole('admin', 'superadmin', 'user'), settingsCtrl.getSettings);
router.put('/', authenticate, requireRole('admin', 'superadmin'), settingsCtrl.updateSettings);

module.exports = router;
