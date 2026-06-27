const pool = require('../config/database');
const { recordAudit } = require('../middleware/auditLogger');
const pdfService = require('../services/pdfService');

const statusLabel = { draft:'Bản nháp', in_progress:'Đang kiểm kê', completed:'Hoàn thành', cancelled:'Đã hủy' };

const SESSION_SELECT = `
  SELECT invs.*, dept.name AS department_name, u.full_name AS created_by_name
  FROM inventory_sessions invs
  LEFT JOIN departments dept ON invs.department_id = dept.id
  LEFT JOIN users u ON invs.created_by = u.id
`;

const actualStatusLabel = { found:'Còn', missing:'Thiếu', damaged:'Hỏng', transferred:'Đã điều chuyển' };

// GET /api/inventory
const getAll = async (req, res) => {
    try {
        let query = SESSION_SELECT + ' WHERE 1=1';
        const params = [];
        if (req.query.status) { query += ' AND invs.status = ?'; params.push(req.query.status); }
        if (req.query.department_id) { query += ' AND invs.department_id = ?'; params.push(req.query.department_id); }
        if (req.query.quarter) { query += ' AND invs.quarter = ?'; params.push(req.query.quarter); }
        if (req.query.year) { query += ' AND invs.year = ?'; params.push(req.query.year); }
        if (req.query.search) {
            query += ' AND (invs.title LIKE ? OR invs.inventory_code LIKE ?)';
            const s = `%${req.query.search}%`;
            params.push(s, s);
        }
        query += ' ORDER BY invs.created_at DESC';
        const [rows] = await pool.query(query, params);
        return res.json({ success: true, data: rows, total: rows.length });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/inventory/:id
const getOne = async (req, res) => {
    try {
        const [sessions] = await pool.query(SESSION_SELECT + ' WHERE invs.id = ?', [req.params.id]);
        if (!sessions.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        const session = sessions[0];

        const [details] = await pool.query(`
            SELECT invd.*, d.device_code, d.name AS device_name, d.brand, d.model,
                   d.serial_number, d.status AS device_status, d.location AS device_location,
                   dc.name AS category_name, dept.name AS department_name,
                   u.full_name AS checked_by_name
            FROM inventory_details invd
            JOIN devices d ON invd.device_id = d.id
            LEFT JOIN device_categories dc ON d.category_id = dc.id
            LEFT JOIN departments dept ON d.department_id = dept.id
            LEFT JOIN users u ON invd.checked_by = u.id
            WHERE invd.session_id = ?
            ORDER BY d.name ASC`, [req.params.id]);

        return res.json({ success: true, data: { ...session, details } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// POST /api/inventory - Tạo phiếu kiểm kê
const create = async (req, res) => {
    try {
        const { title, inventory_date, department_id, quarter, year, notes } = req.body;
        if (!title || !inventory_date) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (tên, ngày kiểm kê)' });
        }

        // Determine scope: all devices if no department, or devices of that department
        let deviceQuery = 'SELECT d.id, d.status, d.location FROM devices d WHERE d.status != ?';
        const deviceParams = ['disposed'];
        if (department_id) {
            deviceQuery += ' AND d.department_id = ?';
            deviceParams.push(department_id);
        }
        const [devices] = await pool.query(deviceQuery, deviceParams);

        // Create session
        const [result] = await pool.query(
            `INSERT INTO inventory_sessions (inventory_code, title, inventory_date, department_id, quarter, year, notes, status, total_devices, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
            ['', title, inventory_date, department_id || null, quarter || null, year || null, notes || null, devices.length, req.user.id]
        );

        // Generate code
        const code = `KK${String(result.insertId).padStart(3, '0')}`;
        await pool.query('UPDATE inventory_sessions SET inventory_code = ? WHERE id = ?', [code, result.insertId]);

        // Insert device details
        if (devices.length > 0) {
            const values = devices.map(d => [result.insertId, d.id, d.status, d.location]);
            await pool.query(
                'INSERT INTO inventory_details (session_id, device_id, system_status, system_location) VALUES ?',
                [values]
            );
        }

        await recordAudit({
            user_id: req.user.id, action: 'Tạo phiếu kiểm kê', entity_type: 'inventory',
            entity_id: result.insertId, new_data: { title, inventory_date, department_id, device_count: devices.length }, req
        });

        return res.status(201).json({ success: true, message: 'Tạo phiếu kiểm kê thành công', id: result.insertId, code });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// PUT /api/inventory/:id - Cập nhật phiếu kiểm kê
const update = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM inventory_sessions WHERE id = ?', [req.params.id]);
        if (!old.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        if (old[0].status === 'completed') return res.status(400).json({ success: false, message: 'Phiếu đã hoàn thành, không thể sửa' });

        const { title, inventory_date, department_id, quarter, year, notes, status } = req.body;
        const validStatus = ['draft', 'in_progress', 'completed', 'cancelled'];
        const newStatus = status || old[0].status;
        if (!validStatus.includes(newStatus)) return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });

        await pool.query(
            `UPDATE inventory_sessions SET title=?, inventory_date=?, department_id=?, quarter=?, year=?, notes=?, status=? WHERE id=?`,
            [title || old[0].title, inventory_date || old[0].inventory_date, department_id ?? old[0].department_id,
             quarter ?? old[0].quarter, year ?? old[0].year, notes ?? old[0].notes, newStatus, req.params.id]
        );

        await recordAudit({
            user_id: req.user.id, action: 'Cập nhật phiếu kiểm kê', entity_type: 'inventory',
            entity_id: req.params.id, old_data: old[0], new_data: { status: newStatus }, req
        });

        return res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// PUT /api/inventory/:id/check - Kiểm tra 1 thiết bị
const checkDevice = async (req, res) => {
    try {
        const { detail_id, actual_status, actual_location, notes } = req.body;
        if (!detail_id || !actual_status) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin (detail_id, actual_status)' });
        }
        const validStatuses = ['found', 'missing', 'damaged', 'transferred'];
        if (!validStatuses.includes(actual_status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
        }

        // Check session belongs to this inventory and is in progress or draft
        const [detail] = await pool.query(
            `SELECT invd.*, invs.status AS session_status FROM inventory_details invd
             JOIN inventory_sessions invs ON invd.session_id = invs.id
             WHERE invd.id = ? AND invd.session_id = ?`, [detail_id, req.params.id]
        );
        if (!detail.length) return res.status(404).json({ success: false, message: 'Không tìm thấy chi tiết' });
        if (detail[0].session_status === 'completed') return res.status(400).json({ success: false, message: 'Phiếu đã hoàn thành' });

        await pool.query(
            `UPDATE inventory_details SET actual_status=?, actual_location=?, notes=?, checked_by=?, checked_at=NOW() WHERE id=?`,
            [actual_status, actual_location || null, notes || null, req.user.id, detail_id]
        );

        // Auto set session to in_progress if still draft
        if (detail[0].session_status === 'draft') {
            await pool.query('UPDATE inventory_sessions SET status=? WHERE id=?', ['in_progress', req.params.id]);
        }

        // Recalculate session counts
        await recalcSession(req.params.id);

        return res.json({ success: true, message: actualStatusLabel[actual_status] || 'Đã cập nhật' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// PUT /api/inventory/:id/complete - Hoàn thành phiếu kiểm kê
const complete = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM inventory_sessions WHERE id = ?', [req.params.id]);
        if (!old.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        if (old[0].status === 'completed') return res.status(400).json({ success: false, message: 'Phiếu đã hoàn thành' });

        await recalcSession(req.params.id);
        const [cur] = await pool.query('SELECT checked_devices, total_devices FROM inventory_sessions WHERE id = ?', [req.params.id]);
        if (cur[0].checked_devices < cur[0].total_devices) {
            return res.status(400).json({ success: false, message: `Chưa kiểm tra hết thiết bị (${cur[0].checked_devices}/${cur[0].total_devices})` });
        }
        await pool.query('UPDATE inventory_sessions SET status=? WHERE id=?', ['completed', req.params.id]);

        await recordAudit({
            user_id: req.user.id, action: 'Hoàn thành kiểm kê', entity_type: 'inventory',
            entity_id: req.params.id, old_data: old[0], new_data: { status: 'completed' }, req
        });

        return res.json({ success: true, message: 'Hoàn thành kiểm kê' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Helper: recalculate session stats
const recalcSession = async (sessionId) => {
    try {
        const [stats] = await pool.query(`
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN actual_status IS NOT NULL THEN 1 ELSE 0 END) AS checked,
                SUM(CASE WHEN actual_status = 'found' THEN 1 ELSE 0 END) AS found,
                SUM(CASE WHEN actual_status = 'missing' THEN 1 ELSE 0 END) AS missing,
                SUM(CASE WHEN actual_status = 'damaged' THEN 1 ELSE 0 END) AS damaged,
                SUM(CASE WHEN actual_status = 'transferred' THEN 1 ELSE 0 END) AS transferred
            FROM inventory_details WHERE session_id = ?
        `, [sessionId]);
        const s = stats[0];
        await pool.query(
            `UPDATE inventory_sessions SET total_devices=?, checked_devices=?, found_devices=?, missing_devices=?, damaged_devices=?, transferred_devices=? WHERE id=?`,
            [s.total, s.checked, s.found, s.missing, s.damaged, s.transferred, sessionId]
        );
    } catch (err) {
        console.error('Recalc error:', err);
    }
};

// DELETE /api/inventory/:id
const remove = async (req, res) => {
    try {
        const [old] = await pool.query('SELECT * FROM inventory_sessions WHERE id = ?', [req.params.id]);
        if (!old.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        await pool.query('DELETE FROM inventory_sessions WHERE id = ?', [req.params.id]);
        await recordAudit({ user_id: req.user.id, action: 'Xóa phiếu kiểm kê', entity_type: 'inventory', entity_id: req.params.id, old_data: old[0], req });
        return res.json({ success: true, message: 'Đã xóa' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/inventory/stats/summary
const getStats = async (req, res) => {
    try {
        const [summary] = await pool.query(`
            SELECT
                COUNT(*) AS total_sessions,
                SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
                SUM(CASE WHEN status = 'completed' AND missing_devices > 0 THEN 1 ELSE 0 END) AS has_issues,
                COALESCE(SUM(total_devices),0) AS total_devices_checked,
                COALESCE(SUM(missing_devices),0) AS total_missing,
                COALESCE(SUM(damaged_devices),0) AS total_damaged
            FROM inventory_sessions
        `);
        const [recent] = await pool.query(`
            SELECT id, inventory_code, title, inventory_date, department_name, status,
                   total_devices, checked_devices, found_devices, missing_devices, damaged_devices
            FROM v_inventory_sessions ORDER BY created_at DESC LIMIT 5
        `);
        return res.json({ success: true, data: { summary: summary[0], recent } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/inventory/:id/export-pdf
const exportPdf = async (req, res) => {
    try {
        const [sessions] = await pool.query(SESSION_SELECT + ' WHERE invs.id = ?', [req.params.id]);
        if (!sessions.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        const [details] = await pool.query(`
            SELECT invd.*, d.device_code, d.name AS device_name, d.brand, d.model,
                   d.serial_number, d.status AS device_status, d.purchase_price,
                   d.location AS device_location, dc.name AS category_name,
                   dept.name AS department_name
            FROM inventory_details invd
            JOIN devices d ON invd.device_id = d.id
            LEFT JOIN device_categories dc ON d.category_id = dc.id
            LEFT JOIN departments dept ON d.department_id = dept.id
            WHERE invd.session_id = ?
            ORDER BY d.name ASC`, [req.params.id]);
        const pdfBuffer = await pdfService.generateInventoryReport(sessions[0], details);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', req.query.inline ? 'inline' : `attachment; filename="BBKK-${sessions[0].inventory_code}-${new Date().toISOString().slice(0,10)}.pdf"`);
        return res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi xuất PDF' });
    }
};

module.exports = { getAll, getOne, create, update, checkDevice, complete, remove, getStats, exportPdf };
