const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/database');
const jwtConfig = require('../config/jwt');
const { sendMail } = require('../config/mail');
const { getPublicBaseUrl } = require('../config/appUrl');

const recordLoginHistory = async ({ userId = null, username, success, ip, userAgent, message }) => {
    try {
        await pool.query(
            'INSERT INTO login_history (user_id, username, success, ip_address, user_agent, message) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, username, success ? 1 : 0, ip, userAgent, message]
        );
    } catch (err) {
        console.error('Login history error:', err);
    }
};

const getIpAddress = (req) => {
    return (req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || '').split(',')[0].trim();
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tài khoản và mật khẩu' });
        }
        const ip = getIpAddress(req);
        const userAgent = req.headers['user-agent'] || null;

        const [rows] = await pool.query(
            'SELECT * FROM users WHERE (username = ? OR email = ?) AND is_active = 1',
            [username, username]
        );
        if (!rows.length) {
            await recordLoginHistory({ username, success: false, ip, userAgent, message: 'Tài khoản không tồn tại hoặc chưa kích hoạt' });
            return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại' });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            await recordLoginHistory({ userId: user.id, username: user.username, success: false, ip, userAgent, message: 'Mật khẩu không đúng' });
            return res.status(401).json({ success: false, message: 'Mật khẩu không đúng' });
        }
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
        await recordLoginHistory({ userId: user.id, username: user.username, success: true, ip, userAgent, message: 'Đăng nhập thành công' });

        // Get department info
        let department = null;
        if (user.department_id) {
            const [depts] = await pool.query('SELECT name, code FROM departments WHERE id = ?', [user.department_id]);
            if (depts.length) department = depts[0];
        }

        const token = jwtConfig.sign({ id: user.id, role: user.role });
        return res.json({
            success: true,
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                username: user.username,
                role: user.role,
                department_id: user.department_id,
                department,
                avatar: user.avatar
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/auth/me
const me = async (req, res) => {
    try {
        const [depts] = req.user.department_id
            ? await pool.query('SELECT name, code, location FROM departments WHERE id = ?', [req.user.department_id])
            : [[]];
        return res.json({
            success: true,
            user: { ...req.user, department: depts[0] || null }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/auth/history
const getLoginHistory = async (req, res) => {
    try {
        const { username, success } = req.query;
        let query = `SELECT lh.*, u.full_name, u.role FROM login_history lh LEFT JOIN users u ON lh.user_id = u.id WHERE 1=1`;
        const params = [];

        if (username) {
            query += ' AND (lh.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)';
            params.push(`%${username}%`, `%${username}%`, `%${username}%`);
        }
        if (success === '0' || success === '1') {
            query += ' AND lh.success = ?';
            params.push(success);
        }
        query += ' ORDER BY lh.created_at DESC LIMIT 500';

        const [rows] = await pool.query(query, params);
        return res.json({ success: true, data: { rows } });
    } catch (err) {
        console.error('Login history error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi tải lịch sử đăng nhập' });
    }
};

// GET /api/auth/history/export
const exportLoginHistory = async (req, res) => {
    try {
        const { username, success } = req.query;
        let query = `SELECT lh.*, u.full_name, u.role FROM login_history lh LEFT JOIN users u ON lh.user_id = u.id WHERE 1=1`;
        const params = [];
        if (username) {
            query += ' AND (lh.username LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)';
            params.push(`%${username}%`, `%${username}%`, `%${username}%`);
        }
        if (success === '0' || success === '1') {
            query += ' AND lh.success = ?';
            params.push(success);
        }
        query += ' ORDER BY lh.created_at DESC LIMIT 2000';

        const [rows] = await pool.query(query, params);

        const ExcelJS = require('exceljs');
        const wb = new ExcelJS.Workbook();
        wb.creator = 'TVU-ITAM';
        wb.created = new Date();
        const ws = wb.addWorksheet('Lịch sử đăng nhập', { views: [{ state: 'frozen', ySplit: 1 }] });

        const borderStyle = {
            top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
        };

        const headerStyle = {
            font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } },
            alignment: { horizontal: 'center', vertical: 'middle' },
            border: borderStyle
        };

        const dataStyle = {
            font: { name: 'Calibri', size: 11 },
            alignment: { vertical: 'middle' },
            border: borderStyle
        };

        const headers = ['Thời gian', 'Tên đăng nhập', 'Người dùng', 'Quyền', 'Kết quả', 'Địa chỉ IP', 'Nội dung'];
        const colWidths = [22, 18, 22, 16, 12, 18, 40];

        ws.columns = headers.map((h, i) => ({ header: h, key: h, width: colWidths[i] }));
        const headerRow = ws.getRow(1);
        headerRow.eachCell(cell => { cell.style = headerStyle; });
        headerRow.height = 28;

        const roleMap = { superadmin: 'Siêu quản trị', admin: 'Quản trị viên', user: 'Người dùng' };
        rows.forEach((row, i) => {
            const r = ws.addRow({
                'Thời gian': row.created_at ? new Date(row.created_at).toLocaleString('vi-VN') : '',
                'Tên đăng nhập': row.username,
                'Người dùng': row.full_name || '',
                'Quyền': roleMap[row.role] || row.role || '',
                'Kết quả': row.success === 1 ? 'Thành công' : 'Thất bại',
                'Địa chỉ IP': row.ip_address || '',
                'Nội dung': row.message || ''
            });
            r.eachCell(cell => {
                cell.style = dataStyle;
                if (row.success === 1) {
                    if (cell.col === 5) { cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF166534' }, bold: true }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; }
                } else {
                    if (cell.col === 5) { cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF991B1B' }, bold: true }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; }
                }
                if (i % 2 === 0 && cell.col !== 5) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            });
            r.height = 22;
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="lich_su_dang_nhap.xlsx"');
        await wb.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Export login history error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi xuất Excel' });
    }
};

// POST /api/auth/change-password
const changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
        const isMatch = await bcrypt.compare(current_password, rows[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
        }
        if (new_password.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }
        const hash = await bcrypt.hash(new_password, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
        return res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// POST /api/auth/register
const register = async (req, res) => {
    try {
        const { full_name, email, username, password, department_id } = req.body;
        
        // Basic validation
        if (!full_name || !email || !username || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }

        // Check if username or email already exists
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Tên đăng nhập hoặc email đã tồn tại' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Insert new user
        // By default, role is 'user' and is_active is 0 (Requires Admin Approval)
        const [result] = await pool.query(
            'INSERT INTO users (full_name, email, username, password_hash, role, department_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [full_name, email, username, password_hash, 'user', department_id || null, 0]
        );

        return res.status(201).json({ 
            success: true, 
            message: 'Đăng ký thành công! Vui lòng đợi SuperAdmin phê duyệt phòng ban và kích hoạt tài khoản của bạn.' 
        });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký' });
    }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập email' });
        }

        // Find user by email
        const [users] = await pool.query('SELECT id, full_name, email FROM users WHERE email = ?', [email]);
        if (!users.length) {
            // Don't reveal whether email exists
            return res.json({ success: true, message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.' });
        }

        const user = users[0];

        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Delete old tokens for this user
        await pool.query('DELETE FROM password_resets WHERE user_id = ?', [user.id]);

        // Insert new token
        await pool.query(
            'INSERT INTO password_resets (user_id, email, token, expires_at) VALUES (?, ?, ?, ?)',
            [user.id, user.email, token, expiresAt]
        );

        // Build reset link
        const baseUrl = getPublicBaseUrl(req);
        const resetLink = `${baseUrl}/reset-password.html?token=${token}`;

        // Send email
        const sent = await sendMail({
            to: user.email,
            subject: 'Đặt lại mật khẩu - Hệ thống Quản lý Tài sản CNTT (TVU-ITAM)',
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h2 style="color: #1e3a5f; margin: 0;">TVU-ITAM</h2>
                        <p style="color: #64748b; margin: 4px 0 0;">Đại học Trà Vinh</p>
                    </div>
                    <div style="background: #fff; padding: 28px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.1);">
                        <p style="color: #334155; margin: 0 0 16px;">Xin chào <strong>${user.full_name}</strong>,</p>
                        <p style="color: #475569; margin: 0 0 16px;">Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản TVU-ITAM. Nhấn nút bên dưới để tiếp tục:</p>
                        <div style="text-align: center; margin: 24px 0;">
                            <a href="${resetLink}" style="display: inline-block; padding: 12px 32px; background: #1e3a5f; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">Đặt lại mật khẩu</a>
                        </div>
                        <p style="color: #64748b; font-size: 13px; margin: 0 0 8px;">Hoặc copy đường dẫn sau vào trình duyệt:</p>
                        <p style="color: #1e3a5f; font-size: 13px; word-break: break-all; margin: 0; background: #f1f5f9; padding: 8px 12px; border-radius: 4px;">${resetLink}</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                        <p style="color: #94a3b8; font-size: 13px; margin: 0;">Liên kết hết hạn sau <strong>1 giờ</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                    </div>
                </div>
            `,
        });

        if (!sent) {
            console.log('[MAIL] Email could not be sent (SMTP not configured). Reset link: ' + resetLink);
            return res.json({ success: true, message: 'Vui lòng kiểm tra email để đặt lại mật khẩu.', resetLink });
        }

        return res.json({ success: true, message: 'Vui lòng kiểm tra email để đặt lại mật khẩu.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }

        // Find valid token
        const [rows] = await pool.query(
            'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW()',
            [token]
        );
        if (!rows.length) {
            return res.status(400).json({ success: false, message: 'Liên kết không hợp lệ hoặc đã hết hạn' });
        }

        const reset = rows[0];

        // Hash new password
        const hash = await bcrypt.hash(password, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, reset.user_id]);

        // Mark token as used
        await pool.query('UPDATE password_resets SET used = 1 WHERE id = ?', [reset.id]);

        return res.json({ success: true, message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.' });
    } catch (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
    try {
        const { full_name, email } = req.body;
        const userId = req.user.id;

        if (full_name !== undefined && !full_name.trim()) {
            return res.status(400).json({ success: false, message: 'Họ tên không được để trống' });
        }
        if (email !== undefined) {
            const emailTrimmed = email.trim();
            if (!emailTrimmed) {
                return res.status(400).json({ success: false, message: 'Email không được để trống' });
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailTrimmed)) {
                return res.status(400).json({ success: false, message: 'Email không hợp lệ' });
            }
            // Check email uniqueness (exclude current user)
            const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [emailTrimmed, userId]);
            if (existing.length) {
                return res.status(400).json({ success: false, message: 'Email đã được sử dụng bởi tài khoản khác' });
            }
        }

        const updates = [];
        const params = [];
        if (full_name !== undefined) { updates.push('full_name = ?'); params.push(full_name.trim()); }
        if (email !== undefined) { updates.push('email = ?'); params.push(email.trim()); }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'Không có dữ liệu nào cần cập nhật' });
        }

        params.push(userId);
        await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

        // Return updated user
        const [rows] = await pool.query('SELECT id, username, full_name, email, role, department_id, avatar, is_active, created_at FROM users WHERE id = ?', [userId]);
        const user = rows[0];
        const [depts] = user.department_id
            ? await pool.query('SELECT name, code, location FROM departments WHERE id = ?', [user.department_id])
            : [[]];

        return res.json({ success: true, message: 'Cập nhật thông tin thành công', user: { ...user, department: depts[0] || null } });
    } catch (err) {
        console.error('Update profile error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// POST /api/auth/guest
const guestLogin = async (req, res) => {
    try {
        const token = jwtConfig.sign({ id: null, role: 'user', guest: true });
        return res.json({
            success: true,
            message: 'Đăng nhập với tư cách khách',
            token,
            user: {
                id: null,
                username: 'Khách',
                full_name: 'Người dùng khách',
                email: '',
                role: 'user',
                department_id: null,
                is_active: true,
                avatar: null,
                department: null
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

module.exports = { login, me, getLoginHistory, exportLoginHistory, changePassword, register, forgotPassword, resetPassword, updateProfile, guestLogin };
