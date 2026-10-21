-- ReliefNet Database Schema
-- Run this in your Supabase SQL editor or via supabase migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── ENUMS ────────────────────────────────────────────────────────────────────

CREATE TYPE incident_category AS ENUM (
  'flood', 'cyclone', 'fire', 'infrastructure_damage',
  'medical_assistance', 'food_water', 'shelter', 'other'
);

CREATE TYPE incident_severity AS ENUM ('low', 'moderate', 'high', 'critical');

CREATE TYPE incident_status AS ENUM (
  'unverified', 'verified', 'in_progress', 'resolved', 'rejected'
);

CREATE TYPE user_role AS ENUM ('volunteer', 'coordinator', 'admin');

CREATE TYPE assignment_status AS ENUM (
  'pending', 'accepted', 'in_progress', 'completed', 'cancelled'
);

-- ── PROFILES ─────────────────────────────────────────────────────────────────

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'volunteer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── INCIDENTS ────────────────────────────────────────────────────────────────

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 120),
  description TEXT NOT NULL CHECK (char_length(description) >= 20),
  category incident_category NOT NULL,
  severity incident_severity NOT NULL,
  status incident_status NOT NULL DEFAULT 'unverified',
  location_name TEXT NOT NULL,
  latitude DOUBLE PRECISION CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION CHECK (longitude BETWEEN -180 AND 180),
  people_affected INTEGER CHECK (people_affected >= 0),
  assistance_requested TEXT,
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_category ON incidents(category);
CREATE INDEX idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);

-- ── INCIDENT MEDIA ────────────────────────────────────────────────────────────

CREATE TABLE incident_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  cloudinary_public_id TEXT NOT NULL,
  cloudinary_url TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'image',
  format TEXT,
  width INTEGER,
  height INTEGER,
  bytes INTEGER,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_incident_media_incident_id ON incident_media(incident_id);

-- ── VOLUNTEER PROFILES ────────────────────────────────────────────────────────

CREATE TABLE volunteer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  skills TEXT[] NOT NULL DEFAULT '{}',
  availability TEXT NOT NULL,
  organization TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_volunteer_profiles_user_id ON volunteer_profiles(user_id);
CREATE INDEX idx_volunteer_profiles_active ON volunteer_profiles(is_active);

-- ── VOLUNTEER ASSIGNMENTS ─────────────────────────────────────────────────────

CREATE TABLE volunteer_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status assignment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(incident_id, volunteer_id) -- Prevent duplicate assignments
);

CREATE INDEX idx_assignments_incident_id ON volunteer_assignments(incident_id);
CREATE INDEX idx_assignments_volunteer_id ON volunteer_assignments(volunteer_id);
CREATE INDEX idx_assignments_status ON volunteer_assignments(status);

-- ── INCIDENT STATUS HISTORY ───────────────────────────────────────────────────

CREATE TABLE incident_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  previous_status incident_status,
  new_status incident_status NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_status_history_incident_id ON incident_status_history(incident_id);

-- Auto-log status changes
CREATE OR REPLACE FUNCTION log_incident_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO incident_status_history (incident_id, previous_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_incident_status_changed
  AFTER UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION log_incident_status_change();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteer_profiles_updated_at
  BEFORE UPDATE ON volunteer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON volunteer_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
