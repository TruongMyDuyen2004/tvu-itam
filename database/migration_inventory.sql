-- ============================================================
-- Migration: Inventory (Kiểm kê tài sản định kỳ)
-- Bổ sung module kiểm kê theo quy định quản lý tài sản công
-- Hỗ trợ kiểm kê theo quý (mỗi quý 1 lần)
-- ============================================================

-- 1. Inventory Sessions (Phiếu kiểm kê)
CREATE TABLE IF NOT EXISTS inventory_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_code VARCHAR(20) NOT NULL COMMENT 'Mã phiếu kiểm kê (KK001...)',
    title VARCHAR(255) NOT NULL COMMENT 'Tên đợt kiểm kê',
    inventory_date DATE NOT NULL COMMENT 'Ngày kiểm kê',
    department_id INT NULL COMMENT 'Phòng ban được kiểm kê (NULL = tất cả)',
    quarter TINYINT NULL COMMENT 'Quý (1-4)',
    year SMALLINT NULL COMMENT 'Năm',
    notes TEXT,
    status ENUM('draft', 'in_progress', 'completed', 'cancelled') DEFAULT 'draft',
    total_devices INT DEFAULT 0 COMMENT 'Tổng thiết bị cần kiểm',
    checked_devices INT DEFAULT 0 COMMENT 'Đã kiểm',
    found_devices INT DEFAULT 0 COMMENT 'Tìm thấy',
    missing_devices INT DEFAULT 0 COMMENT 'Thiếu',
    damaged_devices INT DEFAULT 0 COMMENT 'Hỏng hóc',
    transferred_devices INT DEFAULT 0 COMMENT 'Đã điều chuyển',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_inventory_code (inventory_code),
    INDEX idx_quarter (quarter, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Inventory Details (Chi tiết kiểm kê từng thiết bị)
CREATE TABLE IF NOT EXISTS inventory_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    device_id INT NOT NULL,
    system_status VARCHAR(50) COMMENT 'Trạng thái trong hệ thống',
    actual_status ENUM('found', 'missing', 'damaged', 'transferred') DEFAULT NULL COMMENT 'Trạng thái thực tế',
    system_location VARCHAR(200) COMMENT 'Vị trí trong hệ thống',
    actual_location VARCHAR(200) COMMENT 'Vị trí thực tế',
    notes TEXT,
    checked_by INT NULL,
    checked_at TIMESTAMP NULL,
    FOREIGN KEY (session_id) REFERENCES inventory_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id),
    FOREIGN KEY (checked_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. View tổng hợp kiểm kê
CREATE OR REPLACE VIEW v_inventory_sessions AS
SELECT
    invs.*,
    dept.name AS department_name,
    u.full_name AS created_by_name
FROM inventory_sessions invs
LEFT JOIN departments dept ON invs.department_id = dept.id
LEFT JOIN users u ON invs.created_by = u.id;
