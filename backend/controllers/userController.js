const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { recordAudit } = require('../middleware/auditLogger');

// GET /api/users
const getAll = async (req, res) => {
    try {
        let query = `
            SELECT u.id, u.full_name, u.email, u.username, u.role, u.phone, u.avatar,
                   u.is_active, u.last_login, u.created_at, u.department_id,
                   d.name AS department_name, d.code AS department_code
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
        `;
        const params = [];
        const conditions = [];
        if (req.query.role) { conditions.push('u.role = ?'); params.push(req.query.role); }
        if (req.query.department_id) { conditions.push('u.department_id = ?'); params.push(req.query.department_id); }
        if (req.query.search) {
            conditions.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.username LIKE ?)');
            const s = `%${req.query.search}%`;
            params.push(s, s, s);
        }
        if (req.user.role === 'admin') { conditions.push('u.department_id = ?'); params.push(req.user.department_id); }
        if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY u.created_at DESC';
        const [rows] = await pool.query(query, params);
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/users/:id
const getOne = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.id, u.full_name, u.email, u.username, u.role, u.phone, u.avatar,
                   u.is_active, u.last_login, u.created_at, u.department_id,
                   d.name AS department_name, d.code AS department_code
            FROM users u LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.id = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// POST /api/users
const create = async (req, res) => {
    try {
        const { full_name, email, username, password, role, department_id, phone } = req.body;
        if (!full_name || !email || !username || !password) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }
        const [exist] = await pool.query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
        if (exist.length) return res.status(400).json({ success: false, message: 'Email hoặc username đã tồn tại' });
        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (full_name, email, username, password_hash, role, department_id, phone) VALUES (?,?,?,?,?,?,?)',
            [full_name, email, username, hash, role || 'user', department_id || null, phone || null]
        );
        await recordAudit({
            user_id: req.user.id,
            action: 'Tạo người dùng',
            entity_type: 'user',
            entity_id: result.insertId,
            new_data: { full_name, email, username, role, department_id, phone },
            req
        });
        return res.status(201).json({ success: true, message: 'Tạo người dùng thành công', id: result.insertId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// PUT /api/users/:id
const update = async (req, res) => {
    try {
        const { full_name, email, role, department_id, phone, is_active } = req.body;
        const [oldRows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (!oldRows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        const oldUser = oldRows[0];
        await pool.query(
            'UPDATE users SET full_name=?, email=?, role=?, department_id=?, phone=?, is_active=?, updated_at=NOW() WHERE id=?',
            [full_name, email, role, department_id || null, phone || null, is_active ?? 1, req.params.id]
        );
        await recordAudit({
            user_id: req.user.id,
            action: 'Cập nhật người dùng',
            entity_type: 'user',
            entity_id: req.params.id,
            old_data: oldUser,
            new_data: { full_name, email, role, department_id, phone, is_active },
            req
        });
        return res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// PUT /api/users/:id/reset-password  (SuperAdmin only)
const resetPassword = async (req, res) => {
    try {
        const { new_password } = req.body;
        if (!new_password || new_password.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }
        const hash = await bcrypt.hash(new_password, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.params.id]);
        await recordAudit({
            user_id: req.user.id,
            action: 'Đặt lại mật khẩu người dùng',
            entity_type: 'user',
            entity_id: req.params.id,
            new_data: { password_reset: true },
            req
        });
        return res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// DELETE /api/users/:id  — soft delete
const remove = async (req, res) => {
    try {
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản của chính mình' });
        }
        const [oldRows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (!oldRows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        await pool.query('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id]);
        await recordAudit({
            user_id: req.user.id,
            action: 'Vô hiệu hóa người dùng',
            entity_type: 'user',
            entity_id: req.params.id,
            old_data: oldRows[0],
            new_data: { is_active: 0 },
            req
        });
        return res.json({ success: true, message: 'Đã vô hiệu hóa người dùng' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// POST /api/users/mark-viewed
const markViewed = async (req, res) => {
    try {
        const { section } = req.body;
        if (!section) return res.status(400).json({ success: false, message: 'Thiếu section' });
        await pool.query(
            'INSERT INTO user_section_views (user_id, section, viewed_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE viewed_at = NOW()',
            [req.user.id, section]
        );
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

module.exports = { getAll, getOne, create, update, remove, resetPassword, markViewed };
