-- ─────────────────────────────────────────────────────────────────────────────
-- ReliefNet Migration 005: Volunteer Government Registration Fields
-- ─────────────────────────────────────────────────────────────────────────────
-- Adds Name, Email, Phone, Aadhaar Number, Address and verification status
-- to the volunteer_profiles table in Supabase.

ALTER TABLE public.volunteer_profiles
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS aadhar_number TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending_review';

-- Allow user_id to be nullable so public registration can register before email confirmation
ALTER TABLE public.volunteer_profiles
  ALTER COLUMN user_id DROP NOT NULL;

-- Indexes for coordinator lookups
CREATE INDEX IF NOT EXISTS idx_volunteer_email ON public.volunteer_profiles(email);
CREATE INDEX IF NOT EXISTS idx_volunteer_phone ON public.volunteer_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_volunteer_aadhar ON public.volunteer_profiles(aadhar_number);
CREATE INDEX IF NOT EXISTS idx_volunteer_verification ON public.volunteer_profiles(verification_status);

-- RLS Policy: Anyone can register their volunteer profile
CREATE POLICY "Public can register as volunteer"
  ON public.volunteer_profiles FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Volunteers can read their own profile by email or user_id
CREATE POLICY "Volunteers can read own profile"
  ON public.volunteer_profiles FOR SELECT
  USING (
    user_id = auth.uid() OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
