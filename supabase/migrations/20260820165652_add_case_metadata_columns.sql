/*
# Add case metadata columns to ad_formats

## Purpose
Support the redesigned Cases area: differentiate "Vertical" (product/channel) from
"Formato publicitário" (ad format), and add complementary fields for a richer case
record. The filter logic moves from Vertical to Format type as the primary dimension.

## Changes to ad_formats table
- `cliente` (text, nullable) — client/brand associated with the case
- `plataforma` (text, nullable) — platform: Digital, TV, Pay TV, etc.
- `publish_date` (date, nullable) — publication date of the case
- `video_links` (text array, default '{}') — list of video/external URLs related to the case

## Important Notes
1. All new columns are nullable — existing rows are NOT affected, no data is lost.
2. `vertical` column is preserved as complementary info (no type/rename changes).
3. `format_type` is already NOT NULL with a default — it becomes the primary filter.
4. `tags` column is preserved (kept for backward compatibility, may coexist with video_links).
5. No RLS policy changes needed — existing anon/authenticated CRUD policies cover new columns.
*/

ALTER TABLE ad_formats
  ADD COLUMN IF NOT EXISTS cliente text,
  ADD COLUMN IF NOT EXISTS plataforma text,
  ADD COLUMN IF NOT EXISTS publish_date date,
  ADD COLUMN IF NOT EXISTS video_links text[] DEFAULT '{}';