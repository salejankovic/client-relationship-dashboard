-- Add upsell_strategy column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS upsell_strategy TEXT[] DEFAULT '{}';
