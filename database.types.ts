/**
 * ============================================
 * Hinta Database Types
 * TypeScript interfaces matching SQL schema exactly
 * Nordic Minimalist - Business Critical Only
 * ============================================
 */

/**
 * Database Types - Exact match to SQL schema
 * These types represent the raw database structure
 */

// ============================================
// ENUMS
// ============================================

export type ProjectStatus = 'active' | 'draft' | 'archived';

export type UnitStatus = 'for-sale' | 'reserved' | 'sold' | 'forthcoming';

export type ViewType = 'overview' | 'facade' | 'floorplan';

export type HotspotType = 'polygon' | 'info' | 'camera';

// ============================================
// DATABASE ROW INTERFACES
// ============================================

/**
 * Projects table - matches SQL schema exactly
 */
export interface ProjectsRow {
  id: string;
  name: string;
  description: string;
  client: string;
  organization: string;
  owner_id: string;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
  updated_by_name: string;
  updated_by_avatar_url: string;
  status: ProjectStatus;
  navigation_map_image_url: string | null;
  bostadsvaljaren_active: boolean;
  bostadsvaljaren_activated_at: string | null; // DATE
  bostadsvaljaren_expires_at: string | null; // DATE
}

/**
 * Views table - matches SQL schema exactly
 */
export interface ViewsRow {
  id: string;
  project_id: string;
  type: ViewType;
  title: string;
  image_url: string;
  parent_id: string | null;
  unit_ids: string[];
  created_at: string; // TIMESTAMPTZ
}

/**
 * Units table - matches SQL schema exactly
 * Filter-driven fields: price, rooms, size (area), status, floor_level
 */
export interface UnitsRow {
  id: string;
  project_id: string;
  name: string;
  fact_sheet_file_name: string | null;
  status: UnitStatus;
  price: number; // NUMERIC
  original_price: number | null; // NUMERIC
  size: number; // NUMERIC (sq m)
  ancillary_area: number; // NUMERIC
  lot_size: number; // NUMERIC
  rooms: number; // INTEGER
  fee: number; // NUMERIC
  floor_level: number; // INTEGER
  selections: string;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

/**
 * Hotspots table - matches SQL schema exactly
 */
export interface HotspotsRow {
  id: string;
  view_id: string;
  label: string;
  type: HotspotType;
  coordinates: number[][]; // JSONB array of [x, y] pairs
  linked_view_id: string | null;
  linked_unit_id: string | null;
  linked_asset_id: string | null;
  linked_hotspot_ids: string[] | null;
  status: UnitStatus;
  color: string;
  opacity: number; // NUMERIC (0-1)
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// ============================================
// INSERT INTERFACES (for create operations)
// ============================================

export interface ProjectsInsert {
  id?: string;
  name: string;
  description?: string;
  client: string;
  organization: string;
  owner_id: string;
  created_at?: string;
  updated_at?: string;
  updated_by_name?: string;
  updated_by_avatar_url?: string;
  status?: ProjectStatus;
  navigation_map_image_url?: string | null;
  bostadsvaljaren_active?: boolean;
  bostadsvaljaren_activated_at?: string | null;
  bostadsvaljaren_expires_at?: string | null;
}

export interface ViewsInsert {
  id?: string;
  project_id: string;
  type: ViewType;
  title: string;
  image_url: string;
  parent_id?: string | null;
  unit_ids?: string[];
  created_at?: string;
}

export interface UnitsInsert {
  id?: string;
  project_id: string;
  name: string;
  fact_sheet_file_name?: string | null;
  status?: UnitStatus;
  price?: number;
  original_price?: number | null;
  size?: number;
  ancillary_area?: number;
  lot_size?: number;
  rooms?: number;
  fee?: number;
  floor_level?: number;
  selections?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HotspotsInsert {
  id?: string;
  view_id: string;
  label?: string;
  type: HotspotType;
  coordinates: number[][];
  linked_view_id?: string | null;
  linked_unit_id?: string | null;
  linked_asset_id?: string | null;
  linked_hotspot_ids?: string[] | null;
  status?: UnitStatus;
  color?: string;
  opacity?: number;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// UPDATE INTERFACES (for update operations)
// ============================================

export type ProjectsUpdate = Partial<ProjectsInsert>;
export type ViewsUpdate = Partial<ViewsInsert>;
export type UnitsUpdate = Partial<UnitsInsert>;
export type HotspotsUpdate = Partial<HotspotsInsert>;
