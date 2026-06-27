const pool = require('../config/database');

// GET /api/departments
const getAll = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT d.*, u.full_name AS manager_name,
                   (SELECT COUNT(*) FROM devices WHERE department_id = d.id AND status != 'disposed') AS device_count,
                   (SELECT COUNT(*) FROM users WHERE department_id = d.id AND is_active = 1) AS user_count
            FROM departments d
            LEFT JOIN users u ON d.manager_id = u.id
            WHERE d.is_active = 1 ORDER BY d.name ASC`);
        return res.json({ success: true, data: rows });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// POST /api/departments
const create = async (req, res) => {
    try {
        const { name, code, location, description } = req.body;
        if (!name || !code) return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        const [result] = await pool.query(
            'INSERT INTO departments (name, code, location, description) VALUES (?,?,?,?)',
            [name, code, location||null, description||null]
        );
        return res.status(201).json({ success: true, message: 'Thêm phòng ban thành công', id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Mã phòng ban đã tồn tại' });
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// PUT /api/departments/:id
const update = async (req, res) => {
    try {
        const { name, code, location, description, manager_id } = req.body;
        await pool.query(
            'UPDATE departments SET name=?, code=?, location=?, description=?, manager_id=?, updated_at=NOW() WHERE id=?',
            [name, code, location||null, description||null, manager_id||null, req.params.id]
        );
        return res.json({ success: true, message: 'Cập nhật phòng ban thành công' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// DELETE /api/departments/:id
const remove = async (req, res) => {
    try {
        const [exists] = await pool.query('SELECT id FROM departments WHERE id = ?', [req.params.id]);
        if (!exists.length) return res.status(404).json({ success: false, message: 'Không tìm thấy phòng ban' });

        const [deviceCount] = await pool.query('SELECT COUNT(*) AS count FROM devices WHERE department_id = ? AND status != "disposed"', [req.params.id]);
        if (deviceCount[0].count > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa phòng ban còn thiết bị đang sử dụng' });
        }

        const [userCount] = await pool.query('SELECT COUNT(*) AS count FROM users WHERE department_id = ? AND is_active = 1', [req.params.id]);
        if (userCount[0].count > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa phòng ban còn người dùng đang hoạt động' });
        }

        await pool.query('UPDATE departments SET is_active = 0, updated_at = NOW() WHERE id = ?', [req.params.id]);
        return res.json({ success: true, message: 'Đã xóa phòng ban' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

module.exports = { getAll, create, update, remove };
