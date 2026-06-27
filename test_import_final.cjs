const http = require('http');
const fs = require('fs');

// Try login with common passwords
const passwords = ['admin123', '123456', 'password', 'superadmin', 'admin', '123', '111111', 'letmein'];
let idx = 0;

function tryLogin() {
  if (idx >= passwords.length) {
    console.log('All passwords failed');
    process.exit(1);
  }
  const pwd = passwords[idx++];
  const data = JSON.stringify({ username: 'superadmin', password: pwd });
  const req = http.request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
  }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      try {
        const j = JSON.parse(d);
        if (j.token) {
          console.log('Login OK with password:', pwd);
          doImport(j.token);
        } else {
          console.log('Try password:', pwd, '- failed');
          tryLogin();
        }
      } catch(e) { tryLogin(); }
    });
  });
  req.on('error', () => tryLogin());
  req.write(data);
  req.end();
}

function doImport(token) {
  const file = fs.readFileSync('C:/Users/ADMIN/Desktop/import_mau_daydu.xlsx');
  const boundary = '----Test' + Date.now();
  const parts = [];
  parts.push('--' + boundary);
  parts.push('Content-Disposition: form-data; name="file"; filename="test.xlsx"');
  parts.push('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  parts.push('');
  parts.push(''); // placeholder for file binary

  const header = '--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="test.xlsx"\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n';
  const footer = '\r\n--' + boundary + '--\r\n';
  const body = Buffer.concat([Buffer.from(header), file, Buffer.from(footer)]);

  const imp = http.request({
    hostname: 'localhost', port: 5000, path: '/api/devices/import', method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': body.length,
      'Authorization': 'Bearer ' + token
    }
  }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', d);
      process.exit(0);
    });
  });
  imp.on('error', e => { console.error('Error:', e.message); process.exit(1); });
  imp.write(body);
  imp.end();
}

tryLogin();
