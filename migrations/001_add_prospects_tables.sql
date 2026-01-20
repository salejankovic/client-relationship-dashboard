-- Migration: Add Prospects & Intelligence Tables
-- Date: 2026-01-20
-- Description: Adds acquisition module tables without touching existing clients table

-- ==================================================
-- 1. PROSPECTS TABLE
-- ==================================================
CREATE TABLE prospects (
  id TEXT PRIMARY KEY,

  -- Basic Info
  company TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  telephone TEXT,
  website TEXT,
  linkedin_url TEXT,

  -- Classification
  product_type TEXT CHECK (product_type IN ('Mobile app', 'Website/CMS', 'LitteraWorks', 'CMS', 'Other')),
  prospect_type TEXT CHECK (prospect_type IN ('Media', 'Sports Club', 'Sports League', 'Other')),
  country TEXT,

  -- Sales Pipeline
  status TEXT NOT NULL DEFAULT 'Warm' CHECK (status IN ('Hot', 'Warm', 'Cold', 'Lost')),
  owner TEXT, -- Assigned sales person
  source TEXT, -- How prospect was acquired
  deal_value NUMERIC,

  -- Activity Tracking
  next_action TEXT,
  next_action_date DATE,
  last_contact_date TIMESTAMPTZ,
  days_since_contact INTEGER, -- Computed field

  -- Archiving
  archived BOOLEAN DEFAULT FALSE,
  archived_date TIMESTAMPTZ,
  archive_reason TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_prospects_status ON prospects(status);
CREATE INDEX idx_prospects_owner ON prospects(owner);
CREATE INDEX idx_prospects_country ON prospects(country);
CREATE INDEX idx_prospects_archived ON prospects(archived);
CREATE INDEX idx_prospects_next_action_date ON prospects(next_action_date);

-- ==================================================
-- 2. PROSPECT COMMENTS (Activity Timeline)
-- ==================================================
CREATE TABLE prospect_comments (
  id TEXT PRIMARY KEY,
  prospect_id TEXT NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,

  comment TEXT NOT NULL,
  author TEXT, -- Who added this comment
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_prospect ON prospect_comments(prospect_id);
CREATE INDEX idx_comments_created ON prospect_comments(created_at DESC);

-- ==================================================
-- 3. INTELLIGENCE FEED
-- ==================================================
CREATE TABLE intelligence_items (
  id TEXT PRIMARY KEY,
  prospect_id TEXT REFERENCES prospects(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('linkedin', 'news', 'sports', 'job-change', 'funding', 'other')),
  url TEXT,
  image_url TEXT,

  -- Metadata
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  dismissed BOOLEAN DEFAULT FALSE,

  -- AI Enhancement
  ai_tip TEXT, -- AI-generated engagement suggestion
  relevance_score INTEGER CHECK (relevance_score >= 0 AND relevance_score <= 100)
);

CREATE INDEX idx_intelligence_prospect ON intelligence_items(prospect_id);
CREATE INDEX idx_intelligence_source ON intelligence_items(source_type);
CREATE INDEX idx_intelligence_published ON intelligence_items(published_at DESC);
CREATE INDEX idx_intelligence_dismissed ON intelligence_items(dismissed);

-- ==================================================
-- 4. EMAIL DRAFTS
-- ==================================================
CREATE TABLE email_drafts (
  id TEXT PRIMARY KEY,
  prospect_id TEXT NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,

  -- Email Content
  subject TEXT NOT NULL,
  body TEXT NOT NULL,

  -- Context
  tone TEXT CHECK (tone IN ('formal', 'casual', 'urgent', 'english', 'shorter')),
  goal TEXT CHECK (goal IN ('check-in', 'schedule-call', 'share-update', 're-introduce', 'close-deal')),
  language TEXT CHECK (language IN ('croatian', 'serbian', 'english')),

  -- Status
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,

  -- AI Metadata
  ai_model TEXT DEFAULT 'mock', -- 'claude-3-opus', 'gpt-4', etc.

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drafts_prospect ON email_drafts(prospect_id);
CREATE INDEX idx_drafts_sent ON email_drafts(sent_at);

-- ==================================================
-- 5. AI INSIGHTS
-- ==================================================
CREATE TABLE ai_insights (
  id TEXT PRIMARY KEY,
  prospect_id TEXT NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,

  -- Analysis
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  engagement_score INTEGER CHECK (engagement_score >= 0 AND engagement_score <= 100),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),

  -- Recommendations
  recommended_action TEXT,
  best_time_to_reach TEXT, -- e.g., "Mornings (9-11 AM)"
  key_topics TEXT[], -- Array of topics extracted from conversations

  -- Metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  ai_model TEXT DEFAULT 'mock'
);

CREATE INDEX idx_insights_prospect ON ai_insights(prospect_id);
CREATE INDEX idx_insights_generated ON ai_insights(generated_at DESC);

-- ==================================================
-- 6. AUTO-UPDATE TRIGGERS
-- ==================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON prospects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-calculate days_since_contact
CREATE OR REPLACE FUNCTION update_days_since_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_contact_date IS NOT NULL THEN
    NEW.days_since_contact = EXTRACT(DAY FROM NOW() - NEW.last_contact_date);
  ELSE
    NEW.days_since_contact = NULL;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_days_since_contact BEFORE INSERT OR UPDATE ON prospects
FOR EACH ROW EXECUTE FUNCTION update_days_since_contact();

-- ==================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ==================================================

-- Enable RLS on all tables
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

-- Open policies (no auth for internal tool)
CREATE POLICY "Allow all access to prospects" ON prospects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to comments" ON prospect_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to intelligence" ON intelligence_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to drafts" ON email_drafts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to insights" ON ai_insights FOR ALL USING (true) WITH CHECK (true);

-- ==================================================
-- 8. SEED DATA (Optional - for testing)
-- ==================================================

-- Add a sample prospect
INSERT INTO prospects (id, company, contact_person, email, telephone, product_type, prospect_type, country, status, owner, deal_value, next_action, last_contact_date)
VALUES
  ('prospect-1', 'HRT Croatia', 'Marko Ivić', 'marko@hrt.hr', '+385 1 234 5678', 'Mobile app', 'Media', 'Croatia', 'Hot', 'John Smith', 50000, 'Schedule demo call', NOW() - INTERVAL '2 days');

-- Add a sample comment
INSERT INTO prospect_comments (id, prospect_id, comment, author, created_at)
VALUES
  ('comment-1', 'prospect-1', 'Initial contact made. Very interested in mobile app solution.', 'John Smith', NOW() - INTERVAL '2 days');

-- Add sample intelligence
INSERT INTO intelligence_items (id, prospect_id, title, description, source_type, url, published_at, ai_tip)
VALUES
  ('intel-1', 'prospect-1', 'HRT launches new digital strategy', 'Croatian public broadcaster announces major digital transformation initiative.', 'news', 'https://example.com/news', NOW() - INTERVAL '1 day', 'Great timing to position our mobile app as part of their digital strategy. Mention this in your next email.');

-- ==================================================
-- MIGRATION COMPLETE
-- ==================================================
-- Next steps:
-- 1. Run this in Supabase SQL Editor
-- 2. Verify tables created successfully
-- 3. Check seed data appears in prospects table
-- ==================================================
