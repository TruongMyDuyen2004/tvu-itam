const pool = require('../config/database');
const { recordAudit } = require('../middleware/auditLogger');
const pdfService = require('../services/pdfService');

// GET /api/transfers
const getAll = async (req, res) => {
    try {
        let query = `
            SELECT t.*, 
                   d.device_code, d.name AS device_name,
                   fd.name AS from_dept_name, td.name AS to_dept_name,
                   fu.full_name AS from_user_name, tu.full_name AS to_user_name,
                   au.full_name AS approved_by_name, cu.full_name AS created_by_name
            FROM asset_transfers t
            LEFT JOIN devices d ON t.device_id = d.id
            LEFT JOIN departments fd ON t.from_department_id = fd.id
            LEFT JOIN departments td ON t.to_department_id = td.id
            LEFT JOIN users fu ON t.from_user_id = fu.id
            LEFT JOIN users tu ON t.to_user_id = tu.id
            LEFT JOIN users au ON t.approved_by = au.id
            LEFT JOIN users cu ON t.created_by = cu.id
        `;
        const params = [];
        const conditions = [];
        
        if (req.query.device_id) {
            conditions.push('t.device_id = ?');
            params.push(req.query.device_id);
        }
        if (req.query.status) {
            conditions.push('t.status = ?');
            params.push(req.query.status);
        }
        
        if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY t.created_at DESC';
        
        const [rows] = await pool.query(query, params);
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/transfers/:id
const getOne = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.*, 
                   d.device_code, d.name AS device_name,
                   fd.name AS from_dept_name, td.name AS to_dept_name,
                   fu.full_name AS from_user_name, tu.full_name AS to_user_name,
                   au.full_name AS approved_by_name, cu.full_name AS created_by_name
            FROM asset_transfers t
            LEFT JOIN devices d ON t.device_id = d.id
            LEFT JOIN departments fd ON t.from_department_id = fd.id
            LEFT JOIN departments td ON t.to_department_id = td.id
            LEFT JOIN users fu ON t.from_user_id = fu.id
            LEFT JOIN users tu ON t.to_user_id = tu.id
            LEFT JOIN users au ON t.approved_by = au.id
            LEFT JOIN users cu ON t.created_by = cu.id
            WHERE t.id = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// POST /api/transfers
const create = async (req, res) => {
    try {
        const { device_id, from_department_id, to_department_id, from_user_id, to_user_id, transfer_date, reason, notes } = req.body;
        
        if (!device_id || !transfer_date) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }
        
        const [result] = await pool.query(
            `INSERT INTO asset_transfers (device_id, from_department_id, to_department_id, from_user_id, to_user_id, 
             transfer_date, reason, notes, status, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
            [device_id, from_department_id || null, to_department_id || null, from_user_id || null, 
             to_user_id || null, transfer_date, reason || null, notes || null, req.user.id]
        );
        await recordAudit({
            user_id: req.user.id,
            action: 'Tạo yêu cầu điều chuyển',
            entity_type: 'transfer',
            entity_id: result.insertId,
            new_data: { device_id, from_department_id, to_department_id, from_user_id, to_user_id, transfer_date, status: 'pending' },
            req
        });
        
        return res.status(201).json({ success: true, message: 'Tạo yêu cầu điều chuyển thành công', id: result.insertId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// PUT /api/transfers/:id/approve
const approve = async (req, res) => {
    try {
        const { status, rejection_reason } = req.body;
        
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
        }
        const [oldRows] = await pool.query('SELECT * FROM asset_transfers WHERE id = ?', [req.params.id]);
        if (!oldRows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu điều chuyển' });
        const oldTransfer = oldRows[0];
        
        await pool.query(
            'UPDATE asset_transfers SET status = ?, approved_by = ?, rejection_reason = ? WHERE id = ?',
            [status, req.user.id, status === 'rejected' ? rejection_reason : null, req.params.id]
        );
        
        // If approved, update device location
        if (status === 'approved') {
            const [transfer] = await pool.query('SELECT * FROM asset_transfers WHERE id = ?', [req.params.id]);
            if (transfer.length) {
                const t = transfer[0];
                await pool.query(
                    'UPDATE devices SET department_id = ?, assigned_user_id = ? WHERE id = ?',
                    [t.to_department_id, t.to_user_id, t.device_id]
                );
            }
        }
        await recordAudit({
            user_id: req.user.id,
            action: status === 'approved' ? 'Phê duyệt điều chuyển' : 'Từ chối điều chuyển',
            entity_type: 'transfer',
            entity_id: req.params.id,
            old_data: oldTransfer,
            new_data: { status, approved_by: req.user.id, rejection_reason },
            req
        });
        
        return res.json({ success: true, message: status === 'approved' ? 'Đã phê duyệt' : 'Đã từ chối' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// DELETE /api/transfers/:id
const remove = async (req, res) => {
    try {
        const [oldRows] = await pool.query('SELECT * FROM asset_transfers WHERE id = ?', [req.params.id]);
        if (!oldRows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu điều chuyển' });
        await pool.query('DELETE FROM asset_transfers WHERE id = ?', [req.params.id]);
        await recordAudit({
            user_id: req.user.id,
            action: 'Xóa yêu cầu điều chuyển',
            entity_type: 'transfer',
            entity_id: req.params.id,
            old_data: oldRows[0],
            req
        });
        return res.json({ success: true, message: 'Đã xóa' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/transfers/:id/export-pdf
const exportPdf = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.*, 
                   d.device_code, d.name AS device_name,
                   fd.name AS from_dept_name, td.name AS to_dept_name,
                   fu.full_name AS from_user_name, tu.full_name AS to_user_name,
                   au.full_name AS approved_by_name, cu.full_name AS created_by_name
            FROM asset_transfers t
            LEFT JOIN devices d ON t.device_id = d.id
            LEFT JOIN departments fd ON t.from_department_id = fd.id
            LEFT JOIN departments td ON t.to_department_id = td.id
            LEFT JOIN users fu ON t.from_user_id = fu.id
            LEFT JOIN users tu ON t.to_user_id = tu.id
            LEFT JOIN users au ON t.approved_by = au.id
            LEFT JOIN users cu ON t.created_by = cu.id
            WHERE t.id = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        const [devices] = await pool.query('SELECT * FROM devices');
        const pdfBuffer = await pdfService.generateTransferReport(rows[0], devices);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', req.query.inline ? 'inline' : `attachment; filename="transfer_${req.params.id}.pdf"`);
        return res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

module.exports = { getAll, getOne, create, approve, remove, exportPdf };
