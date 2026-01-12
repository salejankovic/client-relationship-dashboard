-- Add missing color columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS bg_color TEXT DEFAULT '#3b82f6';
ALTER TABLE products ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#ffffff';

-- Update existing products with colors
UPDATE products SET bg_color = '#8b5cf6', text_color = '#ffffff' WHERE name = 'Litteraworks';
UPDATE products SET bg_color = '#3b82f6', text_color = '#ffffff' WHERE name = 'Mobile App';
UPDATE products SET bg_color = '#10b981', text_color = '#ffffff' WHERE name = 'Pchella';
UPDATE products SET bg_color = '#f59e0b', text_color = '#ffffff' WHERE name = 'TTS';
UPDATE products SET bg_color = '#ef4444', text_color = '#ffffff' WHERE name = 'Komentari';
UPDATE products SET bg_color = '#6366f1', text_color = '#ffffff' WHERE name = 'e-Kiosk';
UPDATE products SET bg_color = '#ec4899', text_color = '#ffffff' WHERE name = 'CMS';

-- Make sure RLS policies exist (these will be ignored if they already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Allow all operations on clients'
  ) THEN
    CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow all operations on products'
  ) THEN
    CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'Allow all operations on team_members'
  ) THEN
    CREATE POLICY "Allow all operations on team_members" ON team_members FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Insert default team members if they don't exist
INSERT INTO team_members (name, email) VALUES
  ('John Smith', 'john@appworks.com'),
  ('Sarah Johnson', 'sarah@appworks.com'),
  ('Michael Chen', 'michael@appworks.com'),
  ('Emma Williams', 'emma@appworks.com')
ON CONFLICT (name) DO NOTHING;
