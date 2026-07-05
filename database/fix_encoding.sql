-- ============================================================
-- FIX: Khắc phục lỗi encoding tiếng Việt trong database
-- ============================================================

-- 1. Sửa danh mục thiết bị (device_categories)
UPDATE device_categories SET name = 'Máy tính để bàn' WHERE name LIKE '%M?y t?nh%??b?n%' AND id = 1;
UPDATE device_categories SET name = 'Máy tính xách tay' WHERE name LIKE '%M?y t?nh%x?ch tay%' AND id = 2;
UPDATE device_categories SET name = 'Máy chủ (Server)' WHERE name LIKE '%M?y ch?%Server%' AND id = 3;
UPDATE device_categories SET name = 'Thiết bị mạng' WHERE name LIKE '%Thi?t b? m?ng%' AND id = 4;
UPDATE device_categories SET name = 'Máy in' WHERE name LIKE '%M?y in%' AND id = 5;
UPDATE device_categories SET name = 'Màn hình' WHERE name LIKE '%M?n h?nh%' AND id = 6;
UPDATE device_categories SET name = 'Máy chiếu' WHERE name LIKE '%M?y chi?u%' AND id = 7;
UPDATE device_categories SET name = 'UPS / Nguồn điện' WHERE name LIKE '%UPS / Ngu?n%i?n%' AND id = 8;
UPDATE device_categories SET name = 'Thiết bị lưu trữ' WHERE name LIKE '%Thi?t b? l?u tr?%' AND id = 9;
UPDATE device_categories SET name = 'Thiết bị ngoại vi' WHERE name LIKE '%Thi?t b? ngo?i vi%' AND id = 10;

-- 2. Sửa tên phòng ban (departments)
UPDATE departments SET name = 'Ban Giám Hiệu' WHERE name LIKE '%Ban Gi?m Hi?u%' AND id = 1;
UPDATE departments SET name = 'Phòng CNTT' WHERE name LIKE '%Ph?ng CNTT%' AND id = 2;
UPDATE departments SET name = 'Phòng Hành Chính' WHERE name LIKE '%Ph?ng H?nh Ch?nh%' AND id = 3;
UPDATE departments SET name = 'Khoa CNTT' WHERE name LIKE '%Khoa CNTT%' AND id = 4;
UPDATE departments SET name = 'Khoa Kinh Tế' WHERE name LIKE '%Khoa Kinh T?%' AND id = 5;
UPDATE departments SET name = 'Phòng Kế Toán' WHERE name LIKE '%Ph?ng K? To?n%' AND id = 6;
UPDATE departments SET name = 'Thư Viện' WHERE name LIKE '%Th? Vi?n%' AND id = 7;
UPDATE departments SET description = 'Phòng Công nghệ thông tin' WHERE description LIKE '%Ph?ng C?ng ngh? th?ng tin%' AND id = 2;
UPDATE departments SET description = 'Phòng Hành chính - Tổng hợp' WHERE description LIKE '%Ph?ng H?nh ch?nh - T?ng h?p%' AND id = 3;
UPDATE departments SET description = 'Khoa Công nghệ thông tin & Truyền thông' WHERE description LIKE '%Khoa C?ng ngh? th?ng tin%' AND id = 4;
UPDATE departments SET description = 'Khoa Kinh tế, Luật và Quản lý nhà nước' WHERE description LIKE '%Khoa Kinh t?, Lu?t%' AND id = 5;
UPDATE departments SET description = 'Phòng Kế hoạch - Tài chính' WHERE description LIKE '%Ph?ng K? ho?ch - T�i ch?nh%' AND id = 6;
UPDATE departments SET description = 'Trung tâm Học liệu' WHERE description LIKE '%Trung t�m H?c li?u%' AND id = 7;

-- 3. Sửa tên thiết bị (devices)
UPDATE devices SET name = REPLACE(name, 'M�y t�nh', 'Máy tính');
UPDATE devices SET name = REPLACE(name, 'M?y t?nh', 'Máy tính');
UPDATE devices SET name = REPLACE(name, 'M�y ch?', 'Máy chủ');
UPDATE devices SET name = REPLACE(name, 'M?y ch?', 'Máy chủ');
UPDATE devices SET name = REPLACE(name, 'M�y in', 'Máy in');
UPDATE devices SET name = REPLACE(name, 'M?y in', 'Máy in');
UPDATE devices SET name = REPLACE(name, 'M�n h?nh', 'Màn hình');
UPDATE devices SET name = REPLACE(name, 'M?n h?nh', 'Màn hình');
UPDATE devices SET name = REPLACE(name, 'M�y chi?u', 'Máy chiếu');
UPDATE devices SET name = REPLACE(name, 'M?y chi?u', 'Máy chiếu');
UPDATE devices SET name = REPLACE(name, 'Thi?t b?', 'Thiết bị');
UPDATE devices SET name = REPLACE(name, 'Thiê?t b?', 'Thiết bị');
UPDATE devices SET name = REPLACE(name, 'Đ? nng', 'Đa năng');
UPDATE devices SET name = REPLACE(name, '?a n?ng', 'Đa năng');
UPDATE devices SET name = REPLACE(name, '? l?u tr?', 'Ổ lưu trữ');
UPDATE devices SET name = REPLACE(name, '? c?ng', 'Ổ cứng');
UPDATE devices SET name = REPLACE(name, '? c?ng di ??ng', 'Ổ cứng di động');
UPDATE devices SET name = REPLACE(name, '?i?n', 'Điện');
UPDATE devices SET name = REPLACE(name, 'di ??ng', 'di động');
UPDATE devices SET name = REPLACE(name, 'v?n ph?ng', 'văn phòng');
UPDATE devices SET name = REPLACE(name, 'th? nghi?m', 'thử nghiệm');

-- 4. Sửa các tên thiết bị cụ thể còn lại
UPDATE devices SET name = 'Laptop hiệu trưởng' WHERE device_code = 'TVU-LT-020';
UPDATE devices SET name = 'Máy in Khoa CNTT' WHERE device_code = 'TVU-PR-020';
UPDATE devices SET name = 'Máy tính bàn Hành chính #1' WHERE device_code = 'TVU-PC-100';
UPDATE devices SET name = 'Máy tính bàn Hành chính #2' WHERE device_code = 'TVU-PC-101';

SELECT 'FIX COMPLETE' AS status;
