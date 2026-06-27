const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', requireRole('admin', 'superadmin'), ctrl.getAll);
router.get('/:id', requireRole('admin', 'superadmin'), ctrl.getOne);
router.post('/', requireRole('superadmin'), ctrl.create);
router.put('/:id', requireRole('superadmin', 'admin'), ctrl.update);
router.put('/:id/reset-password', requireRole('superadmin'), ctrl.resetPassword);
router.delete('/:id', requireRole('superadmin'), ctrl.remove);
router.post('/mark-viewed', ctrl.markViewed);

module.exports = router;
