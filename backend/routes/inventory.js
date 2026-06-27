const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventoryController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/stats/summary', ctrl.getStats);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.get('/:id/export-pdf', ctrl.exportPdf);
router.post('/', requireRole('superadmin', 'admin'), ctrl.create);
router.put('/:id', requireRole('superadmin', 'admin'), ctrl.update);
router.put('/:id/check', requireRole('superadmin', 'admin'), ctrl.checkDevice);
router.put('/:id/complete', requireRole('superadmin', 'admin'), ctrl.complete);
router.delete('/:id', requireRole('superadmin'), ctrl.remove);

module.exports = router;
