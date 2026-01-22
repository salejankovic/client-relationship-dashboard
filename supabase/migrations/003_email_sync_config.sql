-- Email Sync Configuration Table
CREATE TABLE IF NOT EXISTS email_sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  provider TEXT CHECK (provider IN ('gmail', 'outlook', 'imap')),

  -- OAuth tokens (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,

  -- User email connected
  email_address TEXT,

  -- Sync settings
  last_sync_at TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT true,
  auto_sync_interval INTEGER DEFAULT 15, -- minutes

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick user lookups
CREATE INDEX IF NOT EXISTS idx_email_sync_config_user ON email_sync_config(user_id);

-- Update communications table with email-specific fields
ALTER TABLE communications
ADD COLUMN IF NOT EXISTS email_message_id TEXT,
ADD COLUMN IF NOT EXISTS email_thread_id TEXT,
ADD COLUMN IF NOT EXISTS email_labels TEXT[],
ADD COLUMN IF NOT EXISTS synced_from TEXT,
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

-- Index for email deduplication
CREATE INDEX IF NOT EXISTS idx_communications_email_id ON communications(email_message_id);
CREATE INDEX IF NOT EXISTS idx_communications_thread_id ON communications(email_thread_id);
