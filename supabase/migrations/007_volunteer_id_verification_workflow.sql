-- ─────────────────────────────────────────────────────────────────────────────
-- ReliefNet Migration 007: Manual Volunteer ID & Verification Interview Workflow
-- ─────────────────────────────────────────────────────────────────────────────
-- Allows coordinators to review full registration details, conduct a phone
-- interview, and manually issue a custom Volunteer ID (e.g. RN-VOL-2026-001).

ALTER TABLE public.volunteer_profiles
  ADD COLUMN IF NOT EXISTS volunteer_id_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS phone_interview_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by_email TEXT;

CREATE INDEX IF NOT EXISTS idx_volunteer_id_code ON public.volunteer_profiles(volunteer_id_code);
CREATE INDEX IF NOT EXISTS idx_volunteer_verification_status ON public.volunteer_profiles(verification_status);
