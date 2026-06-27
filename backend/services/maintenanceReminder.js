const cron = require('node-cron');
const pool = require('../config/database');
const { sendMail } = require('../config/mail');
const { getPublicBaseUrl } = require('../config/appUrl');

const REMINDER_DAYS_AHEAD = 3;
const CRON_SCHEDULE = '0 8 * * *';

const getBaseUrl = () => {
    try { return getPublicBaseUrl(); } catch { return process.env.APP_URL || 'http://localhost:5500'; }
};

const getOverdueMaintenance = async () => {
    const [rows] = await pool.query(`
        SELECT ms.id, ms.request_date, ms.priority, ms.description, ms.maintenance_type,
               d.id AS device_id, d.device_code, d.name AS device_name,
               t.id AS technician_id, t.full_name AS technician_name, t.email AS technician_email
        FROM maintenance_schedules ms
        JOIN devices d ON ms.device_id = d.id
        LEFT JOIN users t ON ms.technician_id = t.id
        WHERE ms.status IN ('pending', 'in_progress') AND ms.request_date < CURDATE()
        ORDER BY ms.request_date ASC
    `);
    return rows;
};

const getUpcomingMaintenance = async () => {
    const [rows] = await pool.query(`
        SELECT ms.id, ms.request_date, ms.priority, ms.description, ms.maintenance_type,
               d.id AS device_id, d.device_code, d.name AS device_name,
               t.id AS technician_id, t.full_name AS technician_name, t.email AS technician_email
        FROM maintenance_schedules ms
        JOIN devices d ON ms.device_id = d.id
        LEFT JOIN users t ON ms.technician_id = t.id
        WHERE ms.status IN ('pending', 'in_progress')
          AND ms.request_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
        ORDER BY ms.request_date ASC
    `, [REMINDER_DAYS_AHEAD]);
    return rows;
};

const sendReminderEmail = async (item, type) => {
    if (!item.technician_email) return;
    const baseUrl = getBaseUrl();
    const isOverdue = type === 'overdue';
    const subject = isOverdue
        ? `[TVU-ITAM] Cảnh báo: Bảo trì quá hạn - ${item.device_code}`
        : `[TVU-ITAM] Nhắc nhở: Bảo trì sắp đến hạn - ${item.device_code}`;

    const priorityLabels = { low: 'Thấp', medium: 'Trung bình', high: 'Cao', critical: 'Khẩn cấp' };
    const typeLabels = { dinh_ky: 'Định kỳ', dot_xuat: 'Đột xuất' };

    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:linear-gradient(135deg,#1a73e8,#0d47a1);color:#fff;padding:20px;border-radius:8px 8px 0 0;text-align:center">
            <h2 style="margin:0;font-size:18px">${isOverdue ? '⚠️ Bảo trì quá hạn' : '🔔 Nhắc nhở bảo trì'}</h2>
        </div>
        <div style="border:1px solid #e0e0e0;border-top:0;padding:20px;border-radius:0 0 8px 8px;background:#fff">
            <p>Xin chào <strong>${item.technician_name}</strong>,</p>
            ${isOverdue
                ? `<p style="color:#d32f2f">Lịch bảo trì sau đây đã quá hạn, vui lòng kiểm tra và xử lý sớm:</p>`
                : `<p>Lịch bảo trì sau đây sắp đến hạn trong vòng ${REMINDER_DAYS_AHEAD} ngày tới:</p>`
            }
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600;width:120px">Thiết bị</td><td style="padding:8px 12px">${item.device_name} (${item.device_code})</td></tr>
                <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600">Loại bảo trì</td><td style="padding:8px 12px">${typeLabels[item.maintenance_type] || item.maintenance_type}</td></tr>
                <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600">Ngày đề xuất</td><td style="padding:8px 12px">${item.request_date}</td></tr>
                <tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600">Mức ưu tiên</td><td style="padding:8px 12px">${priorityLabels[item.priority] || item.priority}</td></tr>
                ${item.description ? `<tr><td style="padding:8px 12px;background:#f5f5f5;font-weight:600">Mô tả</td><td style="padding:8px 12px">${item.description}</td></tr>` : ''}
            </table>
            <div style="text-align:center;margin:20px 0">
                <a href="${baseUrl}/app.html#maintenance" style="display:inline-block;background:#1a73e8;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:14px">Xem chi tiết trong hệ thống</a>
            </div>
            <p style="color:#666;font-size:12px;border-top:1px solid #e0e0e0;padding-top:12px">Email này được gửi tự động từ hệ thống TVU-ITAM. Vui lòng không trả lời email này.</p>
        </div>
    </div>`;

    await sendMail({ to: item.technician_email, subject, html });
};

const runReminderCheck = async () => {
    try {
        const [overdue, upcoming] = await Promise.all([getOverdueMaintenance(), getUpcomingMaintenance()]);

        for (const item of overdue) {
            await sendReminderEmail(item, 'overdue');
        }
        for (const item of upcoming) {
            await sendReminderEmail(item, 'upcoming');
        }

        if (overdue.length || upcoming.length) {
            console.log('[MAIL] Maintenance reminders sent: ' + overdue.length + ' overdue, ' + upcoming.length + ' upcoming');
        }
    } catch (err) {
        console.error('[ERROR] Maintenance reminder error:', err);
    }
};

const startMaintenanceReminder = () => {
    cron.schedule(CRON_SCHEDULE, () => {
        console.log('[CRON] Running maintenance reminder check at ' + new Date().toLocaleString());
        runReminderCheck();
    });
    console.log('[CRON] Maintenance reminder scheduled: ' + CRON_SCHEDULE + ' (daily at 8:00 AM)');

    runReminderCheck();
};

module.exports = { startMaintenanceReminder };
