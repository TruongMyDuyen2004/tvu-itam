-- ============================================================
-- HỆ THỐNG QUẢN LÝ TÀI SẢN SỐ - ĐẠI HỌC TRÀ VINH (TVU-ITAM)
-- Database: MySQL 5.7+
-- Created: 2026-05-02
-- ============================================================

CREATE DATABASE IF NOT EXISTS tvu_itam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tvu_itam;

-- ============================================================
-- 1. DEPARTMENTS (Phòng ban / Khoa)
-- ============================================================
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    location VARCHAR(200),
    description TEXT,
    manager_id INT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. USERS (Người dùng)
-- ============================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'admin', 'user') DEFAULT 'user',
    department_id INT NULL,
    phone VARCHAR(20),
    avatar VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

ALTER TABLE departments
    ADD CONSTRAINT fk_dept_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================
-- 3. DEVICE CATEGORIES (Loại thiết bị)
-- ============================================================
CREATE TABLE device_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'laptop',
    useful_life_years INT NOT NULL DEFAULT 5 COMMENT 'Thời gian khấu hao (năm) theo TT 45/2013/TT-BTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. DEVICES (Thiết bị)
-- ============================================================
CREATE TABLE devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    category_id INT NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(150),
    serial_number VARCHAR(100),
    specs JSON,
    purchase_date DATE,
    purchase_price DECIMAL(15,2),
    depreciation_rate DECIMAL(5,2) DEFAULT 20 COMMENT 'Tỷ lệ khấu hao (%/năm)',
    warranty_expiry DATE,
    status ENUM('active', 'maintenance', 'broken', 'disposed', 'inactive') DEFAULT 'active',
    department_id INT NULL,
    assigned_user_id INT NULL,
    location VARCHAR(200),
    image_url VARCHAR(255),
    notes TEXT,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES device_categories(id),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 5. MAINTENANCE SCHEDULES (Lịch bảo trì)
-- ============================================================
CREATE TABLE maintenance_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    maintenance_code VARCHAR(20) NOT NULL COMMENT 'Mã phiếu bảo trì (BT001...)',
    device_id INT NOT NULL,
    request_date DATE NOT NULL COMMENT 'Ngày đề xuất bảo trì',
    start_date DATE NULL COMMENT 'Ngày bắt đầu thực hiện',
    actual_date DATE NULL COMMENT 'Ngày hoàn thành',
    maintenance_type ENUM('dinh_ky', 'dot_xuat') NOT NULL DEFAULT 'dinh_ky' COMMENT 'Định kỳ / Đột xuất',
    description TEXT,
    result ENUM('da_sua', 'khong_sua_duoc') DEFAULT NULL COMMENT 'Đã sửa / Không sửa được',
    cost DECIMAL(15,2) DEFAULT 0,
    status ENUM('cho_xu_ly', 'da_duyet', 'dang_thuc_hien', 'hoan_thanh', 'huy') NOT NULL DEFAULT 'cho_xu_ly',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    technician_id INT NULL,
    approver_id INT NULL COMMENT 'Người phê duyệt',
    notes TEXT,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 6. MAINTENANCE LOGS (Nhật ký bảo trì)
-- ============================================================
CREATE TABLE maintenance_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NULL,
    device_id INT NOT NULL,
    action VARCHAR(200) NOT NULL,
    description TEXT,
    performed_by INT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    before_status VARCHAR(50),
    after_status VARCHAR(50),
    cost DECIMAL(15,2) DEFAULT 0,
    FOREIGN KEY (schedule_id) REFERENCES maintenance_schedules(id) ON DELETE SET NULL,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 7. ASSET TRANSFERS (Điều chuyển tài sản)
-- ============================================================
CREATE TABLE asset_transfers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    from_department_id INT NULL,
    to_department_id INT NULL,
    from_user_id INT NULL,
    to_user_id INT NULL,
    transfer_date DATE NOT NULL,
    approved_by INT NULL,
    reason TEXT,
    notes TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    FOREIGN KEY (from_department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (to_department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 8. DISPOSALS (Thanh lý tài sản)
-- ============================================================
CREATE TABLE IF NOT EXISTS disposals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    disposal_code VARCHAR(20) NOT NULL,
    device_id INT NOT NULL,
    proposal_date DATE NOT NULL,
    inspection_date DATE NULL,
    decision_number VARCHAR(50) NULL,
    decision_date DATE NULL,
    disposal_date DATE NOT NULL,
    reason TEXT NOT NULL,
    asset_condition VARCHAR(200) NULL,
    current_value DECIMAL(15,2) NULL,
    disposal_method ENUM('ban_thanh_ly', 'tieu_huy', 'dieu_chuyen_noi_bo', 'mat_tai_san', 'hu_hong_khong_sd_duoc') NOT NULL DEFAULT 'ban_thanh_ly',
    recovery_value DECIMAL(15,2) DEFAULT NULL,
    council VARCHAR(255) NULL,
    status ENUM('de_nghi', 'dang_kiem_tra', 'cho_phe_duyet', 'da_duyet', 'da_thanh_ly', 'tu_choi') NOT NULL DEFAULT 'de_nghi',
    approved_by INT NULL,
    handover_unit VARCHAR(200) NULL,
    notes TEXT,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_disposal_code (disposal_code),
    INDEX idx_decision_number (decision_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. INCIDENT REPORTS (Báo cáo sự cố)
-- ============================================================
CREATE TABLE incident_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    reported_by INT NOT NULL,
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    issue VARCHAR(500) NOT NULL,
    description TEXT,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
    assigned_to INT NULL,
    resolved_at TIMESTAMP NULL,
    resolution TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 10. AUDIT LOGS (Nhật ký hệ thống)
-- ============================================================
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    old_data JSON,
    new_data JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- 11. SYSTEM SETTINGS (Cài đặt hệ thống)
-- ============================================================
CREATE TABLE system_settings (
    `key` VARCHAR(100) PRIMARY KEY,
    `value` TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 12. LOGIN HISTORY (Lịch sử đăng nhập)
-- ============================================================
CREATE TABLE login_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    username VARCHAR(150) NOT NULL,
    success TINYINT(1) DEFAULT 0,
    ip_address VARCHAR(45),
    user_agent TEXT,
    message VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Categories
INSERT INTO device_categories (name, description, icon, useful_life_years) VALUES
('Máy tính để bàn', 'Desktop computers', 'desktop', 5),
('Máy tính xách tay', 'Laptop computers', 'laptop', 5),
('Máy chủ (Server)', 'Physical and virtual servers', 'server', 7),
('Thiết bị mạng', 'Switch, Router, Access Point', 'wifi', 5),
('Máy in', 'Printers and scanners', 'printer', 5),
('Màn hình', 'Monitors and displays', 'monitor', 5),
('Máy chiếu', 'Projectors', 'projector', 5),
('UPS / Nguồn điện', 'UPS, APC, Power supply', 'battery', 5),
('Thiết bị lưu trữ', 'NAS, External drives, USB', 'hard-drive', 5),
('Thiết bị ngoại vi', 'Keyboard, Mouse, Webcam, Headset', 'keyboard', 3);

-- Departments
INSERT INTO departments (name, code, location, description) VALUES
('Ban Giám Hiệu', 'BGH', 'Nhà A - Tầng 4', 'Ban lãnh đạo trường'),
('Phòng CNTT', 'PCNTT', 'Nhà B - Tầng 1', 'Phòng Công nghệ thông tin'),
('Phòng Hành Chính', 'PHC', 'Nhà A - Tầng 1', 'Phòng Hành chính - Tổng hợp'),
('Khoa CNTT', 'KCNTT', 'Nhà C - Tầng 2', 'Khoa Công nghệ thông tin & Truyền thông'),
('Khoa Kinh Tế', 'KKT', 'Nhà D - Tầng 1', 'Khoa Kinh tế, Luật và Quản lý nhà nước'),
('Phòng Kế Toán', 'PKT', 'Nhà A - Tầng 2', 'Phòng Kế hoạch - Tài chính'),
('Thư Viện', 'TV', 'Nhà E - Tầng 1', 'Trung tâm Học liệu'),
('Trung Tâm Ngoại Ngữ', 'TTNN', 'Nhà F', 'Trung tâm Ngoại ngữ - Tin học');

-- Default SuperAdmin account (password: Admin@123)
INSERT INTO users (full_name, email, username, password_hash, role, department_id) VALUES
('Quản Trị Hệ Thống', 'superadmin@tvu.edu.vn', 'superadmin', '$2b$10$B03PnzDv6YZ5VQAXQ7UrVet6ah4GZ.MS0wGKvq2xFaMKq5GntJoVK', 'superadmin', 2),
('Nguyễn Văn Admin', 'admin@tvu.edu.vn', 'admin', '$2b$10$B03PnzDv6YZ5VQAXQ7UrVet6ah4GZ.MS0wGKvq2xFaMKq5GntJoVK', 'admin', 2),
('Trần Thị User', 'user@tvu.edu.vn', 'user01', '$2b$10$B03PnzDv6YZ5VQAXQ7UrVet6ah4GZ.MS0wGKvq2xFaMKq5GntJoVK', 'user', 4);

-- Sample Devices
INSERT INTO devices (device_code, name, category_id, brand, model, serial_number, specs, purchase_date, purchase_price, warranty_expiry, status, department_id, assigned_user_id, location, created_by) VALUES
('TVU-PC-001', 'Máy tính bàn phòng CNTT #1', 1, 'Dell', 'OptiPlex 3080', 'SN-DELL-001', '{"cpu":"Intel Core i5-10500","ram":"8GB DDR4","storage":"256GB SSD","os":"Windows 10 Pro"}', '2023-01-15', 15000000, '2026-01-15', 'active', 2, 2, 'Phòng CNTT - Bàn 01', 1),
('TVU-PC-002', 'Máy tính bàn phòng CNTT #2', 1, 'Dell', 'OptiPlex 3080', 'SN-DELL-002', '{"cpu":"Intel Core i5-10500","ram":"8GB DDR4","storage":"256GB SSD","os":"Windows 10 Pro"}', '2023-01-15', 15000000, '2026-01-15', 'maintenance', 2, NULL, 'Phòng CNTT - Bàn 02', 1),
('TVU-LT-001', 'Laptop giảng dạy Khoa CNTT #1', 2, 'HP', 'ProBook 440 G8', 'SN-HP-LT-001', '{"cpu":"Intel Core i7-1165G7","ram":"16GB DDR4","storage":"512GB SSD","display":"14 inch FHD"}', '2022-06-01', 22000000, '2025-06-01', 'active', 4, 3, 'Phòng thực hành C201', 1),
('TVU-SV-001', 'Server chính phòng CNTT', 3, 'Dell', 'PowerEdge R740', 'SN-SRV-001', '{"cpu":"2x Intel Xeon Gold 6226R","ram":"64GB ECC","storage":"4x 2TB RAID10","os":"Windows Server 2019"}', '2021-09-10', 180000000, '2024-09-10', 'active', 2, NULL, 'Server Room - Rack 1', 1),
('TVU-SW-001', 'Switch mạng tầng 1', 4, 'Cisco', 'Catalyst 2960X-48', 'SN-SW-001', '{"ports":"48x GbE + 4x SFP+","managed":true}', '2022-03-20', 45000000, '2025-03-20', 'active', 2, NULL, 'Tủ mạng - Tầng 1', 1),
('TVU-PR-001', 'Máy in phòng Hành Chính', 5, 'Canon', 'imageRUNNER 2625', 'SN-CN-PR-001', '{"type":"Laser","speed":"25ppm","duplex":true}', '2023-05-10', 28000000, '2026-05-10', 'active', 3, NULL, 'Phòng HC - Góc in', 1),
('TVU-MN-001', 'Màn hình 27 inch phòng họp', 6, 'LG', '27UK850-W', 'SN-LG-MN-001', '{"size":"27 inch","resolution":"4K UHD","panel":"IPS"}', '2023-08-01', 9500000, '2026-08-01', 'active', 1, NULL, 'Phòng họp A401', 1),
('TVU-PJ-001', 'Máy chiếu phòng C201', 7, 'Epson', 'EB-X51', 'SN-EP-PJ-001', '{"lumens":"3800","resolution":"XGA","throw":"1.41-1.69"}', '2022-11-15', 18000000, '2025-11-15', 'broken', 4, NULL, 'Phòng học C201', 1),
('TVU-UPS-001', 'UPS Server Room', 8, 'APC', 'Smart-UPS 3000VA', 'SN-APC-UPS-001', '{"capacity":"3000VA","runtime":"15min at full load"}', '2021-09-10', 35000000, '2024-09-10', 'active', 2, NULL, 'Server Room', 1),
('TVU-PC-003', 'Máy tính bàn Thư Viện #1', 1, 'HP', 'EliteDesk 800 G6', 'SN-HP-003', '{"cpu":"Intel Core i5-10500","ram":"8GB","storage":"500GB HDD","os":"Windows 10"}', '2023-03-01', 14000000, '2026-03-01', 'active', 7, NULL, 'Thư viện - Quầy mượn', 1);

-- Sample Maintenance Schedules
INSERT INTO maintenance_schedules (maintenance_code, device_id, request_date, start_date, maintenance_type, technician_id, description, status, priority, created_by) VALUES
('BT001', 1, '2026-05-08', '2026-05-10', 'dinh_ky', 2, 'Vệ sinh, kiểm tra phần cứng, cập nhật phần mềm định kỳ', 'cho_xu_ly', 'medium', 1),
('BT002', 2, '2026-05-03', '2026-05-05', 'dot_xuat', 2, 'Sửa chữa lỗi khởi động, kiểm tra RAM và ổ cứng', 'dang_thuc_hien', 'high', 1),
('BT003', 4, '2026-05-12', '2026-05-15', 'dinh_ky', 2, 'Kiểm tra tình trạng server, log hệ thống, kiểm tra ổ cứng RAID', 'cho_xu_ly', 'critical', 1),
('BT004', 8, CURDATE(), NULL, 'dot_xuat', 2, 'Sửa chữa máy chiếu bị lỗi đèn', 'cho_xu_ly', 'high', 1),
('BT005', 5, '2026-05-28', '2026-06-01', 'dinh_ky', 2, 'Cập nhật firmware, kiểm tra các port mạng', 'cho_xu_ly', 'low', 1);

-- Demo data for Dashboard (expiring warranties + upcoming maintenance)
INSERT INTO devices (device_code, name, category_id, brand, model, serial_number, purchase_date, purchase_price, warranty_expiry, status, department_id, location, created_by) VALUES
('TVU-PC-100', 'Máy tính bàn Hành chính #1', 1, 'Dell', 'OptiPlex 7080', 'SN-DEMO-100', '2026-03-01', 15000000, '2026-07-15', 'active', 3, 'Phòng Hành chính', 1),
('TVU-PC-101', 'Máy tính bàn Hành chính #2', 1, 'HP', 'ProDesk 600 G6', 'SN-DEMO-101', '2026-03-15', 14000000, '2026-08-01', 'active', 3, 'Phòng Hành chính', 1),
('TVU-LT-020', 'Laptop hiệu trưởng', 2, 'Lenovo', 'ThinkPad X1 Carbon', 'SN-DEMO-102', '2026-04-01', 28000000, '2026-08-20', 'active', 1, 'Phòng Hiệu trưởng', 1),
('TVU-PR-020', 'Máy in Khoa CNTT', 5, 'Canon', 'MF445dt', 'SN-DEMO-103', '2026-05-01', 12000000, '2026-09-01', 'active', 4, 'Phòng GV Khoa CNTT', 1);

INSERT INTO maintenance_schedules (maintenance_code, device_id, request_date, start_date, maintenance_type, technician_id, description, status, priority, created_by) VALUES
('BT006', (SELECT id FROM devices WHERE device_code = 'TVU-PC-100'), '2026-06-10', '2026-06-15', 'dinh_ky', 2, 'Vệ sinh, kiểm tra phần cứng máy tính hành chính', 'cho_xu_ly', 'medium', 1),
('BT007', (SELECT id FROM devices WHERE device_code = 'TVU-PC-101'), '2026-06-15', '2026-06-20', 'dinh_ky', 2, 'Bảo trì định kỳ máy tính hành chính', 'cho_xu_ly', 'low', 1),
('BT008', (SELECT id FROM devices WHERE device_code = 'TVU-LT-020'), '2026-06-20', '2026-06-25', 'dinh_ky', 2, 'Kiểm tra tổng quát laptop hiệu trưởng', 'cho_xu_ly', 'high', 1),
('BT009', (SELECT id FROM devices WHERE device_code = 'TVU-SW-001'), '2026-06-25', '2026-07-01', 'dinh_ky', 2, 'Cập nhật firmware switch', 'cho_xu_ly', 'medium', 1),
('BT010', (SELECT id FROM devices WHERE device_code = 'TVU-PR-020'), '2026-07-05', '2026-07-10', 'dinh_ky', 2, 'Vệ sinh đầu in, thay drum', 'cho_xu_ly', 'medium', 1),
('BT011', (SELECT id FROM devices WHERE device_code = 'TVU-PC-001'), CURDATE(), '2026-06-20', 'dinh_ky', 2, 'Bảo trì định kỳ tháng 6', 'cho_xu_ly', 'medium', 1),
('BT012', (SELECT id FROM devices WHERE device_code = 'TVU-SV-001'), CURDATE(), '2026-07-05', 'dinh_ky', 2, 'Kiểm tra server, dọn log, sao lưu', 'cho_xu_ly', 'critical', 1);

-- Sample Incidents
INSERT INTO incident_reports (device_id, reported_by, issue, description, severity, status, assigned_to) VALUES
(8, 3, 'Đèn máy chiếu không sáng', 'Máy chiếu bật lên nhưng đèn không hoạt động, không chiếu được hình', 'high', 'in_progress', 2),
(2, 3, 'Máy tính không khởi động được', 'Máy bật nguồn nhưng không vào Windows, màn hình đen', 'high', 'in_progress', 2);

-- ============================================================
-- VIEWS TIỆN ÍCH
-- ============================================================

CREATE OR REPLACE VIEW v_device_details AS
SELECT 
    d.id, d.device_code, d.name, d.brand, d.model, d.serial_number,
    d.status, d.location, d.purchase_date, d.purchase_price, d.warranty_expiry,
    d.specs, d.image_url, d.notes, d.created_at,
    dc.name AS category_name, dc.icon AS category_icon, dc.useful_life_years,
    dept.name AS department_name, dept.code AS department_code,
    u.full_name AS assigned_user_name, u.email AS assigned_user_email
FROM devices d
LEFT JOIN device_categories dc ON d.category_id = dc.id
LEFT JOIN departments dept ON d.department_id = dept.id
LEFT JOIN users u ON d.assigned_user_id = u.id;

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

SELECT 'TVU-ITAM Database created successfully!' AS message;
