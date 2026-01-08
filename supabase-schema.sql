-- Hinta App Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY DEFAULT 'proj_' || substr(md5(random()::text), 1, 9) || '_' || extract(epoch from now())::bigint,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  client TEXT NOT NULL,
  organization TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by_name TEXT NOT NULL DEFAULT '',
  updated_by_avatar_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
  navigation_map_image_url TEXT,
  bostadsvaljaren_active BOOLEAN NOT NULL DEFAULT false,
  bostadsvaljaren_activated_at DATE,
  bostadsvaljaren_expires_at DATE
);

-- Views table
CREATE TABLE IF NOT EXISTS views (
  id TEXT PRIMARY KEY DEFAULT 'view_' || substr(md5(random()::text), 1, 9) || '_' || extract(epoch from now())::bigint,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('overview', 'facade', 'floorplan')),
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  parent_id TEXT REFERENCES views(id) ON DELETE SET NULL,
  unit_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hotspots table
CREATE TABLE IF NOT EXISTS hotspots (
  id TEXT PRIMARY KEY DEFAULT 'hotspot_' || substr(md5(random()::text), 1, 9) || '_' || extract(epoch from now())::bigint,
  view_id TEXT NOT NULL REFERENCES views(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('polygon', 'info', 'camera')),
  coordinates JSONB NOT NULL, -- Array of [x, y] pairs: [[x1, y1], [x2, y2], ...]
  linked_view_id TEXT REFERENCES views(id) ON DELETE SET NULL,
  linked_unit_id TEXT, -- Will reference units table when created
  linked_asset_id TEXT, -- Will reference project_assets table when created
  linked_hotspot_ids TEXT[],
  status TEXT NOT NULL DEFAULT 'for-sale' CHECK (status IN ('for-sale', 'reserved', 'sold', 'forthcoming')),
  color TEXT NOT NULL DEFAULT '#3B82F6',
  opacity NUMERIC NOT NULL DEFAULT 0.5 CHECK (opacity >= 0 AND opacity <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Units table
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY DEFAULT 'unit_' || substr(md5(random()::text), 1, 9) || '_' || extract(epoch from now())::bigint,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fact_sheet_file_name TEXT,
  status TEXT NOT NULL DEFAULT 'for-sale' CHECK (status IN ('for-sale', 'reserved', 'sold', 'forthcoming')),
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  size NUMERIC NOT NULL DEFAULT 0, -- sq m
  ancillary_area NUMERIC NOT NULL DEFAULT 0,
  lot_size NUMERIC NOT NULL DEFAULT 0,
  rooms INTEGER NOT NULL DEFAULT 0,
  fee NUMERIC NOT NULL DEFAULT 0,
  floor_level INTEGER NOT NULL DEFAULT 0,
  selections TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project Assets table
CREATE TABLE IF NOT EXISTS project_assets (
  id TEXT PRIMARY KEY DEFAULT 'asset_' || substr(md5(random()::text), 1, 9) || '_' || extract(epoch from now())::bigint,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'panorama', 'floorplan', 'video', 'document')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project Members table
CREATE TABLE IF NOT EXISTS project_members (
  id TEXT PRIMARY KEY DEFAULT 'member_' || substr(md5(random()::text), 1, 9) || '_' || extract(epoch from now())::bigint,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Unit Files table
CREATE TABLE IF NOT EXISTS unit_files (
  id TEXT PRIMARY KEY DEFAULT 'file_' || substr(md5(random()::text), 1, 9) || '_' || extract(epoch from now())::bigint,
  unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'image', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_views_project_id ON views(project_id);
CREATE INDEX IF NOT EXISTS idx_views_parent_id ON views(parent_id);
CREATE INDEX IF NOT EXISTS idx_hotspots_view_id ON hotspots(view_id);
CREATE INDEX IF NOT EXISTS idx_hotspots_linked_unit_id ON hotspots(linked_unit_id);
CREATE INDEX IF NOT EXISTS idx_units_project_id ON units(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assets_project_id ON project_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_unit_files_unit_id ON unit_files(unit_id);

-- Enable Row Level Security (RLS) - For now, we'll allow all operations
-- You can tighten this later based on your auth requirements
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE views ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_files ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for now)
-- In production, you should restrict these based on user authentication
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on views" ON views FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on hotspots" ON hotspots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on units" ON units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on project_assets" ON project_assets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on project_members" ON project_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on unit_files" ON unit_files FOR ALL USING (true) WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotspots_updated_at BEFORE UPDATE ON hotspots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

