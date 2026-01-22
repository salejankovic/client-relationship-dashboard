-- Migration: Add more countries with flag emojis
-- Date: 2026-01-22
-- Description: Add commonly used countries for the CRM

INSERT INTO countries (id, name, flag_emoji) VALUES
  ('bosnia', 'Bosnia and Herzegovina', '🇧🇦'),
  ('bosnia-short', 'Bosnia', '🇧🇦'),
  ('montenegro', 'Montenegro', '🇲🇪'),
  ('north-macedonia', 'North Macedonia', '🇲🇰'),
  ('albania', 'Albania', '🇦🇱'),
  ('kosovo', 'Kosovo', '🇽🇰'),
  ('italy', 'Italy', '🇮🇹'),
  ('austria', 'Austria', '🇦🇹'),
  ('switzerland', 'Switzerland', '🇨🇭'),
  ('poland', 'Poland', '🇵🇱'),
  ('czech-republic', 'Czech Republic', '🇨🇿'),
  ('slovakia', 'Slovakia', '🇸🇰'),
  ('hungary', 'Hungary', '🇭🇺'),
  ('romania', 'Romania', '🇷🇴'),
  ('bulgaria', 'Bulgaria', '🇧🇬'),
  ('greece', 'Greece', '🇬🇷'),
  ('turkey', 'Turkey', '🇹🇷'),
  ('netherlands', 'Netherlands', '🇳🇱'),
  ('belgium', 'Belgium', '🇧🇪'),
  ('portugal', 'Portugal', '🇵🇹'),
  ('norway', 'Norway', '🇳🇴'),
  ('sweden', 'Sweden', '🇸🇪'),
  ('denmark', 'Denmark', '🇩🇰'),
  ('finland', 'Finland', '🇫🇮')
ON CONFLICT (name) DO NOTHING;
