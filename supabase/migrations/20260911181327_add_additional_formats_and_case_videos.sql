/*
# Add additional formats, custom format name, and case videos

## Purpose
Support two new features:
1. "Home Day" cases can include multiple additional formats (e.g. Banner Vídeo, Big Banner, Billboard).
2. "Outros" format allows a custom format name to be typed.
3. Video file uploads (in addition to URL links), stored in the existing ad-formats storage bucket.

## Changes to ad_formats table
- `additional_formats` (text[], nullable, defaults '{}'): list of extra format names included in a Home Day case. Empty for non-Home-Day cases.
- `outros_formato_name` (text, nullable): custom format name when format_type = "Outros".

## New Tables
- `case_videos`
  - `id` (uuid, primary key)
  - `format_id` (uuid, foreign key to ad_formats.id, ON DELETE CASCADE)
  - `video_url` (text, URL to the uploaded video in Supabase Storage)
  - `file_name` (text, original file name for display)
  - `file_size` (bigint, file size in bytes for display)
  - `mime_type` (text, MIME type for video playback)
  - `sort_order` (integer, ordering, defaults to 0)
  - `created_at` (timestamptz)

## Security
- Single-tenant app (no sign-in). RLS enabled on case_videos.
- Allow anon + authenticated CRUD, same pattern as case_images.
- case_videos inherits cascade delete from ad_formats.

## Important Notes
1. Both new columns on ad_formats are nullable/empty-default — existing rows are NOT affected.
2. Existing cases with a single format_type continue working unchanged.
3. video_links (URL links) remains as-is; case_videos is for uploaded video files.
4. No data is lost; no columns are dropped or renamed.
*/

-- Add additional_formats and outros_formato_name to ad_formats
ALTER TABLE ad_formats
  ADD COLUMN IF NOT EXISTS additional_formats text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS outros_formato_name text;

-- Create case_videos table
CREATE TABLE IF NOT EXISTS case_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  format_id uuid NOT NULL REFERENCES ad_formats(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_case_videos_format_id ON case_videos(format_id);
CREATE INDEX IF NOT EXISTS idx_case_videos_sort_order ON case_videos(sort_order);

ALTER TABLE case_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_case_videos" ON case_videos;
CREATE POLICY "anon_select_case_videos" ON case_videos FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_case_videos" ON case_videos;
CREATE POLICY "anon_insert_case_videos" ON case_videos FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_case_videos" ON case_videos;
CREATE POLICY "anon_update_case_videos" ON case_videos FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_case_videos" ON case_videos;
CREATE POLICY "anon_delete_case_videos" ON case_videos FOR DELETE
  TO anon, authenticated USING (true);