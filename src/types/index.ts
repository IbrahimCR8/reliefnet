// ──────────────────────────────────────────────────────────────────────────────
// ReliefNet — Shared TypeScript types
// ──────────────────────────────────────────────────────────────────────────────

export type IncidentCategory =
  | 'flood'
  | 'cyclone'
  | 'fire'
  | 'infrastructure_damage'
  | 'medical_assistance'
  | 'food_water'
  | 'shelter'
  | 'other';

export type IncidentSeverity = 'low' | 'moderate' | 'high' | 'critical';

export type IncidentStatus =
  | 'unverified'
  | 'verified'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export type UserRole = 'volunteer' | 'coordinator' | 'admin';

export type AssignmentStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

// ── Database row types (mirror Supabase schema) ──────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: string;
  reference_code: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  people_affected: number | null;
  assistance_requested: string | null;
  reporter_name?: string | null;
  reporter_phone?: string | null;
  reported_by: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  is_demo: boolean;
  incident_media?: IncidentMedia[];
}

export interface IncidentMedia {
  id: string;
  incident_id: string;
  cloudinary_public_id: string;
  cloudinary_url: string;
  resource_type: string;
  format: string;
  width: number | null;
  height: number | null;
  bytes: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface VolunteerProfile {
  id: string;
  user_id: string;
  skills: string[];
  availability: string;
  organization: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VolunteerAssignment {
  id: string;
  incident_id: string;
  volunteer_id: string;
  assigned_by: string | null;
  status: AssignmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentStatusHistory {
  id: string;
  incident_id: string;
  previous_status: IncidentStatus | null;
  new_status: IncidentStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

// ── Enriched / joined types ───────────────────────────────────────────────────

export interface IncidentWithMedia extends Incident {
  incident_media?: IncidentMedia[];
  reporter?: Pick<Profile, 'id' | 'full_name' | 'email'> | null;
}

export interface AssignmentWithDetails extends VolunteerAssignment {
  incident?: Pick<Incident, 'id' | 'reference_code' | 'title' | 'status' | 'severity'>;
  volunteer?: Pick<Profile, 'id' | 'full_name' | 'email'>;
}

// ── Form input types ──────────────────────────────────────────────────────────

export interface ReportIncidentInput {
  title: string;
  category: IncidentCategory;
  description: string;
  severity: IncidentSeverity;
  location_name: string;
  reporter_name: string;
  reporter_phone: string;
  latitude?: number | null;
  longitude?: number | null;
  people_affected?: number | null;
  assistance_requested?: string;
  cloudinary_public_id?: string;
  cloudinary_url?: string;
}

export interface VolunteerProfileInput {
  skills: string[];
  availability: string;
  organization?: string;
}

// ── Dashboard stats ───────────────────────────────────────────────────────────

export interface DashboardStats {
  total: number;
  unverified: number;
  verified: number;
  in_progress: number;
  resolved: number;
  rejected: number;
  critical: number;
  high: number;
  activeVolunteers: number;
}

// ── Demo data flag ────────────────────────────────────────────────────────────

export interface DemoFlag {
  isDemo: boolean;
}
