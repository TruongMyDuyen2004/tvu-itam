-- Migration: Add report fields to disposals table
-- Báo cáo kết quả thanh lý gửi cơ quan chủ quản

ALTER TABLE disposals
  ADD COLUMN report_number VARCHAR(50) NULL AFTER notes,
  ADD COLUMN report_date DATE NULL AFTER report_number,
  ADD COLUMN report_notes TEXT NULL AFTER report_date;
