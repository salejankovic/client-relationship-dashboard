-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('Media', 'Sport')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
  products TEXT[] DEFAULT '{}',
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
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_category ON clients(category);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for clients table
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default products
INSERT INTO products (name) VALUES
  ('Mobile App'),
  ('Pchella'),
  ('TTS'),
  ('Litteraworks'),
  ('Komentari'),
  ('e-Kiosk'),
  ('CMS')
ON CONFLICT (name) DO NOTHING;

-- Insert default team members
INSERT INTO team_members (name) VALUES
  ('John Smith'),
  ('Sarah Johnson'),
  ('Michael Chen'),
  ('Emma Williams')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since this is an internal tool without auth)
-- For production with auth, you would make these more restrictive

CREATE POLICY "Enable all operations for clients" ON clients
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for products" ON products
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for team_members" ON team_members
  FOR ALL USING (true) WITH CHECK (true);
