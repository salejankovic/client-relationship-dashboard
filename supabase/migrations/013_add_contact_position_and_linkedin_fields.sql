-- Add contact position and contact linkedin URL fields to prospects table

ALTER TABLE prospects ADD COLUMN IF NOT EXISTS contact_position TEXT;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS contact_linkedin_url TEXT;
