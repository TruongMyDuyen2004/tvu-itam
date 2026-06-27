const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
async function run() {
  const pool = mysql.createPool({host:'localhost',user:'root',password:'',database:'tvu_itam',connectionLimit:1});
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = 1', [hash]);
  console.log('Password reset to: admin123');
  await pool.end();
}
run().catch(e => console.error(e));
