const pool = require('../config/database');

const defaultSettings = {
    maintenance_notification_enabled: '1',
    maintenance_default_interval_days: '90',
    notification_email: '',
    login_alerts_enabled: '1'
};

const ensureSettingsTable = async () => {
    await pool.query(
        'CREATE TABLE IF NOT EXISTS system_settings (' +
        ' `key` VARCHAR(100) PRIMARY KEY,' +
        ' `value` TEXT,' +
        ' description TEXT,' +
        ' updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' +
        ' )'
    );
};

const getSettings = async (req, res) => {
    try {
        await ensureSettingsTable();
        const [rows] = await pool.query('SELECT `key`, `value` FROM system_settings');
        const data = { ...defaultSettings };
        rows.forEach(row => {
            data[row.key] = row.value;
        });
        return res.json({ success: true, data });
    } catch (err) {
        console.error('Get settings error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi khi tải cài đặt hệ thống' });
    }
};

const updateSettings = async (req, res) => {
    const updates = req.body || {};
    const validKeys = Object.keys(defaultSettings);
    const changes = Object.keys(updates).filter(key => validKeys.includes(key));
    if (!changes.length) {
        return res.status(400).json({ success: false, message: 'Không có cài đặt hợp lệ để cập nhật' });
    }

    await ensureSettingsTable();
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        for (const key of changes) {
            const value = updates[key] == null ? '' : String(updates[key]);
            await connection.query(
                'INSERT INTO system_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
                [key, value]
            );
        }
        await connection.commit();

        const [rows] = await pool.query('SELECT `key`, `value` FROM system_settings');
        const data = { ...defaultSettings };
        rows.forEach(row => { data[row.key] = row.value; });
        return res.json({ success: true, message: 'Cập nhật cài đặt thành công', data });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Update settings error:', err);
        return res.status(500).json({ success: false, message: 'Lỗi khi lưu cài đặt hệ thống' });
    } finally {
        if (connection) connection.release();
    }
};

module.exports = { getSettings, updateSettings };