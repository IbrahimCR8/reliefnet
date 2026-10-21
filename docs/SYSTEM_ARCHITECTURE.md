# System Architecture

## Overview

ReliefNet is a full-stack web application built on the Next.js App Router paradigm. The architecture follows a clear separation of concerns: the frontend handles rendering and user interaction, API routes handle server-side business logic and secret management, and Supabase handles persistence, authentication, and authorization enforcement.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                           │
│                                                                     │
│  ┌───────────────┐  ┌────────────────┐  ┌────────────────────────┐ │
│  │  Next.js RSC  │  │ React Client   │  │  Leaflet + OSM Map     │ │
│  │  (Server      │  │ Components     │  │  (no API key needed)   │ │
│  │  Components)  │  │                │  │                        │ │
│  └───────┬───────┘  └───────┬────────┘  └────────────────────────┘ │
│          │                  │                                       │
└──────────┼──────────────────┼───────────────────────────────────────┘
           │                  │
           ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS APP SERVER (Vercel)                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      API Routes (/api/*)                     │  │
│  │                                                              │  │
│  │  POST /api/incidents        — create incident                │  │
│  │  GET  /api/incidents/[id]   — fetch single incident          │  │
│  │  POST /api/upload/sign      — generate Cloudinary signature  │  │
│  │  POST /api/volunteers/register — register volunteer profile  │  │
│  │  PATCH /api/incidents/[id]/status — update status (coord.)  │  │
│  └──────────────────┬───────────────────────────────────────────┘  │
│                     │                                               │
│  Secrets available: SUPABASE_SERVICE_ROLE_KEY                      │
│                     CLOUDINARY_API_KEY                              │
│                     CLOUDINARY_API_SECRET                           │
└─────────────────────┼───────────────────────────────────────────────┘
                      │
          ┌───────────┴────────────┐
          │                        │
          ▼                        ▼
┌──────────────────┐    ┌───────────────────────┐
│    SUPABASE       │    │      CLOUDINARY        │
│                  │    │                        │
│  ┌────────────┐  │    │  reliefnet-incidents/  │
│  │ PostgreSQL │  │    │  (image storage +      │
│  │            │  │    │   auto-optimization)   │
│  │ profiles   │  │    │                        │
│  │ incidents  │  │    │  ← client uploads      │
│  │ media      │  │    │    directly after      │
│  │ volunteers │  │    │    server generates    │
│  │ assignments│  │    │    signature           │
│  │ history    │  │    └───────────────────────┘
│  └────────────┘  │
│                  │
│  ┌────────────┐  │
│  │  Auth      │  │
│  │ (JWT +     │  │
│  │ cookies)   │  │
│  └────────────┘  │
│                  │
│  ┌────────────┐  │
│  │  RLS       │  │
│  │ Policies   │  │
│  │ (enforced  │  │
│  │  at DB)    │  │
│  └────────────┘  │
└──────────────────┘
```

---

## Data Flow

### Incident Reporting Flow

```
1. User fills incident form (client-side validation via Zod + React Hook Form)
2. If photos selected:
   a. Client fetches POST /api/upload/sign
   b. Server generates Cloudinary signature (using secret, server-side only)
   c. Client uploads image directly to Cloudinary with signature
   d. Client receives Cloudinary public_id and secure_url
3. Client submits incident data + media URLs to POST /api/incidents
4. Server validates with Zod (server-side)
5. Server inserts incident record into Supabase (using service role or anon key)
6. Server inserts incident_media records
7. Server returns incident reference_code to client
8. Client redirects to confirmation page
```

### Authentication Flow

```
1. User submits sign-up / sign-in form
2. Supabase Auth issues JWT (stored in HTTP-only cookie by @supabase/ssr)
3. Server components and API routes access session via createServerClient()
4. auth.uid() is available in RLS policies for row-level authorization
5. Role is read from profiles.role (set to 'volunteer' by default on signup)
```

### Map Data Flow

```
1. Map page loads → Server Component fetches verified incidents from Supabase
2. Incident data passed as props to Leaflet client component
3. Leaflet renders markers on OpenStreetMap tiles (no API key)
4. User clicks marker → incident detail panel renders
5. Client can fetch additional details via GET /api/incidents/[id]
```

---

## Security Architecture

### Principle of Least Privilege

| Context | Client Exposed | Server Only |
|---|---|---|
| Supabase URL | ✅ (needed for client queries) | — |
| Supabase Anon Key | ✅ (public, RLS-protected) | — |
| Supabase Service Role Key | ❌ NEVER | ✅ API routes only |
| Cloudinary Cloud Name | ✅ (needed for delivery URLs) | — |
| Cloudinary API Key | ❌ NEVER | ✅ Signature generation only |
| Cloudinary API Secret | ❌ NEVER | ✅ Signature generation only |

### Defense Layers

1. **Input validation:** Zod schemas on both client (UX feedback) and server (security enforcement)
2. **Authentication:** Supabase Auth with HTTP-only session cookies (not localStorage)
3. **Authorization:** Row Level Security policies enforced at the database level — even if an API route is bypassed, unauthorized data access is blocked
4. **Secret isolation:** All secrets accessed only in Next.js API routes and Server Components running in the Node.js runtime, never bundled into client JavaScript

---

## Map Architecture

ReliefNet uses **Leaflet** with **OpenStreetMap** tiles. This choice was deliberate:

- **No API key required** — OpenStreetMap tiles are free and open
- **No vendor lock-in** — the tile source can be swapped without code changes
- **Works during API outages** — not dependent on Google Maps or Mapbox availability
- **Privacy-respecting** — no user location data sent to a commercial mapping provider

Leaflet is dynamically imported in Next.js to avoid SSR hydration issues with `window`-dependent map code.

---

## Deployment Architecture

```
┌─────────────────┐     ┌─────────────────────┐
│  GitHub Repo    │────▶│  Vercel             │
│                 │     │  (CI/CD auto-deploy │
│  main branch    │     │   on push)          │
│                 │     │                     │
└─────────────────┘     │  Edge Network CDN   │
                        │  Serverless API     │
                        │  Routes             │
                        └─────────┬───────────┘
                                  │
                    ┌─────────────┘
                    │
                    ▼
          ┌──────────────────┐
          │  Supabase Cloud  │
          │  (Managed Infra) │
          │                  │
          │  PostgreSQL 15   │
          │  Auth            │
          │  Realtime        │
          └──────────────────┘
```

Vercel automatically detects Next.js and configures the build pipeline. Environment variables are set in the Vercel project dashboard. API routes run as serverless functions in the same deployment, ensuring secrets never leave the server runtime.
