ALTER TABLE disposals ADD COLUMN rejection_reason TEXT NULL AFTER notes;
ALTER TABLE asset_transfers ADD COLUMN rejection_reason TEXT NULL AFTER notes;
