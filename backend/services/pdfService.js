const PDFDocument = require('pdfkit');
const fs = require('fs');

const FONT_PATH = 'C:/Windows/Fonts/times.ttf';
const FONT_BOLD_PATH = 'C:/Windows/Fonts/timesbd.ttf';
const FONT_ITALIC_PATH = 'C:/Windows/Fonts/timesi.ttf';

const ML = 50, MR = 50, PW = 595.28, CW = PW - ML - MR;

const fmt = {
  currency: v => v ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v) : '0 VND',
  date: v => {
    if (!v) return '—';
    const d = new Date(v);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  },
  dateLong: v => {
    if (!v) return '——';
    const d = new Date(v);
    return `Vĩnh Long, ngày ${String(d.getDate()).padStart(2, '0')} tháng ${String(d.getMonth() + 1).padStart(2, '0')} năm ${d.getFullYear()}`;
  },
};

const statusLabel = { active:'Đang dùng', maintenance:'Bảo trì', broken:'Hỏng', disposed:'Thanh lý', inactive:'Không dùng' };
const transferStatus = { pending:'Chờ duyệt', approved:'Đã duyệt', rejected:'Từ chối' };
const maintStatus = { cho_xu_ly:'Chờ xử lý', da_duyet:'Đã duyệt', dang_thuc_hien:'Đang thực hiện', hoan_thanh:'Hoàn thành', huy:'Hủy' };
const maintPriority = { low:'Thấp', medium:'Trung bình', high:'Cao', critical:'Khẩn cấp' };
const maintType = { dinh_ky:'Định kỳ', dot_xuat:'Đột xuất' };
const maintResult = { da_sua:'Đã sửa', khong_sua_duoc:'Không sửa được' };

const calcCurrentValue = (price, date, rate = 0.20) => {
  if (!price || !date) return 0;
  const pd = new Date(date);
  const now = new Date();
  const years = Math.max(0, Math.floor((now - pd) / (365.25 * 24 * 60 * 60 * 1000)));
  const annualDep = price * rate;
  const totalDep = Math.min(annualDep * years, price);
  return Math.max(0, Math.round(price - totalDep));
};

function createDoc() {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const font = fs.existsSync(FONT_PATH) ? FONT_PATH : undefined;
  const fontBold = fs.existsSync(FONT_BOLD_PATH) ? FONT_BOLD_PATH : undefined;
  const fontItalic = fs.existsSync(FONT_ITALIC_PATH) ? FONT_ITALIC_PATH : undefined;
  if (font) doc.registerFont('custom', font);
  if (fontBold) doc.registerFont('custom-bold', fontBold);
  if (fontItalic) doc.registerFont('custom-italic', fontItalic);
  const f = font ? 'custom' : 'Helvetica';
  const fb = fontBold ? 'custom-bold' : 'Helvetica-Bold';
  const fi = fontItalic ? 'custom-italic' : 'Helvetica-Oblique';
  let pageNum = 0;
  doc.on('pageAdded', () => {
    pageNum++;
    if (pageNum >= 1) {
      doc.font(f).fontSize(9).fillColor('#666').text(String(pageNum + 1), ML, 776, { align: 'center', width: CW });
      doc.fillColor('#000');
    }
  });
  return { doc, f, fb, fi };
}

function drawHeader(doc, f, fb, fi, docNum, title) {
  const Y0 = 35;
  const leftText = 'ỦY BAN NHÂN DÂN TỈNH VĨNH LONG';
  const rightText = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
  doc.font(fb).fontSize(11);
  doc.text(leftText, ML, Y0);
  doc.text(rightText, ML + CW - doc.widthOfString(rightText), Y0);

  const schoolText = 'ĐẠI HỌC TRÀ VINH';
  const schoolWidth = doc.widthOfString(schoolText);
  const leftWidth = doc.widthOfString(leftText);
  const sx = ML + (leftWidth - schoolWidth) / 2;
  const ulPad = 8;
  doc.text(schoolText, sx, Y0 + 18);
  doc.moveTo(sx + ulPad, Y0 + 32).lineTo(sx + schoolWidth - ulPad, Y0 + 32).stroke();

  const mottoText = 'Độc lập – Tự do – Hạnh phúc';
  const mottoWidth = doc.widthOfString(mottoText);
  const rightWidth = doc.widthOfString(rightText);
  const mtx = ML + CW - rightWidth + (rightWidth - mottoWidth) / 2;
  doc.text(mottoText, mtx, Y0 + 18);
  doc.moveTo(mtx + ulPad, Y0 + 32).lineTo(mtx + mottoWidth - ulPad, Y0 + 32).stroke();

  doc.font(f).fontSize(10);
  doc.text('BAN CÔNG NGHỆ THÔNG TIN', ML, Y0 + 42);

  doc.font(f).fontSize(10);
  doc.text(`Số: ${docNum}`, ML, Y0 + 60);
  doc.font(fi).fontSize(10);
  const dl = fmt.dateLong(new Date());
  doc.text(dl, ML + CW - doc.widthOfString(dl), Y0 + 60);

  doc.font(fb).fontSize(16).text(title, ML, Y0 + 82, { align: 'center', width: CW });
  return Y0 + 102;
}

function drawRow(doc, f, fb, label, value, curY) {
  doc.font(fb).fontSize(10).text(label, ML, curY, { width: 115 });
  doc.font(f).text(`: ${value}`, ML + 115, curY, { width: CW - 115, align: 'left' });
}

function drawSection(doc, fb, title, curY) {
  doc.font(fb).fontSize(12).text(title, ML, curY);
}

function drawSignature(doc, f, fb, sigY, labels) {
  const n = labels.length;
  const colW = CW / n;
  doc.font(fb).fontSize(11);
  labels.forEach((l, i) => {
    doc.text(l, ML + colW * i, sigY, { align: 'center', width: colW });
  });
  doc.font(f).fontSize(10);
  const subY = sigY + 32;
  const subText = '(Ký, ghi rõ họ tên)';
  labels.forEach((l, i) => {
    const isLast = i === labels.length - 1;
    doc.text(subText, ML + colW * i, subY, { align: 'center', width: colW, lineBreak: isLast });
  });
}

function drawFooter(doc, f) {
  doc.font(f).fontSize(8).fillColor('#888');
  doc.text('Biên bản được tạo từ hệ thống TVU-ITAM — Đại học Trà Vinh', ML, 750, { align: 'center', width: CW });
  doc.text(`In ngày: ${fmt.date(new Date())}`, ML, 762, { align: 'center', width: CW });
  doc.fillColor('#000');
}

const disposalMethod = { ban_thanh_ly:'Bán thanh lý', tieu_huy:'Tiêu hủy', dieu_chuyen_noi_bo:'Điều chuyển nội bộ', mat_tai_san:'Mất tài sản', hu_hong_khong_sd_duoc:'Hư hỏng không SD được', khac:'Khác' };
const disposalStatus = { de_nghi:'Đề nghị', dang_kiem_tra:'Đang kiểm tra', cho_phe_duyet:'Chờ phê duyệt', da_duyet:'Đã duyệt', da_thanh_ly:'Đã thanh lý', tu_choi:'Từ chối' };

// =========================================================================
// 1. Biên bản thanh lý
// =========================================================================
const generateDisposalReport = (record) => {
  return new Promise((resolve, reject) => {
    try {
      const { doc, f, fb, fi } = createDoc();
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      let curY = drawHeader(doc, f, fb, fi, `BB-TL-${String(record.id).padStart(4, '0')}`, 'BIÊN BẢN THANH LÝ TÀI SẢN');
      drawSection(doc, fb, 'I. THÔNG TIN TÀI SẢN', curY); curY += 20;
      [['Mã tài sản', record.device_code || '—'],
       ['Tên tài sản', record.device_name || '—'],
       ['Nhãn hiệu', record.brand || '—'],
       ['Model', record.model || '—'],
       ['Số Serial', record.serial_number || '—'],
       ['Nguyên giá', record.purchase_price ? fmt.currency(record.purchase_price) : '—'],
       ['Giá trị còn lại', record.current_value ? fmt.currency(record.current_value) : '—'],
       ['Tình trạng', record.asset_condition || '—'],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 6;
      drawSection(doc, fb, 'II. THÔNG TIN THANH LÝ', curY); curY += 20;
      [['Số phiếu', record.disposal_code || '—'],
       ['Ngày đề nghị', record.proposal_date ? fmt.date(record.proposal_date) : '—'],
       ['Ngày kiểm kê', record.inspection_date ? fmt.date(record.inspection_date) : '—'],
       ['Quyết định số', record.decision_number || '—'],
       ['Ngày quyết định', record.decision_date ? fmt.date(record.decision_date) : '—'],
       ['Ngày thanh lý', record.disposal_date ? fmt.date(record.disposal_date) : '—'],
       ['Hình thức', disposalMethod[record.disposal_method] || record.disposal_method],
       ['Giá trị thu hồi', record.recovery_value ? fmt.currency(record.recovery_value) : '—'],
       ['Hội đồng', record.council || '—'],
       ['Đơn vị tiếp nhận', record.handover_unit || '—'],
       ['Lý do', record.reason || '—'],
       ['Ghi chú', record.notes || '—'],
       ['Trạng thái', disposalStatus[record.status] || record.status],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 6;
      drawSection(doc, fb, 'III. PHÊ DUYỆT', curY); curY += 20;
      [['Người tạo', record.created_by_name || '—'],
       ['Người phê duyệt', record.approved_by_name || '—'],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 10;
      drawSignature(doc, f, fb, Math.max(curY, 640), ['NGƯỜI LẬP BIÊN BẢN', 'THỦ TRƯỞNG ĐƠN VỊ']);
      drawFooter(doc, f);
      doc.end();
    } catch (err) { reject(err); }
  });
};

// =========================================================================
// 2. Báo cáo kết quả thanh lý
// =========================================================================
const generateDisposalResultReport = (record) => {
  return new Promise((resolve, reject) => {
    try {
      const { doc, f, fb, fi } = createDoc();
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      let curY = drawHeader(doc, f, fb, fi, `BC-TL-${String(record.id).padStart(4, '0')}`, 'BÁO CÁO KẾT QUẢ THANH LÝ TÀI SẢN');
      drawSection(doc, fb, 'I. THÔNG TIN TÀI SẢN', curY); curY += 20;
      [['Mã tài sản', record.device_code || '—'],
       ['Tên tài sản', record.device_name || '—'],
       ['Nhãn hiệu', record.brand || '—'],
       ['Model', record.model || '—'],
       ['Số Serial', record.serial_number || '—'],
       ['Nguyên giá', record.purchase_price ? fmt.currency(record.purchase_price) : '—'],
       ['Giá trị còn lại', record.current_value ? fmt.currency(record.current_value) : '—'],
       ['Tình trạng trước TL', record.asset_condition || '—'],
       ['Phòng ban', record.department_name || '—'],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 6;
      drawSection(doc, fb, 'II. THÔNG TIN THANH LÝ', curY); curY += 20;
      [['Số phiếu thanh lý', record.disposal_code || '—'],
       ['Quyết định số', record.decision_number || '—'],
       ['Ngày quyết định', record.decision_date ? fmt.date(record.decision_date) : '—'],
       ['Ngày thanh lý', record.disposal_date ? fmt.date(record.disposal_date) : '—'],
       ['Hình thức thanh lý', disposalMethod[record.disposal_method] || record.disposal_method],
       ['Hội đồng thanh lý', record.council || '—'],
       ['Đơn vị tiếp nhận', record.handover_unit || '—'],
       ['Giá trị thu hồi', record.recovery_value ? fmt.currency(record.recovery_value) : '—'],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 6;
      drawSection(doc, fb, 'III. KẾT QUẢ THANH LÝ', curY); curY += 20;
      [['Tình trạng', disposalStatus[record.status] || record.status],
       ['Giá trị thu hồi', record.recovery_value ? fmt.currency(record.recovery_value) : '0 VND'],
       ['Phương thức xử lý', disposalMethod[record.disposal_method] || record.disposal_method],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 6;
      drawSection(doc, fb, 'IV. THÔNG TIN BÁO CÁO', curY); curY += 20;
      [['Số báo cáo', record.report_number || '—'],
       ['Ngày báo cáo', record.report_date ? fmt.date(record.report_date) : fmt.date(new Date())],
       ['Ghi chú', record.report_notes || '—'],
       ['Căn cứ', 'Thông tư 144/2017/TT-BTC về thanh lý tài sản công'],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 6;
      drawSection(doc, fb, 'V. PHÊ DUYỆT', curY); curY += 20;
      [['Người lập biên bản', record.created_by_name || '—'],
       ['Người duyệt', record.approved_by_name || '—'],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 10;
      drawSignature(doc, f, fb, Math.max(curY, 640), ['NGƯỜI LẬP BÁO CÁO', 'KẾ TOÁN TRƯỞNG', 'THỦ TRƯỞNG ĐƠN VỊ']);
      drawFooter(doc, f);
      doc.end();
    } catch (err) { reject(err); }
  });
};

// =========================================================================
// 3. Phiếu bàn giao
// =========================================================================
const generateTransferReport = (transfer, devices) => {
  return new Promise((resolve, reject) => {
    try {
      const { doc, f, fb, fi } = createDoc();
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const device = devices.find(d => d.id === transfer.device_id) || {};
      let curY = drawHeader(doc, f, fb, fi, `BB-BG-${String(transfer.id).padStart(4, '0')}`, 'BIÊN BẢN BÀN GIAO TÀI SẢN');
      drawSection(doc, fb, 'I. THÔNG TIN TÀI SẢN', curY); curY += 20;
      [['Mã tài sản', transfer.device_code || device.device_code || '—'],
       ['Tên tài sản', transfer.device_name || device.name || '—'],
       ['Nhãn hiệu', device.brand || '—'],
       ['Model', device.model || '—'],
       ['Số Serial', device.serial_number || '—'],
       ['Ngày mua', fmt.date(device.purchase_date)],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 6;
      drawSection(doc, fb, 'II. THÔNG TIN BÀN GIAO', curY); curY += 20;
      [['Người bàn giao', transfer.from_name || '—'],
       ['Người nhận', transfer.to_name || '—'],
       ['Ngày bàn giao', fmt.date(transfer.transfer_date)],
       ['Địa điểm', transfer.location || '—'],
       ['Ghi chú', transfer.notes || '—'],
       ['Trạng thái', transferStatus[transfer.status] || transfer.status],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 6;
      drawSection(doc, fb, 'III. XÁC NHẬN', curY); curY += 20;
      [['Người lập', transfer.created_by_name || '—'],
       ['Phê duyệt', transfer.approved_by_name || '—'],
       ['Ngày duyệt', fmt.date(transfer.updated_at || transfer.created_at)],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 10;
      drawSignature(doc, f, fb, Math.max(curY, 640), ['NGƯỜI BÀN GIAO', 'NGƯỜI NHẬN', 'THỦ TRƯỞNG ĐƠN VỊ']);
      drawFooter(doc, f);
      doc.end();
    } catch (err) { reject(err); }
  });
};

// =========================================================================
// 3. Biên bản bảo trì
// =========================================================================
const generateMaintenanceReport = (record, device) => {
  return new Promise((resolve, reject) => {
    try {
      const { doc, f, fb, fi } = createDoc();
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      let curY = drawHeader(doc, f, fb, fi, `BB-BT-${String(record.id).padStart(4, '0')}`, 'BIÊN BẢN BẢO TRÌ SỬA CHỮA');
      drawSection(doc, fb, 'I. THÔNG TIN THIẾT BỊ', curY); curY += 20;
      [['Mã tài sản', record.device_code || device?.device_code || '—'],
       ['Tên tài sản', record.device_name || device?.name || '—'],
       ['Nhãn hiệu', device?.brand || '—'],
       ['Model', device?.model || '—'],
       ['Số Serial', device?.serial_number || '—'],
       ['Trạng thái', statusLabel[record.device_status || device?.status] || '—'],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 6;
      drawSection(doc, fb, 'II. THÔNG TIN BẢO TRÌ', curY); curY += 20;
      [['Mã phiếu', record.maintenance_code || '—'],
       ['Loại bảo trì', maintType[record.maintenance_type] || record.maintenance_type],
       ['Ngày đề xuất', fmt.date(record.request_date)],
       ['Ngày bắt đầu', record.start_date ? fmt.date(record.start_date) : '—'],
       ['Ngày hoàn thành', record.actual_date ? fmt.date(record.actual_date) : '—'],
       ['Kỹ thuật viên', record.technician_name || '—'],
       ['Người phê duyệt', record.approver_name || '—'],
       ['Mức ưu tiên', maintPriority[record.priority] || record.priority],
       ['Trạng thái', maintStatus[record.status] || record.status],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 6;
      drawSection(doc, fb, 'III. NỘI DUNG & KẾT QUẢ', curY); curY += 20;
      [['Mô tả sự cố', record.description || '—'],
       ['Kết quả', maintResult[record.result] || record.result || '—'],
       ['Ghi chú', record.notes || '—'],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 6;
      drawSection(doc, fb, 'IV. CHI PHÍ', curY); curY += 20;
      drawRow(doc, f, fb, 'Chi phí', record.cost ? fmt.currency(record.cost) : '—', curY); curY += 16;
      curY += 10;
      drawSignature(doc, f, fb, Math.max(curY, 640), ['KỸ THUẬT VIÊN', 'PHỤ TRÁCH', 'PHÊ DUYỆT']);
      drawFooter(doc, f);
      doc.end();
    } catch (err) { reject(err); }
  });
};

// =========================================================================
// 4. Danh sách thiết bị
// =========================================================================
const generateDeviceList = (devices, filters) => {
  return new Promise((resolve, reject) => {
    try {
      const { doc, f, fb, fi } = createDoc();
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      let curY = drawHeader(doc, f, fb, fi, `DS-TB-${fmt.date(new Date()).replace(/\//g, '')}`, 'DANH SÁCH THIẾT BỊ');
      if (filters && Object.keys(filters).length) {
        const flt = Object.entries(filters).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' | ');
        doc.font(f).fontSize(9).text(`Bộ lọc: ${flt}`, ML, curY); curY += 16;
      }
      doc.font(f).fontSize(9).text(`Tổng số: ${devices.length} thiết bị`, ML, curY); curY += 14;

      const columns = ['STT', 'Mã TS', 'Tên thiết bị', 'Loại', 'Phòng ban', 'Trạng thái', 'Ngày mua', 'Giá trị'];
      const colW = [20, 50, 120, 55, 65, 48, 55, 82.28];
      colW[colW.length - 1] = CW - colW.slice(0, -1).reduce((a, b) => a + b, 0);

      const xPos = [ML];
      for (let i = 0; i < colW.length; i++) xPos.push(xPos[i] + colW[i]);

      const tableTop = curY;
      const headerH = 14;
      doc.font(fb).fontSize(8);
      columns.forEach((col, i) => {
        doc.text(col, xPos[i] + 1, curY + 4, { width: colW[i] - 2, align: 'center' });
      });
      curY += headerH;

      const rows = [];
      devices.forEach((d, idx) => {
        const vals = [idx + 1, d.device_code, d.name, d.category_name || '—', d.department_name || '—', statusLabel[d.status] || d.status, fmt.date(d.purchase_date), fmt.currency(d.purchase_price)];
        let rowHeight = 11;
        vals.forEach((val, i) => {
          const pad = i === 2 ? 4 : 2;
          const h = doc.heightOfString(String(val), { width: colW[i] - pad });
          if (h > rowHeight) rowHeight = h;
        });
        rows.push({ vals, rowHeight });
      });

      let pageY = curY;
      let currentPageTop = tableTop;

      rows.forEach(({ vals, rowHeight }) => {
        if (pageY + rowHeight > 740) {
          finishTable(doc, fb, xPos, currentPageTop, pageY - 4, headerH);
          doc.addPage();
          currentPageTop = 50;
          drawTableHeader(doc, fb, columns, xPos, 50, headerH);
          pageY = 50 + headerH + 2;
        }
        doc.font(f).fontSize(8);
        vals.forEach((val, i) => {
          doc.text(String(val), xPos[i] + (i === 2 ? 4 : 2), pageY, { width: colW[i] - (i === 2 ? 4 : 2), align: i === 0 || i === 6 ? 'center' : 'left' });
        });
        pageY += rowHeight + 4;
        doc.moveTo(ML, pageY - 4).lineTo(ML + CW, pageY - 4).lineWidth(0.3).stroke();
      });

      const bottom = pageY - 4;
      finishTable(doc, fb, xPos, currentPageTop, bottom, headerH);

      curY = bottom + 10;
      doc.font(fb).fontSize(9).text(`Tổng giá trị: ${fmt.currency(devices.reduce((s, d) => s + (Number(d.purchase_price) || 0), 0))}`, ML, curY);
      curY += 14;
      doc.font(f).fontSize(9).text(`Đang dùng: ${devices.filter(d => d.status === 'active').length}  |  Bảo trì: ${devices.filter(d => d.status === 'maintenance').length}  |  Hỏng: ${devices.filter(d => d.status === 'broken').length}  |  Thanh lý: ${devices.filter(d => d.status === 'disposed').length}`, ML, curY);

      drawFooter(doc, f);
      doc.end();
    } catch (err) { reject(err); }
  });
};

function finishTable(doc, fb, xPos, top, bottom, headerH) {
  doc.moveTo(ML, top).lineTo(ML + CW, top).lineWidth(0.8).stroke();
  doc.moveTo(ML, top + headerH).lineTo(ML + CW, top + headerH).lineWidth(0.8).stroke();
  doc.moveTo(ML, bottom).lineTo(ML + CW, bottom).lineWidth(0.8).stroke();
  xPos.forEach((x) => doc.moveTo(x, top).lineTo(x, bottom).lineWidth(0.6).stroke());
}

function drawTableHeader(doc, fb, columns, xPos, y, headerH) {
  doc.font(fb).fontSize(8);
  columns.forEach((col, i) => {
    doc.text(col, xPos[i] + 1, y + 4, { width: xPos[i + 1] - xPos[i] - 2, align: 'center' });
  });
  doc.moveTo(ML, y).lineTo(ML + CW, y).lineWidth(0.8).stroke();
  doc.moveTo(ML, y + headerH).lineTo(ML + CW, y + headerH).lineWidth(0.8).stroke();
  xPos.forEach((x) => doc.moveTo(x, y).lineTo(x, y + headerH).lineWidth(0.6).stroke());
}

// =========================================================================
// 5. Báo cáo khấu hao
// =========================================================================
const generateDepreciationReport = (devices) => {
  return new Promise((resolve, reject) => {
    try {
      const { doc, f, fb, fi } = createDoc();
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      let curY = drawHeader(doc, f, fb, fi, `BC-KH-${fmt.date(new Date()).replace(/\//g, '')}`, 'BÁO CÁO KHẤU HAO TÀI SẢN');
      drawSection(doc, fb, 'THÔNG TIN KHẤU HAO', curY); curY += 20;

      const columns = ['STT', 'Mã TS', 'Tên thiết bị', 'Ngày mua', 'Nguyên giá', 'TG KH', 'Đã dùng', 'Hao mòn', 'Giá trị còn lại'];
      const colW = [18, 52, 115, 42, 55, 30, 30, 55, 52];
      colW[colW.length - 1] = CW - colW.slice(0, -1).reduce((a, b) => a + b, 0);

      const xPos = [ML];
      for (let i = 0; i < colW.length; i++) xPos.push(xPos[i] + colW[i]);

      const rowH = 11;
      const pageLimit = 720;
      let totalOriginal = 0;
      let totalDep = 0;
      let totalRemain = 0;
      let headerTop = curY;

      function drawTableHeader(y) {
        doc.font(fb).fontSize(7);
        columns.forEach((col, i) => doc.text(col, xPos[i], y, { width: colW[i], align: 'center', ellipsis: true }));
        const hBot = y + rowH;
        doc.moveTo(ML, y).lineTo(ML + CW, y).lineWidth(0.8).stroke();
        doc.moveTo(ML, hBot).lineTo(ML + CW, hBot).lineWidth(0.8).stroke();
        xPos.forEach((x) => doc.moveTo(x, y).lineTo(x, hBot).lineWidth(0.6).stroke());
        return hBot;
      }

      function closeTable(y, startY) {
        doc.moveTo(ML, y).lineTo(ML + CW, y).lineWidth(0.8).stroke();
      }

      curY = drawTableHeader(curY);

      devices.forEach((d, idx) => {
        if (curY > pageLimit) {
          closeTable(curY, headerTop);
          doc.addPage();
          curY = drawTableHeader(50);
          headerTop = curY - rowH;
        }
        const pd = d.purchase_date ? new Date(d.purchase_date) : new Date();
        const years = Math.max(0, Math.floor((new Date() - pd) / (365.25 * 24 * 60 * 60 * 1000)));
        let rate;
        if (d.useful_life_years && d.useful_life_years > 0) {
            rate = 1 / d.useful_life_years;
        } else if (d.depreciation_rate != null) {
            const r = String(d.depreciation_rate).replace('%', '');
            rate = (Number(r) || 0) / 100;
        } else {
            rate = 0.20;
        }
        const annualDep = (d.purchase_price || 0) * rate;
        const dep = Math.max(0, Math.min(Math.round(annualDep * years), d.purchase_price || 0));
        const cv = Math.max(0, Math.round((d.purchase_price || 0) - dep));
        const pct = Math.round(rate * 100);
        const lifeYears = d.useful_life_years || (rate > 0 ? Math.round(1 / rate) : 5);
        totalOriginal += Number(d.purchase_price) || 0;
        totalDep += dep;
        totalRemain += cv;
        const pDate = d.purchase_date ? fmt.date(d.purchase_date) : '—';
        const vals = [idx + 1, d.device_code || '—', d.name || '—', pDate, fmt.currency(d.purchase_price), `${lifeYears}n`, years, fmt.currency(dep), fmt.currency(cv)];
        doc.font(f).fontSize(7);
        const rowTop = curY;
        vals.forEach((val, i) => doc.text(String(val), xPos[i], curY, { width: colW[i], align: 'center', ellipsis: true, lineBreak: false }));
        curY += rowH;
        xPos.forEach((x) => doc.moveTo(x, rowTop).lineTo(x, curY).lineWidth(0.4).stroke());
        doc.moveTo(ML, curY).lineTo(ML + CW, curY).lineWidth(0.4).stroke();
      });

      closeTable(curY, headerTop);

      curY += 8;
      doc.font(f).fontSize(8).text(`Tổng nguyên giá: ${fmt.currency(totalOriginal)}`, ML, curY);
      curY += 12;
      doc.font(f).fontSize(8).text(`Tổng hao mòn: ${fmt.currency(totalDep)}`, ML, curY);
      curY += 12;
      doc.font(f).fontSize(8).text(`Tổng giá trị còn lại: ${fmt.currency(totalRemain)}`, ML, curY);

      drawFooter(doc, f);
      doc.end();
    } catch (err) { reject(err); }
  });
};

// =========================================================================
// 6. Thống kê
// =========================================================================
const generateStatsReport = (stats) => {
  return new Promise((resolve, reject) => {
    try {
      const { doc, f, fb, fi } = createDoc();
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      let curY = drawHeader(doc, f, fb, fi, `BC-TK-${fmt.date(new Date()).replace(/\//g, '')}`, 'BÁO CÁO THỐNG KÊ TÀI SẢN');

      const drawLine = (text) => {
        if (curY > 730) { doc.addPage(); curY = 50; }
        doc.font(f).fontSize(10).text(text, ML, curY, { width: CW });
        curY += 15;
      };

      const drawSectionTitle = (title) => {
        if (curY > 720) { doc.addPage(); curY = 50; }
        curY += 6;
        doc.moveTo(ML, curY).lineTo(ML + 100, curY).lineWidth(1.5).stroke();
        curY += 5;
        doc.font(fb).fontSize(12).text(title, ML, curY);
        curY += 20;
      };

      drawSectionTitle('I. TỔNG QUAN');
      drawLine(`Tổng thiết bị: ${stats.total_devices}`);
      drawLine(`Đang dùng: ${stats.active_devices}`);
      drawLine(`Bảo trì: ${stats.maintenance_devices}`);
      drawLine(`Hỏng: ${stats.broken_devices}`);
      drawLine(`Thanh lý: ${stats.disposed_devices}`);
      drawLine(`Tổng nguyên giá: ${fmt.currency(stats.total_value)}`);
      drawLine(`Tổng giá trị còn lại: ${fmt.currency(stats.remaining_value)}`);

      drawSectionTitle('II. THEO LOẠI TÀI SẢN');
      (stats.by_category || []).forEach(([name, count]) => drawLine(`${name}: ${count}`));

      drawSectionTitle('III. THEO PHÒNG BAN');
      (stats.by_department || []).forEach(([name, count]) => drawLine(`${name}: ${count}`));

      drawSectionTitle('IV. THEO TRẠNG THÁI');
      drawLine(`Đang dùng: ${stats.active_devices}`);
      drawLine(`Bảo trì: ${stats.maintenance_devices}`);
      drawLine(`Hỏng: ${stats.broken_devices}`);
      drawLine(`Thanh lý: ${stats.disposed_devices}`);

      drawSectionTitle('V. LỊCH BẢO TRÌ SẮP TỚI');
      (stats.recent_maintenance || []).slice(0, 5).forEach((item) => {
        drawLine(`${item.device_name || '—'} → ${fmt.date(item.actual_date)} (${item.technician_name || '—'})`);
        curY -= 3;
      });

      drawSectionTitle('VI. HẠN BẢO HÀNH SẮP HẾT');
      (stats.warranty_expiring || []).slice(0, 5).forEach((item) => {
        drawLine(`${item.device_name || '—'} → ${fmt.date(item.warranty_expiry)}`);
        curY -= 3;
      });

      drawFooter(doc, f);
      doc.end();
    } catch (err) { reject(err); }
  });
};

const sevLabel = { low:'Thấp', medium:'Trung bình', high:'Cao', critical:'Khẩn cấp' };
const sevColor = { low:'#10B981', medium:'#F59E0B', high:'#EF4444', critical:'#DC2626' };
const incidentStatus = { open:'Mới', in_progress:'Đang xử lý', resolved:'Đã giải quyết', closed:'Đóng' };

const generateIncidentReport = (record) => {
  return new Promise((resolve, reject) => {
    try {
      const { doc, f, fb, fi } = createDoc();
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      let curY = drawHeader(doc, f, fb, fi, `BB-SC-${String(record.id).padStart(4, '0')}`, 'BIÊN BẢN SỰ CỐ THIẾT BỊ');
      drawSection(doc, fb, 'I. THÔNG TIN THIẾT BỊ', curY); curY += 20;
      [['Mã tài sản', record.device_code || '—'],
       ['Tên tài sản', record.device_name || '—'],
       ['Nhãn hiệu', record.brand || '—'],
       ['Model', record.model || '—'],
       ['Số Serial', record.serial_number || '—'],
       ['Trạng thái', statusLabel[record.device_status] || '—'],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 6;
      drawSection(doc, fb, 'II. THÔNG TIN SỰ CỐ', curY); curY += 20;
      [['Vấn đề', record.issue || '—'],
       ['Mô tả', record.description || '—'],
       ['Mức độ', sevLabel[record.severity] || record.severity],
       ['Người báo', record.reporter_name || '—'],
       ['Email', record.reporter_email || '—'],
       ['Thời gian', fmt.date(record.reported_at)],
       ['Phụ trách', record.assignee_name || '—'],
       ['Trạng thái', incidentStatus[record.status] || record.status],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      if (record.status === 'resolved' || record.status === 'closed') {
        curY += 6;
        drawSection(doc, fb, 'III. KẾT QUẢ XỬ LÝ', curY); curY += 20;
        [['Giải pháp', record.resolution || '—'],
         ['Ngày hoàn thành', record.resolved_at ? fmt.date(record.resolved_at) : '—'],
        ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      }
      curY += 10;
      drawSignature(doc, f, fb, Math.max(curY, 640), ['NGƯỜI BÁO', 'KỸ THUẬT VIÊN', 'PHÊ DUYỆT']);
      drawFooter(doc, f);
      doc.end();
    } catch (err) { reject(err); }
  });
};

// =========================================================================
// 7. Phieu xuat kho
// =========================================================================
const generateIssueReport = (issue) => {
  return new Promise((resolve, reject) => {
    try {
      const { doc, f, fb, fi } = createDoc();
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      let curY = drawHeader(doc, f, fb, fi, `BB-XK-${String(issue.id).padStart(4, '0')}`, 'BIÊN BẢN XUẤT KHO TÀI SẢN');
      drawSection(doc, fb, 'I. THÔNG TIN PHIẾU XUẤT', curY); curY += 20;
      [['Mã phiếu', issue.issue_code || '---'],
       ['Ngày xuất', fmt.date(issue.issue_date)],
       ['Kho xuất', issue.warehouse_name || '---'],
       ['Phòng ban nhận', issue.department_name || '---'],
       ['Người nhận', issue.recipient_name || '---'],
       ['Ghi chú', issue.notes || '---'],
       ['Người lập', issue.created_by_name || '---'],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 6;
      drawSection(doc, fb, 'II. DANH SÁCH THIẾT BỊ', curY); curY += 20;

      const details = issue.details || [];
      const colX = [ML, ML + 40, ML + 130, ML + 310];
      const colW = [40, 90, 180, 495 - 310];
      const borderX = [...colX, ML + CW];
      const headerH = 14;
      const tableTop = curY;
      doc.font(fb).fontSize(8);
      ['STT', 'Mã TB', 'Tên thiết bị', 'Trạng thái'].forEach((c, i) => {
        doc.text(c, colX[i] + 2, curY + 4, { width: colW[i] - 4, align: 'center' });
      });
      finishTable(doc, fb, borderX, tableTop, tableTop + headerH, headerH);
      curY = tableTop + headerH;

      details.forEach((d, idx) => {
        if (curY > 720) {
          const bottom = curY;
          finishTable(doc, fb, borderX, tableTop, bottom, headerH);
          doc.addPage();
          curY = 50;
          drawTableHeader(doc, fb, ['STT', 'Mã TB', 'Tên thiết bị', 'Trạng thái'], colX, curY, headerH);
          curY += headerH + 2;
        }
        const statusMap = { active: 'Đang dùng', maintenance: 'Bảo trì', broken: 'Hỏng', disposed: 'Thanh lý', in_stock: 'Trong kho', inactive: 'Không dùng' };
        const vals = [idx + 1, d.device_code || '---', d.device_name || '---', statusMap[d.device_status] || d.device_status || '---'];
        doc.font(f).fontSize(8);
        vals.forEach((v, i) => {
          doc.text(String(v), colX[i] + 2, curY, { width: colW[i] - 4, align: i === 0 ? 'center' : 'left' });
        });
        curY += 14;
        if (idx < details.length - 1) doc.moveTo(ML, curY - 2).lineTo(ML + CW, curY - 2).lineWidth(0.6).stroke();
      });

      const bottom = curY;
      finishTable(doc, fb, borderX, tableTop, bottom, headerH);
      curY += 10;

      drawSignature(doc, f, fb, Math.max(curY, 640), ['NGƯỜI LẬP PHIẾU', 'THỦ KHO', 'NGƯỜI NHẬN']);
      drawFooter(doc, f);
      doc.end();
    } catch (err) { reject(err); }
  });
};

// =========================================================================
// 8. Biên bản nhập kho
// =========================================================================
const generateReceiptReport = (receipt) => {
  return new Promise((resolve, reject) => {
    try {
      const { doc, f, fb, fi } = createDoc();
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      let curY = drawHeader(doc, f, fb, fi, `BB-NK-${String(receipt.id).padStart(4, '0')}`, 'BIÊN BẢN NHẬP KHO TÀI SẢN');
      drawSection(doc, fb, 'I. THÔNG TIN PHIẾU NHẬP', curY); curY += 20;
      [['Mã phiếu', receipt.receipt_code || '---'],
       ['Ngày nhập', fmt.date(receipt.receipt_date)],
       ['Kho nhập', receipt.warehouse_name || '---'],
       ['Nhà cung cấp', receipt.supplier_name || '---'],
       ['Ghi chú', receipt.notes || '---'],
       ['Người lập', receipt.created_by_name || '---'],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 6;
      drawSection(doc, fb, 'II. DANH SÁCH THIẾT BỊ NHẬP', curY); curY += 20;

      const details = receipt.details || [];
      const colX = [ML, ML + 40, ML + 130, ML + 310];
      const colW = [40, 90, 180, 495 - 310];
      const borderX = [...colX, ML + CW];
      const headerH = 14;
      const tableTop = curY;
      doc.font(fb).fontSize(8);
      ['STT', 'Mã TB', 'Tên thiết bị', 'Trạng thái'].forEach((c, i) => {
        doc.text(c, colX[i] + 2, curY + 4, { width: colW[i] - 4, align: 'center' });
      });
      finishTable(doc, fb, borderX, tableTop, tableTop + headerH, headerH);
      curY = tableTop + headerH;

      details.forEach((d, idx) => {
        if (curY > 720) {
          const bottom = curY;
          finishTable(doc, fb, borderX, tableTop, bottom, headerH);
          doc.addPage();
          curY = 50;
          drawTableHeader(doc, fb, ['STT', 'Mã TB', 'Tên thiết bị', 'Trạng thái'], colX, curY, headerH);
          curY += headerH + 2;
        }
        const statusMap = { active: 'Đang dùng', maintenance: 'Bảo trì', broken: 'Hỏng', disposed: 'Thanh lý', in_stock: 'Trong kho', inactive: 'Không dùng' };
        const vals = [idx + 1, d.device_code || '---', d.device_name || '---', statusMap[d.device_status] || d.device_status || '---'];
        doc.font(f).fontSize(8);
        vals.forEach((v, i) => {
          doc.text(String(v), colX[i] + 2, curY, { width: colW[i] - 4, align: i === 0 ? 'center' : 'left' });
        });
        curY += 14;
        if (idx < details.length - 1) doc.moveTo(ML, curY - 2).lineTo(ML + CW, curY - 2).lineWidth(0.6).stroke();
      });

      const bottom = curY;
      finishTable(doc, fb, borderX, tableTop, bottom, headerH);
      curY += 10;

      drawSignature(doc, f, fb, Math.max(curY, 640), ['NGƯỜI LẬP PHIẾU', 'THỦ KHO', 'NGƯỜI GIAO']);
      drawFooter(doc, f);
      doc.end();
    } catch (err) { reject(err); }
  });
};

// =========================================================================
// 9. Báo cáo tồn kho
// =========================================================================
const generateStockReport = (stockData) => {
  return new Promise((resolve, reject) => {
    try {
      const { doc, f, fb, fi } = createDoc();
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      let curY = drawHeader(doc, f, fb, fi, `BC-TK-${fmt.date(new Date()).replace(/\//g, '')}`, 'BÁO CÁO TỒN KHO TÀI SẢN');
      drawSection(doc, fb, 'I. THÔNG TIN TỒN KHO', curY); curY += 20;
      const total = stockData.reduce((s, g) => s + (g.devices ? g.devices.length : 0), 0);
      [['Ngày báo cáo', fmt.date(new Date())],
       ['Tổng số kho', String(stockData.length)],
       ['Tổng thiết bị tồn', String(total)],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 6;

      stockData.forEach((group, gi) => {
        const devices = group.devices || [];
        if (!devices.length) return;
        if (curY > 680) { doc.addPage(); curY = 50; }
        drawSection(doc, fb, `${gi + 1}. ${group.warehouse_name || 'Kho'} (${devices.length} thiết bị)`, curY); curY += 18;

        const colX = [ML, ML + 35, ML + 120, ML + 330];
        const colW = [35, 85, 210, 495 - 330];
        const borderX = [...colX, ML + CW];
        const headerH = 13;
        const tableTop = curY;
        doc.font(fb).fontSize(7.5);
        ['STT', 'Mã TB', 'Tên thiết bị', 'Ngày nhập'].forEach((c, i) => {
          doc.text(c, colX[i] + 2, curY + 3, { width: colW[i] - 4, align: 'center' });
        });
        finishTable(doc, fb, borderX, tableTop, tableTop + headerH, headerH);
        curY = tableTop + headerH;

        devices.forEach((d, idx) => {
          if (curY > 735) {
            const bottom = curY;
            finishTable(doc, fb, borderX, tableTop, bottom, headerH);
            doc.addPage();
            curY = 50;
            drawTableHeader(doc, fb, ['STT', 'Mã TB', 'Tên thiết bị', 'Ngày nhập'], colX, curY, headerH);
            curY += headerH + 2;
          }
          const vals = [idx + 1, d.device_code || '---', d.device_name || '---', d.device_created ? fmt.date(d.device_created) : '---'];
          doc.font(f).fontSize(7.5);
          vals.forEach((v, i) => {
            doc.text(String(v), colX[i] + 2, curY, { width: colW[i] - 4, align: i === 0 ? 'center' : 'left' });
          });
          curY += 12;
          if (idx < devices.length - 1) doc.moveTo(ML, curY - 2).lineTo(ML + CW, curY - 2).lineWidth(0.4).stroke();
        });

        const bottom = curY;
        finishTable(doc, fb, borderX, tableTop, bottom, headerH);
        curY += 6;
      });

      drawFooter(doc, f);
      doc.end();
    } catch (err) { reject(err); }
  });
};

// =========================================================================
// 10. QR Labels
// =========================================================================
const generateQRLabelSheet = (devices) => {
  return new Promise((resolve, reject) => {
    try {
      const { doc, f, fb, fi } = createDoc();
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const labelW = 120;
      const labelH = 70;
      const gapX = 10;
      const gapY = 10;
      const cols = 4;
      const rows = 6;
      const startX = ML;
      const startY = 40;

      devices.slice(0, 24).forEach((d, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = startX + col * (labelW + gapX);
        const y = startY + row * (labelH + gapY);
        doc.rect(x, y, labelW, labelH).stroke();
        doc.font(fb).fontSize(9).text(d.device_code, x + 4, y + 4, { width: labelW - 8, align: 'center' });
        doc.font(f).fontSize(8).text(d.name || '—', x + 4, y + 18, { width: labelW - 8, align: 'center' });
        doc.font(f).fontSize(7).text(d.department_name || '', x + 4, y + 34, { width: labelW - 8, align: 'center' });
      });

      doc.end();
    } catch (err) { reject(err); }
  });
};

// =========================================================================
// 8. Biên bản kiểm kê tài sản
// =========================================================================
const inventoryStatus = { draft:'Bản nháp', in_progress:'Đang kiểm kê', completed:'Hoàn thành', cancelled:'Đã hủy' };
const invActualStatus = { found:'Còn', missing:'Thiếu', damaged:'Hỏng', transferred:'Đã điều chuyển' };

const generateInventoryReport = (session, details) => {
  return new Promise((resolve, reject) => {
    try {
      const { doc, f, fb, fi } = createDoc();
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      let curY = drawHeader(doc, f, fb, fi, `BB-KK-${String(session.id).padStart(4, '0')}`, 'BIÊN BẢN KIỂM KÊ TÀI SẢN');
      drawSection(doc, fb, 'I. THÔNG TIN KIỂM KÊ', curY); curY += 20;
      [['Mã phiếu', session.inventory_code || '—'],
       ['Tên đợt kiểm kê', session.title || '—'],
       ['Ngày kiểm kê', session.inventory_date ? fmt.date(session.inventory_date) : '—'],
       ['Phòng ban', session.department_name || 'Toàn trường'],
       ['Quý', session.quarter ? `Quý ${session.quarter}/${session.year}` : '—'],
       ['Trạng thái', inventoryStatus[session.status] || session.status],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 6;

      drawSection(doc, fb, 'II. KẾT QUẢ KIỂM KÊ', curY); curY += 20;
      [['Tổng thiết bị', String(session.total_devices || 0)],
       ['Đã kiểm', String(session.checked_devices || 0)],
       ['Còn', String(session.found_devices || 0)],
       ['Thiếu', String(session.missing_devices || 0)],
       ['Hỏng', String(session.damaged_devices || 0)],
       ['Đã điều chuyển', String(session.transferred_devices || 0)],
      ].forEach(([l, v]) => { drawRow(doc, f, fb, l, v, curY); curY += 16; });
      curY += 6;

      drawSection(doc, fb, 'III. DANH SÁCH CHI TIẾT', curY); curY += 20;

      // Determine unique columns
      const hasMissing = details.some(d => d.actual_status === 'missing' || d.actual_status === 'damaged');
      const columns = ['STT', 'Mã TS', 'Tên thiết bị', 'Loại', 'Phòng ban', 'HT', 'TT', 'Ghi chú'];
      const colW = [16, 50, 130, 60, 65, 24, 50, 60];
      colW[colW.length - 1] = CW - colW.slice(0, -1).reduce((a, b) => a + b, 0);

      const xPos = [ML];
      for (let i = 0; i < colW.length; i++) xPos.push(xPos[i] + colW[i]);

      const tableTop = curY;
      const headerH = 14;
      doc.font(fb).fontSize(7);
      columns.forEach((col, i) => {
        doc.text(col, xPos[i] + 1, curY + 4, { width: colW[i] - 2, align: i === 0 || i === 5 ? 'center' : 'left' });
      });
      curY += headerH;

      const rows = details.map((d, idx) => {
        const sysStatus = d.device_status === 'active' ? 'Đang dùng' : d.device_status === 'maintenance' ? 'Bảo trì' : d.device_status === 'broken' ? 'Hỏng' : d.device_status === 'disposed' ? 'TLý' : d.device_status || '—';
        const actualStatus = d.actual_status ? (invActualStatus[d.actual_status] || d.actual_status) : '—';
        const notes = d.notes || '';
        const vals = [idx + 1, d.device_code || '—', d.device_name || '—', d.category_name || '—', d.department_name || '—', sysStatus, actualStatus, notes];
        let rowHeight = 11;
        vals.forEach((val, i) => {
          const pad = i === 2 ? 4 : 2;
          const h = doc.heightOfString(String(val), { width: colW[i] - pad });
          if (h > rowHeight) rowHeight = h;
        });
        return { vals, rowHeight, isIssue: d.actual_status === 'missing' || d.actual_status === 'damaged' };
      });

      let pageY = curY;
      let currentPageTop = tableTop;

      rows.forEach(({ vals, rowHeight, isIssue }) => {
        if (pageY + rowHeight > 740) {
          finishTable(doc, fb, xPos, currentPageTop, pageY - 4, headerH);
          doc.addPage();
          currentPageTop = 50;
          drawTableHeader(doc, fb, columns, xPos, 50, headerH);
          pageY = 50 + headerH + 2;
        }
        if (isIssue) doc.fillColor('#EF4444');
        doc.font(f).fontSize(7);
        vals.forEach((val, i) => {
          doc.text(String(val), xPos[i] + (i === 2 ? 4 : 2), pageY, { width: colW[i] - (i === 2 ? 4 : 2), align: i === 0 || i === 5 ? 'center' : 'left', ellipsis: true });
        });
        doc.fillColor('#000');
        pageY += rowHeight + 4;
        doc.moveTo(ML, pageY - 4).lineTo(ML + CW, pageY - 4).lineWidth(0.3).stroke();
      });

      const bottom = pageY - 4;
      finishTable(doc, fb, xPos, currentPageTop, bottom, headerH);
      curY = bottom + 10;

      // Summary section
      if (session.missing_devices > 0 || session.damaged_devices > 0) {
        curY += 6;
        drawSection(doc, fb, 'IV. TỒN TẠI & KIẾN NGHỊ', curY); curY += 20;
        doc.font(f).fontSize(10);
        if (session.missing_devices > 0) {
          doc.text(`- Thiết bị thiếu: ${session.missing_devices}`, ML, curY); curY += 16;
        }
        if (session.damaged_devices > 0) {
          doc.text(`- Thiết bị hư hỏng: ${session.damaged_devices}`, ML, curY); curY += 16;
        }
      }

      if (session.notes) {
        curY += 4;
        doc.font(f).fontSize(10).text(`Ghi chú: ${session.notes}`, ML, curY, { width: CW });
        curY += 16;
      }

      curY += 10;
      let sigY = Math.max(curY, 620);
      if (sigY > 680) { doc.addPage(); sigY = 80; }
      drawSignature(doc, f, fb, sigY, ['NGƯỜI KIỂM KÊ', 'KẾ TOÁN TRƯỞNG', 'THỦ TRƯỞNG ĐƠN VỊ']);
      drawFooter(doc, f);
      doc.end();
    } catch (err) { reject(err); }
  });
};

module.exports = {
  generateDisposalReport,
  generateDisposalResultReport,
  generateTransferReport,
  generateMaintenanceReport,
  generateDeviceList,
  generateDepreciationReport,
  generateStatsReport,
  generateIncidentReport,
  generateIssueReport,
  generateReceiptReport,
  generateStockReport,
  generateQRLabelSheet,
  generateInventoryReport,
};
