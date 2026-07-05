const pool = require('./backend/config/database');

(async () => {
    try {
        await pool.query("ALTER TABLE devices ADD COLUMN qr_status ENUM('pending','printed','assigned') DEFAULT 'pending' AFTER status");
        console.log('Added qr_status column');
    } catch(e) {
        if (e.message.includes('Duplicate column')) {
            console.log('Column already exists');
        } else {
            console.error('Error:', e.message);
        }
    }
    process.exit(0);
})();
