-- Add next_action_suggestion column to prospects table
-- This stores AI-generated action suggestions separately from user's personal next_action notes
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS next_action_suggestion TEXT;
