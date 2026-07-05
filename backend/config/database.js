const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tvu_itam',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+07:00',
    charset: 'utf8mb4',
    ssl: process.env.DB_SSL === 'true' ? {} : false
});

// Ensure UTF-8 Vietnamese support
pool.on('connection', (connection) => {
    connection.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
});

pool.getConnection()
    .then(async conn => {
        await conn.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
        console.log('[OK] MySQL connected successfully (UTF-8 Vietnamese support enabled)');
        conn.release();
    })
    .catch(err => {
        console.error('[ERROR] MySQL connection failed:', err.message);
    });

module.exports = pool;
