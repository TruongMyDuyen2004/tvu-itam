const pool = require('../config/database');
const { recordAudit } = require('../middleware/auditLogger');
const pdfService = require('../services/pdfService');

const statusFlow = {
  de_nghi: 'Đề nghị',
  dang_kiem_tra: 'Đang kiểm tra',
  cho_phe_duyet: 'Chờ phê duyệt',
  da_duyet: 'Đã duyệt',
  da_thanh_ly: 'Đã thanh lý',
  tu_choi: 'Từ chối'
};

const DISPOSAL_SELECT = `
  SELECT dsp.*,
         d.device_code, d.name AS device_name, d.status AS device_status,
         d.brand, d.model, d.serial_number, d.purchase_price, d.purchase_date,
         d.department_id, dept.name AS department_name,
         au.full_name AS approved_by_name, cu.full_name AS created_by_name
  FROM disposals dsp
  LEFT JOIN devices d ON dsp.device_id = d.id
  LEFT JOIN departments dept ON d.department_id = dept.id
  LEFT JOIN users au ON dsp.approved_by = au.id
  LEFT JOIN users cu ON dsp.created_by = cu.id
`;

// GET /api/disposals
const getAll = async (req, res) => {
    try {
        let query = DISPOSAL_SELECT + ' WHERE 1=1';
        const params = [];
        if (req.query.status) { query += ' AND dsp.status = ?'; params.push(req.query.status); }
        if (req.query.method) { query += ' AND dsp.disposal_method = ?'; params.push(req.query.method); }
        if (req.query.device_id) { query += ' AND dsp.device_id = ?'; params.push(req.query.device_id); }
        query += ' ORDER BY dsp.created_at DESC';
        const [rows] = await pool.query(query, params);
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/disposals/:id
const getOne = async (req, res) => {
    try {
        const [rows] = await pool.query(DISPOSAL_SELECT + ' WHERE dsp.id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// POST /api/disposals - Bước 1: Lập đề nghị thanh lý
const create = async (req, res) => {
    try {
        const { device_id, proposal_date, disposal_date, reason, asset_condition, current_value, disposal_method, recovery_value, council, notes } = req.body;
        if (!device_id || !reason) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (thiết bị, lý do)' });
        }
        const [result] = await pool.query(
            `INSERT INTO disposals (disposal_code, device_id, proposal_date, disposal_date, reason, asset_condition, current_value, disposal_method, recovery_value, council, notes, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'de_nghi', ?)`,
            ['', device_id, proposal_date || new Date(), disposal_date || new Date(), reason, asset_condition || null, current_value || null, disposal_method || 'ban_thanh_ly', recovery_value || null, council || null, notes || null, req.user.id]
        );
        // Sinh mã TL + ID
        await pool.query('UPDATE disposals SET disposal_code = CONCAT("TL", LPAD(id, 3, "0")) WHERE id = ?', [result.insertId]);
        await recordAudit({ user_id: req.user.id, action: 'Lập đề nghị thanh lý', entity_type: 'disposal', entity_id: result.insertId, new_data: { device_id, reason, status: 'de_nghi' }, req });
        return res.status(201).json({ success: true, message: 'Tạo đề nghị thanh lý thành công', id: result.insertId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// PUT /api/disposals/:id - Bước 2-3: Kiểm tra / Chờ duyệt / Thanh lý
const update = async (req, res) => {
    try {
        const { status, inspection_date, decision_number, decision_date, disposal_date, asset_condition, current_value, recovery_value, disposal_method, council, handover_unit, notes, rejection_reason } = req.body;
        const [oldRows] = await pool.query('SELECT * FROM disposals WHERE id = ?', [req.params.id]);
        if (!oldRows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        const old = oldRows[0];

        const validStatus = ['de_nghi', 'dang_kiem_tra', 'cho_phe_duyet', 'da_duyet', 'da_thanh_ly', 'tu_choi'];
        const newStatus = status || old.status;
        if (!validStatus.includes(newStatus)) return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });

        const actionLabels = {
            dang_kiem_tra: 'Chuyển sang kiểm tra',
            cho_phe_duyet: 'Trình phê duyệt',
            da_duyet: 'Phê duyệt thanh lý',
            da_thanh_ly: 'Hoàn tất thanh lý',
            tu_choi: 'Từ chối thanh lý'
        };

        await pool.query(
            `UPDATE disposals SET status=?, inspection_date=?, decision_number=?, decision_date=?, disposal_date=?, asset_condition=?, current_value=?, recovery_value=?, disposal_method=?, council=?, handover_unit=?, notes=? WHERE id=?`,
            [newStatus, inspection_date || old.inspection_date, decision_number || old.decision_number, decision_date || old.decision_date, disposal_date || old.disposal_date, asset_condition || old.asset_condition, current_value || old.current_value, recovery_value || old.recovery_value, disposal_method || old.disposal_method, council || old.council, handover_unit || old.handover_unit, notes || old.notes, req.params.id]
        );

        // Nếu phê duyệt: sinh decision_number tự động
        if (newStatus === 'da_duyet' && !decision_number && !old.decision_number) {
            const dn = `QĐTL-${String(req.params.id).padStart(4, '0')}-${new Date().getFullYear()}`;
            await pool.query('UPDATE disposals SET decision_number=? WHERE id=?', [dn, req.params.id]);
        }

        // Nếu hoàn tất thanh lý: cập nhật device → disposed
        if (newStatus === 'da_thanh_ly') {
            await pool.query("UPDATE devices SET status='disposed', updated_at=NOW() WHERE id=?", [old.device_id]);
        }

        // Nếu từ chối: lưu rejection_reason vào notes
        if (newStatus === 'tu_choi' && rejection_reason) {
            await pool.query('UPDATE disposals SET notes=CONCAT(COALESCE(notes,""), "\n[Lý do từ chối]: ", ?) WHERE id=?', [rejection_reason, req.params.id]);
        }

        await recordAudit({ user_id: req.user.id, action: actionLabels[newStatus] || 'Cập nhật thanh lý', entity_type: 'disposal', entity_id: req.params.id, old_data: old, new_data: { status: newStatus }, req });
        return res.json({ success: true, message: statusFlow[newStatus] || 'Cập nhật thành công' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// DELETE /api/disposals/:id
const remove = async (req, res) => {
    try {
        const [oldRows] = await pool.query('SELECT * FROM disposals WHERE id = ?', [req.params.id]);
        if (!oldRows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        await pool.query('DELETE FROM disposals WHERE id = ?', [req.params.id]);
        await recordAudit({ user_id: req.user.id, action: 'Xóa phiếu thanh lý', entity_type: 'disposal', entity_id: req.params.id, old_data: oldRows[0], req });
        return res.json({ success: true, message: 'Đã xóa' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/disposals/:id/export-pdf
const exportPdf = async (req, res) => {
    try {
        const [rows] = await pool.query(DISPOSAL_SELECT + ' WHERE dsp.id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        const pdfBuffer = await pdfService.generateDisposalReport(rows[0]);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', req.query.inline ? 'inline' : `attachment; filename="BBTL-${rows[0].disposal_code}-${new Date().toISOString().slice(0,10)}.pdf"`);
        return res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi xuất PDF' });
    }
};

// PUT /api/disposals/:id/report - Lưu báo cáo kết quả thanh lý
const submitReport = async (req, res) => {
    try {
        const { report_number, report_date, report_notes } = req.body;
        const [oldRows] = await pool.query('SELECT * FROM disposals WHERE id = ?', [req.params.id]);
        if (!oldRows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        if (oldRows[0].status !== 'da_thanh_ly') return res.status(400).json({ success: false, message: 'Chỉ lập báo cáo khi đã hoàn tất thanh lý' });

        await pool.query(
            'UPDATE disposals SET report_number=?, report_date=?, report_notes=? WHERE id=?',
            [report_number || null, report_date || new Date(), report_notes || null, req.params.id]
        );
        await recordAudit({ user_id: req.user.id, action: 'Lập báo cáo kết quả thanh lý', entity_type: 'disposal', entity_id: req.params.id, old_data: oldRows[0], new_data: { report_number, report_date, report_notes }, req });
        return res.json({ success: true, message: 'Đã lưu báo cáo kết quả thanh lý' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/disposals/:id/export-result-pdf
const exportResultPdf = async (req, res) => {
    try {
        const [rows] = await pool.query(DISPOSAL_SELECT + ' WHERE dsp.id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        if (rows[0].status !== 'da_thanh_ly') return res.status(400).json({ success: false, message: 'Chỉ xuất báo cáo khi đã thanh lý' });
        const pdfBuffer = await pdfService.generateDisposalResultReport(rows[0]);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', req.query.inline ? 'inline' : `attachment; filename="BC-TL-${rows[0].disposal_code}-${new Date().toISOString().slice(0,10)}.pdf"`);
        return res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi xuất PDF' });
    }
};

module.exports = { getAll, getOne, create, update, remove, exportPdf, submitReport, exportResultPdf };
