-- 010_allow_unverified_incident_media.sql
-- ReliefNet: Ensure photo evidence of unverified citizen incident reports can be retrieved
-- by coordinators and public triage views.

DROP POLICY IF EXISTS "Anyone can read incident media" ON incident_media;

-- Allow reading media for all incidents (unverified, verified, in_progress, resolved)
CREATE POLICY "Anyone can read incident media"
  ON incident_media FOR SELECT
  USING (true);

-- Allow public and authenticated reporters to insert media linked to incidents
DROP POLICY IF EXISTS "Auth users can upload media" ON incident_media;
DROP POLICY IF EXISTS "Anyone can report incident media" ON incident_media;

CREATE POLICY "Anyone can report incident media"
  ON incident_media FOR INSERT
  WITH CHECK (true);
