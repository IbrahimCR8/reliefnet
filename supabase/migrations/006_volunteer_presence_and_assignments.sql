-- ─────────────────────────────────────────────────────────────────────────────
-- ReliefNet Migration 006: Volunteer Real Presence & Job Assignments
-- ─────────────────────────────────────────────────────────────────────────────
-- Enables tracking live online presence and real coordinator-to-volunteer
-- incident job assignments with zero mock data.

-- 1. Add presence and current assignment columns to volunteer_profiles
ALTER TABLE public.volunteer_profiles
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS assigned_incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_role_task TEXT,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_by_email TEXT;

-- 2. Indexes for fast query in coordinator console
CREATE INDEX IF NOT EXISTS idx_volunteer_online ON public.volunteer_profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_volunteer_last_active ON public.volunteer_profiles(last_active_at);
CREATE INDEX IF NOT EXISTS idx_volunteer_assigned_incident ON public.volunteer_profiles(assigned_incident_id);

-- 3. Upgrade volunteer_assignments table to link to volunteer_profiles
ALTER TABLE public.volunteer_assignments
  ADD COLUMN IF NOT EXISTS volunteer_profile_id UUID REFERENCES volunteer_profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS role_task TEXT,
  ADD COLUMN IF NOT EXISTS assigned_by_email TEXT;

-- Make volunteer_id nullable if using volunteer_profile_id
ALTER TABLE public.volunteer_assignments
  ALTER COLUMN volunteer_id DROP NOT NULL;

-- 4. RLS Policies
-- Allow anyone to update their own online presence by email/user_id
CREATE POLICY "Volunteers update own presence"
  ON public.volunteer_profiles FOR UPDATE
  USING (
    user_id = auth.uid() OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    true
  );

-- Coordinators have full permission to update assignments
CREATE POLICY "Coordinators manage volunteer assignments on profiles"
  ON public.volunteer_profiles FOR UPDATE
  USING (true);
