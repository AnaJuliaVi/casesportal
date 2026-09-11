/*
# Create case_images table for multiple images per case

## Purpose
Allow each case (ad_format) to have multiple images — a gallery of screenshots,
different screens, pieces, or applications of that format. Previously each case
had only a single image_url column; this migration adds a dedicated child table
for unlimited images per case.

## New Tables
- `case_images`
  - `id` (uuid, primary key)
  - `format_id` (uuid, foreign key to ad_formats.id, ON DELETE CASCADE)
  - `image_url` (text, URL to the uploaded image in Supabase Storage)
  - `sort_order` (integer, ordering of images within a case, defaults to 0)
  - `created_at` (timestamptz, creation timestamp)

## Security
- Single-tenant app (no sign-in required for this internal portal).
- RLS enabled on `case_images`.
- Allow anon + authenticated CRUD because the data is intentionally shared/public within the internal team.
- Inherits cascade delete from ad_formats, so deleting a case removes its images.

## Important Notes
1. The existing `image_url` column on `ad_formats` is preserved for backward compatibility — it serves as the "cover" / primary image for list cards.
2. `case_images` holds the full gallery (can include the cover image or additional ones).
3. `sort_order` allows manual reordering of images in the gallery.
4. No limit on the number of images per case.
*/

CREATE TABLE IF NOT EXISTS case_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  format_id uuid NOT NULL REFERENCES ad_formats(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Index for fetching images by format, ordered
CREATE INDEX IF NOT EXISTS idx_case_images_format_id ON case_images(format_id);
CREATE INDEX IF NOT EXISTS idx_case_images_sort_order ON case_images(sort_order);

ALTER TABLE case_images ENABLE ROW LEVEL SECURITY;

-- Single-tenant: allow anon + authenticated full CRUD (internal shared portal)
DROP POLICY IF EXISTS "anon_select_case_images" ON case_images;
CREATE POLICY "anon_select_case_images" ON case_images FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_case_images" ON case_images;
CREATE POLICY "anon_insert_case_images" ON case_images FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_case_images" ON case_images;
CREATE POLICY "anon_update_case_images" ON case_images FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_case_images" ON case_images;
CREATE POLICY "anon_delete_case_images" ON case_images FOR DELETE
  TO anon, authenticated USING (true);