-- ─────────────────────────────────────────────────────────────────────────────
-- ReliefNet Migration 009: Incident Reporter Contact Information
-- ─────────────────────────────────────────────────────────────────────────────
-- Adds reporter_name and reporter_phone columns to the incidents table so
-- coordinators can verify crisis reports by directly calling citizens.

ALTER TABLE public.incidents
  ADD COLUMN IF NOT EXISTS reporter_name TEXT,
  ADD COLUMN IF NOT EXISTS reporter_phone TEXT;

CREATE INDEX IF NOT EXISTS idx_incidents_reporter_phone ON public.incidents(reporter_phone);
