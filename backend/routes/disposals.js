const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/disposalController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', requireRole('superadmin', 'admin'), ctrl.create);
router.put('/:id', requireRole('superadmin', 'admin'), ctrl.update);
router.put('/:id/report', requireRole('superadmin', 'admin'), ctrl.submitReport);
router.get('/:id/export-pdf', requireRole('superadmin', 'admin'), ctrl.exportPdf);
router.get('/:id/export-result-pdf', requireRole('superadmin', 'admin'), ctrl.exportResultPdf);
router.delete('/:id', requireRole('superadmin'), ctrl.remove);

module.exports = router;
