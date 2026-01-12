-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('Media', 'Sport')),
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'inactive')),
  products TEXT[] DEFAULT '{}',
  upsell_strategy TEXT[] DEFAULT '{}',
  website TEXT,
  next_action TEXT,
  next_action_date TEXT,
  assigned_to TEXT,
  notes TEXT,
  contacts JSONB DEFAULT '[]',
  todos JSONB DEFAULT '[]',
  activity JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  bg_color TEXT DEFAULT '#3b82f6',
  text_color TEXT DEFAULT '#ffffff',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (change this in production!)
CREATE POLICY "Allow all operations on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on team_members" ON team_members FOR ALL USING (true) WITH CHECK (true);

-- Insert default products
INSERT INTO products (name, bg_color, text_color) VALUES
  ('Mobile App', '#3b82f6', '#ffffff'),
  ('Pchella', '#10b981', '#ffffff'),
  ('TTS', '#f59e0b', '#ffffff'),
  ('Litteraworks', '#8b5cf6', '#ffffff'),
  ('Komentari', '#ef4444', '#ffffff'),
  ('e-Kiosk', '#6366f1', '#ffffff'),
  ('CMS', '#ec4899', '#ffffff')
ON CONFLICT (name) DO NOTHING;

-- Insert default team members
INSERT INTO team_members (name, email) VALUES
  ('John Smith', 'john@appworks.com'),
  ('Sarah Johnson', 'sarah@appworks.com'),
  ('Michael Chen', 'michael@appworks.com'),
  ('Emma Williams', 'emma@appworks.com')
ON CONFLICT (name) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for clients
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
