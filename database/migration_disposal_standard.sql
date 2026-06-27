-- Migration: Chuẩn hóa bảng thanh lý theo NĐ 151/2017/NĐ-CP
-- Thêm: mã phiếu, ngày đề xuất, kiểm kê, quyết định, giá trị, hội đồng...

-- 1. Thêm các cột mới
ALTER TABLE disposals
  ADD COLUMN disposal_code VARCHAR(20) NOT NULL AFTER id,
  ADD COLUMN proposal_date DATE AFTER device_id,
  ADD COLUMN inspection_date DATE NULL AFTER proposal_date,
  ADD COLUMN decision_number VARCHAR(50) NULL AFTER inspection_date,
  ADD COLUMN decision_date DATE NULL AFTER decision_number,
  ADD COLUMN asset_condition VARCHAR(200) NULL AFTER reason,
  ADD COLUMN current_value DECIMAL(15,2) NULL AFTER asset_condition,
  ADD COLUMN council VARCHAR(255) NULL AFTER current_value,
  ADD COLUMN disposal_method VARCHAR(50) NULL AFTER council,
  ADD COLUMN handover_unit VARCHAR(200) NULL AFTER approved_by,
  ADD INDEX idx_disposal_code (disposal_code),
  ADD INDEX idx_decision_number (decision_number);

-- 2. Đổi disposal_price → recovery_value
ALTER TABLE disposals CHANGE disposal_price recovery_value DECIMAL(15,2) DEFAULT NULL;

-- 3. Mở rộng ENUM status trước (bao gồm cả cũ + mới) để UPDATE được
ALTER TABLE disposals MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'de_nghi', 'dang_kiem_tra', 'cho_phe_duyet', 'da_duyet', 'da_thanh_ly', 'tu_choi') NOT NULL DEFAULT 'pending';

-- 4. Cập nhật dữ liệu cũ
UPDATE disposals SET disposal_code = CONCAT('TL', LPAD(id, 3, '0'));
UPDATE disposals SET proposal_date = COALESCE(created_at, CURDATE());
UPDATE disposals SET disposal_method = CASE disposal_type
  WHEN 'liquidation' THEN 'ban_thanh_ly'
  WHEN 'recall' THEN 'dieu_chuyen_noi_bo'
  WHEN 'lost' THEN 'mat_tai_san'
  WHEN 'damaged' THEN 'hu_hong_khong_sd_duoc'
  ELSE 'ban_thanh_ly'
END;
UPDATE disposals SET current_value = recovery_value;
UPDATE disposals SET status = CASE
  WHEN status = 'pending' THEN 'de_nghi'
  WHEN status = 'approved' THEN 'da_duyet'
  WHEN status = 'rejected' THEN 'tu_choi'
  ELSE 'de_nghi'
END;

-- 5. Xóa cột disposal_type cũ
ALTER TABLE disposals DROP COLUMN disposal_type;

-- 6. Chuyển disposal_method → ENUM
ALTER TABLE disposals MODIFY COLUMN disposal_method ENUM('ban_thanh_ly', 'tieu_huy', 'dieu_chuyen_noi_bo', 'mat_tai_san', 'hu_hong_khong_sd_duoc', 'khac') NOT NULL DEFAULT 'ban_thanh_ly';

-- 7. Thu gọn ENUM status về chỉ các giá trị mới
ALTER TABLE disposals MODIFY COLUMN status ENUM('de_nghi', 'dang_kiem_tra', 'cho_phe_duyet', 'da_duyet', 'da_thanh_ly', 'tu_choi') NOT NULL DEFAULT 'de_nghi';
