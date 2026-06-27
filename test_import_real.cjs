const http = require('http');
const fs = require('fs');
const path = require('path');

// Use the token from an existing session
// The user has an active session, so let's try the API directly
// First, login
const login = JSON.stringify({ username: 'superadmin', password: '123' });

const loginReq = http.request({
  hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(login) }
}, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const j = JSON.parse(data);
      if (!j.token) {
        // Try admin
        const login2 = JSON.stringify({ username: 'admin', password: '123' });
        const r2 = http.request({ hostname:'localhost', port:5000, path:'/api/auth/login', method:'POST',
          headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(login2)} }, (res2) => {
          let d2 = '';
          res2.on('data', c => d2 += c);
          res2.on('end', () => {
            try {
              const j2 = JSON.parse(d2);
              if (j2.token) doImport(j2.token);
              else { console.log('Login fail. Response:', d2); doImport('test'); }
            } catch(e) { console.log('Parse error:', e.message); }
          });
        });
        r2.write(login2); r2.end();
      } else {
        doImport(j.token);
      }
    } catch(e) { console.log('Parse error:', e.message); }
  });
});
loginReq.write(login);
loginReq.end();

function doImport(token) {
  const file = fs.readFileSync('C:/Users/ADMIN/Desktop/import_mau_daydu.xlsx');
  const boundary = '----Boundary' + Date.now();
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
  imp.on('error', e => { console.log('Error:', e.message); process.exit(1); });
  imp.write(body);
  imp.end();
}
