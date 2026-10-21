-- ── ROW LEVEL SECURITY POLICIES ───────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_status_history ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──────────────────────────────────────────────────────────────────

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Coordinators can read all profiles
CREATE POLICY "Coordinators can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('coordinator', 'admin')
    )
  );

-- ── INCIDENTS ─────────────────────────────────────────────────────────────────

-- Anyone can read non-demo verified/in-progress/resolved incidents
CREATE POLICY "Public can read verified incidents"
  ON incidents FOR SELECT
  USING (status IN ('verified', 'in_progress', 'resolved') AND NOT is_demo);

-- Authenticated users can read all non-demo incidents
CREATE POLICY "Auth users can read all incidents"
  ON incidents FOR SELECT
  TO authenticated
  USING (NOT is_demo);

-- Anyone can create an incident (anonymous reporting allowed)
CREATE POLICY "Anyone can report incident"
  ON incidents FOR INSERT
  WITH CHECK (NOT is_demo);

-- Reporters can update their own unverified incidents
CREATE POLICY "Reporters can update own unverified incidents"
  ON incidents FOR UPDATE
  TO authenticated
  USING (reported_by = auth.uid() AND status = 'unverified');

-- Coordinators can update any incident
CREATE POLICY "Coordinators can update any incident"
  ON incidents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('coordinator', 'admin')
    )
  );

-- ── INCIDENT MEDIA ────────────────────────────────────────────────────────────

-- Anyone can read media for visible incidents
CREATE POLICY "Anyone can read incident media"
  ON incident_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM incidents i
      WHERE i.id = incident_id
      AND i.status IN ('verified', 'in_progress', 'resolved')
    )
  );

-- Authenticated users can insert media
CREATE POLICY "Auth users can upload media"
  ON incident_media FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- ── VOLUNTEER PROFILES ────────────────────────────────────────────────────────

-- Volunteers can read/write own profile
CREATE POLICY "Volunteers manage own profile"
  ON volunteer_profiles FOR ALL
  USING (user_id = auth.uid());

-- Coordinators can read all volunteer profiles
CREATE POLICY "Coordinators can read volunteer profiles"
  ON volunteer_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('coordinator', 'admin')
    )
  );

-- ── VOLUNTEER ASSIGNMENTS ─────────────────────────────────────────────────────

-- Volunteers can read their own assignments
CREATE POLICY "Volunteers read own assignments"
  ON volunteer_assignments FOR SELECT
  TO authenticated
  USING (volunteer_id = auth.uid());

-- Coordinators can manage all assignments
CREATE POLICY "Coordinators manage assignments"
  ON volunteer_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('coordinator', 'admin')
    )
  );

-- ── INCIDENT STATUS HISTORY ───────────────────────────────────────────────────

-- Auth users can read status history
CREATE POLICY "Auth users can read status history"
  ON incident_status_history FOR SELECT
  TO authenticated
  USING (true);

-- Status history is inserted via trigger only (no direct insert policy for users)
