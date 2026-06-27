const pool = require('../config/database');

const recordAudit = async ({ user_id, action, entity_type, entity_id = null, old_data = null, new_data = null, req = null }) => {
    try {
        const ip_address = req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req?.ip || null;
        const user_agent = req?.headers?.['user-agent'] || null;
        await pool.query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, action, entity_type, entity_id, JSON.stringify(old_data || null), JSON.stringify(new_data || null), ip_address, user_agent]
        );
    } catch (err) {
        console.error('Audit log failed:', err);
    }
};

module.exports = { recordAudit };