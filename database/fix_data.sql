-- Fix data for TVU-ITAM thesis - run this via phpMyAdmin or mysql CLI

-- 1. Update maintenance: completed status, costs, actual dates
UPDATE maintenance_schedules SET status='hoan_thanh', result='da_sua', actual_date='2026-05-12', cost=1500000, notes='Da thay keo tan nhiet CPU, ve sinh quan.' WHERE id=1;
UPDATE maintenance_schedules SET status='hoan_thanh', result='da_sua', actual_date='2026-05-08', cost=2500000, notes='Thay the RAM loi bang RAM Kingston 8GB DDR4.' WHERE id=2;
UPDATE maintenance_schedules SET status='hoan_thanh', result='da_sua', actual_date='2026-05-18', cost=3000000, notes='Thay o cung Seagate 4TB moi cho RAID array.' WHERE id=3;
UPDATE maintenance_schedules SET status='hoan_thanh', result='da_sua', actual_date='2026-06-03', cost=800000, notes='Firmware nang cap tu v15.2 len v15.5.' WHERE id=5;
UPDATE maintenance_schedules SET status='hoan_thanh', result='da_sua', actual_date='2026-06-18', cost=500000, notes='Ve sinh dinh ky.' WHERE id=6;
UPDATE maintenance_schedules SET status='hoan_thanh', result='da_sua', actual_date='2026-06-22', cost=2000000, notes='Thay bong den Epson ELPLP88 chinh hang.' WHERE id=4;

-- 2. Set depreciation_rate for variety
UPDATE devices SET depreciation_rate=25 WHERE depreciation_rate IS NULL OR depreciation_rate=20;
UPDATE devices SET depreciation_rate=15 WHERE category_id=3;
UPDATE devices SET depreciation_rate=30 WHERE category_id IN (4,10);
UPDATE devices SET depreciation_rate=10 WHERE category_id=8;

-- 3. Set purchase_dates for devices that have NULL
UPDATE devices SET purchase_date='2024-01-15' WHERE id=1 AND purchase_date IS NULL;
UPDATE devices SET purchase_date='2024-03-20' WHERE id=2 AND purchase_date IS NULL;
UPDATE devices SET purchase_date='2023-06-10' WHERE id=4 AND purchase_date IS NULL;
UPDATE devices SET purchase_date='2024-09-05' WHERE id=5 AND purchase_date IS NULL;
UPDATE devices SET purchase_date='2025-02-15' WHERE id=11 AND purchase_date IS NULL;
UPDATE devices SET purchase_date='2025-04-01' WHERE id=12 AND purchase_date IS NULL;
UPDATE devices SET purchase_date='2026-01-05' WHERE id=13 AND purchase_date IS NULL;
UPDATE devices SET purchase_date='2026-03-10' WHERE id=14 AND purchase_date IS NULL;
UPDATE devices SET purchase_date='2025-07-01' WHERE id IN (15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41) AND purchase_date IS NULL;

-- 4. Fix some purchase prices for realism
UPDATE devices SET purchase_price=16500000 WHERE device_code='TVU-PC-001' AND purchase_price=15000000;
UPDATE devices SET purchase_price=12500000 WHERE device_code='TVU-PC-010' AND purchase_price=12000000;
UPDATE devices SET purchase_price=25000000 WHERE device_code='TVU-PR-001' AND purchase_price=28000000;
UPDATE devices SET purchase_price=7500000 WHERE device_code='TVU-MN-001' AND purchase_price=9500000;
UPDATE devices SET purchase_price=32000000 WHERE device_code='TVU-SV-001' AND purchase_price=180000000;

-- 5. Fix incident severity
UPDATE incident_reports SET severity='critical' WHERE id=1;
UPDATE incident_reports SET severity='high' WHERE id=2;
