-- Migration: add clinical fields to tests, samples, and results
-- Run this against your existing smartlab_db to apply the new columns.
-- Safe to run multiple times (uses IF NOT EXISTS / MODIFY pattern).

USE smartlab_db;

-- ── tests table ─────────────────────────────────────────────────────────────
ALTER TABLE tests
  ADD COLUMN IF NOT EXISTS unit VARCHAR(100) COMMENT 'Measurement unit e.g. mmol/L, g/dL' AFTER currency,
  ADD COLUMN IF NOT EXISTS reference_range VARCHAR(200) COMMENT 'Normal range e.g. 3.5–5.0 mmol/L' AFTER unit,
  ADD COLUMN IF NOT EXISTS turnaround_hours INT COMMENT 'Expected TAT in hours' AFTER reference_range;

-- ── samples table ─────────────────────────────────────────────────────────────
ALTER TABLE samples
  ADD COLUMN IF NOT EXISTS collected_at TIMESTAMP NULL COMMENT 'When specimen was physically collected — for TAT calculation' AFTER notes;

-- ── results table ─────────────────────────────────────────────────────────────
ALTER TABLE results
  MODIFY COLUMN value VARCHAR(500) NOT NULL,
  MODIFY COLUMN status ENUM('Normal', 'Abnormal', 'Pending Review', 'Rejected') DEFAULT 'Pending Review',
  ADD COLUMN IF NOT EXISTS unit VARCHAR(100) COMMENT 'Measurement unit e.g. mmol/L' AFTER value,
  ADD COLUMN IF NOT EXISTS reference_range VARCHAR(200) COMMENT 'Reference range at time of capture' AFTER unit,
  ADD COLUMN IF NOT EXISTS interpretation ENUM('Normal', 'Abnormal', 'Borderline', 'Critical', 'Inconclusive') COMMENT 'Lab tech flag' AFTER reference_range,
  ADD COLUMN IF NOT EXISTS doctor_note TEXT COMMENT 'Doctor note on approval or rejection' AFTER interpretation,
  ADD COLUMN IF NOT EXISTS approved_by INT NULL COMMENT 'User ID of approving doctor' AFTER status,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL AFTER approved_by;

-- Add FK for approved_by if not already present
SET @fk_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'results'
    AND COLUMN_NAME = 'approved_by'
    AND REFERENCED_TABLE_NAME = 'users'
);
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE results ADD CONSTRAINT fk_results_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for results status and approved_by if not present
ALTER TABLE results
  ADD INDEX IF NOT EXISTS idx_status (status),
  ADD INDEX IF NOT EXISTS idx_approved_by (approved_by);

SELECT 'Migration completed successfully.' AS result;
