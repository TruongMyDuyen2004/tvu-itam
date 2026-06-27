-- Migration: Chuẩn hóa bảng bảo trì theo TT 45/2013/TT-BTC
-- Bổ sung: mã phiếu, ngày đề xuất, ngày bắt đầu, người phê duyệt, ENUM chuẩn

DROP VIEW IF EXISTS v_maintenance_details;
DROP VIEW IF EXISTS v_dashboard_stats;

ALTER TABLE maintenance_schedules
  ADD COLUMN maintenance_code VARCHAR(20) NOT NULL AFTER id,
  ADD COLUMN request_date DATE AFTER device_id,
  ADD COLUMN start_date DATE NULL AFTER request_date,
  ADD COLUMN approver_id INT NULL AFTER technician_id,
  ADD INDEX idx_maintenance_code (maintenance_code),
  ADD INDEX idx_approver (approver_id);

UPDATE maintenance_schedules SET maintenance_code = CONCAT('BT', LPAD(id, 3, '0'));
UPDATE maintenance_schedules SET request_date = COALESCE(created_at, CURDATE());

-- Sửa maintenance_type
ALTER TABLE maintenance_schedules
  MODIFY COLUMN maintenance_type ENUM('dinh_ky', 'dot_xuat') NOT NULL DEFAULT 'dinh_ky';

UPDATE maintenance_schedules SET maintenance_type = 'dinh_ky' WHERE maintenance_type IN ('preventive', 'inspection');
UPDATE maintenance_schedules SET maintenance_type = 'dot_xuat' WHERE maintenance_type IN ('corrective', 'upgrade');

-- Sửa status
ALTER TABLE maintenance_schedules
  MODIFY COLUMN status ENUM('cho_xu_ly', 'da_duyet', 'dang_thuc_hien', 'hoan_thanh', 'huy') NOT NULL DEFAULT 'cho_xu_ly';

UPDATE maintenance_schedules SET status = 'cho_xu_ly' WHERE status = 'pending';
UPDATE maintenance_schedules SET status = 'da_duyet' WHERE status = 'approved';
UPDATE maintenance_schedules SET status = 'dang_thuc_hien' WHERE status = 'in_progress';
UPDATE maintenance_schedules SET status = 'hoan_thanh' WHERE status = 'completed';
UPDATE maintenance_schedules SET status = 'huy' WHERE status = 'cancelled';

-- Sửa result
ALTER TABLE maintenance_schedules
  MODIFY COLUMN result ENUM('da_sua', 'khong_sua_duoc') DEFAULT NULL;

-- Xóa scheduled_date (đã thay bằng request_date)
ALTER TABLE maintenance_schedules DROP COLUMN scheduled_date;

-- Thêm FK cho approver_id
ALTER TABLE maintenance_schedules
  ADD CONSTRAINT fk_approver FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL;

-- Tái tạo views
CREATE OR REPLACE VIEW v_maintenance_details AS
SELECT
    ms.id, ms.maintenance_code, ms.maintenance_type, ms.request_date, ms.start_date,
    ms.actual_date, ms.description, ms.result, ms.cost, ms.status, ms.priority, ms.notes,
    ms.created_at,
    d.device_code, d.name AS device_name,
    dc.name AS category_name,
    dept.name AS department_name,
    t.full_name AS technician_name, t.email AS technician_email,
    c.full_name AS created_by_name,
    a.full_name AS approver_name
FROM maintenance_schedules ms
LEFT JOIN devices d ON ms.device_id = d.id
LEFT JOIN device_categories dc ON d.category_id = dc.id
LEFT JOIN departments dept ON d.department_id = dept.id
LEFT JOIN users t ON ms.technician_id = t.id
LEFT JOIN users c ON ms.created_by = c.id
LEFT JOIN users a ON ms.approver_id = a.id;

CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM devices) AS total_devices,
    (SELECT COUNT(*) FROM devices WHERE status = 'active') AS active_devices,
    (SELECT COUNT(*) FROM devices WHERE status = 'maintenance') AS maintenance_devices,
    (SELECT COUNT(*) FROM devices WHERE status = 'broken') AS broken_devices,
    (SELECT COUNT(*) FROM devices WHERE status = 'disposed') AS disposed_devices,
    (SELECT COUNT(*) FROM maintenance_schedules WHERE status IN ('cho_xu_ly', 'da_duyet')) AS pending_maintenance,
    (SELECT COUNT(*) FROM incident_reports WHERE status = 'open') AS open_incidents,
    (SELECT COUNT(*) FROM devices WHERE warranty_expiry < DATE_ADD(CURDATE(), INTERVAL 90 DAY) AND warranty_expiry > CURDATE() AND status != 'disposed') AS expiring_warranty,
    (SELECT COALESCE(SUM(cost),0) FROM maintenance_schedules WHERE status = 'hoan_thanh' AND YEAR(actual_date) = YEAR(CURDATE())) AS yearly_maintenance_cost;
