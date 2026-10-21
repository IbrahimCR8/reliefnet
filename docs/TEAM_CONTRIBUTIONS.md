# Team Division of Work & Contributions
## ReliefNet — Disaster Response Intelligence Platform

ReliefNet was architected with clean modular boundaries to facilitate parallel development between two full-stack engineering team members.

---

## Member 1: Frontend Architecture & Product Design

**Primary Focus:** User experience, visual design system, accessibility, and client-side application state.

### Key Contributions:
1. **Design System & Visual Identity:**
   - Established the modern dark-slate and relief-orange visual theme.
   - Built the original vector brand logo (`ReliefNetLogo`) and SVG browser favicon.
   - Designed accessible, reusable UI component library (`Button`, `Card`, `Badge`, `Input`, `StatCard`, `EmptyState`, `LoadingSpinner`).
2. **Public Landing Page & Awareness (`src/app/page.tsx`):**
   - Engineered the mission hero, feature breakdown, how-it-works process flow, and emergency disclaimer system.
3. **Interactive Geospatial Interface (`src/components/map/` & `src/app/map/`):**
   - Integrated Leaflet with OpenStreetMap with custom status-colored SVG DivIcon markers.
   - Engineered category and severity filter bars and an accessible table/list view fallback.
4. **Operations Dashboard & Reporting UI (`src/app/dashboard/`, `src/app/report/`):**
   - Created the real-time metrics dashboard with dynamic severity distribution bars.
   - Implemented the client-side incident reporting form with React Hook Form and Zod validation.
5. **Volunteer Coordination Interface (`src/app/volunteers/page.tsx`):**
   - Built the volunteer roster and skill enrollment form with multi-domain capability tags.

---

## Member 2: Backend Architecture & Cloud Integrations

**Primary Focus:** Database schema, security policies, authentication, media pipelines, and API routes.

### Key Contributions:
1. **Database Schema & Migrations (`supabase/migrations/`):**
   - Authored the comprehensive PostgreSQL database schema across 6 normalized tables (`profiles`, `incidents`, `incident_media`, `volunteer_profiles`, `volunteer_assignments`, `incident_status_history`).
   - Configured custom PostgreSQL ENUMs, foreign keys, cascade deletes, and indexing strategies.
2. **Row Level Security (RLS) & Triggers:**
   - Authored database-level RLS policies enforcing multi-role boundaries (Anonymous, Volunteer, Coordinator, Admin).
   - Created automated audit logging triggers (`log_incident_status_change`) and automatic profile provisioning.
3. **Cloudinary Signed Media Pipeline (`src/app/api/upload/sign/`, `PhotoUpload.tsx`):**
   - Implemented the secure server-signed Cloudinary upload protocol.
   - Protected the master `CLOUDINARY_API_SECRET` strictly on the server while enabling direct client-to-CDN image streaming.
4. **API Route Handlers (`src/app/api/`):**
   - Built RESTful endpoints for incident creation, filtered queries, single incident lookups, and volunteer registration.
5. **Automated Testing & Security Verification (`tests/`):**
   - Built 17 automated tests covering schema validation, authentication rules, deduplication, and file size/type sanitization.
6. **Documentation & Deployment:**
   - Authored the setup guide, system architecture, database schema, security policy, and Notion roadmap.
