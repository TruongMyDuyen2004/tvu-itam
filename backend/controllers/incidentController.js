const pool = require('../config/database');
const pdfService = require('../services/pdfService');

// GET /api/incidents
const getAll = async (req, res) => {
    try {
        let query = `
            SELECT ir.*, d.device_code, d.name AS device_name, dc.name AS category_name,
                   dept.name AS department_name, r.full_name AS reporter_name, a.full_name AS assignee_name
            FROM incident_reports ir
            JOIN devices d ON ir.device_id = d.id
            LEFT JOIN device_categories dc ON d.category_id = dc.id
            LEFT JOIN departments dept ON d.department_id = dept.id
            LEFT JOIN users r ON ir.reported_by = r.id
            LEFT JOIN users a ON ir.assigned_to = a.id
            WHERE 1=1
        `;
        const params = [];
        if (req.query.status) { query += ' AND ir.status = ?'; params.push(req.query.status); }
        if (req.query.severity) { query += ' AND ir.severity = ?'; params.push(req.query.severity); }
        if (req.user.role === 'user') { query += ' AND (ir.reported_by = ? OR d.department_id = ?)'; params.push(req.user.id, req.user.department_id); }
        query += ' ORDER BY ir.reported_at DESC';
        const [rows] = await pool.query(query, params);
        return res.json({ success: true, data: rows, total: rows.length });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// POST /api/incidents
const create = async (req, res) => {
    try {
        const { device_id, issue, description, severity } = req.body;
        if (!device_id || !issue) return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        const [result] = await pool.query(
            'INSERT INTO incident_reports (device_id, reported_by, issue, description, severity) VALUES (?,?,?,?,?)',
            [device_id, req.user.id, issue, description||null, severity||'medium']
        );
        // Update device status to broken if critical
        if (severity === 'critical' || severity === 'high') {
            await pool.query("UPDATE devices SET status = 'broken', updated_at = NOW() WHERE id = ?", [device_id]);
        }
        return res.status(201).json({ success: true, message: 'Báo cáo sự cố thành công', id: result.insertId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// PUT /api/incidents/:id
const update = async (req, res) => {
    try {
        const { status, assigned_to, resolution } = req.body;
        if (status === 'resolved') {
            await pool.query(
                'UPDATE incident_reports SET status=?, assigned_to=?, resolution=?, resolved_at=NOW(), updated_at=NOW() WHERE id=?',
                [status, assigned_to||null, resolution||null, req.params.id]
            );
            await pool.query("UPDATE devices SET status='active', updated_at=NOW() WHERE id=(SELECT device_id FROM incident_reports WHERE id=?)", [req.params.id]);
        } else {
            await pool.query(
                'UPDATE incident_reports SET status=?, assigned_to=?, resolution=?, updated_at=NOW() WHERE id=?',
                [status, assigned_to||null, resolution||null, req.params.id]
            );
        }
        return res.json({ success: true, message: 'Cập nhật sự cố thành công' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/incidents/:id
const getOne = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT ir.*, d.device_code, d.name AS device_name, d.status AS device_status,
                   dc.name AS category_name, dept.name AS department_name,
                   r.full_name AS reporter_name, a.full_name AS assignee_name
            FROM incident_reports ir
            JOIN devices d ON ir.device_id = d.id
            LEFT JOIN device_categories dc ON d.category_id = dc.id
            LEFT JOIN departments dept ON d.department_id = dept.id
            LEFT JOIN users r ON ir.reported_by = r.id
            LEFT JOIN users a ON ir.assigned_to = a.id
            WHERE ir.id = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy sự cố' });
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/incidents/:id/export-pdf
const exportPdf = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT ir.*, d.device_code, d.name AS device_name, d.status AS device_status,
                   d.brand, d.model, d.serial_number, d.purchase_price,
                   dc.name AS category_name, dept.name AS department_name,
                   r.full_name AS reporter_name, r.email AS reporter_email,
                   a.full_name AS assignee_name
            FROM incident_reports ir
            JOIN devices d ON ir.device_id = d.id
            LEFT JOIN device_categories dc ON d.category_id = dc.id
            LEFT JOIN departments dept ON d.department_id = dept.id
            LEFT JOIN users r ON ir.reported_by = r.id
            LEFT JOIN users a ON ir.assigned_to = a.id
            WHERE ir.id = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy sự cố' });
        const pdfBuffer = await pdfService.generateIncidentReport(rows[0]);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', req.query.inline ? 'inline' : `attachment; filename="suco_${req.params.id}.pdf"`);
        return res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const remove = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id FROM incident_reports WHERE id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy sự cố' });
        await pool.query('DELETE FROM incident_reports WHERE id = ?', [req.params.id]);
        return res.json({ success: true, message: 'Đã xóa sự cố' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

module.exports = { getAll, create, getOne, update, exportPdf, remove };
