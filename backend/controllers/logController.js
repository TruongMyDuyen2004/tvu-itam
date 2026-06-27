const pool = require('../config/database');

const getAll = async (req, res) => {
    try {
        let query = `
            SELECT l.*, u.full_name AS user_name, u.role AS user_role
            FROM audit_logs l
            LEFT JOIN users u ON l.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (req.query.user_id) {
            query += ' AND l.user_id = ?';
            params.push(req.query.user_id);
        }
        if (req.query.entity_type) {
            query += ' AND l.entity_type = ?';
            params.push(req.query.entity_type);
        }
        if (req.query.action) {
            query += ' AND l.action LIKE ?';
            params.push(`%${req.query.action}%`);
        }
        if (req.query.search) {
            query += ' AND (l.action LIKE ? OR l.entity_type LIKE ? OR l.ip_address LIKE ? OR u.full_name LIKE ?)';
            const s = `%${req.query.search}%`;
            params.push(s, s, s, s);
        }

        query += ' ORDER BY l.created_at DESC LIMIT 200';
        const [rows] = await pool.query(query, params);
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const getOne = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT l.*, u.full_name AS user_name, u.role AS user_role
            FROM audit_logs l
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.id = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy nhật ký' });
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

module.exports = { getAll, getOne };