/*
# Create Storage Bucket for Ad Format Images

## Purpose
Create a public storage bucket to hold screenshot images of advertising formats uploaded by the team.

## Changes
- Create `ad-formats` storage bucket (public, so images are viewable in the portal)
- Add storage policies allowing anon + authenticated users to read, upload, update, and delete images in the `ad-formats` bucket
- This is a single-tenant internal portal, so all team members share access

## Security
- Bucket is public (images need to be visible in the portal without auth)
- CRUD policies scoped to the `ad-formats` bucket for anon + authenticated
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('ad-formats', 'ad-formats', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_select_ad_formats_storage" ON storage.objects;
CREATE POLICY "anon_select_ad_formats_storage" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'ad-formats');

DROP POLICY IF EXISTS "anon_insert_ad_formats_storage" ON storage.objects;
CREATE POLICY "anon_insert_ad_formats_storage" ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'ad-formats');

DROP POLICY IF EXISTS "anon_update_ad_formats_storage" ON storage.objects;
CREATE POLICY "anon_update_ad_formats_storage" ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'ad-formats') WITH CHECK (bucket_id = 'ad-formats');

DROP POLICY IF EXISTS "anon_delete_ad_formats_storage" ON storage.objects;
CREATE POLICY "anon_delete_ad_formats_storage" ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'ad-formats');