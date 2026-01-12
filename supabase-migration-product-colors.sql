-- Add color columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT '#3b82f6';
ALTER TABLE products ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#ffffff';

-- Update existing products with default colors (you can customize these)
UPDATE products SET bg_color = '#8b5cf6', text_color = '#ffffff' WHERE name = 'Litteraworks';
UPDATE products SET bg_color = '#3b82f6', text_color = '#ffffff' WHERE name = 'Mobile App';
UPDATE products SET bg_color = '#10b981', text_color = '#ffffff' WHERE name = 'Pchella';
UPDATE products SET bg_color = '#f59e0b', text_color = '#ffffff' WHERE name = 'TTS';
UPDATE products SET bg_color = '#ef4444', text_color = '#ffffff' WHERE name = 'Komentari';
UPDATE products SET bg_color = '#6366f1', text_color = '#ffffff' WHERE name = 'e-Kiosk';
UPDATE products SET bg_color = '#ec4899', text_color = '#ffffff' WHERE name = 'CMS';
