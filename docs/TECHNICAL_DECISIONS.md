# Technical Decisions & Architecture Rationale
## ReliefNet — Disaster Response Intelligence Platform

This document outlines the core architectural and technology choices made during the engineering of ReliefNet for Hacktober HackDays 2026.

---

### 1. Frontend Framework: Next.js 16 (App Router) + React 19 + TypeScript
- **Context:** A disaster-management platform requires high performance, resilience under poor network connectivity, SEO/discoverability for emergency access, and strong type safety to prevent runtime crashes during life-critical operations.
- **Decision:** Built on the Next.js App Router with React Server Components (RSC) and strict TypeScript.
- **Rationale:**
  - Server components reduce client bundle size for responders on 2G/3G connections.
  - Granular `'use client'` isolation for interactive components (Leaflet map, Cloudinary upload widget, auth forms).
  - TypeScript interfaces provide shared data contracts between frontend UI and PostgreSQL schema.

---

### 2. Database & Auth: Supabase (PostgreSQL with Row Level Security)
- **Context:** Emergency response operations require multi-tier permissions: anonymous community reporting, volunteer task tracking, and privileged coordinator verification.
- **Decision:** PostgreSQL managed via Supabase with Row Level Security (RLS) enabled on all tables.
- **Rationale:**
  - Declarative RLS ensures security logic is enforced at the database layer, eliminating bypass risks from frontend client tampering.
  - Native triggers automatically populate audit history (`incident_status_history`) and maintain updated timestamps.
  - PostgreSQL ENUMs enforce valid states (`unverified`, `verified`, `in_progress`, `resolved`, `rejected`) and severities (`low`, `moderate`, `high`, `critical`).

---

### 3. Media Pipeline: Cloudinary with Server-Signed Upload Flow
- **Context:** Responders in disaster zones upload photographic evidence of water levels, collapsed roads, and injured victims. Direct uploads to app servers risk resource exhaustion and exposure of credentials.
- **Decision:** Cloudinary integrated via a server-signed API endpoint (`/api/upload/sign`).
- **Rationale:**
  - **Zero Credential Leakage:** `CLOUDINARY_API_SECRET` resides strictly server-side. The client requests a signed HMAC-SHA token with timestamp and folder restrictions.
  - **Direct CDN Upload:** Files are streamed directly from client to Cloudinary CDN without passing large binaries through Next.js server memory.
  - **Adaptive Transformations:** Cloudinary automatically delivers compressed, responsive WebP/AVIF formats to field workers on constrained cellular networks.

---

### 4. Geospatial Visualization: Leaflet + OpenStreetMap
- **Context:** Field coordinators need an interactive map displaying spatial clusters of emergencies without paywall-gated API quotas or vendor lock-in.
- **Decision:** Leaflet library with OpenStreetMap tile layers, dynamically imported with SSR disabled.
- **Rationale:**
  - Completely open-source with zero external API key requirements.
  - Custom HTML DivIcon markers colored by operational status (`#94a3b8` unverified, `#3b82f6` verified, `#f97316` in-progress, `#10b981` resolved).
  - Accessible list-view fallback provided for screen readers and low-bandwidth clients.

---

### 5. Input Validation: Dual-Layer Zod Validation
- **Context:** Garbage data or malicious script injection into an emergency platform can mislead rescue workers.
- **Decision:** Unified Zod schemas in `src/lib/validations.ts` applied both in React Hook Form on the client and in Next.js Route Handlers on the server.
- **Rationale:** Single source of truth for string bounds, coordinate ranges (-90 to 90, -180 to 180), and required fields.

---

### 6. Isolated Demonstration Architecture
- **Context:** Hackathon judges and offline reviewers must be able to explore the full platform experience even before setting up external third-party cloud credentials.
- **Decision:** Automatic fallback to explicitly labeled `DEMO DATA` when `NEXT_PUBLIC_SUPABASE_URL` is unconfigured.
- **Rationale:**
  - Clear visual badges (`⚡ DEMO DATA`) prevent test records from ever being mistaken for real emergencies.
  - Fictional but realistic disaster scenarios (flooding, cyclone damage, clinic supplies) demonstrate the full triage, map, and coordinator pipeline.
