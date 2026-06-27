const os = require('os');
const nets = os.networkInterfaces();
console.log('');
console.log('=== Địa chỉ IP của máy tính bạn ===');
console.log('');
let found = false;
for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
            console.log(`  ${name}: ${net.address}`);
            found = true;
        }
    }
}
if (!found) {
    console.log('  (Không tìm thấy kết nối mạng)');
}
console.log('');
console.log('📱 Dùng trên iPhone: http://<IP>:5000');
console.log('');
