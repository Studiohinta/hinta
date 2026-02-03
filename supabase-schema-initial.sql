-- ============================================
-- Hinta Production Schema - INITIAL SETUP
-- Nordic Minimalist - Business Critical Only
-- Run this FIRST TIME only (no DROP statements)
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- Project status enum
CREATE TYPE project_status AS ENUM ('active', 'draft', 'archived');

-- Unit status enum
CREATE TYPE unit_status AS ENUM ('for-sale', 'reserved', 'sold', 'forthcoming');

-- View type enum
CREATE TYPE view_type AS ENUM ('overview', 'facade', 'floorplan');

-- Hotspot type enum
CREATE TYPE hotspot_type AS ENUM ('polygon', 'info', 'camera');

-- ============================================
-- TABLES
-- ============================================

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
  status project_status NOT NULL DEFAULT 'draft',
  navigation_map_image_url TEXT,
  bostadsvaljaren_active BOOLEAN NOT NULL DEFAULT false,
  bostadsvaljaren_activated_at DATE,
  bostadsvaljaren_expires_at DATE
);

-- Views table
CREATE TABLE IF NOT EXISTS views (
  id TEXT PRIMARY KEY DEFAULT 'view_' || substr(md5(random()::text), 1, 9) || '_' || extract(epoch from now())::bigint,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type view_type NOT NULL,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  parent_id TEXT REFERENCES views(id) ON DELETE SET NULL,
  unit_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Units table (Filter-driven fields: price, rooms, size/area, status, floor_level)
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY DEFAULT 'unit_' || substr(md5(random()::text), 1, 9) || '_' || extract(epoch from now())::bigint,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fact_sheet_file_name TEXT,
  status unit_status NOT NULL DEFAULT 'for-sale',
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  size NUMERIC NOT NULL DEFAULT 0,
  ancillary_area NUMERIC NOT NULL DEFAULT 0,
  lot_size NUMERIC NOT NULL DEFAULT 0,
  rooms INTEGER NOT NULL DEFAULT 0,
  fee NUMERIC NOT NULL DEFAULT 0,
  floor_level INTEGER NOT NULL DEFAULT 0,
  selections TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hotspots table
CREATE TABLE IF NOT EXISTS hotspots (
  id TEXT PRIMARY KEY DEFAULT 'hotspot_' || substr(md5(random()::text), 1, 9) || '_' || extract(epoch from now())::bigint,
  view_id TEXT NOT NULL REFERENCES views(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '',
  type hotspot_type NOT NULL,
  coordinates JSONB NOT NULL,
  linked_view_id TEXT REFERENCES views(id) ON DELETE SET NULL,
  linked_unit_id TEXT REFERENCES units(id) ON DELETE SET NULL,
  linked_asset_id TEXT,
  linked_hotspot_ids TEXT[],
  status unit_status NOT NULL DEFAULT 'for-sale',
  color TEXT NOT NULL DEFAULT '#3B82F6',
  opacity NUMERIC NOT NULL DEFAULT 0.5 CHECK (opacity >= 0 AND opacity <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_views_project_id ON views(project_id);
CREATE INDEX IF NOT EXISTS idx_views_parent_id ON views(parent_id);
CREATE INDEX IF NOT EXISTS idx_hotspots_view_id ON hotspots(view_id);
CREATE INDEX IF NOT EXISTS idx_hotspots_linked_unit_id ON hotspots(linked_unit_id);
CREATE INDEX IF NOT EXISTS idx_units_project_id ON units(project_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_units_price ON units(price);
CREATE INDEX IF NOT EXISTS idx_units_rooms ON units(rooms);
CREATE INDEX IF NOT EXISTS idx_units_floor_level ON units(floor_level);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if they exist (for idempotency)
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_hotspots_updated_at ON hotspots;
DROP TRIGGER IF EXISTS update_units_updated_at ON units;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotspots_updated_at BEFORE UPDATE ON hotspots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE views ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotspots ENABLE ROW LEVEL SECURITY;

-- Projects: Public read, Admin write/update/delete
CREATE POLICY "Public read projects" ON projects
  FOR SELECT
  USING (true);

CREATE POLICY "Admin write projects" ON projects
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Views: Public read, Admin write/update/delete
CREATE POLICY "Public read views" ON views
  FOR SELECT
  USING (true);

CREATE POLICY "Admin write views" ON views
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Units: Public read, Admin write/update/delete
CREATE POLICY "Public read units" ON units
  FOR SELECT
  USING (true);

CREATE POLICY "Admin write units" ON units
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Hotspots: Public read, Admin write/update/delete
CREATE POLICY "Public read hotspots" ON hotspots
  FOR SELECT
  USING (true);

CREATE POLICY "Admin write hotspots" ON hotspots
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
