import { createClient } from '@supabase/supabase-js';

// These should be set as environment variables
// For now, you'll need to replace these with your actual Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials not found!');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  console.error('Current values:', { 
    url: supabaseUrl || 'MISSING', 
    key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING' 
  });
}

// Create client with fallback empty strings to prevent crashes
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: false, // We're using our own auth system
      autoRefreshToken: false,
    },
  }
);

// Database types (matching our TypeScript interfaces)
export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string;
          name: string;
          description: string;
          client: string;
          organization: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
          updated_by_name: string;
          updated_by_avatar_url: string;
          status: 'active' | 'draft' | 'archived';
          navigation_map_image_url: string | null;
          bostadsvaljaren_active: boolean;
          bostadsvaljaren_activated_at: string | null;
          bostadsvaljaren_expires_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };
      views: {
        Row: {
          id: string;
          project_id: string;
          type: 'overview' | 'facade' | 'floorplan';
          title: string;
          image_url: string;
          parent_id: string | null;
          unit_ids: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['views']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['views']['Insert']>;
      };
      hotspots: {
        Row: {
          id: string;
          view_id: string;
          label: string;
          type: 'polygon' | 'info' | 'camera';
          coordinates: number[][]; // JSON array of [x, y] pairs
          linked_view_id: string | null;
          linked_unit_id: string | null;
          linked_asset_id: string | null;
          linked_hotspot_ids: string[] | null;
          status: 'for-sale' | 'reserved' | 'sold' | 'forthcoming';
          color: string;
          opacity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['hotspots']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['hotspots']['Insert']>;
      };
      units: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          fact_sheet_file_name: string | null;
          status: 'for-sale' | 'reserved' | 'sold' | 'forthcoming';
          price: number;
          original_price: number | null;
          size: number;
          ancillary_area: number;
          lot_size: number;
          rooms: number;
          fee: number;
          floor_level: number;
          selections: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['units']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['units']['Insert']>;
      };
      project_assets: {
        Row: {
          id: string;
          project_id: string;
          type: 'image' | 'panorama' | 'floorplan' | 'video' | 'document';
          title: string;
          url: string;
          thumbnail_url: string | null;
          description: string | null;
          uploaded_at: string;
        };
        Insert: Omit<Database['public']['Tables']['project_assets']['Row'], 'id' | 'uploaded_at'> & {
          id?: string;
          uploaded_at?: string;
        };
        Update: Partial<Database['public']['Tables']['project_assets']['Insert']>;
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          name: string;
          email: string;
          role: 'owner' | 'editor' | 'viewer';
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['project_members']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['project_members']['Insert']>;
      };
      unit_files: {
        Row: {
          id: string;
          unit_id: string;
          name: string;
          url: string;
          type: 'pdf' | 'image' | 'other';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['unit_files']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['unit_files']['Insert']>;
      };
    };
  };
};

