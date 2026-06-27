-- ============================================================
-- Migration: Warehouse Management (Quản lý Kho/Nhập/Xuất)
-- ============================================================

-- 0. Add 'in_stock' to devices status enum
ALTER TABLE devices MODIFY COLUMN status ENUM('active', 'maintenance', 'broken', 'disposed', 'inactive', 'in_stock') NOT NULL DEFAULT 'active';

-- 1. Warehouses (Kho)
CREATE TABLE IF NOT EXISTS warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    warehouse_code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    manager_name VARCHAR(255),
    notes TEXT,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_warehouse_code (warehouse_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Inventory Receipts (Phiếu nhập kho)
CREATE TABLE IF NOT EXISTS inventory_receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receipt_code VARCHAR(20) NOT NULL,
    receipt_date DATE NOT NULL,
    warehouse_id INT NOT NULL,
    supplier_name VARCHAR(255),
    notes TEXT,
    total_items INT DEFAULT 0,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_receipt_code (receipt_code),
    INDEX idx_receipt_date (receipt_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Inventory Receipt Details (Chi tiết phiếu nhập)
CREATE TABLE IF NOT EXISTS inventory_receipt_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receipt_id INT NOT NULL,
    device_id INT NOT NULL,
    unit_price DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (receipt_id) REFERENCES inventory_receipts(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id),
    INDEX idx_receipt_id (receipt_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Inventory Issues (Phiếu xuất kho)
CREATE TABLE IF NOT EXISTS inventory_issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    issue_code VARCHAR(20) NOT NULL,
    issue_date DATE NOT NULL,
    warehouse_id INT NOT NULL,
    department_id INT NULL,
    recipient_name VARCHAR(255),
    notes TEXT,
    total_items INT DEFAULT 0,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_issue_code (issue_code),
    INDEX idx_issue_date (issue_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Inventory Issue Details (Chi tiết phiếu xuất)
CREATE TABLE IF NOT EXISTS inventory_issue_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    issue_id INT NOT NULL,
    device_id INT NOT NULL,
    notes TEXT,
    FOREIGN KEY (issue_id) REFERENCES inventory_issues(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id),
    INDEX idx_issue_id (issue_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
