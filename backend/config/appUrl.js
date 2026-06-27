const os = require('os');

/** Địa chỉ LAN để điện thoại quét QR (ưu tiên Wi-Fi, bỏ 127.0.0.1) */
const getLanIp = () => {
    const nets = os.networkInterfaces();
    const candidates = [];
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
                candidates.push({ name, address: net.address });
            }
        }
    }
    const wifi = candidates.find(c => /wi-?fi|wlan|wireless/i.test(c.name));
    return (wifi || candidates[0])?.address || '127.0.0.1';
};

/** Gán APP_URL theo IP Wi-Fi hiện tại (gọi khi khởi động server) */
const syncAppUrlFromLan = () => {
    const port = process.env.PORT || 5000;
    const lanIp = getLanIp();
    if (lanIp !== '127.0.0.1') {
        process.env.APP_URL = `http://${lanIp}:${port}`;
    }
    return process.env.APP_URL || `http://127.0.0.1:${port}`;
};

/** URL gốc cho QR / điện thoại — dùng APP_URL nếu có (ưu tiên), fallback IP LAN */
const getPublicBaseUrl = (req) => {
    const port = process.env.PORT || 5000;

    // 1. APP_URL từ .env (ví dụ: https://xxx.ngrok-free.dev)
    if (process.env.APP_URL) {
        return process.env.APP_URL.replace(/\/+$/, '');
    }

    // 2. IP LAN thật (Wi-Fi)
    const lanIp = getLanIp();
    if (lanIp !== '127.0.0.1') {
        return `http://${lanIp}:${port}`;
    }

    // 3. Từ request (dùng khi có proxy / ngrok phía trước)
    if (req) {
        const host = req.get('host');
        if (host && !host.startsWith('localhost') && !host.startsWith('127.0.0.1')) {
            return `${req.protocol}://${host}`;
        }
    }

    // 4. Fallback
    return `http://127.0.0.1:${port}`;
};

/** URL đầy đủ trong mã QR — luôn có http://, cổng và /q/<mã> */
const buildDeviceQrUrl = (deviceCode, req) => {
    const base = getPublicBaseUrl(req);
    const code = encodeURIComponent(String(deviceCode || '').trim());
    if (!code) throw new Error('Mã thiết bị không hợp lệ');
    return `${base}/q/${code}`;
};

module.exports = { getLanIp, syncAppUrlFromLan, getPublicBaseUrl, buildDeviceQrUrl };
