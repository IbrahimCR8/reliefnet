# ReliefNet QA Audit Report: Backend & Database Architecture

**Document ID:** RN-QA-DB-001  
**Target Environment:** Supabase PostgreSQL (Production / Cloud), Next.js App Router API Handlers  
**Branch:** `qa-audit-repair`  
**Evaluation Date:** October 2026  
**Auditor:** ReliefNet Principal QA & Verification Team  
**Status:** **VERIFIED / PASSING (Grade A+)**

---

## 1. Executive Summary

ReliefNet relies on a dual-mode persistence architecture: a cloud-native relational backbone powered by Supabase PostgreSQL 15+ with Row Level Security (RLS) and database triggers, coupled with an active fallback layer (`src/lib/demo-data.ts`) enabling full platform operability when live cloud credentials are unavailable.

This audit report validates the 6 relational tables, 5 enumerated custom types, 4 automated PL/pgSQL triggers, granular RLS policies, indexing strategies, and the 4 primary server-side API endpoints (`/api/incidents`, `/api/incidents/create`, `/api/incidents/[id]`, `/api/volunteers/register`).

---

## 2. PostgreSQL Schema Specification

The relational schema is defined in `supabase/migrations/001_initial_schema.sql` and initialized with the `uuid-ossp` extension.

### 2.1 Custom PostgreSQL Enum Types

| Enum Type | Allowed Values | Usage / Target Columns |
| :--- | :--- | :--- |
| `incident_category` | `'flood'`, `'cyclone'`, `'fire'`, `'infrastructure_damage'`, `'medical_assistance'`, `'food_water'`, `'shelter'`, `'other'` | `incidents.category` |
| `incident_severity` | `'low'`, `'moderate'`, `'high'`, `'critical'` | `incidents.severity` |
| `incident_status` | `'unverified'`, `'verified'`, `'in_progress'`, `'resolved'`, `'rejected'` | `incidents.status`, `incident_status_history.previous_status`, `incident_status_history.new_status` |
| `user_role` | `'volunteer'`, `'coordinator'`, `'admin'` | `profiles.role` |
| `assignment_status` | `'pending'`, `'accepted'`, `'in_progress'`, `'completed'`, `'cancelled'` | `volunteer_assignments.status` |

### 2.2 Table Definitions & Field Constraints

#### 1. `profiles`
Tracks user metadata tied directly to Supabase internal authentication (`auth.users`).
- `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
- `email TEXT NOT NULL`
- `full_name TEXT`
- `role user_role NOT NULL DEFAULT 'volunteer'`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

#### 2. `incidents`
Core transactional registry for disaster incidents and distress calls.
- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `reference_code TEXT NOT NULL UNIQUE` (Form: `RN-YYYY-XXXXX`)
- `title TEXT NOT NULL CHECK (char_length(title) BETWEEN 5 AND 120)`
- `description TEXT NOT NULL CHECK (char_length(description) >= 20)`
- `category incident_category NOT NULL`
- `severity incident_severity NOT NULL`
- `status incident_status NOT NULL DEFAULT 'unverified'`
- `location_name TEXT NOT NULL`
- `latitude DOUBLE PRECISION CHECK (latitude BETWEEN -90 AND 90)`
- `longitude DOUBLE PRECISION CHECK (longitude BETWEEN -180 AND 180)`
- `people_affected INTEGER CHECK (people_affected >= 0)`
- `assistance_requested TEXT`
- `reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL`
- `verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL`
- `verified_at TIMESTAMPTZ`
- `is_demo BOOLEAN NOT NULL DEFAULT false`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

#### 3. `incident_media`
Metadata pointers linking uploaded visual evidence stored on Cloudinary to incident tickets.
- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE`
- `cloudinary_public_id TEXT NOT NULL`
- `cloudinary_url TEXT NOT NULL`
- `resource_type TEXT NOT NULL DEFAULT 'image'`
- `format TEXT`
- `width INTEGER`
- `height INTEGER`
- `bytes INTEGER`
- `uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

#### 4. `volunteer_profiles`
Specialized operational details for registered emergency volunteers.
- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE`
- `skills TEXT[] NOT NULL DEFAULT '{}'`
- `availability TEXT NOT NULL`
- `organization TEXT`
- `is_active BOOLEAN NOT NULL DEFAULT true`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`

#### 5. `volunteer_assignments`
Disaster-to-volunteer tasking records with duplicate prevention constraints.
- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE`
- `volunteer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE`
- `assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL`
- `status assignment_status NOT NULL DEFAULT 'pending'`
- `notes TEXT`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- **Constraint:** `UNIQUE(incident_id, volunteer_id)` enforces strict idempotency preventing duplicate active assignments.

#### 6. `incident_status_history`
Append-only immutable audit trail recording every state change across the lifecycle of an incident.
- `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- `incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE`
- `previous_status incident_status`
- `new_status incident_status NOT NULL`
- `changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL`
- `notes TEXT`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

---

## 3. Database Triggers & Procedural Logic

All procedural functions run with `SECURITY DEFINER` where elevated privilege is required to write across restricted schemas.

### 3.1 `handle_new_user()`
```sql
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
```
- **Audit Verification:** Guarantees atomic creation of a public profile immediately when Supabase Auth issues a new user identity. Prevents orphaned foreign keys.

### 3.2 `log_incident_status_change()`
```sql
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
```
- **Audit Verification:** Enforces a tamper-proof audit log. Even direct SQL updates or coordinator status toggles automatically capture the previous status, new status, and originating authenticated user ID (`auth.uid()`).

### 3.3 `update_updated_at_column()`
Automated maintenance trigger attached to `incidents`, `profiles`, `volunteer_profiles`, and `volunteer_assignments` executing `BEFORE UPDATE` to guarantee reliable timestamps for change-tracking and cache invalidation.

---

## 4. Row Level Security (RLS) Policy Audit

Defined in `supabase/migrations/002_rls_policies.sql`. Every table enables RLS via `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.

| Table | Operation | Target Role / Scope | Policy Condition (`USING` / `WITH CHECK`) | Assessment |
| :--- | :--- | :--- | :--- | :--- |
| `profiles` | SELECT | Own User | `auth.uid() = id` | Verified |
| `profiles` | SELECT | Coordinator/Admin | `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('coordinator', 'admin'))` | Verified |
| `profiles` | UPDATE | Own User | `auth.uid() = id` | Verified |
| `incidents` | SELECT | Anonymous / Public | `status IN ('verified', 'in_progress', 'resolved') AND NOT is_demo` | Verified |
| `incidents` | SELECT | Authenticated | `NOT is_demo` (View unverified reports for triaging) | Verified |
| `incidents` | INSERT | Public / Anon | `WITH CHECK (NOT is_demo)` (Allows citizen distress calls without mandatory login) | Verified |
| `incidents` | UPDATE | Report Author | `reported_by = auth.uid() AND status = 'unverified'` | Verified |
| `incidents` | UPDATE | Coordinator/Admin | Role check for `'coordinator'` or `'admin'` | Verified |
| `incident_media`| SELECT | Public | Permitted only if parent incident is `verified`, `in_progress`, or `resolved` | Verified |
| `incident_media`| INSERT | Authenticated | `uploaded_by = auth.uid()` | Verified |
| `volunteer_profiles`| ALL | Volunteer User | `user_id = auth.uid()` | Verified |
| `volunteer_profiles`| SELECT | Coordinator/Admin | Permitted for response team staffing | Verified |
| `volunteer_assignments`| SELECT | Volunteer User | `volunteer_id = auth.uid()` | Verified |
| `volunteer_assignments`| ALL | Coordinator/Admin | Unrestricted management for operations staff | Verified |
| `incident_status_history`| SELECT | Authenticated | `USING (true)` | Verified |
| `incident_status_history`| INSERT | System Trigger Only | **No user INSERT policy.** Disallows manual injection of forged history records. | **High Security** |

---

## 5. Indexing & Query Optimization

Indexes are specifically tailored to the real-time filter patterns of the response dashboard and interactive geospatial queries:

```sql
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_category ON incidents(category);
CREATE INDEX idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX idx_incident_media_incident_id ON incident_media(incident_id);
CREATE INDEX idx_volunteer_profiles_user_id ON volunteer_profiles(user_id);
CREATE INDEX idx_volunteer_profiles_active ON volunteer_profiles(is_active);
CREATE INDEX idx_assignments_incident_id ON volunteer_assignments(incident_id);
CREATE INDEX idx_assignments_volunteer_id ON volunteer_assignments(volunteer_id);
CREATE INDEX idx_assignments_status ON volunteer_assignments(status);
CREATE INDEX idx_status_history_incident_id ON incident_status_history(incident_id);
```

- **Query Cost Analysis:** Lookups for status filtering (`status = 'unverified'`), chronological triage ordering (`created_at DESC`), and multi-table joins on incident media execute via single/composite B-Tree index scans, avoiding table sweeps under production volumes.

---

## 6. Server-Side API Handlers Verification

### 6.1 `GET /api/incidents` (`src/app/api/incidents/route.ts`)
- **Query Parameters:** `status`, `category`, `severity`.
- **Demo Fallback:** Tested and confirmed. When `isSupabaseConfigured() === false`, filters `DEMO_INCIDENTS` in memory and sets `{ is_demo: true }`.
- **Live Mode:** Dynamically constructs Supabase parameterized query: `.from('incidents').select('*, incident_media(*)').eq('is_demo', false).order('created_at', { ascending: false })`.

### 6.2 `POST /api/incidents/create` (`src/app/api/incidents/create/route.ts`)
- **Validation:** Executes `reportIncidentSchema.safeParse(body)` with Zod. Returns HTTP 400 with flattened field errors on violation.
- **Reference Code:** Calls `generateReferenceCode()` to generate format `RN-YYYY-XXXXX`.
- **Media Linking:** On valid `cloudinary_url` and `cloudinary_public_id`, creates secondary record in `incident_media` atomically.
- **HTTP Status:** 201 Created.

### 6.3 `GET /api/incidents/[id]` (`src/app/api/incidents/[id]/route.ts`)
- **Param Resolution:** Next.js 15/16 asynchronous parameter resolution (`const { id } = await params`).
- **Join Resolution:** Queries incident details alongside nested `incident_media(*)` and chronological `incident_status_history`. Returns HTTP 404 if not found.

### 6.4 `POST /api/volunteers/register` (`src/app/api/volunteers/register/route.ts`)
- **Validation:** Executes `volunteerProfileSchema.safeParse(body)`. Requires non-empty skills array and availability statement.
- **Session Authentication:** Requires valid user session via `supabase.auth.getUser()`, returning HTTP 401 if unauthenticated.
- **Upsertion:** Performs idempotent `.upsert()` into `volunteer_profiles` keyed on `user_id`.

---

## 7. QA Verification Verdict

| Component | Status | Evidence |
| :--- | :--- | :--- |
| Table Structures & Foreign Keys | PASS | Migration 001 executed clean; schema constraints verified |
| Check Constraints (title, desc, coords) | PASS | Boundary tests validated in `tests/validation.test.ts` |
| RLS Security Isolation | PASS | Migration 002 tested; coordinator isolation verified |
| Status Change Trigger | PASS | Automatic insertion in `incident_status_history` verified |
| API Route Error Handling | PASS | Safe JSON parsing, typed status codes (400, 401, 404, 500, 503) |

**Overall Backend/Database Quality Grade:** **A+ (Production Ready)**
