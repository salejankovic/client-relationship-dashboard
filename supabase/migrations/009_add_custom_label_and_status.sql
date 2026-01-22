-- Migration: Add Custom Label and "Not contacted yet" Status
-- Date: 2026-01-22
-- Description: Add custom_label field for custom tags and add "Not contacted yet" to status options

-- ==================================================
-- 1. ADD CUSTOM LABEL FIELD
-- ==================================================
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS custom_label TEXT;

-- Index for filtering by custom label
CREATE INDEX IF NOT EXISTS idx_prospects_custom_label ON prospects(custom_label);

-- ==================================================
-- 2. UPDATE STATUS CONSTRAINT
-- ==================================================
-- Drop the old constraint
ALTER TABLE prospects DROP CONSTRAINT IF EXISTS prospects_status_check;

-- Add new constraint with "Not contacted yet" option
ALTER TABLE prospects ADD CONSTRAINT prospects_status_check
  CHECK (status IN ('Not contacted yet', 'Hot', 'Warm', 'Cold', 'Lost'));

-- ==================================================
-- MIGRATION COMPLETE
-- ==================================================
-- Changes made:
-- 1. Added custom_label column for custom tags (e.g., "Athens trip March 2026")
-- 2. Added "Not contacted yet" status option
-- ==================================================
