-- Add new activity types to communications table
-- New types: online_call, sms_whatsapp, email_reply

-- Drop the old constraint
ALTER TABLE communications DROP CONSTRAINT IF EXISTS communications_type_check;

-- Add the new constraint with all activity types
ALTER TABLE communications
ADD CONSTRAINT communications_type_check
CHECK (type IN ('email', 'call', 'meeting', 'note', 'linkedin', 'online_call', 'sms_whatsapp', 'email_reply'));
