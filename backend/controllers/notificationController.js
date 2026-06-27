const pool = require('../config/database');

// GET /api/notifications - Lấy danh sách thông báo
const getAll = async (req, res) => {
    try {
        const notifications = [];
        
        // 1. Bảo trì quá hạn (pending nhưng đã quá ngày)
        const [overdueMaintenance] = await pool.query(`
            SELECT ms.id, ms.request_date, ms.description, ms.priority,
                   d.id AS device_id, d.device_code, d.name AS device_name
            FROM maintenance_schedules ms
            JOIN devices d ON ms.device_id = d.id
            WHERE ms.status IN ('cho_xu_ly', 'da_duyet') AND ms.request_date < CURDATE()
            ORDER BY ms.request_date ASC
        `);
        
        overdueMaintenance.forEach(m => {
            const daysOver = Math.ceil((new Date() - new Date(m.request_date)) / 86400000);
            notifications.push({
                type: 'maintenance',
                priority: 'high',
                title: `⚠️ Bảo trì quá hạn`,
                message: `Thiết bị "${m.device_name}" (${m.device_code}) quá hạn bảo trì ${daysOver} ngày`,
                link: `#maintenance`,
                date: m.request_date,
                data: m
            });
        });

        // 2. Bảo trì sắp đến hạn (trong 7 ngày tới)
        const [upcomingMaintenance] = await pool.query(`
            SELECT ms.id, ms.request_date, ms.description, ms.priority,
                   d.id AS device_id, d.device_code, d.name AS device_name
            FROM maintenance_schedules ms
            JOIN devices d ON ms.device_id = d.id
            WHERE ms.status IN ('cho_xu_ly', 'da_duyet') 
            AND ms.request_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            ORDER BY ms.request_date ASC
        `);
        
        upcomingMaintenance.forEach(m => {
            const daysLeft = Math.ceil((new Date(m.request_date) - new Date()) / 86400000);
            notifications.push({
                type: 'maintenance',
                priority: m.priority === 'critical' || m.priority === 'high' ? 'high' : 'medium',
                title: daysLeft <= 2 ? '🔴 Bảo trì sắp đến hạn' : '🟡 Bảo trì sắp đến hạn',
                message: `Thiết bị "${m.device_name}" (${m.device_code}) cần bảo trì trong ${daysLeft} ngày`,
                link: `#maintenance`,
                date: m.request_date,
                data: m
            });
        });
        
        // 2. Thiết bị hết bảo hành (trong 30 ngày tới)
        const [expiringWarranty] = await pool.query(`
            SELECT id, device_code, name, warranty_expiry
            FROM devices
            WHERE warranty_expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
            AND status != 'disposed'
            ORDER BY warranty_expiry ASC
        `);
        
        expiringWarranty.forEach(d => {
            const daysLeft = Math.ceil((new Date(d.warranty_expiry) - new Date()) / 86400000);
            notifications.push({
                type: 'warranty',
                priority: daysLeft <= 7 ? 'high' : 'medium',
                title: `Bảo hành sắp hết hạn`,
                message: `Thiết bị "${d.name}" (${d.device_code}) hết bảo hành trong ${daysLeft} ngày`,
                link: `#devices?view=${d.id}`,
                date: d.warranty_expiry,
                data: d
            });
        });
        
        // 3. Sự cố chưa xử lý
        const [openIncidents] = await pool.query(`
            SELECT ir.id, ir.issue, ir.severity, ir.reported_at,
                   d.id AS device_id, d.device_code, d.name AS device_name,
                   u.full_name AS reported_by_name
            FROM incident_reports ir
            JOIN devices d ON ir.device_id = d.id
            JOIN users u ON ir.reported_by = u.id
            WHERE ir.status = 'open'
            ORDER BY ir.severity DESC, ir.reported_at DESC
        `);
        
        openIncidents.forEach(i => {
            notifications.push({
                type: 'incident',
                priority: i.severity === 'critical' || i.severity === 'high' ? 'high' : 'medium',
                title: `Sự cố chưa xử lý`,
                message: `${i.device_name} (${i.device_code}): ${i.issue}`,
                link: `#incidents`,
                date: i.reported_at,
                data: i
            });
        });
        
        // 4. Yêu cầu điều chuyển chờ duyệt
        const [pendingTransfers] = await pool.query(`
            SELECT at.id, at.transfer_date, at.reason,
                   d.device_code, d.name AS device_name,
                   td.name AS to_dept_name,
                   cu.full_name AS created_by_name
            FROM asset_transfers at
            JOIN devices d ON at.device_id = d.id
            LEFT JOIN departments td ON at.to_department_id = td.id
            LEFT JOIN users cu ON at.created_by = cu.id
            WHERE at.status = 'pending'
            ORDER BY at.created_at DESC
        `);
        
        if (req.user.role === 'superadmin' || req.user.role === 'admin') {
            pendingTransfers.forEach(t => {
                notifications.push({
                    type: 'transfer',
                    priority: 'medium',
                    title: `Yêu cầu điều chuyển chờ duyệt`,
                    message: `${t.device_name} (${t.device_code}) → ${t.to_dept_name || 'N/A'}`,
                    link: `#transfers`,
                    date: t.transfer_date,
                    data: t
                });
            });
        }
        
        // 5. Yêu cầu thanh lý chờ duyệt
        const [pendingDisposals] = await pool.query(`
            SELECT dsp.id, dsp.disposal_date, dsp.reason, dsp.disposal_method,
                   d.device_code, d.name AS device_name,
                   cu.full_name AS created_by_name
            FROM disposals dsp
            JOIN devices d ON dsp.device_id = d.id
            LEFT JOIN users cu ON dsp.created_by = cu.id
            WHERE dsp.status = 'de_nghi'
            ORDER BY dsp.created_at DESC
        `);

        if (req.user.role === 'superadmin' || req.user.role === 'admin') {
            pendingDisposals.forEach(t => {
                notifications.push({
                    type: 'disposal',
                    priority: 'medium',
                    title: `Yêu cầu thanh lý chờ duyệt`,
                    message: `${t.device_name} (${t.device_code}) — ${t.reason?.substring(0, 80)}`,
                    link: `#disposals`,
                    date: t.disposal_date,
                    data: t
                });
            });
        }

        // Sắp xếp theo độ ưu tiên và thời gian
        notifications.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return new Date(a.date) - new Date(b.date);
        });
        
        return res.json({
            success: true,
            data: notifications,
            total: notifications.length,
            unread: notifications.filter(n => n.priority === 'high').length
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/notifications/count - Đếm số thông báo
const getCount = async (req, res) => {
    try {
        const [maintenance] = await pool.query(`
            SELECT COUNT(*) AS count FROM maintenance_schedules 
            WHERE status IN ('cho_xu_ly', 'da_duyet') AND request_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        `);
        
        const [warranty] = await pool.query(`
            SELECT COUNT(*) AS count FROM devices 
            WHERE warranty_expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND status != 'disposed'
        `);
        
        const [incidents] = await pool.query(`
            SELECT COUNT(*) AS count FROM incident_reports WHERE status = 'open'
        `);
        
        const [transfers] = await pool.query(`
            SELECT COUNT(*) AS count FROM asset_transfers WHERE status = 'pending'
        `);

        const [disposals] = await pool.query(`
            SELECT COUNT(*) AS count FROM disposals WHERE status = 'pending'
        `);
        
        const total = maintenance[0].count + warranty[0].count + incidents[0].count + 
                     (req.user.role !== 'user' ? transfers[0].count + disposals[0].count : 0);
        
        return res.json({
            success: true,
            data: {
                total,
                maintenance: maintenance[0].count,
                warranty: warranty[0].count,
                incidents: incidents[0].count,
                transfers: req.user.role !== 'user' ? transfers[0].count : 0,
                disposals: req.user.role !== 'user' ? disposals[0].count : 0
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

module.exports = { getAll, getCount };
