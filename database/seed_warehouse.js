const mysql = require('mysql2/promise');

const seed = async () => {
    const pool = mysql.createPool({
        host: 'localhost', user: 'root', password: '', database: 'tvu_itam',
        waitForConnections: true, connectionLimit: 5
    });

    const [existing] = await pool.query('SELECT COUNT(*) AS cnt FROM warehouses');
    if (existing[0].cnt > 0) {
        console.log('Dữ liệu kho đã tồn tại, bỏ qua seed.');
        await pool.end();
        return;
    }

    // 1. Warehouses
    const warehouses = [
        { code: 'WH001', name: 'Kho cơ sở vật chất', address: 'Tòa nhà A, tầng trệt, TVU', manager: 'Lê Văn Dũng', notes: 'Kho lưu trữ thiết bị văn phòng và cơ sở vật chất' },
        { code: 'WH002', name: 'Kho thiết bị CNTT', address: 'Tòa nhà B, tầng 2, TVU', manager: 'Phạm Minh Tuấn', notes: 'Kho lưu trữ thiết bị công nghệ thông tin' },
        { code: 'WH003', name: 'Kho vật tư phòng thí nghiệm', address: 'Tòa nhà C, tầng 1, TVU', manager: 'Trần Hoàng Nam', notes: 'Kho lưu trữ vật tư và thiết bị thí nghiệm' },
    ];
    for (const w of warehouses) {
        await pool.query(
            'INSERT INTO warehouses (warehouse_code, name, address, manager_name, notes, created_by, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())',
            [w.code, w.name, w.address, w.manager, w.notes]
        );
    }
    console.log('✓ Đã tạo 3 kho');

    // 2. Receipts (phiếu nhập kho)
    const receipts = [
        { date: '2025-06-01', wh: 1, supplier: 'Công ty TNHH Thiết bị Văn phòng Sài Gòn', devices: [13, 14, 15, 24, 25, 26], notes: 'Nhập lô máy tính văn phòng đợt 1' },
        { date: '2025-06-05', wh: 2, supplier: 'CTCP Công nghệ Nam Long', devices: [27, 28, 29], notes: 'Nhập laptop cho giảng viên' },
        { date: '2025-06-10', wh: 2, supplier: 'Công ty TNHH Giải pháp Mạng Việt', devices: [17, 19], notes: 'Nhập thiết bị mạng bổ sung' },
        { date: '2025-06-15', wh: 1, supplier: 'CTCP Thương mại Điện máy Nhà Việt', devices: [20, 21, 22, 23], notes: 'Nhập máy in, màn hình và thiết bị lưu trữ' },
        { date: '2025-06-20', wh: 3, supplier: 'Công ty TNHH Khoa học Kỹ thuật Đồng bằng', devices: [7, 9, 16], notes: 'Nhập máy chiếu và thiết bị hỗ trợ giảng dạy' },
    ];
    for (let i = 0; i < receipts.length; i++) {
        const r = receipts[i];
        const total = r.devices.length;
        const code = 'NK' + String(i + 1).padStart(3, '0');
        const [res] = await pool.query(
            'INSERT INTO inventory_receipts (receipt_code, receipt_date, warehouse_id, supplier_name, notes, total_items, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())',
            [code, r.date, r.wh, r.supplier, r.notes, total]
        );
        const receiptId = res.insertId;
        for (const did of r.devices) {
            await pool.query('INSERT INTO inventory_receipt_details (receipt_id, device_id) VALUES (?, ?)', [receiptId, did]);
            await pool.query("UPDATE devices SET status='in_stock', location=(SELECT name FROM warehouses WHERE id=?), updated_at=NOW() WHERE id=?", [r.wh, did]);
        }
        console.log(`✓ Tạo phiếu nhập ${code} (${total} TB)`);
    }

    // 3. Issues (phiếu xuất kho) — xuất một số TB cho các phòng ban
    const issues = [
        { date: '2025-07-01', wh: 1, dept: 2, recipient: 'Lê Văn Dũng', devices: [13, 14], notes: 'Cấp máy tính cho Ban CNTT' },
        { date: '2025-07-05', wh: 2, dept: 3, recipient: 'Phạm Minh Tuấn', devices: [27, 28], notes: 'Cấp laptop cho Văn phòng Đại học' },
        { date: '2025-07-10', wh: 1, dept: 4, recipient: 'Trần Hoàng Nam', devices: [20, 21], notes: 'Cấp máy in và màn hình cho Trường Kỹ thuật và Công nghệ' },
    ];
    for (let i = 0; i < issues.length; i++) {
        const iss = issues[i];
        const code = 'XK' + String(i + 1).padStart(3, '0');
        const [res] = await pool.query(
            "INSERT INTO inventory_issues (issue_code, issue_date, warehouse_id, department_id, recipient_name, notes, total_items, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW())",
            [code, iss.date, iss.wh, iss.dept, iss.recipient, iss.notes, iss.devices.length]
        );
        const issueId = res.insertId;
        const [deptRows] = await pool.query('SELECT name FROM departments WHERE id = ?', [iss.dept]);
        const deptName = deptRows.length ? deptRows[0].name : '';
        for (const did of iss.devices) {
            await pool.query('INSERT INTO inventory_issue_details (issue_id, device_id) VALUES (?, ?)', [issueId, did]);
            await pool.query("UPDATE devices SET status='active', location=?, updated_at=NOW() WHERE id=?", [`Đã cấp phát - ${deptName}`, did]);
        }
        console.log(`✓ Tạo phiếu xuất ${code} (${iss.devices.length} TB)`);
    }

    console.log('\n✅ Seed dữ liệu kho hoàn tất!');
    await pool.end();
};

seed().catch(err => { console.error('Lỗi:', err); process.exit(1); });
