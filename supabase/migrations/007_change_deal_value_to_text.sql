-- Migration: Change deal_value from numeric to text
-- Date: 2026-01-22
-- Description: Allow flexible deal value descriptions like "385€ monthly + 1,500€ one time fee"

-- Drop any constraints on deal_value if they exist
-- This migration assumes deal_value might be NUMERIC or INTEGER

-- Change deal_value column to TEXT type
-- This allows storing flexible descriptions instead of just numbers
ALTER TABLE prospects ALTER COLUMN deal_value TYPE TEXT USING deal_value::TEXT;
