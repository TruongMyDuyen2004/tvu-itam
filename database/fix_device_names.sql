UPDATE devices SET name = 'Máy tính bàn Hành chính #1' WHERE device_code = 'TVU-PC-100';
UPDATE devices SET name = 'Máy tính bàn Hành chính #2' WHERE device_code = 'TVU-PC-101';
UPDATE devices SET name = 'Laptop hiệu trưởng' WHERE device_code = 'TVU-LT-020';
UPDATE devices SET name = 'Máy in Khoa CNTT' WHERE device_code = 'TVU-PR-020';
SELECT device_code, name FROM devices WHERE device_code IN ('TVU-PC-100','TVU-PC-101','TVU-LT-020','TVU-PR-020');
