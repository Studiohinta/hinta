-- ============================================
-- Hinta Storage Buckets Setup
-- Public Read, Admin Upload
-- ============================================

-- Create project-assets bucket (if not exists via API/UI)
-- Note: Buckets must be created via Supabase Dashboard or API
-- This SQL handles RLS policies only

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public read project-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload project-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public read unit-files" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload unit-files" ON storage.objects;

-- ============================================
-- PROJECT-ASSETS BUCKET POLICIES
-- ============================================

-- Public read access for project-assets
CREATE POLICY "Public read project-assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'project-assets');

-- Admin upload for project-assets (authenticated users only)
CREATE POLICY "Admin upload project-assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-assets' 
  AND auth.role() = 'authenticated'
);

-- Admin update/delete for project-assets (authenticated users only)
CREATE POLICY "Admin update project-assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'project-assets' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'project-assets' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Admin delete project-assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'project-assets' 
  AND auth.role() = 'authenticated'
);

-- ============================================
-- UNIT-FILES BUCKET POLICIES
-- ============================================

-- Public read access for unit-files
CREATE POLICY "Public read unit-files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'unit-files');

-- Admin upload for unit-files (authenticated users only)
CREATE POLICY "Admin upload unit-files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'unit-files' 
  AND auth.role() = 'authenticated'
);

-- Admin update/delete for unit-files (authenticated users only)
CREATE POLICY "Admin update unit-files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'unit-files' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'unit-files' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Admin delete unit-files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'unit-files' 
  AND auth.role() = 'authenticated'
);

-- ============================================
-- NOTES
-- ============================================
-- 
-- IMPORTANT: Before running this SQL, create the buckets via Supabase Dashboard:
-- 1. Go to Storage → New bucket
-- 2. Create bucket: "project-assets" (Public: Yes)
-- 3. Create bucket: "unit-files" (Public: Yes)
-- 
-- Then run this SQL to set up RLS policies.
