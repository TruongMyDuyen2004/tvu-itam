const pool = require('../config/database');
const { getLanIp, getPublicBaseUrl } = require('../config/appUrl');

const DEVICE_SELECT = `
    SELECT d.id, d.device_code, d.name, d.brand, d.model, d.serial_number,
           d.status, d.location, d.warranty_expiry, d.image_url,
           dc.name AS category_name, dc.icon AS category_icon,
           dept.name AS department_name,
           u.full_name AS assigned_user_name
    FROM devices d
    LEFT JOIN device_categories dc ON d.category_id = dc.id
    LEFT JOIN departments dept ON d.department_id = dept.id
    LEFT JOIN users u ON d.assigned_user_id = u.id
`;

const formatDevice = (row) => ({
    id: row.id,
    device_code: row.device_code,
    name: row.name,
    brand: row.brand,
    model: row.model,
    serial_number: row.serial_number,
    status: row.status,
    location: row.location,
    warranty_expiry: row.warranty_expiry,
    image_url: row.image_url,
    category_name: row.category_name,
    category_icon: row.category_icon,
    department_name: row.department_name,
    assigned_user_name: row.assigned_user_name
});

const fetchMaintenanceSummary = async (deviceId) => {
    const [rows] = await pool.query(`
        SELECT maintenance_type, request_date, status, result
        FROM maintenance_schedules
        WHERE device_id = ?
        ORDER BY request_date DESC
        LIMIT 3
    `, [deviceId]);
    return rows;
};

// GET /api/public/device/:id
const getById = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!id || id < 1) {
            return res.status(400).json({ success: false, message: 'Mã thiết bị không hợp lệ' });
        }
        const [rows] = await pool.query(`${DEVICE_SELECT} WHERE d.id = ?`, [id]);
        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị' });
        }
        const maintenance = await fetchMaintenanceSummary(id);
        return res.json({ success: true, data: { ...formatDevice(rows[0]), maintenance_summary: maintenance } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/public/qr/:code
const getByCode = async (req, res) => {
    try {
        const code = decodeURIComponent(req.params.code || '').trim();
        if (!code) {
            return res.status(400).json({ success: false, message: 'Mã QR không hợp lệ' });
        }
        const [rows] = await pool.query(`${DEVICE_SELECT} WHERE d.device_code = ?`, [code]);
        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thiết bị với mã này' });
        }
        const maintenance = await fetchMaintenanceSummary(rows[0].id);
        return res.json({ success: true, data: { ...formatDevice(rows[0]), maintenance_summary: maintenance } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// GET /api/public/info — địa chỉ đúng để mở app / quét QR
const getServerInfo = async (req, res) => {
    const port = process.env.PORT || 5000;
    const lanIp = getLanIp();
    const publicBase = getPublicBaseUrl(req);
    return res.json({
        success: true,
        data: {
            lan_ip: lanIp,
            port,
            public_base_url: publicBase,
            app_url: `${publicBase}/app.html`,
            localhost_app_url: `http://localhost:${port}/app.html`,
            qr_example: `${publicBase}/q/TVU-PC-001`,
            note: 'Luôn gõ http:// ở đầu. Không dùng IP cũ 192.168.1.6 nếu máy đã đổi IP.'
        }
    });
};

// Server-side render: /q/:code, /qr/:code, /device/:id
const renderDevicePage = async (req, res, templatePath) => {
    try {
        const fs = require('fs');
        let deviceData = null;

        // Determine lookup method from URL pattern
        const path = req.path.replace(/\/+$/, '');
        const qMatch = path.match(/\/q\/(.+)$/i);
        const qrMatch = path.match(/\/qr\/(.+)$/i);
        const idMatch = path.match(/\/device\/(\d+)$/i);

        if (idMatch) {
            const id = parseInt(idMatch[1], 10);
            if (id && id > 0) {
                const [rows] = await pool.query(`${DEVICE_SELECT} WHERE d.id = ?`, [id]);
                if (rows.length) {
                    deviceData = { ...formatDevice(rows[0]) };
                }
            }
        } else if (qMatch || qrMatch) {
            const code = decodeURIComponent((qMatch || qrMatch)[1]).trim();
            if (code) {
                const [rows] = await pool.query(`${DEVICE_SELECT} WHERE d.device_code = ?`, [code]);
                if (rows.length) {
                    deviceData = { ...formatDevice(rows[0]) };
                }
            }
        }

        let html = fs.readFileSync(templatePath, 'utf-8');

        if (deviceData) {
            // Fetch maintenance summary too
            try {
                const maint = await fetchMaintenanceSummary(deviceData.id);
                deviceData.maintenance_summary = maint;
            } catch (_) {
                deviceData.maintenance_summary = [];
            }

            // Generate full device HTML server-side (no JS dependency)
            const statusHtml = (() => {
                const labels = { active:'Đang sử dụng', maintenance:'Đang bảo trì', broken:'Hỏng', disposed:'Đã thanh lý', inactive:'Ngừng sử dụng' };
                const classes = { active:'badge-active', maintenance:'badge-maintenance', broken:'badge-broken', disposed:'badge-disposed', inactive:'badge-secondary' };
                return `<span class="badge ${classes[deviceData.status] || 'badge-secondary'}">${labels[deviceData.status] || deviceData.status}</span>`;
            })();

            const maintHtml = (deviceData.maintenance_summary || []).length
                ? deviceData.maintenance_summary.map(m => {
                    const labels = { dinh_ky:'Bảo trì định kỳ', dot_xuat:'Sửa chữa đột xuất' };
                    const t = labels[m.maintenance_type] || m.maintenance_type;
                    const d = m.request_date ? new Date(m.request_date).toLocaleDateString('vi-VN') : '—';
                    const s = m.status === 'hoan_thanh' ? '<span class="badge badge-success" style="margin-left:.35rem;font-size:.7rem">Hoàn thành</span>' : '<span class="badge badge-pending" style="margin-left:.35rem;font-size:.7rem">Chờ xử lý</span>';
                    return `<div class="public-maint-item">${t} — ${d} ${s}</div>`;
                }).join('')
                : '<div class="public-maint-item" style="color:var(--text-muted)">Chưa có lịch sử bảo trì gần đây</div>';

            const infoRows = [
                ['Loại', [(deviceData.category_icon||''), deviceData.category_name].filter(Boolean).join(' ')],
                ['Phòng ban', deviceData.department_name],
                ['Người sử dụng', deviceData.assigned_user_name],
                ['Hãng / Model', [deviceData.brand, deviceData.model].filter(Boolean).join(' ')],
                ['Số serial', deviceData.serial_number],
                ['Vị trí', deviceData.location],
                ['Hạn bảo hành', deviceData.warranty_expiry ? new Date(deviceData.warranty_expiry).toLocaleDateString('vi-VN') : '—']
            ];

            const deviceHtml = `
                <div class="public-card">
                    <div class="public-card-body">
                        <div class="public-device-code">${deviceData.device_code}</div>
                        <h1 class="public-device-name">${deviceData.name}</h1>
                        ${statusHtml}
                        <div class="public-info-grid">
                            ${infoRows.map(r => `<div class="public-info-row"><span class="public-info-label">${r[0]}</span><span class="public-info-value">${r[1] || '—'}</span></div>`).join('')}
                        </div>
                        <div class="public-section-title">Bảo trì gần đây</div>
                        ${maintHtml}
                    </div>
                </div>
                <div class="public-footer">
                    <p>Tra cứu qua mã QR — TVU-ITAM</p>
                    <p style="margin-top:.5rem"><a href="/">Đăng nhập hệ thống quản lý</a></p>
                </div>
            `;

            // Replace the SSR marker with device HTML (the spinner div remains as fallback)
            html = html.replace('<!--SSR_DEVICE_HTML-->', deviceHtml);

            // Inject JSON data too (for JS functionality if needed)
            const script = `<script>window.__DEVICE_DATA__=${JSON.stringify(deviceData)};<\/script>`;
            html = html.replace('</head>', script + '</head>');

            // Update title
            html = html.replace(
                '<title>Tra cứu thiết bị | TVU-ITAM</title>',
                `<title>${deviceData.device_code} — ${deviceData.name} | TVU-ITAM</title>`
            );
        }

        return res.send(html);
    } catch (err) {
        console.error('renderDevicePage error:', err);
        // Fallback: serve static page, JS will handle errors
        return res.sendFile(templatePath);
    }
};

module.exports = { getById, getByCode, getServerInfo, renderDevicePage };
