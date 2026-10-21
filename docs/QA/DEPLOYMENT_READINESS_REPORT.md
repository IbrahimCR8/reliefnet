# ReliefNet Production Deployment Readiness Audit & Runbook

**Document ID:** RN-QA-DEP-005  
**Project:** ReliefNet - Disaster Response Coordination Platform  
**Version:** 1.0.0-rc  
**Target Environments:** Vercel (Edge/Serverless Platform) + Supabase (PostgreSQL 15) + Cloudinary (Digital Asset Management)  
**Date:** October 21, 2026  
**Auditor:** ReliefNet Principal QA & Verification Team  
**Status:** READY FOR PRODUCTION DEPLOYMENT  

---

## 1. Executive Summary

This deployment readiness audit establishes the exact runbook and verification standards required to deploy ReliefNet into a live, production-grade cloud infrastructure. 

The application architecture has been validated for zero-downtime deployment on Vercel's global edge network, backed by Supabase Managed PostgreSQL with Row-Level Security (RLS) and Cloudinary media processing. All build artifacts, TypeScript definitions, environment variable declarations, and database migration scripts have been audited for operational readiness.

---

## 2. Infrastructure Architecture Overview

```
                      ┌─────────────────────────────────────────┐
                      │              END USERS                  │
                      │   (Citizens, Volunteers, Coordinators)  │
                      └────────────────────┬────────────────────┘
                                           │ HTTPS (TLS 1.3)
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │          VERCEL EDGE NETWORK            │
                      │  - Next.js 16.4.2 Prerendered Static    │
                      │  - Serverless API Routes (/api/*)       │
                      │  - Global Anycast CDN Caching           │
                      └─────────────┬─────────────┬─────────────┘
                                    │             │
                Client Auth & Direct│             │Signed Media
                Database Queries    │             │Uploads
                                    ▼             ▼
  ┌───────────────────────────────────┐ ┌──────────────────────────────────┐
  │         SUPABASE CLOUD            │ │         CLOUDINARY CDN           │
  │ - PostgreSQL 15 Engine            │ │ - Asset Storage (f_auto, q_auto) │
  │ - Row-Level Security (RLS)        │ │ - Direct Secure HTTPS Uploads    │
  │ - Supabase Auth (JWT Provider)    │ │ - Thumbnail & Metadata Transform │
  │ - Realtime WebSocket Subscriptions│ └──────────────────────────────────┘
  └───────────────────────────────────┘
```

---

## 3. Vercel Deployment Checklist & Configuration

ReliefNet is optimized out-of-the-box for deployment on Vercel:

| Parameter | Configuration Value | Verified |
| :--- | :--- | :---: |
| **Framework Preset** | Next.js | ✅ |
| **Node.js Runtime Version** | `20.x` or `22.x` (LTS) | ✅ |
| **Build Command** | `npm run build` | ✅ |
| **Output Directory** | `.next` (Default) | ✅ |
| **Install Command** | `npm install` | ✅ |
| **Root Directory** | `./` | ✅ |
| **Turbopack Build Optimization** | Enabled by default in Next.js 16 | ✅ |

### Pre-Deployment CLI Verification
```bash
# Verify clean compilation locally prior to git push
npx tsc --noEmit
npm run lint
npm test
npm run build
```

---

## 4. Environment Variables Production Matrix

All required environment variables must be populated in the Vercel Project Settings under **Settings > Environment Variables**:

| Variable Name | Required | Environment | Description & Example |
| :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_APP_URL` | YES | All | Public base URL (e.g., `https://reliefnet.vercel.app`) |
| `NEXT_PUBLIC_SUPABASE_URL` | YES | All | Supabase project API gateway (`https://xyzcompany.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | YES | All | Supabase public anonymous key (browser client-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | YES | Server-only | Supabase privileged service role key (bypasses RLS for admin tasks) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | YES | All | Cloudinary account identifier |
| `CLOUDINARY_API_KEY` | YES | Server-only | Cloudinary API Key for backend signature generation |
| `CLOUDINARY_API_SECRET` | YES | Server-only | Cloudinary API Secret for HMAC signature generation |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`| YES | All | Cloudinary upload preset name (`reliefnet_incidents`) |

> **CRITICAL SECURITY NOTE:** Ensure `SUPABASE_SERVICE_ROLE_KEY` and `CLOUDINARY_API_SECRET` are never exposed to `NEXT_PUBLIC_*` prefixes. ReliefNet's API layer strictly restricts secret usage to `/api/upload/sign` and privileged server routines.

---

## 5. Supabase Database Migration Checklist

Production database setup requires running the verified migration scripts in sequential order via the **Supabase Dashboard > SQL Editor**:

### Step 1: Initial Database Schema (`001_initial_schema.sql`)
- Creates core enumeration types: `incident_category`, `incident_severity`, `incident_status`, `user_role`, `volunteer_skill`.
- Creates core relational tables:
  - `profiles`: User accounts linked to `auth.users(id)`.
  - `incidents`: Central emergency report table with PostGIS/WGS-84 coordinates.
  - `incident_media`: Cloudinary image references and metadata.
  - `incident_status_history`: Immutable audit trail for incident status changes.
  - `volunteers`: Volunteer profiles, contact numbers, and skill arrays.
  - `volunteer_assignments`: M:N coordination table linking volunteers to incidents.
- Configures indexes on `incidents(status)`, `incidents(created_at)`, and `volunteers(skills)`.

### Step 2: Row-Level Security Configuration (`002_rls_policies.sql`)
- Enables RLS on all tables: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
- Applies citizen public insert policy: Anyone can submit an emergency report without prior login.
- Applies read policies: Public can read verified/non-confidential incidents.
- Applies coordinator role restrictions: Only users with `role = 'coordinator'` or `role = 'admin'` can alter incident status or assign volunteers.
- Applies volunteer privacy policy: Contact details visible only to coordinators and the volunteer themselves.

### Step 3: First Coordinator Setup (`003_coordinator_setup.md`)
1. Create coordinator account via public signup `/auth/signup`.
2. Retrieve the user UUID from `auth.users`.
3. In SQL Editor, execute the elevation script:
   ```sql
   UPDATE public.profiles
   SET role = 'coordinator'
   WHERE id = 'USER-UUID-HERE';
   ```
4. Confirm user now has full access to the Coordinator Control Center at `/coordinator`.

---

## 6. Cloudinary Media Pipeline Configuration

To enable citizen photo evidence uploads:

1. Log in to the Cloudinary Management Console.
2. Navigate to **Settings > Upload > Upload presets**.
3. Create a new Upload Preset:
   - **Preset Name**: `reliefnet_incidents`
   - **Signing Mode**: `Signed` (recommended) or `Unsigned`
   - **Folder**: `reliefnet/incidents`
   - **Allowed Formats**: `jpg, jpeg, png, webp`
   - **Max File Size**: `10485760` (10 MB)
   - **Media Transformations**: Auto-format (`f_auto`), Auto-quality (`q_auto`), maximum dimension `2048px` thumbnailing.
4. Save and copy the preset name into `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.

---

## 7. Post-Deployment Smoke Test Protocol

Immediately following production deployment, the deployment lead must execute the following 7-step smoke test verification:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PRODUCTION SMOKE TEST RUNBOOK                        │
├──────┬───────────────────────┬─────────────────────────────────────────┤
│ Step │ Verification Target   │ Expected Outcome                        │
├──────┼───────────────────────┼─────────────────────────────────────────┤
│ 1    │ Public Landing (/)    │ Loads within 1.0s, no amber demo badge  │
│ 2    │ Report Submission     │ Submit test report with photo; receive  │
│      │ (/report)             │ valid reference code RN-2026-XXXXX      │
│ 3    │ Database Verification │ Verify new row exists in Supabase table │
│ 4    │ Media CDN Check       │ Verify photo loads from res.cloudinary  │
│ 5    │ Interactive Map (/map)│ Leaflet renders, shows new incident pin │
│ 6    │ Coordinator Panel     │ Log in as coordinator, change status to │
│      │ (/coordinator)        │ 'verified', add status update note      │
│ 7    │ Status Audit Trail    │ Confirm status change appears on public │
│      │ (/incidents/[id])     │ incident timeline with timestamp        │
└──────┴───────────────────────┴─────────────────────────────────────────┘
```

---

## 8. Rollback Strategy & Incident Contingency

If critical regressions are detected post-deployment:
1. **Instant Vercel Rollback**: Navigate to Vercel Deployments > select previous green deployment > click **Instant Rollback**. Rollback takes effect globally within 5 seconds.
2. **Database Rollback**: Schema migrations are strictly additive. In the event of schema rollback, restore from the automated Supabase daily snapshot.
3. **Emergency Demo Mode Toggle**: If Supabase experiences an upstream outage, removing or invalidating `NEXT_PUBLIC_SUPABASE_URL` in Vercel settings immediately drops the app into safe, offline Demo Mode without downtime.

---

## 9. Conclusion & Deployment Approval

ReliefNet has successfully completed all pre-deployment engineering requirements. Build artifacts are clean, automated tests pass at 100%, and environment configurations are fully documented. The system is certified **APPROVED FOR PRODUCTION LAUNCH**.
