const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/transferController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', requireRole('superadmin', 'admin'), ctrl.create);
router.put('/:id/approve', requireRole('superadmin', 'admin'), ctrl.approve);
router.get('/:id/export-pdf', requireRole('superadmin', 'admin'), ctrl.exportPdf);
router.delete('/:id', requireRole('superadmin'), ctrl.remove);

module.exports = router;
