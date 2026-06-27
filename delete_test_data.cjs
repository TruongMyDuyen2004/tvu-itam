const mysql = require('mysql2/promise');
async function run() {
  const pool = mysql.createPool({host:'localhost',user:'root',password:'',database:'tvu_itam',connectionLimit:1});
  const [res] = await pool.query("DELETE FROM devices WHERE device_code LIKE 'TVU-TEST-%'");
  console.log('Deleted ' + res.affectedRows + ' test devices');
  await pool.end();
}
run().catch(e => console.error(e));
