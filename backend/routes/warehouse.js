const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/warehouseController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

router.get('/', ctrl.getWarehouses);
router.post('/', requireRole('superadmin', 'admin'), ctrl.createWarehouse);
router.put('/:id', requireRole('superadmin', 'admin'), ctrl.updateWarehouse);
router.delete('/:id', requireRole('superadmin', 'admin'), ctrl.deleteWarehouse);

router.get('/receipts', ctrl.getReceipts);
router.get('/receipts/:id', ctrl.getReceipt);
router.post('/receipts', requireRole('superadmin', 'admin'), ctrl.createReceipt);
router.delete('/receipts/:id', requireRole('superadmin', 'admin'), ctrl.deleteReceipt);
router.get('/receipts/:id/export-pdf', requireRole('superadmin', 'admin'), ctrl.exportReceiptPdf);

router.get('/issues', ctrl.getIssues);
router.get('/issues/:id', ctrl.getIssue);
router.post('/issues', requireRole('superadmin', 'admin'), ctrl.createIssue);
router.delete('/issues/:id', requireRole('superadmin', 'admin'), ctrl.deleteIssue);
router.get('/issues/:id/export-pdf', requireRole('superadmin', 'admin'), ctrl.exportIssuePdf);

router.get('/stock', ctrl.getStock);
router.get('/stock/export-pdf', requireRole('superadmin', 'admin'), ctrl.exportStockPdf);

module.exports = router;
