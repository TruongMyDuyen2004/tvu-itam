-- Fix ALL device prices to realistic market values
-- Ch?y sau fix_data.sql

-- Helper: set prices by device_code for main devices (IDs 1-14 from original seed)
UPDATE devices SET purchase_price = 16500000 WHERE device_code = 'TVU-PC-001';  -- Dell OptiPlex 7080
UPDATE devices SET purchase_price = 7500000  WHERE device_code = 'TVU-PC-002';  -- HP ProDesk 600 G6 (cu)
UPDATE devices SET purchase_price = 35000000 WHERE device_code = 'TVU-LT-001';  -- ThinkPad X1 Carbon Gen 9
UPDATE devices SET purchase_price = 180000000 WHERE device_code = 'TVU-SV-001'; -- HPE ProLiant DL380 Gen10
UPDATE devices SET purchase_price = 25000000 WHERE device_code = 'TVU-SW-001';  -- Switch Cisco Catalyst 2960-X
UPDATE devices SET purchase_price = 7500000  WHERE device_code = 'TVU-PR-001';  -- Canon MF235 da nang
UPDATE devices SET purchase_price = 25000000 WHERE device_code = 'TVU-MN-001';  -- Panasonic PT-LB305 (may chieu)
UPDATE devices SET purchase_price = 15000000 WHERE device_code = 'TVU-PJ-001';  -- NAS Synology DS920+
UPDATE devices SET purchase_price = 8000000  WHERE device_code = 'TVU-UPS-001'; -- Man hinh Samsung Odyssey G5
UPDATE devices SET purchase_price = 15000000 WHERE device_code = 'TVU-PC-003';  -- Lenovo M70s
UPDATE devices SET purchase_price = 22000000 WHERE device_code = 'TVU-LT-002';  -- Dell Latitude 5420
UPDATE devices SET purchase_price = 45000000 WHERE device_code = 'TVU-LT-003';  -- MacBook Pro 14
UPDATE devices SET purchase_price = 18000000 WHERE device_code = 'TVU-PC-004';  -- Dell OptiPlex 7080 #13
UPDATE devices SET purchase_price = 14000000 WHERE device_code = 'TVU-PC-005';  -- HP ProDesk 600 G6 #14

-- Fix by device_code pattern for seed_more_data devices
-- Desktops (cat 1): 12-18tr
UPDATE devices SET purchase_price = 15000000 WHERE device_code = 'TVU-PC-006';
UPDATE devices SET purchase_price = 18000000 WHERE device_code = 'TVU-PC-010';
UPDATE devices SET purchase_price = 16000000 WHERE device_code = 'TVU-PC-011';
UPDATE devices SET purchase_price = 13000000 WHERE device_code = 'TVU-PC-012';

-- Laptops (cat 2): 20-45tr
UPDATE devices SET purchase_price = 38000000 WHERE device_code = 'TVU-LT-010';
UPDATE devices SET purchase_price = 22000000 WHERE device_code = 'TVU-LT-011';
UPDATE devices SET purchase_price = 45000000 WHERE device_code = 'TVU-LT-012';

-- Printers (cat 5): 5-12tr
UPDATE devices SET purchase_price = 8000000  WHERE device_code = 'TVU-PR-002';
UPDATE devices SET purchase_price = 7500000  WHERE device_code = 'TVU-PR-003';
UPDATE devices SET purchase_price = 8000000  WHERE device_code = 'TVU-PR-004';
UPDATE devices SET purchase_price = 7500000  WHERE device_code = 'TVU-PR-005';

-- Projectors (devices with device_code LIKE 'TVU-MN-%' in cat 6): 15-30tr
UPDATE devices SET purchase_price = 25000000 WHERE device_code = 'TVU-MN-002';
UPDATE devices SET purchase_price = 25000000 WHERE device_code = 'TVU-MN-010';
UPDATE devices SET purchase_price = 20000000 WHERE device_code = 'TVU-MN-011';
UPDATE devices SET purchase_price = 25000000 WHERE device_code = 'TVU-MN-012';

-- Network (cat 4)
UPDATE devices SET purchase_price = 25000000 WHERE device_code = 'TVU-SW-002';
UPDATE devices SET purchase_price = 25000000 WHERE device_code = 'TVU-WF-001';
UPDATE devices SET purchase_price = 25000000 WHERE device_code = 'TVU-WF-002';
UPDATE devices SET purchase_price = 25000000 WHERE device_code = 'TVU-SW-003';
UPDATE devices SET purchase_price = 30000000 WHERE device_code = 'TVU-RT-001';
UPDATE devices SET purchase_price = 25000000 WHERE device_code = 'TVU-WF-003';

-- Monitors (cat 8; codes TVU-UPS-* for historical reasons)
UPDATE devices SET purchase_price = 8000000  WHERE device_code = 'TVU-UPS-002';
UPDATE devices SET purchase_price = 10000000 WHERE device_code = 'TVU-UPS-003';
UPDATE devices SET purchase_price = 8000000  WHERE device_code = 'TVU-UPS-004';

-- Storage (cat 9)
UPDATE devices SET purchase_price = 15000000 WHERE device_code = 'TVU-NAS-001';
UPDATE devices SET purchase_price = 12000000 WHERE device_code = 'TVU-NAS-002';
UPDATE devices SET purchase_price = 2500000  WHERE device_code = 'TVU-HDD-001';
UPDATE devices SET purchase_price = 3500000  WHERE device_code = 'TVU-HDD-002';

-- Peripherals (cat 10)
UPDATE devices SET purchase_price = 300000   WHERE device_code = 'TVU-KB-001';
UPDATE devices SET purchase_price = 200000   WHERE device_code = 'TVU-MS-001';
UPDATE devices SET purchase_price = 2500000  WHERE device_code = 'TVU-WC-001';

-- Servers (cat 3) from seed_more_data: 100-180tr
UPDATE devices SET purchase_price = 150000000 WHERE device_code = 'TVU-SV-002';
UPDATE devices SET purchase_price = 150000000 WHERE device_code = 'TVU-SV-003';

-- TVU-DEV-* devices — set by category
UPDATE devices SET purchase_price = 150000000 WHERE device_code = 'TVU-DEV-100';  -- Server
UPDATE devices SET purchase_price = 15000000  WHERE device_code = 'TVU-DEV-101';  -- Desktop
UPDATE devices SET purchase_price = 20000000  WHERE device_code = 'TVU-DEV-102';  -- Projector (in cat 6)
UPDATE devices SET purchase_price = 35000000  WHERE device_code = 'TVU-DEV-103';  -- Laptop
UPDATE devices SET purchase_price = 10000000  WHERE device_code = 'TVU-DEV-104';  -- Monitor
UPDATE devices SET purchase_price = 18000000  WHERE device_code = 'TVU-DEV-105';  -- NAS/Storage
UPDATE devices SET purchase_price = 180000000 WHERE device_code = 'TVU-DEV-106';  -- Server
UPDATE devices SET purchase_price = 22000000  WHERE device_code = 'TVU-DEV-107';  -- Laptop
UPDATE devices SET purchase_price = 180000000 WHERE device_code = 'TVU-DEV-108';  -- Server
UPDATE devices SET purchase_price = 30000000  WHERE device_code = 'TVU-DEV-109';  -- Router
UPDATE devices SET purchase_price = 14000000  WHERE device_code = 'TVU-DEV-110';  -- Desktop
UPDATE devices SET purchase_price = 25000000  WHERE device_code = 'TVU-DEV-111';  -- Projector (in cat 6)
UPDATE devices SET purchase_price = 20000000  WHERE device_code = 'TVU-DEV-112';  -- Projector (in cat 6)
UPDATE devices SET purchase_price = 8000000   WHERE device_code = 'TVU-DEV-113';  -- TB thi nghiem (disposed)
UPDATE devices SET purchase_price = 25000000  WHERE device_code = 'TVU-DEV-114';  -- Switch
UPDATE devices SET purchase_price = 8000000   WHERE device_code = 'TVU-DEV-115';  -- Printer
UPDATE devices SET purchase_price = 180000000 WHERE device_code = 'TVU-DEV-116';  -- Server
UPDATE devices SET purchase_price = 18000000  WHERE device_code = 'TVU-DEV-117';  -- NAS/Storage
UPDATE devices SET purchase_price = 180000000 WHERE device_code = 'TVU-DEV-118';  -- Server
UPDATE devices SET purchase_price = 150000000 WHERE device_code = 'TVU-DEV-119';  -- Server (broken)

-- Fix test/demo devices: set minimal realistic prices
UPDATE devices SET purchase_price = 500000  WHERE device_code LIKE 'TVU-DEMO-%';
UPDATE devices SET purchase_price = 15000000 WHERE device_code = 'TVU-MAU-01';
UPDATE devices SET purchase_price = 22000000 WHERE device_code = 'TVU-MAU-02';

-- Devices added later from manual scripts (TVU-TEST-B*, TVU-PC-100, etc.)
UPDATE devices SET purchase_price = 15000000 WHERE device_code = 'TVU-TEST-B01';
UPDATE devices SET purchase_price = 22000000 WHERE device_code = 'TVU-TEST-B02';
UPDATE devices SET purchase_price = 35000000 WHERE device_code = 'TVU-TEST-B03';
UPDATE devices SET purchase_price = 5500000  WHERE device_code = 'TVU-TEST-B04';
UPDATE devices SET purchase_price = 85000000 WHERE device_code = 'TVU-TEST-B05';
UPDATE devices SET purchase_price = 15000000 WHERE device_code = 'TVU-PC-100';
UPDATE devices SET purchase_price = 14000000 WHERE device_code = 'TVU-PC-101';
UPDATE devices SET purchase_price = 28000000 WHERE device_code = 'TVU-LT-020';
UPDATE devices SET purchase_price = 12000000 WHERE device_code = 'TVU-PR-020';

-- Catch any remaining devices (fix by category with reasonable defaults)
UPDATE devices SET purchase_price = 15000000 WHERE purchase_price IS NULL AND category_id = 1;
UPDATE devices SET purchase_price = 25000000 WHERE purchase_price IS NULL AND category_id = 2;
UPDATE devices SET purchase_price = 150000000 WHERE purchase_price IS NULL AND category_id = 3;
UPDATE devices SET purchase_price = 25000000 WHERE purchase_price IS NULL AND category_id = 4;
UPDATE devices SET purchase_price = 8000000 WHERE purchase_price IS NULL AND category_id = 5;
UPDATE devices SET purchase_price = 10000000 WHERE purchase_price IS NULL AND category_id = 6;
UPDATE devices SET purchase_price = 20000000 WHERE purchase_price IS NULL AND category_id = 7;
UPDATE devices SET purchase_price = 8000000 WHERE purchase_price IS NULL AND category_id = 8;
UPDATE devices SET purchase_price = 15000000 WHERE purchase_price IS NULL AND category_id = 9;
UPDATE devices SET purchase_price = 500000 WHERE purchase_price IS NULL AND category_id = 10;
