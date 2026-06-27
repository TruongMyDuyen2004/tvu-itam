const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/maintenanceController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', requireRole('superadmin', 'admin'), ctrl.create);
router.put('/:id', requireRole('superadmin', 'admin'), ctrl.update);
router.get('/:id/export-pdf', requireRole('superadmin', 'admin'), ctrl.exportPdf);
router.delete('/:id', requireRole('superadmin', 'admin'), ctrl.remove);

module.exports = router;
