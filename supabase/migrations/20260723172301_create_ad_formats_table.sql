/*
# Create ad_formats table for Globo ad formats portal

## Purpose
Internal portal to store and catalog advertising formats used across Globo's digital properties.
Users can upload screenshots of ad formats, filter by vertical, search, and view individual format pages.

## New Tables
- `ad_formats`
  - `id` (uuid, primary key)
  - `title` (text, name of the ad format, e.g. "Banner Expandível 970x250")
  - `vertical` (text, the Globo vertical/property, e.g. "G1", "GE", "Globo Play", "Globoplay")
  - `format_type` (text, type of ad format, e.g. "Banner", "Rich Media", "Video", "Native")
  - `dimensions` (text, dimensions if applicable, e.g. "970x250")
  - `description` (text, detailed description of the format)
  - `image_url` (text, URL to the uploaded screenshot in Supabase Storage)
  - `tags` (text array, searchable tags for the format)
  - `status` (text, current status: "active", "inactive", "draft" - defaults to "active")
  - `created_at` (timestamptz, creation timestamp)
  - `updated_at` (timestamptz, last update timestamp)

## Security
- Single-tenant app (no sign-in required for this internal portal).
- RLS enabled on `ad_formats`.
- Allow anon + authenticated CRUD because the data is intentionally shared/public within the internal team.
*/

CREATE TABLE IF NOT EXISTS ad_formats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  vertical text NOT NULL,
  format_type text DEFAULT 'Banner',
  dimensions text,
  description text,
  image_url text,
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for searching by vertical
CREATE INDEX IF NOT EXISTS idx_ad_formats_vertical ON ad_formats(vertical);

-- Index for searching by format type
CREATE INDEX IF NOT EXISTS idx_ad_formats_format_type ON ad_formats(format_type);

-- Index for full-text search on title
CREATE INDEX IF NOT EXISTS idx_ad_formats_title ON ad_formats USING gin(to_tsvector('portuguese', title));

-- Index for tags array search
CREATE INDEX IF NOT EXISTS idx_ad_formats_tags ON ad_formats USING gin(tags);

ALTER TABLE ad_formats ENABLE ROW LEVEL SECURITY;

-- Single-tenant: allow anon + authenticated full CRUD (internal shared portal)
DROP POLICY IF EXISTS "anon_select_ad_formats" ON ad_formats;
CREATE POLICY "anon_select_ad_formats" ON ad_formats FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_ad_formats" ON ad_formats;
CREATE POLICY "anon_insert_ad_formats" ON ad_formats FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_ad_formats" ON ad_formats;
CREATE POLICY "anon_update_ad_formats" ON ad_formats FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_ad_formats" ON ad_formats;
CREATE POLICY "anon_delete_ad_formats" ON ad_formats FOR DELETE
  TO anon, authenticated USING (true);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ad_formats_updated_at ON ad_formats;
CREATE TRIGGER update_ad_formats_updated_at
  BEFORE UPDATE ON ad_formats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();