const ExcelJS = require('exceljs');
const mysql = require('mysql2/promise');

async function run() {
  // Delete old test data
  const pool = mysql.createPool({host:'localhost',user:'root',password:'',database:'tvu_itam',connectionLimit:1});
  await pool.query("DELETE FROM devices WHERE device_code LIKE 'TVU-TEST-%'");
  console.log('Deleted old test devices');

  // Create Excel
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Devices');
  ws.addRow(['Mã tài sản', 'Tên tài sản', 'Loại', 'Hãng', 'Model', 'Serial', 'Giá trị', 'Ngày mua', 'Hạn bảo hành', 'Phòng ban', 'Trạng thái']);
  ws.addRow(['TVU-TEST-A01', 'Máy tính Dell OptiPlex 7080', 'Máy tính để bàn', 'Dell', 'OptiPlex 7080', 'SN-DELL-001', '15000000', '2026-01-15', '2028-01-15', 'Khoa CNTT', 'active']);
  ws.addRow(['TVU-TEST-A02', 'Laptop Lenovo ThinkPad X1', 'Máy tính xách tay', 'Lenovo', 'X1 Carbon Gen 9', 'SN-LEN-001', '22000000', '2026-02-20', '2028-02-20', 'Ban Giám Hiệu', 'active']);
  ws.addRow(['TVU-TEST-A03', 'Switch Cisco Catalyst 9200', 'Thiết bị mạng', 'Cisco', 'C9200-24T', 'SN-CIS-001', '35000000', '2026-03-10', '2029-03-10', 'Phòng CNTT', 'active']);
  ws.addRow(['TVU-TEST-A04', 'Máy in HP LaserJet Pro M404dn', 'Máy in', 'HP', 'M404dn', 'SN-HP-001', '5500000', '2026-04-05', '2028-04-05', 'Phòng Hành Chính', 'active']);
  ws.addRow(['TVU-TEST-A05', 'Máy chủ HPE ProLiant DL360', 'Máy chủ', 'HPE', 'DL360 Gen10', 'SN-HPE-001', '85000000', '2026-05-01', '2029-05-01', 'Phòng CNTT', 'active']);

  await wb.xlsx.writeFile('C:/Users/ADMIN/Desktop/import_mau_daydu.xlsx');
  console.log('File created: import_mau_daydu.xlsx');
  await pool.end();
}
run().catch(e => console.error('Error:', e.message, e.stack));
