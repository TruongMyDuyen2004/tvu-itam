const express = require('express');
const router = express.Router();
const incidentCtrl = require('../controllers/incidentController');
const deptCtrl = require('../controllers/departmentController');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

// Incidents
router.use('/incidents', authenticate);
router.get('/incidents', incidentCtrl.getAll);
router.get('/incidents/:id', incidentCtrl.getOne);
router.post('/incidents', authenticate, incidentCtrl.create);
router.put('/incidents/:id', authenticate, requireRole('superadmin', 'admin'), incidentCtrl.update);
router.get('/incidents/:id/export-pdf', authenticate, requireRole('superadmin', 'admin'), incidentCtrl.exportPdf);
router.delete('/incidents/:id', requireRole('superadmin'), incidentCtrl.remove);

// Departments
router.get('/departments', deptCtrl.getAll); // Công khai cho trang đăng ký
router.use('/departments', authenticate);
router.post('/departments', requireRole('superadmin'), deptCtrl.create);
router.put('/departments/:id', requireRole('superadmin', 'admin'), deptCtrl.update);
router.delete('/departments/:id', requireRole('superadmin'), deptCtrl.remove);

// Device Categories
const pool = require('../config/database');
router.get('/categories', authenticate, async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM device_categories ORDER BY name');
    res.json({ success: true, data: rows });
});

// Create category
router.post('/categories', authenticate, requireRole('superadmin'), async (req, res) => {
    try {
        const { name, description, icon, useful_life_years } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Tên loại thiết bị không được để trống' });
        const [result] = await pool.query(
            'INSERT INTO device_categories (name, description, icon, useful_life_years) VALUES (?, ?, ?, ?)',
            [name, description, icon || 'laptop', useful_life_years || 5]
        );
        res.json({ success: true, message: 'Thêm loại thiết bị thành công', data: { id: result.insertId, name, description, icon, useful_life_years } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
});

// Update category
router.put('/categories/:id', authenticate, requireRole('superadmin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon, useful_life_years } = req.body;
        if (!name) return res.status(400).json({ success: false, message: 'Tên loại thiết bị không được để trống' });
        await pool.query(
            'UPDATE device_categories SET name = ?, description = ?, icon = ?, useful_life_years = ? WHERE id = ?',
            [name, description, icon || 'laptop', useful_life_years || 5, id]
        );
        res.json({ success: true, message: 'Cập nhật loại thiết bị thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
});

// Delete category
router.delete('/categories/:id', authenticate, requireRole('superadmin'), async (req, res) => {
    try {
        const { id } = req.params;
        // Check if there are devices in this category
        const [devices] = await pool.query('SELECT id FROM devices WHERE category_id = ? LIMIT 1', [id]);
        if (devices.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa loại thiết bị này vì đang có thiết bị thuộc nhóm này' });
        }
        await pool.query('DELETE FROM device_categories WHERE id = ?', [id]);
        res.json({ success: true, message: 'Xóa loại thiết bị thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
});

// File Upload
router.post('/upload/device', authenticate, requireRole('superadmin', 'admin'), upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn một tệp ảnh' });
    }
    
    // Construct the public URL
    const imageUrl = `/uploads/devices/${req.file.filename}`;
    res.json({ 
        success: true, 
        message: 'Tải ảnh lên thành công', 
        data: { 
            url: imageUrl,
            filename: req.file.filename
        } 
    });
});

// Avatar Upload
const avatarUpload = require('../middleware/uploadAvatarMiddleware');
router.post('/upload/avatar', authenticate, avatarUpload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn một tệp ảnh' });
        }
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, req.user.id]);
        res.json({
            success: true,
            message: 'Cập nhật ảnh đại diện thành công',
            data: { url: avatarUrl }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi tải ảnh lên' });
    }
});

module.exports = router;
