# ReliefNet — Disaster Response Intelligence Platform
### Hacktober HackDays 2026 Prototype

> **Safety Notice:** ReliefNet is a hackathon prototype designed for disaster assistance coordination. For immediate life-threatening danger, users must contact official emergency services (Dial **112** in India or local emergency dispatch).

---

## 1. Project Mission

**ReliefNet** is an open disaster-response coordination platform that bridges the gap between affected citizens, volunteers, and relief organizations during floods, cyclones, and humanitarian emergencies.

During extreme weather events, relief efforts frequently stall due to communication breakdown, duplicate task assignments, and lack of verified photographic intelligence from the ground. ReliefNet solves this by providing:
- **Incident Reporting:** Anyone can submit geolocated hazard reports with photos, requested assistance, and urgency ratings.
- **Geospatial Intelligence Map:** An interactive, filterable Leaflet + OpenStreetMap displaying incident clusters color-coded by operational status.
- **Volunteer Coordination:** A centralized roster where responders register their capabilities (Medical, Rescue, Logistics) and receive missions.
- **Coordinator Console:** A privileged operations center where authorized coordinators review, verify, dispatch, and resolve incidents with complete audit histories.
- **Secure Cloudinary Media Pipeline:** Server-signed photographic evidence delivery with zero API secret exposure.

---

## 2. Technology Stack

- **Frontend Framework:** Next.js 16 (App Router) with React 19 and strict TypeScript.
- **Styling & UI:** Tailwind CSS v4, custom operations dashboard theme, Lucide icons.
- **Backend & Database:** Supabase (PostgreSQL with Row Level Security and triggers).
- **Authentication:** Supabase Auth (Cookie-based sessions, RBAC).
- **Media Pipeline:** Cloudinary (Server-side HMAC-SHA signed upload flow).
- **Geospatial Mapping:** Leaflet and OpenStreetMap (Client-side rendering via React-Leaflet).
- **Validation:** Dual-layer Zod schemas (client forms & server route handlers).
- **Testing:** Node.js native test runner (`node:test`, `node:assert`) via `tsx`.

---

## 3. Quick Start (Windows PowerShell)

ReliefNet includes a built-in **Demonstration Mode** that operates out of the box with zero third-party setup required.

```powershell
# 1. Clone repository & navigate to project root
cd C:\Reliefnet

# 2. Run automated test suites (17 tests)
npm test

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 4. Production Environment Configuration

To connect live Supabase PostgreSQL and Cloudinary accounts:

1. Copy `.env.example` to `.env.local`:
   ```powershell
   Copy-Item .env.example .env.local
   ```
2. Populate the required environment variables:

| Variable | Description | Where to Find |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Client Key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase Key | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary Secret (Server-only) | Cloudinary Dashboard |
| `CLOUDINARY_UPLOAD_PRESET` | Optional upload preset | Cloudinary Upload Settings |

3. Run database migrations in Supabase SQL Editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`

---

## 5. Automated Testing

Run the automated test suite verifying form validation, reference code generation, duplicate volunteer assignment guards, and data integrity:

```powershell
npm test
```

**Results:** 17 tests passed, 0 failed.

---

## 6. Project Documentation Directory

Detailed technical and product documentation is located in the `docs/` folder:

- [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) — Comprehensive project overview and target audience.
- [`docs/PROBLEM_STATEMENT.md`](docs/PROBLEM_STATEMENT.md) — In-depth analysis of coordination failures during crises.
- [`docs/SOLUTION_AND_IMPACT.md`](docs/SOLUTION_AND_IMPACT.md) — Proposed humanitarian solution and metrics.
- [`docs/SYSTEM_ARCHITECTURE.md`](docs/SYSTEM_ARCHITECTURE.md) — Complete data flow and architectural diagram.
- [`docs/TECHNICAL_DECISIONS.md`](docs/TECHNICAL_DECISIONS.md) — Architectural decisions and trade-offs.
- [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) — PostgreSQL table definitions, relations, and triggers.
- [`docs/CLOUDINARY_INTEGRATION.md`](docs/CLOUDINARY_INTEGRATION.md) — Secure signed upload architecture.
- [`docs/SECURITY_AND_PRIVACY.md`](docs/SECURITY_AND_PRIVACY.md) — Row Level Security and data privacy safeguards.
- [`docs/TESTING_REPORT.md`](docs/TESTING_REPORT.md) — Automated verification report and results.
- [`docs/SETUP_GUIDE.md`](docs/SETUP_GUIDE.md) — Full installation and configuration guide.
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) — 5-minute timed presentation script for hackathon judging.
- [`docs/TEAM_CONTRIBUTIONS.md`](docs/TEAM_CONTRIBUTIONS.md) — Work separation between Team Member 1 and Member 2.
- [`docs/NOTION_DOCUMENTATION_PLAN.md`](docs/NOTION_DOCUMENTATION_PLAN.md) — Blueprint for publishing to Notion.

---

## 7. License

MIT License &copy; 2026 ReliefNet Hackathon Team.
