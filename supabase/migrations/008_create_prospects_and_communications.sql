-- Migration: Create Prospects and Communications Tables
-- Date: 2026-01-22
-- Description: Create the core prospects and communications tables that were missing from previous migrations

-- ==================================================
-- 1. PROSPECTS TABLE
-- ==================================================
CREATE TABLE IF NOT EXISTS prospects (
  id TEXT PRIMARY KEY,

  -- Basic Company Info
  company TEXT NOT NULL,
  website TEXT,
  linkedin_url TEXT,
  country TEXT,

  -- Classification
  product_type TEXT,
  prospect_type TEXT,
  status TEXT DEFAULT 'Warm' CHECK (status IN ('Hot', 'Warm', 'Cold', 'Lost')),

  -- Contact Info (legacy fields - primary contact info)
  contact_person TEXT,
  email TEXT,
  telephone TEXT,

  -- Deal Info
  deal_value TEXT,
  owner TEXT,

  -- Next Action
  next_action TEXT,
  next_action_date TEXT,

  -- Tracking
  last_contact_date TEXT,
  days_since_contact INTEGER DEFAULT 0,

  -- Archive
  archived BOOLEAN DEFAULT FALSE,
  archive_reason TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for prospects
CREATE INDEX IF NOT EXISTS idx_prospects_company ON prospects(company);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_owner ON prospects(owner);
CREATE INDEX IF NOT EXISTS idx_prospects_product_type ON prospects(product_type);
CREATE INDEX IF NOT EXISTS idx_prospects_archived ON prospects(archived);
CREATE INDEX IF NOT EXISTS idx_prospects_country ON prospects(country);

-- ==================================================
-- 2. COMMUNICATIONS TABLE
-- ==================================================
CREATE TABLE IF NOT EXISTS communications (
  id TEXT PRIMARY KEY,
  prospect_id TEXT NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,

  -- Communication Details
  type TEXT NOT NULL CHECK (type IN ('email', 'call', 'meeting', 'note', 'linkedin')),
  subject TEXT,
  content TEXT,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),

  -- Call/Meeting specific
  duration INTEGER, -- minutes
  attendees TEXT[],

  -- Email specific (added by migration 003)
  email_message_id TEXT,
  email_thread_id TEXT,
  email_labels TEXT[],
  synced_from TEXT,
  synced_at TIMESTAMPTZ,

  -- Metadata
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ai_summary TEXT
);

-- Indexes for communications
CREATE INDEX IF NOT EXISTS idx_communications_prospect ON communications(prospect_id);
CREATE INDEX IF NOT EXISTS idx_communications_type ON communications(type);
CREATE INDEX IF NOT EXISTS idx_communications_created_at ON communications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communications_email_id ON communications(email_message_id);
CREATE INDEX IF NOT EXISTS idx_communications_thread_id ON communications(email_thread_id);

-- ==================================================
-- 3. TRIGGERS
-- ==================================================

-- Trigger for prospects updated_at
DROP TRIGGER IF EXISTS update_prospects_updated_at ON prospects;
CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON prospects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==================================================

-- Enable RLS
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow all access to prospects" ON prospects;
DROP POLICY IF EXISTS "Allow all access to communications" ON communications;

-- Create policies (allow all since this is an internal tool without auth)
CREATE POLICY "Allow all access to prospects" ON prospects
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to communications" ON communications
  FOR ALL USING (true) WITH CHECK (true);

-- ==================================================
-- MIGRATION COMPLETE
-- ==================================================
-- This migration creates:
-- 1. prospects table with all necessary columns
-- 2. communications table with all necessary columns
-- 3. Proper indexes for query performance
-- 4. Updated_at trigger for prospects
-- 5. RLS policies allowing all access (internal tool)
-- ==================================================
