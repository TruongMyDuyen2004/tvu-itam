const pool = require('../config/database');
const ExcelJS = require('exceljs');
const { recordAudit } = require('../middleware/auditLogger');
const { buildDeviceQrUrl } = require('../config/appUrl');
const pdfService = require('../services/pdfService');

// GET /api/devices
const getAll = async (req, res) => {
    try {
        let query = `SELECT * FROM v_device_details WHERE 1=1`;
        const params = [];
        if (req.query.status) { query += ' AND status = ?'; params.push(req.query.status); }
        if (req.query.category_id) { query += ' AND category_id = ?'; params.push(req.query.category_id); }  // need to adjust view
        if (req.query.department_id) { query += ' AND department_id = ?'; params.push(req.query.department_id); }
        if (req.query.search) {
            query += ' AND (name LIKE ? OR device_code LIKE ? OR brand LIKE ? OR model LIKE ? OR serial_number LIKE ?)';
            const s = `%${req.query.search}%`;
            params.push(s, s, s, s, s);
        }
        if (req.user.role === 'user') {
            query += ' AND (department_id = ? OR assigned_user_id = ?)'; // need actual column
            params.push(req.user.department_id, req.user.id);
        }
        query += ' ORDER BY id DESC';
        // Use direct query for flexibility
        const fullQuery = `
            SELECT d.id, d.device_code, d.name, d.brand, d.model, d.serial_number,
                   d.status, d.location, d.purchase_date, d.purchase_price, d.warranty_expiry,
                   d.specs, d.image_url, d.notes, d.created_at, d.updated_at,
                   d.category_id, d.department_id, d.assigned_user_id, d.depreciation_rate,
                    dc.name AS category_name, dc.icon AS category_icon, dc.useful_life_years,
                   dept.name AS department_name, dept.code AS department_code,
                   u.full_name AS assigned_user_name
            FROM devices d
            LEFT JOIN device_categories dc ON d.category_id = dc.id
            LEFT JOIN departments dept ON d.department_id = dept.id
            LEFT JOIN users u ON d.assigned_user_id = u.id
            WHERE 1=1
        `;
        const fullParams = [];
        let extra = '';
        if (req.query.status) { extra += ' AND d.status = ?'; fullParams.push(req.query.status); }
        if (req.query.category_id) { extra += ' AND d.category_id = ?'; fullParams.push(req.query.category_id); }
        if (req.query.department_id) { extra += ' AND d.department_id = ?'; fullParams.push(req.query.department_id); }
        if (req.query.search) {
            extra += ' AND (d.name LIKE ? OR d.device_code LIKE ? OR d.brand LIKE ? OR d.model LIKE ? OR d.serial_number LIKE ?)';
            const s = `%${req.query.search}%`;
            fullParams.push(s, s, s, s, s);
        }
        if (req.query.model) {
            extra += ' AND d.model LIKE ?';
            fullParams.push(`%${req.query.model}%`);
        }
        if (req.query.serial_number) {
            extra += ' AND d.serial_number LIKE ?';
            fullParams.push(`%${req.query.serial_number}%`);
        }
        if (req.query.purchase_price_min) {
            extra += ' AND d.purchase_price >= ?';
            fullParams.push(Number(req.query.purchase_price_min));
        }
        if (req.query.purchase_price_max) {
            extra += ' AND d.purchase_price <= ?';
            fullParams.push(Number(req.query.purchase_price_max));
        }
        if (req.query.purchase_date_from) {
            extra += ' AND d.purchase_date >= ?';
            fullParams.push(req.query.purchase_date_from);
        }
        if (req.query.purchase_date_to) {
            extra += ' AND d.purchase_date <= ?';
            fullParams.push(req.query.purchase_date_to);
        }
        if (req.user.role === 'user') {
            extra += ' AND (d.department_id = ? OR d.assigned_user_id = ?)';
            fullParams.push(req.user.department_id, req.user.id);
        }
        const [rows] = await pool.query(fullQuery + extra + ' ORDER BY d.id DESC', fullParams);
        return res.json({ success: true, data: rows, total: rows.length });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/devices/export
const exportExcel = async (req, res) => {
    try {
        const fullQuery = `
            SELECT d.id, d.device_code, d.name, d.brand, d.model, d.serial_number,
                   d.status, d.location, d.purchase_date, d.purchase_price, d.warranty_expiry,
                   d.category_id, d.department_id, d.assigned_user_id,
                    dc.name AS category_name, dc.useful_life_years,
                    dept.name AS department_name
             FROM devices d
             LEFT JOIN device_categories dc ON d.category_id = dc.id
             LEFT JOIN departments dept ON d.department_id = dept.id
             WHERE 1=1
        `;
        const params = [];
        let extra = '';
        if (req.query.status) { extra += ' AND d.status = ?'; params.push(req.query.status); }
        if (req.query.category_id) { extra += ' AND d.category_id = ?'; params.push(req.query.category_id); }
        if (req.query.department_id) { extra += ' AND d.department_id = ?'; params.push(req.query.department_id); }
        if (req.query.search) {
            extra += ' AND (d.name LIKE ? OR d.device_code LIKE ? OR d.brand LIKE ? OR d.model LIKE ? OR d.serial_number LIKE ?)';
            const s = `%${req.query.search}%`;
            params.push(s, s, s, s, s);
        }
        if (req.query.model) {
            extra += ' AND d.model LIKE ?';
            params.push(`%${req.query.model}%`);
        }
        if (req.query.serial_number) {
            extra += ' AND d.serial_number LIKE ?';
            params.push(`%${req.query.serial_number}%`);
        }
        if (req.query.purchase_price_min) {
            extra += ' AND d.purchase_price >= ?';
            params.push(Number(req.query.purchase_price_min));
        }
        if (req.query.purchase_price_max) {
            extra += ' AND d.purchase_price <= ?';
            params.push(Number(req.query.purchase_price_max));
        }
        if (req.query.purchase_date_from) {
            extra += ' AND d.purchase_date >= ?';
            params.push(req.query.purchase_date_from);
        }
        if (req.query.purchase_date_to) {
            extra += ' AND d.purchase_date <= ?';
            params.push(req.query.purchase_date_to);
        }
        const [rows] = await pool.query(fullQuery + extra + ' ORDER BY d.id DESC', params);

        const statusLabel = { active:'Đang dùng', maintenance:'Bảo trì', broken:'Hỏng', disposed:'Thanh lý', inactive:'Không dùng' };
        const fmtCurrency = v => v ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '';
        const fmtDate = v => v ? new Date(v).toISOString().slice(0, 10) : '';

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Danh sách thiết bị');

        const borderStyle = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
        };
        const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a73e8' } };
        const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };

        sheet.columns = [
            { header: 'STT', key: 'stt', width: 6 },
            { header: 'Mã tài sản', key: 'device_code', width: 18 },
            { header: 'Tên tài sản', key: 'name', width: 32 },
            { header: 'Loại tài sản', key: 'category_name', width: 18 },
            { header: 'Phòng ban', key: 'department_name', width: 20 },
            { header: 'Trạng thái', key: 'status', width: 14 },
            { header: 'Hãng SX', key: 'brand', width: 16 },
            { header: 'Model', key: 'model', width: 16 },
            { header: 'Serial', key: 'serial_number', width: 18 },
            { header: 'Vị trí', key: 'location', width: 20 },
            { header: 'Ngày mua', key: 'purchase_date', width: 14 },
            { header: 'Giá trị', key: 'purchase_price', width: 18 },
            { header: 'Hạn bảo hành', key: 'warranty_expiry', width: 14 }
        ];

        const headerRow = sheet.getRow(1);
        headerRow.eachCell(cell => {
            cell.font = headerFont;
            cell.fill = headerFill;
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = borderStyle;
        });
        headerRow.height = 22;

        rows.forEach((device, idx) => {
            const row = sheet.addRow({
                stt: idx + 1,
                device_code: device.device_code,
                name: device.name,
                category_name: device.category_name || '',
                department_name: device.department_name || '',
                status: statusLabel[device.status] || device.status,
                brand: device.brand || '',
                model: device.model || '',
                serial_number: device.serial_number || '',
                location: device.location || '',
                purchase_date: fmtDate(device.purchase_date),
                purchase_price: device.purchase_price ? fmtCurrency(device.purchase_price) : '',
                warranty_expiry: fmtDate(device.warranty_expiry)
            });
            row.eachCell(cell => { cell.border = borderStyle; });
            row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
            row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
            row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
            row.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' };
            row.getCell(13).alignment = { horizontal: 'center', vertical: 'middle' };
            row.getCell(12).alignment = { horizontal: 'right', vertical: 'middle' };
            if (idx % 2 === 1) {
                row.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4FF' } };
                });
            }
        });

        sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: rows.length + 1, column: 13 } };
        sheet.views = [{ state: 'frozen', ySplit: 1 }];

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="devices_export_${new Date().toISOString().slice(0,10)}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi khi xuất Excel' });
    }
};

// GET /api/devices/:id
const getOne = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT d.*, dc.name AS category_name, dc.icon AS category_icon,
                   dept.name AS department_name, u.full_name AS assigned_user_name
            FROM devices d
            LEFT JOIN device_categories dc ON d.category_id = dc.id
            LEFT JOIN departments dept ON d.department_id = dept.id
            LEFT JOIN users u ON d.assigned_user_id = u.id
            WHERE d.id = ?`, [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });

        // Get maintenance history
        const [maintenance] = await pool.query(`
            SELECT ms.*, u.full_name AS technician_name
            FROM maintenance_schedules ms
            LEFT JOIN users u ON ms.technician_id = u.id
            WHERE ms.device_id = ? ORDER BY ms.request_date DESC LIMIT 10`, [req.params.id]);

        // Get transfer history
        const [transfers] = await pool.query(`
            SELECT at.*, fd.name AS from_dept, td.name AS to_dept, fu.full_name AS from_user, tu.full_name AS to_user, ab.full_name AS approved_by_name
            FROM asset_transfers at
            LEFT JOIN departments fd ON at.from_department_id = fd.id
            LEFT JOIN departments td ON at.to_department_id = td.id
            LEFT JOIN users fu ON at.from_user_id = fu.id
            LEFT JOIN users tu ON at.to_user_id = tu.id
            LEFT JOIN users ab ON at.approved_by = ab.id
            WHERE at.device_id = ? ORDER BY at.created_at DESC LIMIT 10`, [req.params.id]);

        return res.json({ success: true, data: { ...rows[0], maintenance_history: maintenance, transfer_history: transfers } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// POST /api/devices
const create = async (req, res) => {
    try {
        const { device_code, name, category_id, brand, model, serial_number, specs,
                purchase_date, purchase_price, warranty_expiry, status, department_id,
                assigned_user_id, location, notes, image_url, depreciation_rate } = req.body;
        
        if (!device_code || !name || !category_id) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }
        
        const [exist] = await pool.query('SELECT id FROM devices WHERE device_code = ?', [device_code]);
        if (exist.length) return res.status(400).json({ success: false, message: 'Mã thiết bị đã tồn tại' });
        
        const specsJson = typeof specs === 'object' ? JSON.stringify(specs) : (specs || null);
        const [result] = await pool.query(
            `INSERT INTO devices (device_code, name, category_id, brand, model, serial_number, specs,
             purchase_date, purchase_price, warranty_expiry, status, department_id, assigned_user_id,
             location, notes, image_url, depreciation_rate, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [device_code, name, category_id, brand||null, model||null, serial_number||null, specsJson,
             purchase_date||null, purchase_price||null, warranty_expiry||null,
             status||'active', department_id||null, assigned_user_id||null, location||null, notes||null, image_url||null, depreciation_rate||null, req.user.id]
        );
        
        await recordAudit({
            user_id: req.user.id,
            action: 'Thêm thiết bị',
            entity_type: 'device',
            entity_id: result.insertId,
            new_data: { device_code, name, category_id, brand, model, serial_number, status, department_id, assigned_user_id, location },
            req
        });
        
        return res.status(201).json({ success: true, message: 'Thêm thiết bị thành công', id: result.insertId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// PUT /api/devices/:id
const update = async (req, res) => {
    try {
        const [oldRows] = await pool.query('SELECT * FROM devices WHERE id = ?', [req.params.id]);
        if (!oldRows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
        
        const oldDevice = oldRows[0];
        const updateData = { ...oldDevice, ...req.body };
        const specsJson = typeof updateData.specs === 'object' ? JSON.stringify(updateData.specs) : (updateData.specs || null);
        
        await pool.query(
            `UPDATE devices SET name=?, category_id=?, brand=?, model=?, serial_number=?, specs=?,
             purchase_date=?, purchase_price=?, warranty_expiry=?, status=?, department_id=?,
             assigned_user_id=?, location=?, notes=?, image_url=?, depreciation_rate=?, updated_at=NOW() WHERE id=?`,
            [updateData.name, updateData.category_id, updateData.brand||null, updateData.model||null, updateData.serial_number||null, specsJson,
             updateData.purchase_date||null, updateData.purchase_price||null, updateData.warranty_expiry||null, updateData.status,
             updateData.department_id||null, updateData.assigned_user_id||null, updateData.location||null, updateData.notes||null, updateData.image_url||null, updateData.depreciation_rate??null, req.params.id]
        );
        
        await recordAudit({
            user_id: req.user.id,
            action: 'Cập nhật thiết bị',
            entity_type: 'device',
            entity_id: req.params.id,
            old_data: oldDevice,
            new_data: { name: updateData.name, category_id: updateData.category_id, brand: updateData.brand, model: updateData.model, serial_number: updateData.serial_number, status: updateData.status, department_id: updateData.department_id, assigned_user_id: updateData.assigned_user_id, location: updateData.location },
            req
        });
        
        return res.json({ success: true, message: 'Cập nhật thiết bị thành công' });
    } catch (err) {
        console.error(err);
        try { require('fs').appendFileSync('error.log', new Date().toISOString() + ' UPDATE ERROR: ' + err.stack + '\n'); } catch(e){}
        return res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};

// DELETE /api/devices/:id
const remove = async (req, res) => {
    try {
        const [oldRows] = await pool.query('SELECT * FROM devices WHERE id = ?', [req.params.id]);
        if (!oldRows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
        
        await pool.query("UPDATE devices SET status = 'disposed', updated_at = NOW() WHERE id = ?", [req.params.id]);
        
        await recordAudit({
            user_id: req.user.id,
            action: 'Thanh lý thiết bị',
            entity_type: 'device',
            entity_id: req.params.id,
            old_data: oldRows[0],
            new_data: { status: 'disposed' },
            req
        });
        
        return res.json({ success: true, message: 'Đã thanh lý thiết bị' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/devices/stats/summary
const getStats = async (req, res) => {
    try {
        const [stats] = await pool.query('SELECT * FROM v_dashboard_stats');
        const [byCategory] = await pool.query(`
            SELECT dc.name, dc.icon, COUNT(d.id) AS total,
                   SUM(CASE WHEN d.status='active' THEN 1 ELSE 0 END) AS active,
                   SUM(CASE WHEN d.status='maintenance' THEN 1 ELSE 0 END) AS maintenance,
                   SUM(CASE WHEN d.status='broken' THEN 1 ELSE 0 END) AS broken
            FROM device_categories dc
            LEFT JOIN devices d ON d.category_id = dc.id AND d.status != 'disposed'
            GROUP BY dc.id, dc.name, dc.icon ORDER BY total DESC`);
        const [byDept] = await pool.query(`
            SELECT dept.name, dept.code, COUNT(d.id) AS total,
                   COALESCE(SUM(d.purchase_price),0) AS total_value
            FROM departments dept
            LEFT JOIN devices d ON d.department_id = dept.id AND d.status != 'disposed'
            GROUP BY dept.id, dept.name, dept.code ORDER BY total DESC`);
        const [upcoming] = await pool.query(`
            SELECT ms.*, d.device_code, d.name AS device_name, u.full_name AS technician_name
            FROM maintenance_schedules ms
            JOIN devices d ON ms.device_id = d.id
            LEFT JOIN users u ON ms.technician_id = u.id
            WHERE ms.status IN ('cho_xu_ly','da_duyet') AND ms.request_date >= CURDATE()
            ORDER BY ms.request_date ASC LIMIT 5`);
        const [expiring] = await pool.query(`
            SELECT id, device_code, name, warranty_expiry, status, department_id
            FROM devices WHERE warranty_expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)
            AND status != 'disposed' ORDER BY warranty_expiry ASC LIMIT 5`);

        // Calculate "new" badge counts since user's last viewed
        const [userViews] = await pool.query(
            'SELECT section, viewed_at FROM user_section_views WHERE user_id = ?',
            [req.user.id]
        );
        const viewMap = {};
        userViews.forEach(v => { viewMap[v.section] = v.viewed_at; });

        let newPendingMaintenance = stats[0].pending_maintenance;
        let newOpenIncidents = stats[0].open_incidents;

        if (viewMap['maintenance']) {
            const [rows] = await pool.query(
                'SELECT COUNT(*) AS count FROM maintenance_schedules WHERE status IN (\'cho_xu_ly\', \'dang_thuc_hien\') AND created_at > ?',
                [viewMap['maintenance']]
            );
            newPendingMaintenance = rows[0].count;
        }
        if (viewMap['incidents']) {
            const [rows] = await pool.query(
                'SELECT COUNT(*) AS count FROM incident_reports WHERE status = "open" AND reported_at > ?',
                [viewMap['incidents']]
            );
            newOpenIncidents = rows[0].count;
        }

        return res.json({
            success: true,
            data: { stats: { ...stats[0], new_pending_maintenance: newPendingMaintenance, new_open_incidents: newOpenIncidents }, by_category: byCategory, by_department: byDept, upcoming_maintenance: upcoming, expiring_warranty: expiring }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/devices/:id/qrcode
const getQRCode = async (req, res) => {
    try {
        const QRCode = require('qrcode');
        const [rows] = await pool.query('SELECT id, device_code, name FROM devices WHERE id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
        
        const device = rows[0];
        const url = buildDeviceQrUrl(device.device_code, req);
        const qrDataURL = await QRCode.toDataURL(url, {
            width: 300,
            margin: 2,
            errorCorrectionLevel: 'M'
        });
        
        return res.json({ success: true, data: { qrcode: qrDataURL, url, device } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi tạo QR code' });
    }
};

// GET /api/devices/:id/qrcode.png — serve QR as downloadable PNG
const downloadQR = async (req, res) => {
    try {
        const QRCode = require('qrcode');
        const [rows] = await pool.query('SELECT id, device_code FROM devices WHERE id = ?', [req.params.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });

        const url = buildDeviceQrUrl(rows[0].device_code, req);
        const buffer = await QRCode.toBuffer(url, {
            width: 400,
            margin: 2,
            errorCorrectionLevel: 'M',
            type: 'png'
        });

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="QR_${rows[0].device_code}.png"`);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(buffer);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi tạo QR code' });
    }
};

// POST /api/devices/import
const importExcel = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng tải lên file Excel' });

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const sheet = workbook.worksheets[0];
        if (!sheet) return res.status(400).json({ success: false, message: 'File Excel không có dữ liệu' });

        // Map column headers to fields (row 1 = header)
        const headerRow = sheet.getRow(1);
        const colMap = {};
        const headerMap = {
            'mã tài sản': 'device_code', 'mã thiết bị': 'device_code', 'device_code': 'device_code',
            'tên tài sản': 'name', 'tên thiết bị': 'name', 'name': 'name',
            'loại tài sản': 'category_name', 'loại': 'category_name', 'danh mục': 'category_name',
            'hãng': 'brand', 'hãng sản xuất': 'brand', 'brand': 'brand',
            'model': 'model',
            'serial': 'serial_number', 'số serial': 'serial_number', 'serial_number': 'serial_number',
            'giá trị': 'purchase_price', 'giá mua': 'purchase_price', 'purchase_price': 'purchase_price',
            'ngày mua': 'purchase_date', 'purchase_date': 'purchase_date',
            'hạn bảo hành': 'warranty_expiry', 'warranty_expiry': 'warranty_expiry',
            'vị trí': 'location', 'location': 'location',
            'trạng thái': 'status', 'status': 'status',
            'phòng ban': 'department_name', 'department_name': 'department_name',
            'mô tả': 'notes', 'ghi chú': 'notes', 'notes': 'notes',
            'cấu hình': 'specs', 'specs': 'specs',
        };

        headerRow.eachCell((cell, colNum) => {
            const header = String(cell.value || '').trim().toLowerCase();
            if (headerMap[header]) colMap[colNum] = headerMap[header];
        });

        const mappedVals = Object.values(colMap);
        if (!mappedVals.includes('device_code') || !mappedVals.includes('name')) {
            return res.status(400).json({ success: false, message: 'File Excel phải có cột "Mã tài sản" và "Tên tài sản"' });
        }

        // Load categories & departments for mapping
        const [categories] = await pool.query('SELECT id, name FROM device_categories');
        const [departments] = await pool.query('SELECT id, name FROM departments');
        const catMap = {};
        categories.forEach(c => { catMap[c.name.toLowerCase()] = c.id; });
        const deptMap = {};
        departments.forEach(d => { deptMap[d.name.toLowerCase()] = d.id; });

        const inserted = [];
        const errors = [];
        let rowNum = 2;

        sheet.eachRow((row, rowIndex) => {
            if (rowIndex === 1) return;
            rowNum = rowIndex;
            try {
                const rowData = {};
                Object.entries(colMap).forEach(([colNum, field]) => {
                    rowData[field] = row.getCell(parseInt(colNum)).value || null;
                });

                // Normalize string fields
                const device_code = String(rowData.device_code || '').trim();
                const name = String(rowData.name || '').trim();

                if (!device_code) { errors.push(`Dòng ${rowIndex}: Thiếu mã tài sản`); return; }
                if (!name) { errors.push(`Dòng ${rowIndex} (${device_code}): Thiếu tên tài sản`); return; }

                // Resolve category_id from name
                let category_id = null;
                if (rowData.category_name) {
                    const key = String(rowData.category_name).trim().toLowerCase();
                    category_id = catMap[key] || null;
                }

                // Resolve department_id from name
                let department_id = null;
                if (rowData.department_name) {
                    const key = String(rowData.department_name).trim().toLowerCase();
                    department_id = deptMap[key] || null;
                }

                const parseDate = (v) => {
                    if (!v) return null;
                    const d = new Date(v);
                    if (!isNaN(d)) return d.toISOString().slice(0, 10);
                    // Try Vietnamese format DD/MM/YYYY
                    const m = String(v).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                    if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
                    return null;
                };
                const purchase_price = rowData.purchase_price ? parseFloat(String(rowData.purchase_price).replace(/[^\d.-]/g, '')) : null;
                const purchase_date = parseDate(rowData.purchase_date);
                const warranty_expiry = parseDate(rowData.warranty_expiry);
                const status = rowData.status || 'active';
                const specs = rowData.specs ? rowData.specs : null;

                inserted.push([
                    device_code, name, category_id,
                    rowData.brand, rowData.model, rowData.serial_number,
                    specs, purchase_date, purchase_price, warranty_expiry,
                    status, department_id, null, rowData.location || null,
                    rowData.notes || null, null, req.user.id
                ]);
            } catch (err) {
                errors.push(`Dòng ${rowIndex}: Lỗi xử lý - ${err.message}`);
            }
        });

        if (inserted.length === 0) {
            return res.status(400).json({ success: false, message: 'Không có dữ liệu hợp lệ để import', errors });
        }

        // Insert in batch
        const sql = `INSERT INTO devices (device_code, name, category_id, brand, model, serial_number, specs,
                     purchase_date, purchase_price, warranty_expiry, status, department_id, assigned_user_id,
                     location, notes, image_url, created_by) VALUES ?`;

        // Check existing codes
        const codes = inserted.map(r => r[0]);
        const [existing] = await pool.query('SELECT device_code FROM devices WHERE device_code IN (?)', [codes]);
        const existingCodes = new Set(existing.map(e => e.device_code));
        const validRows = inserted.filter(r => !existingCodes.has(r[0]));
        const skipped = inserted.filter(r => existingCodes.has(r[0]));

        if (validRows.length === 0) {
            return res.status(400).json({ success: false, message: 'Tất cả mã tài sản đã tồn tại trong hệ thống', errors, skipped: skipped.map(r => r[0]) });
        }

        const [result] = await pool.query(sql, [validRows]);

        await recordAudit({
            user_id: req.user.id,
            action: 'Import danh sách thiết bị',
            entity_type: 'device',
            new_data: { total: validRows.length, skipped: skipped.length, errors: errors.length },
            req
        });

        return res.json({
            success: true,
            message: `Import thành công ${validRows.length} thiết bị`,
            data: {
                imported: validRows.length,
                skipped: skipped.map(r => r[0]),
                errors
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi khi import file Excel' });
    }
};

// POST /api/devices/:id/recall
const recall = async (req, res) => {
    try {
        const [oldRows] = await pool.query('SELECT * FROM devices WHERE id = ?', [req.params.id]);
        if (!oldRows.length) return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });

        const device = oldRows[0];
        if (device.status === 'disposed') {
            return res.status(400).json({ success: false, message: 'Thiết bị đã thanh lý, không thể thu hồi' });
        }

        await pool.query(
            'UPDATE devices SET assigned_user_id = NULL, department_id = NULL, status = ?, location = ?, updated_at = NOW() WHERE id = ?',
            ['inactive', req.body.location || 'Kho lưu trữ', req.params.id]
        );

        // Record recall in audit log
        await recordAudit({
            user_id: req.user.id,
            action: 'Thu hồi thiết bị',
            entity_type: 'device',
            entity_id: req.params.id,
            old_data: { assigned_user_id: device.assigned_user_id, department_id: device.department_id, status: device.status, location: device.location },
            new_data: { assigned_user_id: null, department_id: null, status: 'inactive', location: req.body.location || 'Kho lưu trữ' },
            req
        });

        return res.json({ success: true, message: 'Thu hồi thiết bị thành công' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/devices/:id/history
const getHistory = async (req, res) => {
    try {
        const [device] = await pool.query('SELECT id, device_code, name FROM devices WHERE id = ?', [req.params.id]);
        if (!device.length) return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });

        const deviceId = req.params.id;

        // Audit logs for this device
        const [auditLogs] = await pool.query(`
            SELECT l.*, u.full_name AS user_name
            FROM audit_logs l
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.entity_type = 'device' AND l.entity_id = ?
            ORDER BY l.created_at DESC`, [deviceId]);

        // Transfers
        const [transfers] = await pool.query(`
            SELECT t.*, fd.name AS from_dept, td.name AS to_dept,
                   fu.full_name AS from_user, tu.full_name AS to_user,
                   ab.full_name AS approved_by_name, cu.full_name AS created_by_name
            FROM asset_transfers t
            LEFT JOIN departments fd ON t.from_department_id = fd.id
            LEFT JOIN departments td ON t.to_department_id = td.id
            LEFT JOIN users fu ON t.from_user_id = fu.id
            LEFT JOIN users tu ON t.to_user_id = tu.id
            LEFT JOIN users ab ON t.approved_by = ab.id
            LEFT JOIN users cu ON t.created_by = cu.id
            WHERE t.device_id = ?
            ORDER BY t.created_at DESC`, [deviceId]);

        // Maintenance schedules
        const [maintenance] = await pool.query(`
            SELECT ms.*, u.full_name AS technician_name
            FROM maintenance_schedules ms
            LEFT JOIN users u ON ms.technician_id = u.id
            WHERE ms.device_id = ?
            ORDER BY ms.request_date DESC`, [deviceId]);

        // Maintenance logs
        const [maintenanceLogs] = await pool.query(`
            SELECT ml.*, u.full_name AS performed_by_name
            FROM maintenance_logs ml
            LEFT JOIN users u ON ml.performed_by = u.id
            WHERE ml.device_id = ?
            ORDER BY ml.performed_at DESC`, [deviceId]);

        // Incidents
        const [incidents] = await pool.query(`
            SELECT ir.*, r.full_name AS reporter_name, a.full_name AS assignee_name
            FROM incident_reports ir
            LEFT JOIN users r ON ir.reported_by = r.id
            LEFT JOIN users a ON ir.assigned_to = a.id
            WHERE ir.device_id = ?
            ORDER BY ir.reported_at DESC`, [deviceId]);

        return res.json({
            success: true,
            data: {
                device: device[0],
                audit_logs: auditLogs,
                transfers,
                maintenance,
                maintenance_logs: maintenanceLogs,
                incidents
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/devices/export-pdf
const exportPdf = async (req, res) => {
    try {
        const fullQuery = `
            SELECT d.id, d.device_code, d.name, d.brand, d.model, d.serial_number,
                   d.status, d.location, d.purchase_date, d.purchase_price, d.warranty_expiry,
                   d.category_id, d.department_id, d.assigned_user_id,
                   dc.name AS category_name,
                   dept.name AS department_name
            FROM devices d
            LEFT JOIN device_categories dc ON d.category_id = dc.id
            LEFT JOIN departments dept ON d.department_id = dept.id
            WHERE 1=1
        `;
        const params = [];
        let extra = '';
        if (req.query.search) { extra += ' AND (d.name LIKE ? OR d.device_code LIKE ? OR d.brand LIKE ? OR d.model LIKE ? OR d.serial_number LIKE ?)'; const s = `%${req.query.search}%`; params.push(s, s, s, s, s); }
        if (req.query.status) { extra += ' AND d.status = ?'; params.push(req.query.status); }
        if (req.query.category_id) { extra += ' AND d.category_id = ?'; params.push(req.query.category_id); }
        if (req.query.department_id) { extra += ' AND d.department_id = ?'; params.push(req.query.department_id); }
        if (req.query.purchase_price_min) { extra += ' AND d.purchase_price >= ?'; params.push(Number(req.query.purchase_price_min)); }
        if (req.query.purchase_price_max) { extra += ' AND d.purchase_price <= ?'; params.push(Number(req.query.purchase_price_max)); }
        if (req.query.purchase_date_from) { extra += ' AND d.purchase_date >= ?'; params.push(req.query.purchase_date_from); }
        if (req.query.purchase_date_to) { extra += ' AND d.purchase_date <= ?'; params.push(req.query.purchase_date_to); }
        if (req.query.model) { extra += ' AND d.model LIKE ?'; params.push(`%${req.query.model}%`); }
        if (req.query.serial_number) { extra += ' AND d.serial_number LIKE ?'; params.push(`%${req.query.serial_number}%`); }
        const [rows] = await pool.query(fullQuery + extra + ' ORDER BY d.id DESC', params);
        const filters = {
            search: req.query.search,
            status: req.query.status,
            category_id: req.query.category_id,
            department_id: req.query.department_id,
            purchase_price_min: req.query.purchase_price_min,
            purchase_price_max: req.query.purchase_price_max,
            purchase_date_from: req.query.purchase_date_from,
            purchase_date_to: req.query.purchase_date_to,
            model: req.query.model,
            serial_number: req.query.serial_number,
        };
        const pdfBuffer = await pdfService.generateDeviceList(rows, filters);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', req.query.inline ? 'inline' : 'attachment; filename="device_list.pdf"');
        return res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi xuất PDF' });
    }
};

// GET /api/devices/depreciation/export-pdf
const exportDepreciationPdf = async (req, res) => {
    try {
        const fullQuery = `
            SELECT d.id, d.device_code, d.name, d.brand, d.model, d.serial_number,
                   d.status, d.location, d.purchase_date, d.purchase_price, d.warranty_expiry,
                   d.category_id, d.department_id, d.assigned_user_id, d.depreciation_rate,
                    dc.name AS category_name, dc.useful_life_years,
                    dept.name AS department_name
             FROM devices d
             LEFT JOIN device_categories dc ON d.category_id = dc.id
             LEFT JOIN departments dept ON d.department_id = dept.id
             WHERE d.status != 'disposed'
        `;
        const params = [];
        let extra = '';
        if (req.query.search) { extra += ' AND (d.name LIKE ? OR d.device_code LIKE ? OR d.brand LIKE ? OR d.model LIKE ? OR d.serial_number LIKE ?)'; const s = `%${req.query.search}%`; params.push(s, s, s, s, s); }
        if (req.query.status) { extra += ' AND d.status = ?'; params.push(req.query.status); }
        if (req.query.category_id) { extra += ' AND d.category_id = ?'; params.push(req.query.category_id); }
        if (req.query.department_id) { extra += ' AND d.department_id = ?'; params.push(req.query.department_id); }
        if (req.query.purchase_price_min) { extra += ' AND d.purchase_price >= ?'; params.push(Number(req.query.purchase_price_min)); }
        if (req.query.purchase_price_max) { extra += ' AND d.purchase_price <= ?'; params.push(Number(req.query.purchase_price_max)); }
        const [rows] = await pool.query(fullQuery + extra + ' ORDER BY d.id DESC', params);
        const pdfBuffer = await pdfService.generateDepreciationReport(rows);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', req.query.inline ? 'inline' : 'attachment; filename="khauhao.pdf"');
        return res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi xuất PDF khấu hao' });
    }
};

// GET /api/devices/stats/export-pdf
const exportStatsPdf = async (req, res) => {
    try {
        const [stats] = await pool.query('SELECT * FROM v_dashboard_stats');
        const [byCategory] = await pool.query(`
            SELECT dc.name, dc.icon, COUNT(d.id) AS total,
                   SUM(CASE WHEN d.status='active' THEN 1 ELSE 0 END) AS active,
                   SUM(CASE WHEN d.status='maintenance' THEN 1 ELSE 0 END) AS maintenance,
                   SUM(CASE WHEN d.status='broken' THEN 1 ELSE 0 END) AS broken
            FROM device_categories dc
            LEFT JOIN devices d ON d.category_id = dc.id AND d.status != 'disposed'
            GROUP BY dc.id, dc.name, dc.icon ORDER BY total DESC`);
        const [byDept] = await pool.query(`
            SELECT dept.name, dept.code, COUNT(d.id) AS total,
                   COALESCE(SUM(d.purchase_price),0) AS total_value
            FROM departments dept
            LEFT JOIN devices d ON d.department_id = dept.id AND d.status != 'disposed'
            GROUP BY dept.id, dept.name, dept.code ORDER BY total DESC`);
        const [upcoming] = await pool.query(`
            SELECT ms.*, d.device_code, d.name AS device_name, u.full_name AS technician_name
            FROM maintenance_schedules ms
            JOIN devices d ON ms.device_id = d.id
            LEFT JOIN users u ON ms.technician_id = u.id
            WHERE ms.status IN ('cho_xu_ly','da_duyet') AND ms.request_date >= CURDATE()
            ORDER BY ms.request_date ASC LIMIT 5`);
        const [expiring] = await pool.query(`
            SELECT id, device_code, name, warranty_expiry, status, department_id
            FROM devices WHERE warranty_expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)
            AND status != 'disposed' ORDER BY warranty_expiry ASC LIMIT 5`);
        const pdfBuffer = await pdfService.generateStatsReport({
            ...stats[0],
            by_category: (byCategory || []).map(c => [c.name, c.total]),
            by_department: (byDept || []).map(d => [d.name, d.total]),
            recent_maintenance: (upcoming || []).map(m => ({
                device_name: m.device_name,
                actual_date: m.request_date,
                technician_name: m.technician_name,
            })),
            warranty_expiring: (expiring || []).map(e => ({
                device_name: e.name,
                warranty_expiry: e.warranty_expiry,
            })),
            total_value: byDept.reduce((sum, d) => sum + Number(d.total_value || 0), 0),
            remaining_value: 0,
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', req.query.inline ? 'inline' : 'attachment; filename="statistics_report.pdf"');
        return res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi xuất PDF thống kê' });
    }
};

// GET /api/devices/qr/all - Get all devices with QR codes for management
const getAllQRCodes = async (req, res) => {
    try {
        const QRCode = require('qrcode');
        let query = `
            SELECT d.id, d.device_code, d.name, d.brand, d.model, d.status, d.serial_number,
                   d.department_id, d.category_id, d.qr_status, d.image_url, d.location, d.warranty_expiry,
                   dc.name AS category_name, dept.name AS department_name
            FROM devices d
            LEFT JOIN device_categories dc ON d.category_id = dc.id
            LEFT JOIN departments dept ON d.department_id = dept.id
            WHERE d.status != 'disposed'
        `;
        const params = [];

        if (req.query.search) {
            query += ' AND (d.name LIKE ? OR d.device_code LIKE ? OR d.brand LIKE ? OR d.model LIKE ?)';
            const s = `%${req.query.search}%`;
            params.push(s, s, s, s);
        }
        if (req.query.status) {
            query += ' AND d.status = ?';
            params.push(req.query.status);
        }
        if (req.query.department_id) {
            query += ' AND d.department_id = ?';
            params.push(req.query.department_id);
        }
        if (req.query.category_id) {
            query += ' AND d.category_id = ?';
            params.push(req.query.category_id);
        }

        query += ' ORDER BY d.device_code ASC';

        const [rows] = await pool.query(query, params);

        const devicesWithQR = await Promise.all(rows.map(async (device) => {
            const url = buildDeviceQrUrl(device.device_code, req);
            const qrDataURL = await QRCode.toDataURL(url, {
                width: 200,
                margin: 1,
                errorCorrectionLevel: 'M'
            });
            return {
                ...device,
                qr_code: qrDataURL,
                qr_url: url
            };
        }));

        return res.json({ success: true, data: devicesWithQR, total: devicesWithQR.length });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi tải danh sách QR code' });
    }
};

// GET /api/devices/qr/bulk-download - Download multiple QR codes as ZIP
const bulkDownloadQR = async (req, res) => {
    try {
        const QRCode = require('qrcode');
        const JSZip = require('jszip');

        let deviceIds = req.query.ids;
        if (!deviceIds) {
            return res.status(400).json({ success: false, message: 'Thiếu danh sách thiết bị' });
        }

        if (typeof deviceIds === 'string') {
            deviceIds = deviceIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => id > 0);
        }
        if (!Array.isArray(deviceIds)) {
            deviceIds = [deviceIds];
        }

        if (deviceIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Danh sách thiết bị không hợp lệ' });
        }

        const placeholders = deviceIds.map(() => '?').join(',');
        const [rows] = await pool.query(`
            SELECT d.id, d.device_code, d.name
            FROM devices d
            WHERE d.id IN (${placeholders})
        `, deviceIds);

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
        }

        const zip = new JSZip();

        for (const device of rows) {
            try {
                const url = buildDeviceQrUrl(device.device_code, req);
                const buffer = await QRCode.toBuffer(url, {
                    width: 400,
                    margin: 2,
                    errorCorrectionLevel: 'M',
                    type: 'png'
                });
                const safeName = (device.name || 'device').replace(/[^a-zA-Z0-9_\-]/g, '_');
                zip.file(`QR_${device.device_code}_${safeName}.png`, buffer);
            } catch (qrErr) {
                console.error(`QR error for ${device.device_code}:`, qrErr.message);
            }
        }

        const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="QR_Codes_${new Date().toISOString().slice(0,10)}.zip"`);
        res.send(zipBuffer);
    } catch (err) {
        console.error('Bulk download error:', err);
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: 'Lỗi tải QR code hàng loạt' });
        }
    }
};

// PUT /api/devices/qr/status - Update QR status for a device
const updateQRStatus = async (req, res) => {
    try {
        const { id, qr_status } = req.body;
        if (!id || !qr_status) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
        }
        if (!['pending', 'printed', 'assigned'].includes(qr_status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
        }
        const [result] = await pool.query('UPDATE devices SET qr_status = ? WHERE id = ?', [qr_status, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
        }
        return res.json({ success: true, message: 'Cập nhật trạng thái QR thành công' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái QR' });
    }
};

// PUT /api/devices/qr/status/bulk - Update QR status for multiple devices
const bulkUpdateQRStatus = async (req, res) => {
    try {
        const { ids, qr_status } = req.body;
        if (!ids || !ids.length || !qr_status) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin' });
        }
        if (!['pending', 'printed', 'assigned'].includes(qr_status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
        }
        const placeholders = ids.map(() => '?').join(',');
        const [result] = await pool.query(`UPDATE devices SET qr_status = ? WHERE id IN (${placeholders})`, [qr_status, ...ids]);
        return res.json({ success: true, message: `Đã cập nhật ${result.affectedRows} thiết bị`, updated: result.affectedRows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi cập nhật hàng loạt' });
    }
};

// POST /api/devices/qr/scan-log - Log a QR scan event
const logScan = async (req, res) => {
    try {
        const { device_id, action } = req.body;
        if (!device_id) {
            return res.status(400).json({ success: false, message: 'Thiếu device_id' });
        }
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        await pool.query(
            'INSERT INTO qr_scan_logs (device_id, user_id, action, ip_address) VALUES (?, ?, ?, ?)',
            [device_id, req.user?.id || null, action || 'view', ip]
        );
        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi ghi nhận quét' });
    }
};

// PUT /api/devices/qr/scan-update - Update device info after scan
const scanUpdate = async (req, res) => {
    try {
        const { device_id, location, status, department_id, assigned_user_id, notes, qr_status } = req.body;
        if (!device_id) {
            return res.status(400).json({ success: false, message: 'Thiếu device_id' });
        }
        const [old] = await pool.query('SELECT * FROM devices WHERE id = ?', [device_id]);
        if (!old.length) return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });

        const fields = [];
        const values = [];
        const updatedFields = {};

        if (location !== undefined) { fields.push('location = ?'); values.push(location); updatedFields.location = location; }
        if (status !== undefined) { fields.push('status = ?'); values.push(status); updatedFields.status = status; }
        if (department_id !== undefined) { fields.push('department_id = ?'); values.push(department_id); updatedFields.department_id = department_id; }
        if (assigned_user_id !== undefined) { fields.push('assigned_user_id = ?'); values.push(assigned_user_id); updatedFields.assigned_user_id = assigned_user_id; }
        if (notes !== undefined) { fields.push('notes = ?'); values.push(notes); updatedFields.notes = notes; }
        if (qr_status !== undefined) { fields.push('qr_status = ?'); values.push(qr_status); updatedFields.qr_status = qr_status; }

        if (!fields.length) {
            return res.status(400).json({ success: false, message: 'Không có trường nào cần cập nhật' });
        }

        values.push(device_id);
        await pool.query(`UPDATE devices SET ${fields.join(', ')} WHERE id = ?`, values);

        // Log the update scan
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        await pool.query(
            'INSERT INTO qr_scan_logs (device_id, user_id, action, updated_fields, ip_address) VALUES (?, ?, ?, ?, ?)',
            [device_id, req.user?.id || null, 'update', JSON.stringify(updatedFields), ip]
        );

        await recordAudit({
            user_id: req.user?.id,
            action: 'Cập nhật sau quét QR',
            entity_type: 'device',
            entity_id: device_id,
            old_data: old[0],
            new_data: updatedFields,
            req
        });

        return res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi cập nhật' });
    }
};

// GET /api/devices/qr/scan-logs - Get scan history
const getScanLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50, device_id } = req.query;
        const offset = (page - 1) * limit;
        let where = '';
        const params = [];

        if (device_id) {
            where = 'WHERE l.device_id = ?';
            params.push(device_id);
        }

        const [rows] = await pool.query(`
            SELECT l.*, d.device_code, d.name AS device_name, u.full_name AS user_name
            FROM qr_scan_logs l
            LEFT JOIN devices d ON l.device_id = d.id
            LEFT JOIN users u ON l.user_id = u.id
            ${where}
            ORDER BY l.scanned_at DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), parseInt(offset)]);

        const [countResult] = await pool.query(`SELECT COUNT(*) AS total FROM qr_scan_logs l ${where}`, params);

        return res.json({
            success: true,
            data: rows,
            pagination: { page: parseInt(page), limit: parseInt(limit), total: countResult[0].total }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi lấy lịch sử quét' });
    }
};

module.exports = { getAll, getOne, create, update, remove, getStats, getQRCode, downloadQR, exportExcel, importExcel, recall, getHistory, exportPdf, exportDepreciationPdf, exportStatsPdf, getAllQRCodes, bulkDownloadQR, updateQRStatus, bulkUpdateQRStatus, logScan, scanUpdate, getScanLogs };
