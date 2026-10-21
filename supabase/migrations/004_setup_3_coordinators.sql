-- ─────────────────────────────────────────────────────────────────────────────
-- ReliefNet — Register & Promote the 3 Authorized Coordinators
-- ─────────────────────────────────────────────────────────────────────────────
-- This script configures the 3 designated coordinator accounts in Supabase.
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ============================================================================
-- OPTION 1: PROMOTE 3 EXISTING SIGNED-UP USERS TO COORDINATOR
-- ============================================================================
-- If your 3 coordinators have already registered their accounts,
-- replace the 3 emails below with their actual email addresses:

UPDATE public.profiles
SET role = 'coordinator',
    updated_at = NOW()
WHERE email IN (
  'coordinator1@reliefnet.org',
  'coordinator2@reliefnet.org',
  'coordinator3@reliefnet.org'
);

-- ============================================================================
-- OPTION 2: VERIFY THE CURRENT COORDINATORS
-- ============================================================================
-- Run this query to confirm that exactly 3 coordinators exist:

SELECT id, email, full_name, role, created_at
FROM public.profiles
WHERE role IN ('coordinator', 'admin')
ORDER BY created_at ASC;

-- ============================================================================
-- OPTION 3 (OPTIONAL): ENFORCE MAXIMUM 3 COORDINATORS VIA TRIGGER
-- ============================================================================
-- This database trigger enforces the strict business rule that no more than
-- 3 coordinators can exist at any given time.

CREATE OR REPLACE FUNCTION enforce_max_three_coordinators()
RETURNS TRIGGER AS $$
DECLARE
  coord_count INTEGER;
BEGIN
  IF NEW.role = 'coordinator' AND (OLD.role IS NULL OR OLD.role != 'coordinator') THEN
    SELECT COUNT(*) INTO coord_count
    FROM public.profiles
    WHERE role = 'coordinator';

    IF coord_count >= 3 THEN
      RAISE EXCEPTION 'Maximum coordinator limit reached: only 3 coordinators are permitted.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_max_three_coordinators ON public.profiles;

CREATE TRIGGER trg_enforce_max_three_coordinators
  BEFORE INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION enforce_max_three_coordinators();
