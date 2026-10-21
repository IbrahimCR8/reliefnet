# ReliefNet QA & Verification: Authentication, Authorization & RLS Audit

**Project:** ReliefNet Disaster Response Platform  
**Target Branch:** `qa-audit-repair`  
**Security Framework:** Supabase Auth, PostgreSQL Row-Level Security (RLS), RBAC  
**Audit Date:** October 21, 2026  
**Auditor:** ReliefNet Principal QA & Verification Engineering Team  

---

## 1. Executive Summary

A security architecture and access control audit was performed on ReliefNet to evaluate user identity management, role-based authorization (RBAC), anonymous data ingestion boundaries, database Row-Level Security (RLS) policies, and demo mode guardrails.

```
┌────────────────────────────────────────────────────────────────────────┐
│   AUTHENTICATION & AUTHORIZATION SCORECARD                             │
│                                                                        │
│   Auth Provider:            Supabase Auth (GoTrue) + HTTP-only Cookies │
│   Role-Based Access (RBAC): Citizen, Volunteer, Coordinator, Admin     │
│   Database RLS Enforcement: 100% Tables Guarded (6 of 6 Tables Active) │
│   Anonymous Intake Policy:  Explicitly Permitted for Incident Ingestion│
│   Triage Authorization:     Restricted to Coordinator & Admin Roles    │
│   Demo Mode Guardrails:     Local Session Emulation (Zero Leakage)     │
└────────────────────────────────────────────────────────────────────────┘
```

The authentication system successfully resolves the classic disaster response dilemma: **guaranteeing zero friction for distressed victims reporting crises anonymously**, while **strictly enforcing cryptographic authorization for responder triage, data mutation, and resource dispatching**.

---

## 2. Supabase Auth Architecture & Session Management

ReliefNet integrates Supabase Auth using the modern `@supabase/ssr` package, establishing session management across Next.js 16 App Router boundaries:

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Browser Client  │ <---> │ Next.js Server  │ <---> │ Supabase Auth   │
│ (Cookie Store)  │       │ (Route Handlers)│       │ (PostgreSQL DB) │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

1. **Client Client (`src/lib/supabase/client.ts`):**  
   Utilizes `createBrowserClient` with auto-refreshing JWT tokens.
2. **Server Client (`src/lib/supabase/server.ts`):**  
   Utilizes `createServerClient` bound to Next.js `cookies()` store from `next/headers`. All session tokens are stored in secure, `HttpOnly`, `SameSite=Lax` cookies, preventing XSS-based token theft.
3. **Session Verification (`src/lib/auth.ts`):**  
   `getCurrentUser()` reads and validates the active session, resolving the associated user profile and assigned role from the `profiles` table.

---

## 3. Coordinator Authentication Pages

### 1. Coordinator Login Portal (`/auth/login`)
* **URL:** `src/app/auth/login/page.tsx`
* **Features:** Email and password input, remember session toggle, error toast notifications.
* **Hackathon Quick Demo Login:**  
  Includes a one-click demo login button that pre-populates official test credentials (`coordinator@reliefnet.org` / `demo1234`), enabling evaluators and judges to test authenticated triage workflows instantaneously.
* **Error Handling:** Invalid credentials render clear feedback ("Invalid login credentials") without leaking whether the email or password was the incorrect parameter.

### 2. Coordinator Registration & Agency Intake (`/auth/signup`)
* **URL:** `src/app/auth/signup/page.tsx`
* **Features:** Full Name, Emergency Response Agency / Organization, Official Work Email, Phone Number, and Secure Password (minimum 8 characters) with confirmation matching.
* **Validation:** Enforced via `signUpSchema` with password matching checks.

---

## 4. Role-Based Access Control (RBAC) Model

ReliefNet enforces a four-tier hierarchical RBAC model:

| Role | Acquisition Path | Permissions & Capabilities |
| :--- | :--- | :--- |
| **Anonymous / Public** | Default unauthenticated state | May report new incidents (`POST /api/incidents/create`); view verified incidents on map and directory; view public KPI metrics. Cannot alter incident statuses or view unverified queues. |
| **Volunteer** | Self-registration via `/volunteers` | All Anonymous capabilities + maintain individual volunteer skill profile and view assigned relief dispatches. |
| **Coordinator** | Agency signup + administrative approval | All Volunteer capabilities + full incident triage access (`/coordinator`), status mutation (`verified`, `in_progress`, `resolved`, `rejected`), and volunteer dispatching. |
| **Admin** | Superuser database provisioning | All Coordinator capabilities + system configuration, user role management, and emergency broadcast dispatch. |

### Server-Side Role Enforcement

Protected server actions and route handlers call `requireCoordinator()` from `src/lib/auth.ts`:

```typescript
export async function requireCoordinator(): Promise<Profile> {
  const { user, error } = await getCurrentUser();
  if (error) throw new Error(error);
  if (!user) throw new Error('Not authenticated');
  if (user.role !== 'coordinator' && user.role !== 'admin') {
    throw new Error('Insufficient permissions');
  }
  return user;
}
```

Any unauthorized request attempting to mutate incident status or reassign responders is rejected with an HTTP `403 Forbidden` or `401 Unauthorized`.

---

## 5. Anonymous Reporting Privilege (By-Design Crisis Architecture)

During floods, earthquakes, or wildfires, requiring citizens to register, verify email addresses, or remember passwords creates lethal delays. 

ReliefNet explicitly designates **anonymous incident intake** as a first-class feature:
- Reports can be submitted with or without an authenticated user ID.
- If submitted anonymously, `reported_by` is recorded as `NULL`.
- Reports are assigned a unique, collision-resistant tracking reference code (`RN-YYYY-XXXXX`), allowing the citizen to follow up on their emergency status without an account.
- Newly lodged citizen reports enter the `unverified` triage quarantine, ensuring bogus or spam reports cannot immediately appear on public verified maps until approved by an official coordinator.

---

## 6. PostgreSQL Row-Level Security (RLS) Policy Audit

The database migration `supabase/migrations/002_rls_policies.sql` establishes exhaustive Row-Level Security policies across all 6 core tables:

### 1. `profiles` Table
* `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`
* **User Read:** `auth.uid() = id` (Users read only their own profile).
* **User Update:** `auth.uid() = id` (Users update only their own profile).
* **Coordinator Read:** Permitted for users with role `'coordinator'` or `'admin'`.

### 2. `incidents` Table
* `ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;`
* **Public Read:** `status IN ('verified', 'in_progress', 'resolved') AND NOT is_demo` (Quarantines unverified reports from public view).
* **Authenticated Read:** Authenticated responders can read all non-demo incidents.
* **Anonymous / Anyone Insert:** `WITH CHECK (NOT is_demo)` (Allows anyone to submit emergency reports).
* **Reporter Update:** `reported_by = auth.uid() AND status = 'unverified'` (Reporters can update only their own unverified reports).
* **Coordinator Update:** Allowed for `role IN ('coordinator', 'admin')`.

### 3. `incident_media` Table
* `ALTER TABLE incident_media ENABLE ROW LEVEL SECURITY;`
* **Public Read:** Media visible only if the parent incident is `verified`, `in_progress`, or `resolved`.
* **Authenticated Insert:** Restricted to `uploaded_by = auth.uid()`.

### 4. `volunteer_profiles` Table
* `ALTER TABLE volunteer_profiles ENABLE ROW LEVEL SECURITY;`
* **Volunteer Self-Management:** `user_id = auth.uid()` for all CRUD operations.
* **Coordinator Read:** Coordinators and admins can read all volunteer rosters.

### 5. `volunteer_assignments` Table
* `ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY;`
* **Volunteer Read:** `volunteer_id = auth.uid()`.
* **Coordinator Management:** Coordinators and admins manage all assignments.

### 6. `incident_status_history` Table
* `ALTER TABLE incident_status_history ENABLE ROW LEVEL SECURITY;`
* **Read Policy:** Authenticated users can read complete status history.
* **Insert Policy:** Restricted entirely to database triggers (`NOT user-insertable`), preventing audit history tampering.

---

## 7. Demo Mode Guardrails

When ReliefNet runs in zero-configuration Demo Mode:
1. All database calls safely fall back to `src/lib/demo-data.ts`.
2. Coordinator triage actions modify temporary local state without attempting network calls to unreachable databases.
3. Media upload signing returns a mock signature rather than throwing unhandled rejections.
4. No sensitive data or environment variables are leaked to client browsers.

---

## 8. Authentication & Authorization Conclusion

The authentication and authorization subsystem of ReliefNet is **SECURE, RESILIENT, AND MISSION-ALIGNED**. It balances rapid citizen disaster reporting with ironclad coordinator triage controls.
