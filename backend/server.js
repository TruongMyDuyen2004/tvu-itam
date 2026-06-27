require('dotenv').config({ path: __dirname + '/.env' });
if (process.platform === 'win32') {
    require('child_process').execSync('chcp 65001 > NUL', { stdio: 'ignore' });
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const { getLanIp, syncAppUrlFromLan, getPublicBaseUrl } = require('./config/appUrl');

syncAppUrlFromLan();

// Tự động phát hiện ngrok URL ở môi trường development
if (process.env.NODE_ENV !== 'production') {
    (async () => {
        try {
            const body = await new Promise((resolve, reject) => {
                http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
                    let data = '';
                    res.on('data', c => data += c);
                    res.on('end', () => resolve(data));
                }).on('error', reject);
            });
            const parsed = JSON.parse(body);
            const tunnel = parsed.tunnels?.[0]?.public_url;
            if (tunnel) {
                process.env.APP_URL = tunnel.replace(/\/+$/, '');
                console.log('[NGROK] App URL: ' + process.env.APP_URL);
            }
        } catch (_) {
            // ngrok không chạy, dùng APP_URL từ .env hoặc IP LAN
        }
    })();
}

const app = express();
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 5000;
const FRONTEND = path.join(__dirname, '../frontend');

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
    origin: '*',
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'X-Requested-With'],
    credentials: true
}));
app.use((req, res, next) => {
    res.setHeader('Content-Type-Charset', 'utf-8');
    res.setHeader('ngrok-skip-browser-warning', 'true');
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning, X-Requested-With');
        return res.status(204).end();
    }
    next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static frontend files but NOT index.html (handled by catch-all)
app.use(express.static(FRONTEND, { index: false, etag: false, lastModified: false, setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
} }));
// Always serve index.html for root
app.get('/', (req, res) => {
    console.log('[ROOT REQUEST] headers:', JSON.stringify(req.headers));
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.sendFile(path.join(FRONTEND, 'index.html'));
});

// Serve PWA files with correct headers
app.get('/service-worker.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.sendFile(path.join(FRONTEND, 'service-worker.js'));
});
app.get('/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.sendFile(path.join(FRONTEND, 'manifest.json'));
});

// Debug route — visit to see what path your phone requested
app.get('/__path', (req, res) => {
    console.log('[PHONE PATH CHECK]', req.headers['user-agent'], req.query.ref);
    res.json({ ok: true, message: 'Server nhan duoc request' });
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public API (no login — QR lookup)
app.use('/api/public', require('./routes/public'));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/users', require('./routes/users'));
app.use('/api/transfers', require('./routes/transfers'));
app.use('/api/disposals', require('./routes/disposals'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/depreciation', require('./routes/depreciation'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/warehouses', require('./routes/warehouse'));
app.use('/api', require('./routes/misc'));

// SSE: Real-time notification stream
const clients = new Map();
app.get('/api/notifications/stream', async (req, res) => {
    const token = req.query.token;
    if (!token) return res.status(401).json({ success: false, message: 'Missing token' });

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tvu-itam-secret-key-2026');
        const userId = decoded.id;

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'X-Accel-Buffering': 'no'
        });

        res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE connected' })}\n\n`);

        const clientId = userId + '-' + Date.now();
        clients.set(clientId, { userId, res });

        req.on('close', () => {
            clients.delete(clientId);
        });

        // Send notification updates every 15 seconds
        const pool = require('./config/database');
        let lastCheck = new Date();

        const interval = setInterval(async () => {
            try {
                const [notifications] = await pool.query(`
                    SELECT COUNT(*) as count FROM maintenance_schedules WHERE status IN ('cho_xu_ly','da_duyet') AND request_date < CURDATE()
                `);
                const [upcoming] = await pool.query(`
                    SELECT COUNT(*) as count FROM maintenance_schedules WHERE status IN ('cho_xu_ly','da_duyet') AND request_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                `);
                const [incidents] = await pool.query(`
                    SELECT COUNT(*) as count FROM incident_reports WHERE status IN ('open','in_progress')
                `);
                const [transfers] = await pool.query(`
                    SELECT COUNT(*) as count FROM asset_transfers WHERE status = 'pending'
                `);
                const [disposals] = await pool.query(`
                    SELECT COUNT(*) as count FROM disposals WHERE status = 'de_nghi'
                `);
                const total = notifications[0].count + upcoming[0].count + incidents[0].count + transfers[0].count + disposals[0].count;

                res.write(`event: notification\n`);
                res.write(`data: ${JSON.stringify({ total, overdue: notifications[0].count, upcoming: upcoming[0].count, incidents: incidents[0].count, transfers: transfers[0].count, disposals: disposals[0].count })}\n\n`);

                // Send heartbeat every 15 seconds
                res.write(`:heartbeat\n\n`);
            } catch (err) {
                // ignore errors during polling
            }
        }, 15000);

        req.on('close', () => {
            clearInterval(interval);
        });

    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
});

// Broadcast event to all connected clients of a user (for future use)
const broadcastToUser = (userId, event, data) => {
    clients.forEach((client) => {
        if (client.userId === userId) {
            try {
                client.res.write(`event: ${event}\n`);
                client.res.write(`data: ${JSON.stringify(data)}\n\n`);
            } catch (e) {
                // ignore
            }
        }
    });
};

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'TVU-ITAM API is running', version: '1.0.0', timestamp: new Date() });
});

// Serve app.html explicitly (bypass express.static cache)
app.get('/app.html', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.sendFile(path.join(FRONTEND, 'app.html'));
});

// Public QR / device lookup pages (no login)
const PUBLIC_DEVICE_PAGE = path.join(FRONTEND, 'public-device.html');
const publicQrCtrl = require('./controllers/publicController');

const servePublicDevice = (req, res, next) => {
    publicQrCtrl.renderDevicePage(req, res, PUBLIC_DEVICE_PAGE);
};
app.get('/q/:code', servePublicDevice);
app.get('/qr/:code', servePublicDevice);
app.get('/device/:id', servePublicDevice);
app.get('/test-qr.html', (req, res) => {
    res.sendFile(path.join(FRONTEND, 'test-qr.html'));
});

// Serve index.html for all other non-API, non-file routes
app.get(/^\/(?!api|assets|database|qr|device|q).*$/, (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.sendFile(path.join(FRONTEND, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Ensure required tables exist at startup
(async () => {
    const pool = require('./config/database');
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                email VARCHAR(255) NOT NULL,
                token VARCHAR(255) NOT NULL UNIQUE,
                expires_at DATETIME NOT NULL,
                used TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS login_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                username VARCHAR(150) NOT NULL,
                success TINYINT(1) DEFAULT 0,
                ip_address VARCHAR(45),
                user_agent TEXT,
                message VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        // Inventory tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                inventory_code VARCHAR(20) NOT NULL,
                title VARCHAR(255) NOT NULL,
                inventory_date DATE NOT NULL,
                department_id INT NULL,
                quarter TINYINT NULL,
                year SMALLINT NULL,
                notes TEXT,
                status ENUM('draft','in_progress','completed','cancelled') DEFAULT 'draft',
                total_devices INT DEFAULT 0,
                checked_devices INT DEFAULT 0,
                found_devices INT DEFAULT 0,
                missing_devices INT DEFAULT 0,
                damaged_devices INT DEFAULT 0,
                transferred_devices INT DEFAULT 0,
                created_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        // Warehouse tables
        await pool.query(`ALTER TABLE devices MODIFY COLUMN status ENUM('active','maintenance','broken','disposed','inactive','in_stock') NOT NULL DEFAULT 'active'`);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS warehouses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                warehouse_code VARCHAR(20) NOT NULL,
                name VARCHAR(255) NOT NULL,
                address TEXT,
                manager_name VARCHAR(255),
                notes TEXT,
                created_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory_receipts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                receipt_code VARCHAR(20) NOT NULL,
                receipt_date DATE NOT NULL,
                warehouse_id INT NOT NULL,
                supplier_name VARCHAR(255),
                notes TEXT,
                total_items INT DEFAULT 0,
                created_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory_receipt_details (
                id INT AUTO_INCREMENT PRIMARY KEY,
                receipt_id INT NOT NULL,
                device_id INT NOT NULL,
                unit_price DECIMAL(12,2) DEFAULT 0,
                notes TEXT,
                FOREIGN KEY (receipt_id) REFERENCES inventory_receipts(id) ON DELETE CASCADE,
                FOREIGN KEY (device_id) REFERENCES devices(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory_issues (
                id INT AUTO_INCREMENT PRIMARY KEY,
                issue_code VARCHAR(20) NOT NULL,
                issue_date DATE NOT NULL,
                warehouse_id INT NOT NULL,
                department_id INT NULL,
                recipient_name VARCHAR(255),
                notes TEXT,
                total_items INT DEFAULT 0,
                created_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
                FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory_issue_details (
                id INT AUTO_INCREMENT PRIMARY KEY,
                issue_id INT NOT NULL,
                device_id INT NOT NULL,
                notes TEXT,
                FOREIGN KEY (issue_id) REFERENCES inventory_issues(id) ON DELETE CASCADE,
                FOREIGN KEY (device_id) REFERENCES devices(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        await pool.query(`
            CREATE TABLE IF NOT EXISTS inventory_details (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id INT NOT NULL,
                device_id INT NOT NULL,
                system_status VARCHAR(50),
                actual_status ENUM('found','missing','damaged','transferred') DEFAULT NULL,
                system_location VARCHAR(200),
                actual_location VARCHAR(200),
                notes TEXT,
                checked_by INT NULL,
                checked_at TIMESTAMP NULL,
                FOREIGN KEY (session_id) REFERENCES inventory_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (device_id) REFERENCES devices(id),
                FOREIGN KEY (checked_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        // Ensure disposal report columns exist
        try {
            await pool.query(`ALTER TABLE disposals ADD COLUMN report_number VARCHAR(50) NULL AFTER notes`);
        } catch (_) {}
        try {
            await pool.query(`ALTER TABLE disposals ADD COLUMN report_date DATE NULL AFTER report_number`);
        } catch (_) {}
        try {
            await pool.query(`ALTER TABLE disposals ADD COLUMN report_notes TEXT NULL AFTER report_date`);
        } catch (_) {}
        console.log('[OK] Required tables ensured');
    } catch (err) {
        console.error('[ERROR] Failed to create tables:', err.message);
    }
})();

// Start maintenance reminder cron job
const { startMaintenanceReminder } = require('./services/maintenanceReminder');
startMaintenanceReminder();

app.listen(PORT, HOST, () => {
    const lanIp = getLanIp();
    const publicBase = syncAppUrlFromLan();
    console.log('');
    console.log('========================================');
    console.log('  TVU-ITAM - IP Wi-Fi: ' + lanIp);
    console.log('========================================');
    console.log('  Laptop:     http://localhost:' + PORT + '/app.html');
    console.log('  Phone:      ' + publicBase + '/q/MA-THIET-BI');
    console.log('  (Must have http:// - DO NOT use 192.168.1.6)');
    console.log('========================================');
    console.log('');
});

module.exports = app;

