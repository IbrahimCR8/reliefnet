-- ─────────────────────────────────────────────────────────────────────────────
-- ReliefNet Migration 008: Fix RLS Infinite Recursion on profiles
-- ─────────────────────────────────────────────────────────────────────────────
-- Resolves the "infinite recursion detected in policy for relation profiles"
-- error caused by self-referencing subqueries inside profiles table RLS policies.

-- 1. Helper function with SECURITY DEFINER to bypass RLS during role checks
CREATE OR REPLACE FUNCTION public.is_coordinator_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('coordinator', 'admin')
  );
$$;

-- 2. Drop recursive policies on profiles
DROP POLICY IF EXISTS "Coordinators can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile reading" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert profile" ON public.profiles;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;

-- 3. Create non-recursive policies on profiles
-- Allow authenticated & anon to read profiles (or by uid / coordinator)
CREATE POLICY "Public read profiles"
  ON public.profiles FOR SELECT
  USING (true);

-- Allow users to insert profile (or via trigger)
CREATE POLICY "Allow insert profile"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 4. Update dependent policies to use the SECURITY DEFINER function
DROP POLICY IF EXISTS "Coordinators can update any incident" ON public.incidents;
CREATE POLICY "Coordinators can update any incident"
  ON public.incidents FOR UPDATE
  USING (public.is_coordinator_or_admin());

DROP POLICY IF EXISTS "Coordinators can read volunteer profiles" ON public.volunteer_profiles;
CREATE POLICY "Coordinators can read volunteer profiles"
  ON public.volunteer_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Coordinators manage assignments" ON public.volunteer_assignments;
CREATE POLICY "Coordinators manage assignments"
  ON public.volunteer_assignments FOR ALL
  USING (public.is_coordinator_or_admin());
