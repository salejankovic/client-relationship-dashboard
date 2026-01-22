-- Migration: Add Countries and Contacts Tables
-- Date: 2026-01-22
-- Description: Add countries table with flags and contacts table for multiple persons per prospect

-- ==================================================
-- 1. COUNTRIES TABLE
-- ==================================================
CREATE TABLE IF NOT EXISTS countries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  flag_emoji TEXT, -- Unicode flag emoji
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default countries with flag emojis
INSERT INTO countries (id, name, flag_emoji) VALUES
  ('serbia', 'Serbia', '🇷🇸'),
  ('croatia', 'Croatia', '🇭🇷'),
  ('slovenia', 'Slovenia', '🇸🇮'),
  ('spain', 'Spain', '🇪🇸'),
  ('azerbaijan', 'Azerbaijan', '🇦🇿'),
  ('ghana', 'Ghana', '🇬🇭'),
  ('usa', 'United States', '🇺🇸'),
  ('uk', 'United Kingdom', '🇬🇧'),
  ('germany', 'Germany', '🇩🇪'),
  ('france', 'France', '🇫🇷')
ON CONFLICT (name) DO NOTHING;

-- Index for quick country lookups
CREATE INDEX IF NOT EXISTS idx_countries_name ON countries(name);

-- ==================================================
-- 2. PROSPECT CONTACTS TABLE
-- ==================================================
CREATE TABLE IF NOT EXISTS prospect_contacts (
  id TEXT PRIMARY KEY,
  prospect_id TEXT NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,

  -- Contact Details
  name TEXT NOT NULL,
  position TEXT,
  email TEXT,
  telephone TEXT,
  linkedin_url TEXT,

  -- Flags
  is_primary BOOLEAN DEFAULT FALSE, -- Mark primary contact

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prospect_contacts_prospect ON prospect_contacts(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_contacts_email ON prospect_contacts(email);
CREATE INDEX IF NOT EXISTS idx_prospect_contacts_primary ON prospect_contacts(is_primary);

-- ==================================================
-- 3. UPDATED TRIGGER FOR CONTACTS
-- ==================================================
CREATE TRIGGER update_prospect_contacts_updated_at BEFORE UPDATE ON prospect_contacts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- 4. ROW LEVEL SECURITY
-- ==================================================
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to countries" ON countries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to prospect_contacts" ON prospect_contacts FOR ALL USING (true) WITH CHECK (true);

-- ==================================================
-- MIGRATION COMPLETE
-- ==================================================
-- Next steps:
-- 1. Run this in Supabase SQL Editor
-- 2. Verify tables created successfully
-- 3. Check seed data in countries table
-- ==================================================
