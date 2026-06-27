const express = require('express');
const router = express.Router();
const multer = require('multer');
const ctrl = require('../controllers/deviceController');
const { authenticate, requireRole } = require('../middleware/auth');

// Multer config for Excel import (memory storage)
const excelUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /xlsx|xls/;
        const ext = file.originalname.split('.').pop().toLowerCase();
        if (allowed.test(ext)) return cb(null, true);
        cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'));
    }
});

router.use(authenticate);
router.get('/stats/summary', ctrl.getStats);
router.get('/export', requireRole('superadmin', 'admin'), ctrl.exportExcel);
router.post('/import', requireRole('superadmin', 'admin'), excelUpload.single('file'), ctrl.importExcel);
router.get('/export-pdf', requireRole('superadmin', 'admin'), ctrl.exportPdf);
router.get('/depreciation/export-pdf', requireRole('superadmin', 'admin'), ctrl.exportDepreciationPdf);
router.get('/stats/export-pdf', requireRole('superadmin', 'admin'), ctrl.exportStatsPdf);
router.get('/:id/qrcode', ctrl.getQRCode);
router.get('/:id/qrcode.png', ctrl.downloadQR);
router.get('/:id/history', ctrl.getHistory);
router.post('/:id/recall', requireRole('superadmin', 'admin'), ctrl.recall);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', requireRole('superadmin', 'admin'), ctrl.create);
router.put('/:id', requireRole('superadmin', 'admin'), ctrl.update);
router.delete('/:id', requireRole('superadmin'), ctrl.remove);

module.exports = router;
