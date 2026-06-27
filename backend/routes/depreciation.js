const express = require('express');
const router = express.Router();
const depreciationService = require('../services/depreciationService');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);

// GET /api/depreciation/assets – list all assets with depreciation data
router.get('/assets', async (req, res) => {
  try {
    const data = await depreciationService.listAssetsWithDepreciation();
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// PATCH /api/depreciation/assets/:id – update depreciation rate for a specific asset
router.patch('/assets/:id', requireRole('superadmin', 'admin'), async (req, res) => {
  const { id } = req.params;
  const { depreciation_rate } = req.body;
  if (depreciation_rate == null) return res.status(400).json({ success: false, message: 'Thiếu depreciation_rate' });
  try {
    const result = await depreciationService.updateDepreciationRate(id, depreciation_rate, req.user.id);
    if (!result) return res.status(404).json({ success: false, message: 'Không tìm thấy tài sản' });
    res.json({ success: true, message: 'Cập nhật tỷ lệ khấu hao thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// GET /api/depreciation/summary – aggregated depreciation and remaining value per year
router.get('/summary', async (req, res) => {
  try {
    const data = await depreciationService.getYearlySummary();
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

module.exports = router;
