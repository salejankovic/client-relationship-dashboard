-- Migration: Intelligence Enhancements for Rich Feed
-- Date: 2026-01-27
-- Description: Enhance intelligence_items table for rich card types and add refresh tracking

-- ==================================================
-- 1. CREATE INTELLIGENCE_ITEMS TABLE (if not exists)
-- ==================================================
CREATE TABLE IF NOT EXISTS intelligence_items (
  id TEXT PRIMARY KEY,
  prospect_id TEXT REFERENCES prospects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL,
  url TEXT,
  image_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  dismissed BOOLEAN DEFAULT FALSE,
  ai_tip TEXT,
  relevance_score INTEGER
);

-- ==================================================
-- 2. ADD NEW COLUMNS FOR RICH INTELLIGENCE TYPES
-- ==================================================

-- Intelligence type for card rendering
ALTER TABLE intelligence_items ADD COLUMN IF NOT EXISTS intelligence_type TEXT;

-- Person-related fields (for LinkedIn posts, job changes)
ALTER TABLE intelligence_items ADD COLUMN IF NOT EXISTS person_name TEXT;
ALTER TABLE intelligence_items ADD COLUMN IF NOT EXISTS person_position TEXT;
ALTER TABLE intelligence_items ADD COLUMN IF NOT EXISTS person_linkedin_url TEXT;
ALTER TABLE intelligence_items ADD COLUMN IF NOT EXISTS person_avatar_url TEXT;

-- Company/source fields
ALTER TABLE intelligence_items ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE intelligence_items ADD COLUMN IF NOT EXISTS source_name TEXT;
ALTER TABLE intelligence_items ADD COLUMN IF NOT EXISTS content_quote TEXT;

-- Match result fields (for sports)
ALTER TABLE intelligence_items ADD COLUMN IF NOT EXISTS match_home_team TEXT;
ALTER TABLE intelligence_items ADD COLUMN IF NOT EXISTS match_away_team TEXT;
ALTER TABLE intelligence_items ADD COLUMN IF NOT EXISTS match_home_score INTEGER;
ALTER TABLE intelligence_items ADD COLUMN IF NOT EXISTS match_away_score INTEGER;
ALTER TABLE intelligence_items ADD COLUMN IF NOT EXISTS match_scorers TEXT;
ALTER TABLE intelligence_items ADD COLUMN IF NOT EXISTS match_league TEXT;

-- Job change fields
ALTER TABLE intelligence_items ADD COLUMN IF NOT EXISTS previous_position TEXT;
ALTER TABLE intelligence_items ADD COLUMN IF NOT EXISTS previous_company TEXT;

-- Country code for flag display
ALTER TABLE intelligence_items ADD COLUMN IF NOT EXISTS country_code TEXT;

-- ==================================================
-- 3. CREATE INDEXES
-- ==================================================
CREATE INDEX IF NOT EXISTS idx_intelligence_prospect ON intelligence_items(prospect_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_source_type ON intelligence_items(source_type);
CREATE INDEX IF NOT EXISTS idx_intelligence_type ON intelligence_items(intelligence_type);
CREATE INDEX IF NOT EXISTS idx_intelligence_created ON intelligence_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_dismissed ON intelligence_items(dismissed);

-- ==================================================
-- 4. CREATE INTELLIGENCE REFRESH LOG TABLE
-- ==================================================
CREATE TABLE IF NOT EXISTS intelligence_refresh_log (
  id TEXT PRIMARY KEY,
  prospect_id TEXT REFERENCES prospects(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'web_search', 'linkedin', 'sports', etc.
  last_refresh_at TIMESTAMPTZ DEFAULT NOW(),
  next_refresh_at TIMESTAMPTZ,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  items_found INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_refresh_log_prospect ON intelligence_refresh_log(prospect_id);
CREATE INDEX IF NOT EXISTS idx_refresh_log_next ON intelligence_refresh_log(next_refresh_at);
CREATE INDEX IF NOT EXISTS idx_refresh_log_source ON intelligence_refresh_log(source);

-- ==================================================
-- 5. ROW LEVEL SECURITY
-- ==================================================
ALTER TABLE intelligence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_refresh_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to intelligence_items" ON intelligence_items;
CREATE POLICY "Allow all access to intelligence_items" ON intelligence_items
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to intelligence_refresh_log" ON intelligence_refresh_log;
CREATE POLICY "Allow all access to intelligence_refresh_log" ON intelligence_refresh_log
  FOR ALL USING (true) WITH CHECK (true);

-- ==================================================
-- MIGRATION COMPLETE
-- ==================================================
-- Added columns for:
-- - LinkedIn posts (person info, content quote)
-- - Match results (scores, scorers, league)
-- - Job changes (previous position/company)
-- - Company updates (source name, company name)
-- - Intelligence refresh tracking
-- ==================================================
