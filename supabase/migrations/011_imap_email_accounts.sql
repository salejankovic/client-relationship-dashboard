-- IMAP Email Accounts Table
-- Stores credentials for multiple email accounts (Gmail, custom servers, etc.)
CREATE TABLE IF NOT EXISTS email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Account identification
  account_name TEXT NOT NULL, -- User-friendly name (e.g., "Work Gmail", "Sales Email")
  email_address TEXT NOT NULL,

  -- IMAP server configuration
  imap_host TEXT NOT NULL, -- e.g., imap.gmail.com, mail.domain.com
  imap_port INTEGER DEFAULT 993, -- 993 for SSL, 143 for TLS
  imap_username TEXT NOT NULL, -- Often same as email_address
  imap_password TEXT NOT NULL, -- TODO: Encrypt in production
  use_ssl BOOLEAN DEFAULT true,

  -- Status and sync tracking
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT, -- 'success', 'error', 'pending'
  last_sync_error TEXT, -- Store error message if sync fails

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_email_accounts_active ON email_accounts(is_active);
CREATE INDEX IF NOT EXISTS idx_email_accounts_email ON email_accounts(email_address);

-- Updated trigger for email_accounts
DROP TRIGGER IF EXISTS update_email_accounts_updated_at ON email_accounts;
CREATE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add account_id to communications table to track which account synced the email
ALTER TABLE communications
ADD COLUMN IF NOT EXISTS email_account_id UUID REFERENCES email_accounts(id) ON DELETE SET NULL;

-- Index for filtering communications by email account
CREATE INDEX IF NOT EXISTS idx_communications_email_account ON communications(email_account_id);

-- Remove old Gmail OAuth table (optional - comment out if you want to keep it)
-- DROP TABLE IF EXISTS email_sync_config CASCADE;
