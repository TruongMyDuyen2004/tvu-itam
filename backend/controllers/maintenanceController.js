const pool = require('../config/database');
const { recordAudit } = require('../middleware/auditLogger');
const pdfService = require('../services/pdfService');

// Helper: generate maintenance code
const generateCode = async () => {
    const [row] = await pool.query("SELECT CONCAT('BT', LPAD(COALESCE(MAX(CAST(SUBSTRING(maintenance_code,3) AS UNSIGNED)),0)+1,3,'0')) AS code FROM maintenance_schedules");
    return row[0].code;
};

// GET /api/maintenance
const getAll = async (req, res) => {
    try {
        let query = `
            SELECT ms.*, d.device_code, d.name AS device_name, d.department_id,
                   dc.name AS category_name, dept.name AS department_name,
                   t.full_name AS technician_name, c.full_name AS created_by_name,
                   a.full_name AS approver_name
            FROM maintenance_schedules ms
            JOIN devices d ON ms.device_id = d.id
            LEFT JOIN device_categories dc ON d.category_id = dc.id
            LEFT JOIN departments dept ON d.department_id = dept.id
            LEFT JOIN users t ON ms.technician_id = t.id
            LEFT JOIN users c ON ms.created_by = c.id
            LEFT JOIN users a ON ms.approver_id = a.id
            WHERE 1=1
        `;
        const params = [];
        if (req.query.status) { query += ' AND ms.status = ?'; params.push(req.query.status); }
        if (req.query.device_id) { query += ' AND ms.device_id = ?'; params.push(req.query.device_id); }
        if (req.query.type) { query += ' AND ms.maintenance_type = ?'; params.push(req.query.type); }
        if (req.query.from_date) { query += ' AND ms.request_date >= ?'; params.push(req.query.from_date); }
        if (req.query.to_date) { query += ' AND ms.request_date <= ?'; params.push(req.query.to_date); }
        if (req.user.role === 'user') { query += ' AND (d.department_id = ? OR ms.technician_id = ?)'; params.push(req.user.department_id, req.user.id); }
        query += ' ORDER BY ms.request_date DESC';
        const [rows] = await pool.query(query, params);
        return res.json({ success: true, data: rows, total: rows.length });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/maintenance/:id
const getOne = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT ms.*, d.device_code, d.name AS device_name, d.status AS device_status,
                   dc.name AS category_name, dept.name AS department_name,
                   t.full_name AS technician_name, t.email AS technician_email,
                   c.full_name AS created_by_name, a.full_name AS approver_name
            FROM maintenance_schedules ms
            JOIN devices d ON ms.device_id = d.id
            LEFT JOIN device_categories dc ON d.category_id = dc.id
            LEFT JOIN departments dept ON d.department_id = dept.id
            LEFT JOIN users t ON ms.technician_id = t.id
            LEFT JOIN users c ON ms.created_by = c.id
            LEFT JOIN users a ON ms.approver_id = a.id
            WHERE ms.id = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu bảo trì' });
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// POST /api/maintenance
const create = async (req, res) => {
    try {
        const { device_id, maintenance_type, request_date, start_date, technician_id, approver_id, description, priority, notes } = req.body;
        if (!device_id || !request_date) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }
        const code = await generateCode();
        const [result] = await pool.query(
            `INSERT INTO maintenance_schedules (maintenance_code, device_id, request_date, start_date, maintenance_type, technician_id, approver_id, description, priority, notes, created_by)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
            [code, device_id, request_date, start_date||null, maintenance_type||'dinh_ky', technician_id||null, approver_id||null, description||null, priority||'medium', notes||null, req.user.id]
        );
        await recordAudit({
            user_id: req.user.id,
            action: 'Tạo phiếu bảo trì',
            entity_type: 'maintenance',
            entity_id: result.insertId,
            new_data: { code, device_id, maintenance_type, request_date, status: 'cho_xu_ly' },
            req
        });
        return res.status(201).json({ success: true, message: 'Tạo phiếu bảo trì thành công', id: result.insertId, code });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// PUT /api/maintenance/:id
const update = async (req, res) => {
    try {
        const { maintenance_type, request_date, start_date, actual_date, technician_id, approver_id, description, result, cost, status, priority, notes } = req.body;
        const [oldRows] = await pool.query('SELECT * FROM maintenance_schedules WHERE id = ?', [req.params.id]);
        if (!oldRows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu bảo trì' });
        const oldSchedule = oldRows[0];
        // If completing, update device status
        if (status === 'hoan_thanh') {
            const [ms] = await pool.query('SELECT device_id FROM maintenance_schedules WHERE id = ?', [req.params.id]);
            if (ms.length) {
                await pool.query("UPDATE devices SET status = 'active', updated_at = NOW() WHERE id = ? AND status = 'maintenance'", [ms[0].device_id]);
                await pool.query(
                    'INSERT INTO maintenance_logs (schedule_id, device_id, action, description, performed_by, cost, after_status) VALUES (?,?,?,?,?,?,?)',
                    [req.params.id, ms[0].device_id, 'Hoàn thành bảo trì', description||result||'', req.user.id, cost||0, 'active']
                );
            }
        }
        await pool.query(
            `UPDATE maintenance_schedules SET maintenance_type=?, request_date=?, start_date=?, actual_date=?,
             technician_id=?, approver_id=?, description=?, result=?, cost=?, status=?, priority=?, notes=?, updated_at=NOW() WHERE id=?`,
            [maintenance_type, request_date, start_date||null, actual_date||null, technician_id||null, approver_id||null, description||null, result||null, cost||0, status, priority||'medium', notes||null, req.params.id]
        );
        await recordAudit({
            user_id: req.user.id,
            action: 'Cập nhật phiếu bảo trì',
            entity_type: 'maintenance',
            entity_id: req.params.id,
            old_data: oldSchedule,
            new_data: { maintenance_type, request_date, start_date, actual_date, technician_id, approver_id, description, result, cost, status, priority, notes },
            req
        });
        return res.json({ success: true, message: 'Cập nhật phiếu bảo trì thành công' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// DELETE /api/maintenance/:id
const remove = async (req, res) => {
    try {
        const [oldRows] = await pool.query('SELECT * FROM maintenance_schedules WHERE id = ?', [req.params.id]);
        if (!oldRows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu bảo trì' });
        await pool.query("UPDATE maintenance_schedules SET status = 'huy', updated_at = NOW() WHERE id = ?", [req.params.id]);
        await recordAudit({
            user_id: req.user.id,
            action: 'Hủy phiếu bảo trì',
            entity_type: 'maintenance',
            entity_id: req.params.id,
            old_data: oldRows[0],
            new_data: { status: 'huy' },
            req
        });
        return res.json({ success: true, message: 'Đã hủy phiếu bảo trì' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/maintenance/:id/export-pdf
const exportPdf = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT ms.*, d.device_code, d.name AS device_name, d.status AS device_status,
                   dc.name AS category_name, dept.name AS department_name,
                   t.full_name AS technician_name, t.email AS technician_email,
                   c.full_name AS created_by_name, a.full_name AS approver_name
            FROM maintenance_schedules ms
            JOIN devices d ON ms.device_id = d.id
            LEFT JOIN device_categories dc ON d.category_id = dc.id
            LEFT JOIN departments dept ON d.department_id = dept.id
            LEFT JOIN users t ON ms.technician_id = t.id
            LEFT JOIN users c ON ms.created_by = c.id
            LEFT JOIN users a ON ms.approver_id = a.id
            WHERE ms.id = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy phiếu bảo trì' });
        const [deviceRows] = await pool.query('SELECT * FROM devices WHERE id = ?', [rows[0].device_id]);
        const pdfBuffer = await pdfService.generateMaintenanceReport(rows[0], deviceRows[0] || null);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', req.query.inline ? 'inline' : `attachment; filename="baotri_${req.params.id}.pdf"`);
        return res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

module.exports = { getAll, getOne, create, update, remove, exportPdf };
