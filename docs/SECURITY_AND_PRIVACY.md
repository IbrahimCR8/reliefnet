# Security, Authorization & Privacy Policy
## ReliefNet — Disaster Response Intelligence Platform

Disaster management platforms collect sensitive information regarding vulnerable populations, displaced families, and tactical relief resources. Security, authorization, and data privacy must be designed into every layer from day one.

---

## 1. Multi-Tier Authorization Model (RBAC)

ReliefNet enforces role-based access control with four explicit permission tiers:

| Role | Permissions | Security Boundary |
| :--- | :--- | :--- |
| **Anonymous (Public)** | - Submit crisis incident reports<br/>- View verified incidents on map and list<br/>- View public safety information | Public Supabase RLS policies |
| **Volunteer** | - All Anonymous capabilities<br/>- Register responder skills and availability<br/>- View assigned disaster tasks<br/>- Update task completion status | Authenticated RLS policies |
| **Coordinator** | - All Volunteer capabilities<br/>- Review and triage unverified incident reports<br/>- Verify or reject reports<br/>- Dispatch volunteers to incidents<br/>- Escalate operational status | Restricted Coordinator RLS policies + Server verification |
| **Administrator** | - Full system access and coordinator role promotions | Supabase Dashboard / Service Role |

---

## 2. Row Level Security (RLS) Implementation

Security is enforced at the database level using PostgreSQL Row Level Security policies (`supabase/migrations/002_rls_policies.sql`). Hiding UI elements is never treated as a security barrier.

Key policies include:
1. **Unverified Incident Protection:** Unverified and rejected reports are hidden from the public feed until an authorized coordinator reviews and verifies them.
2. **Volunteer Assignment Privacy:** Responders can only inspect tasks assigned to their specific user ID (`volunteer_id = auth.uid()`).
3. **Immutable Status History:** Users cannot forge or modify status history records directly; entries are generated strictly via secure PostgreSQL triggers (`SECURITY DEFINER`).
4. **Volunteer Profile Privacy:** Contact details of volunteers are restricted to verified coordinators.

---

## 3. Privacy-First Data Minimization

To protect affected individuals during chaotic emergencies:
- **No National ID or Sensitive PII Required:** Citizens reporting incidents are never asked for identity card numbers, banking details, or confidential medical records.
- **Coarse Location Option:** Users may specify general landmarks ("Ward 4 Bridge") without sharing high-precision GPS coordinates if privacy is a concern.
- **Anonymous Reporting Permitted:** Fear of retaliation or documentation barriers should never prevent a citizen from requesting flood evacuation or clean drinking water.

---

## 4. Input Sanitization & Content Security

- **Strict Schema Validation:** All user inputs pass through typed Zod validators with string character bounds (title: 5-120 chars, description: 20-2000 chars).
- **Coordinate Clamping:** Latitude and longitude are clamped to valid earthly domains (-90 to 90, -180 to 180) to prevent map rendering exploits.
- **XSS Prevention:** React's automatic JSX text escaping ensures user-submitted incident descriptions cannot inject malicious `<script>` tags or HTML payloads.
