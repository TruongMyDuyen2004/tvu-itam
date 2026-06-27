-- Migration: Add useful_life_years to device_categories
-- Theo Thông tư 45/2013/TT-BTC, Thông tư 28/2017/TT-BTC

ALTER TABLE device_categories
ADD COLUMN useful_life_years INT NOT NULL DEFAULT 5 COMMENT 'Thời gian khấu hao (năm)';

-- Cập nhật thời gian khấu hao cho từng loại tài sản theo quy định
UPDATE device_categories SET useful_life_years = 5 WHERE id = 1;  -- Máy tính để bàn
UPDATE device_categories SET useful_life_years = 5 WHERE id = 2;  -- Máy tính xách tay
UPDATE device_categories SET useful_life_years = 7 WHERE id = 3;  -- Máy chủ (Server)
UPDATE device_categories SET useful_life_years = 5 WHERE id = 4;  -- Thiết bị mạng
UPDATE device_categories SET useful_life_years = 5 WHERE id = 5;  -- Máy in
UPDATE device_categories SET useful_life_years = 5 WHERE id = 6;  -- Màn hình
UPDATE device_categories SET useful_life_years = 5 WHERE id = 7;  -- Máy chiếu
UPDATE device_categories SET useful_life_years = 5 WHERE id = 8;  -- UPS / Nguồn điện
UPDATE device_categories SET useful_life_years = 5 WHERE id = 9;  -- Thiết bị lưu trữ
UPDATE device_categories SET useful_life_years = 3 WHERE id = 10; -- Thiết bị ngoại vi
