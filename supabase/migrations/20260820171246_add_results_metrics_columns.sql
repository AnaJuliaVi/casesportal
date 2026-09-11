/*
# Add results/metrics columns to ad_formats

## Purpose
Support a "Resultados" section for each case, with performance indicators
like impressions, reach, clicks, CTR, views, completion rate, etc.
All metrics are optional — each case fills in only what's relevant.

## Changes to ad_formats table
- impressoes (bigint, nullable)
- alcance (bigint, nullable)
- cliques (bigint, nullable)
- ctr (numeric, nullable) — Click-through rate (%)
- visualizacoes (bigint, nullable)
- visualizacoes_completas (bigint, nullable)
- taxa_conclusao (numeric, nullable) — Completion rate (%)
- engajamento (bigint, nullable)
- taxa_engajamento (numeric, nullable) — Engagement rate (%)
- conversoes (bigint, nullable)
- outros_resultados (text, nullable) — free-text for additional results/observations

## Important Notes
1. All new columns are nullable — existing rows are NOT affected.
2. No data is lost; no columns are dropped or renamed.
3. No RLS policy changes needed — existing CRUD policies cover new columns.
*/

ALTER TABLE ad_formats
  ADD COLUMN IF NOT EXISTS impressoes bigint,
  ADD COLUMN IF NOT EXISTS alcance bigint,
  ADD COLUMN IF NOT EXISTS cliques bigint,
  ADD COLUMN IF NOT EXISTS ctr numeric,
  ADD COLUMN IF NOT EXISTS visualizacoes bigint,
  ADD COLUMN IF NOT EXISTS visualizacoes_completas bigint,
  ADD COLUMN IF NOT EXISTS taxa_conclusao numeric,
  ADD COLUMN IF NOT EXISTS engajamento bigint,
  ADD COLUMN IF NOT EXISTS taxa_engajamento numeric,
  ADD COLUMN IF NOT EXISTS conversoes bigint,
  ADD COLUMN IF NOT EXISTS outros_resultados text;