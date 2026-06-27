const pool = require('../config/database');
const { recordAudit } = require('../middleware/auditLogger');
const pdfService = require('../services/pdfService');

const getWarehouses = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT w.*, u.full_name AS created_by_name
             FROM warehouses w
             LEFT JOIN users u ON w.created_by = u.id
             ORDER BY w.id DESC`
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const createWarehouse = async (req, res) => {
    try {
        const { name, address, manager_name, notes } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Tên kho không được để trống' });
        }
        const [result] = await pool.query(
            `INSERT INTO warehouses (warehouse_code, name, address, manager_name, notes, created_by)
             VALUES ('', ?, ?, ?, ?, ?)`,
            [name, address || null, manager_name || null, notes || null, req.user.id]
        );
        await pool.query('UPDATE warehouses SET warehouse_code = CONCAT("WH", LPAD(id, 3, "0")) WHERE id = ?', [result.insertId]);
        await recordAudit({ user_id: req.user.id, action: 'Tạo kho', entity_type: 'warehouse', entity_id: result.insertId, new_data: { name, address, manager_name }, req });
        return res.status(201).json({ success: true, message: 'Tạo kho thành công', id: result.insertId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const updateWarehouse = async (req, res) => {
    try {
        const [oldRows] = await pool.query('SELECT * FROM warehouses WHERE id = ?', [req.params.id]);
        if (!oldRows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        const { name, address, manager_name, notes } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Tên kho không được để trống' });
        }
        await pool.query(
            'UPDATE warehouses SET name=?, address=?, manager_name=?, notes=? WHERE id=?',
            [name, address || null, manager_name || null, notes || null, req.params.id]
        );
        await recordAudit({ user_id: req.user.id, action: 'Cập nhật kho', entity_type: 'warehouse', entity_id: req.params.id, old_data: oldRows[0], new_data: { name, address, manager_name }, req });
        return res.json({ success: true, message: 'Cập nhật kho thành công' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const deleteWarehouse = async (req, res) => {
    try {
        const [oldRows] = await pool.query('SELECT * FROM warehouses WHERE id = ?', [req.params.id]);
        if (!oldRows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        const [receipts] = await pool.query('SELECT COUNT(*) AS cnt FROM inventory_receipts WHERE warehouse_id = ?', [req.params.id]);
        const [issues] = await pool.query('SELECT COUNT(*) AS cnt FROM inventory_issues WHERE warehouse_id = ?', [req.params.id]);
        if (receipts[0].cnt > 0 || issues[0].cnt > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa kho đã có phiếu nhập/xuất' });
        }
        await pool.query('DELETE FROM warehouses WHERE id = ?', [req.params.id]);
        await recordAudit({ user_id: req.user.id, action: 'Xóa kho', entity_type: 'warehouse', entity_id: req.params.id, old_data: oldRows[0], req });
        return res.json({ success: true, message: 'Đã xóa kho' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const getReceipts = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT r.*, w.name AS warehouse_name, u.full_name AS created_by_name,
                    (SELECT COUNT(*) FROM inventory_receipt_details WHERE receipt_id = r.id) AS device_count
             FROM inventory_receipts r
             LEFT JOIN warehouses w ON r.warehouse_id = w.id
             LEFT JOIN users u ON r.created_by = u.id
             ORDER BY r.created_at DESC`
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const getReceipt = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT r.*, w.name AS warehouse_name, u.full_name AS created_by_name
             FROM inventory_receipts r
             LEFT JOIN warehouses w ON r.warehouse_id = w.id
             LEFT JOIN users u ON r.created_by = u.id
             WHERE r.id = ?`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        const [details] = await pool.query(
            `SELECT d.*, dev.device_code, dev.name AS device_name, dev.status AS device_status
             FROM inventory_receipt_details d
             LEFT JOIN devices dev ON d.device_id = dev.id
             WHERE d.receipt_id = ?
             ORDER BY d.id`,
            [req.params.id]
        );
        return res.json({ success: true, data: { ...rows[0], details } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const createReceipt = async (req, res) => {
    try {
        const { receipt_date, warehouse_id, supplier_name, notes, device_ids } = req.body;
        if (!receipt_date || !warehouse_id || !device_ids || !device_ids.length) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }
        for (const did of device_ids) {
            const [devRows] = await pool.query('SELECT status FROM devices WHERE id = ?', [did]);
            if (!devRows.length) {
                return res.status(400).json({ success: false, message: `Thiết bị ID ${did} không tồn tại` });
            }
            if (devRows[0].status === 'disposed') {
                return res.status(400).json({ success: false, message: `Thiết bị ID ${did} đã thanh lý, không thể nhập kho` });
            }
        }
        const total_items = device_ids.length;
        const [result] = await pool.query(
            `INSERT INTO inventory_receipts (receipt_code, receipt_date, warehouse_id, supplier_name, notes, total_items, created_by)
             VALUES ('', ?, ?, ?, ?, ?, ?)`,
            [receipt_date, warehouse_id, supplier_name || null, notes || null, total_items, req.user.id]
        );
        const receiptId = result.insertId;
        await pool.query('UPDATE inventory_receipts SET receipt_code = CONCAT("NK", LPAD(id, 3, "0")) WHERE id = ?', [receiptId]);

        const [whRows] = await pool.query('SELECT name FROM warehouses WHERE id = ?', [warehouse_id]);
        const warehouseName = whRows.length ? whRows[0].name : '';

        const insertDetail = async (deviceId) => {
            await pool.query(
                'INSERT INTO inventory_receipt_details (receipt_id, device_id) VALUES (?, ?)',
                [receiptId, deviceId]
            );
            await pool.query(
                "UPDATE devices SET status='in_stock', location=?, updated_at=NOW() WHERE id=?",
                [warehouseName, deviceId]
            );
        };
        for (const did of device_ids) {
            await insertDetail(did);
        }

        await recordAudit({ user_id: req.user.id, action: 'Tạo phiếu nhập kho', entity_type: 'receipt', entity_id: receiptId, new_data: { receipt_date, warehouse_id, device_ids }, req });
        return res.status(201).json({ success: true, message: 'Tạo phiếu nhập kho thành công', id: receiptId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const deleteReceipt = async (req, res) => {
    try {
        const [oldRows] = await pool.query('SELECT * FROM inventory_receipts WHERE id = ?', [req.params.id]);
        if (!oldRows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        const [details] = await pool.query('SELECT device_id FROM inventory_receipt_details WHERE receipt_id = ?', [req.params.id]);
        for (const d of details) {
            await pool.query("UPDATE devices SET status='active', updated_at=NOW() WHERE id=?", [d.device_id]);
        }
        await pool.query('DELETE FROM inventory_receipts WHERE id = ?', [req.params.id]);
        await recordAudit({ user_id: req.user.id, action: 'Xóa phiếu nhập kho', entity_type: 'receipt', entity_id: req.params.id, old_data: oldRows[0], req });
        return res.json({ success: true, message: 'Đã xóa phiếu nhập kho' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const getIssues = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT i.*, w.name AS warehouse_name, d.name AS department_name, u.full_name AS created_by_name,
                    (SELECT COUNT(*) FROM inventory_issue_details WHERE issue_id = i.id) AS device_count
             FROM inventory_issues i
             LEFT JOIN warehouses w ON i.warehouse_id = w.id
             LEFT JOIN departments d ON i.department_id = d.id
             LEFT JOIN users u ON i.created_by = u.id
             ORDER BY i.created_at DESC`
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const getIssue = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT i.*, w.name AS warehouse_name, d.name AS department_name, u.full_name AS created_by_name
             FROM inventory_issues i
             LEFT JOIN warehouses w ON i.warehouse_id = w.id
             LEFT JOIN departments d ON i.department_id = d.id
             LEFT JOIN users u ON i.created_by = u.id
             WHERE i.id = ?`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        const [details] = await pool.query(
            `SELECT d.*, dev.device_code, dev.name AS device_name, dev.status AS device_status
             FROM inventory_issue_details d
             LEFT JOIN devices dev ON d.device_id = dev.id
             WHERE d.issue_id = ?
             ORDER BY d.id`,
            [req.params.id]
        );
        return res.json({ success: true, data: { ...rows[0], details } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const createIssue = async (req, res) => {
    try {
        const { issue_date, warehouse_id, department_id, recipient_name, notes, device_ids } = req.body;
        if (!issue_date || !warehouse_id || !device_ids || !device_ids.length) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }

        for (const did of device_ids) {
            const [devRows] = await pool.query("SELECT status FROM devices WHERE id = ?", [did]);
            if (!devRows.length) {
                return res.status(400).json({ success: false, message: `Thiết bị ID ${did} không tồn tại` });
            }
            if (devRows[0].status !== 'in_stock') {
                return res.status(400).json({ success: false, message: `Thiết bị ID ${did} không trong kho (trạng thái: ${devRows[0].status})` });
            }
        }

        const [deptRows] = department_id ? await pool.query('SELECT name FROM departments WHERE id = ?', [department_id]) : [[{ name: '' }]];
        const deptName = deptRows.length ? deptRows[0].name : '';

        const [result] = await pool.query(
            `INSERT INTO inventory_issues (issue_code, issue_date, warehouse_id, department_id, recipient_name, notes, total_items, created_by)
             VALUES ('', ?, ?, ?, ?, ?, ?, ?)`,
            [issue_date, warehouse_id, department_id || null, recipient_name || null, notes || null, device_ids.length, req.user.id]
        );
        const issueId = result.insertId;
        await pool.query('UPDATE inventory_issues SET issue_code = CONCAT("XK", LPAD(id, 3, "0")) WHERE id = ?', [issueId]);

        for (const did of device_ids) {
            await pool.query(
                'INSERT INTO inventory_issue_details (issue_id, device_id) VALUES (?, ?)',
                [issueId, did]
            );
            await pool.query(
                "UPDATE devices SET status='active', location=?, updated_at=NOW() WHERE id=?",
                [`Đã cấp phát - ${deptName || recipient_name || ''}`, did]
            );
        }

        await recordAudit({ user_id: req.user.id, action: 'Tạo phiếu xuất kho', entity_type: 'issue', entity_id: issueId, new_data: { issue_date, warehouse_id, department_id, device_ids }, req });
        return res.status(201).json({ success: true, message: 'Tạo phiếu xuất kho thành công', id: issueId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const deleteIssue = async (req, res) => {
    try {
        const [oldRows] = await pool.query('SELECT * FROM inventory_issues WHERE id = ?', [req.params.id]);
        if (!oldRows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        const [details] = await pool.query('SELECT device_id FROM inventory_issue_details WHERE issue_id = ?', [req.params.id]);
        for (const d of details) {
            await pool.query("UPDATE devices SET status='in_stock', updated_at=NOW() WHERE id=?", [d.device_id]);
        }
        await pool.query('DELETE FROM inventory_issues WHERE id = ?', [req.params.id]);
        await recordAudit({ user_id: req.user.id, action: 'Xóa phiếu xuất kho', entity_type: 'issue', entity_id: req.params.id, old_data: oldRows[0], req });
        return res.json({ success: true, message: 'Đã xóa phiếu xuất kho' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const getStock = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT d.id AS device_id, d.device_code, d.name AS device_name, d.status, d.location, d.created_at AS device_created,
                    w.id AS warehouse_id, w.name AS warehouse_name
             FROM devices d
             LEFT JOIN warehouses w ON (d.location IS NOT NULL AND d.location = w.name)
             WHERE d.status = 'in_stock'
             ORDER BY w.name, d.device_code`
        );
        const grouped = {};
        for (const r of rows) {
            const key = r.warehouse_id || 0;
            if (!grouped[key]) {
                grouped[key] = { warehouse_id: r.warehouse_id, warehouse_name: r.warehouse_name || 'Không xác định', devices: [] };
            }
            grouped[key].devices.push(r);
        }
        return res.json({ success: true, data: Object.values(grouped) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const exportReceiptPdf = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT r.*, w.name AS warehouse_name, u.full_name AS created_by_name
             FROM inventory_receipts r
             LEFT JOIN warehouses w ON r.warehouse_id = w.id
             LEFT JOIN users u ON r.created_by = u.id
             WHERE r.id = ?`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        const [details] = await pool.query(
            `SELECT d.*, dev.device_code, dev.name AS device_name, dev.status AS device_status
             FROM inventory_receipt_details d
             LEFT JOIN devices dev ON d.device_id = dev.id
             WHERE d.receipt_id = ?
             ORDER BY d.id`,
            [req.params.id]
        );
        const receipt = { ...rows[0], details };
        const pdfBuffer = await pdfService.generateReceiptReport(receipt);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', req.query.inline ? 'inline' : `attachment; filename="nhapkho_${req.params.id}.pdf"`);
        return res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi xuất PDF' });
    }
};

const exportStockPdf = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT d.id AS device_id, d.device_code, d.name AS device_name, d.status, d.location, d.created_at AS device_created,
                    w.id AS warehouse_id, w.name AS warehouse_name
             FROM devices d
             LEFT JOIN warehouses w ON (d.location IS NOT NULL AND d.location = w.name)
             WHERE d.status = 'in_stock'
             ORDER BY w.name, d.device_code`
        );
        const grouped = {};
        for (const r of rows) {
            const key = r.warehouse_id || 0;
            if (!grouped[key]) {
                grouped[key] = { warehouse_id: r.warehouse_id, warehouse_name: r.warehouse_name || 'Không xác định', devices: [] };
            }
            grouped[key].devices.push(r);
        }
        const pdfBuffer = await pdfService.generateStockReport(Object.values(grouped));
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', req.query.inline ? 'inline' : `attachment; filename="tonkho.pdf"`);
        return res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi xuất PDF' });
    }
};

const exportIssuePdf = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT i.*, w.name AS warehouse_name, d.name AS department_name, u.full_name AS created_by_name
             FROM inventory_issues i
             LEFT JOIN warehouses w ON i.warehouse_id = w.id
             LEFT JOIN departments d ON i.department_id = d.id
             LEFT JOIN users u ON i.created_by = u.id
             WHERE i.id = ?`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        const [details] = await pool.query(
            `SELECT d.*, dev.device_code, dev.name AS device_name, dev.status AS device_status
             FROM inventory_issue_details d
             LEFT JOIN devices dev ON d.device_id = dev.id
             WHERE d.issue_id = ?
             ORDER BY d.id`,
            [req.params.id]
        );
        const issue = { ...rows[0], details };
        const pdfBuffer = await pdfService.generateIssueReport(issue);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', req.query.inline ? 'inline' : `attachment; filename="xuatkho_${req.params.id}.pdf"`);
        return res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi xuất PDF' });
    }
};

module.exports = { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse, getReceipts, getReceipt, createReceipt, deleteReceipt, getIssues, getIssue, createIssue, deleteIssue, getStock, exportIssuePdf, exportReceiptPdf, exportStockPdf };
