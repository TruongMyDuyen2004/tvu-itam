const jwtConfig = require('../config/jwt');
const pool = require('../config/database');

const authenticate = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Không có token xác thực' });
        }
        const decoded = jwtConfig.verify(token);

        // Guest user (no DB record)
        if (decoded.guest) {
            req.user = { id: null, username: 'Khách', full_name: 'Người dùng khách', email: '', role: 'user', department_id: null, is_active: true, avatar: null };
            return next();
        }

        const [rows] = await pool.query(
            'SELECT id, full_name, email, username, role, department_id, is_active, avatar FROM users WHERE id = ?',
            [decoded.id]
        );
        if (!rows.length || !rows[0].is_active) {
            return res.status(401).json({ success: false, message: 'Tài khoản không hợp lệ hoặc đã bị khóa' });
        }
        req.user = rows[0];
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
};

const requireRole = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này' });
    }
    next();
};

module.exports = { authenticate, requireRole };
