# ReliefNet — Disaster Response Coordination Platform

> **Hackathon:** Hacktober HackDays 2026

---

## Overview

ReliefNet is an open-source, privacy-first disaster response coordination platform built to bridge the critical gap between affected communities and relief organizations during natural disasters. When floods sweep through a town or a cyclone tears apart infrastructure, the chaos of uncoordinated information costs lives. ReliefNet brings structure, visibility, and accountability to the response effort.

The platform enables residents to report incidents anonymously or with an account, volunteers to find where they are needed, and coordinators to triage, verify, and manage the relief pipeline — all on a real-time interactive map.

---

## Key Features

| Feature | Description |
|---|---|
| **Incident Reporting** | Any person — authenticated or anonymous — can file a structured incident report with location, severity, category, photos, and description |
| **Live Response Map** | Interactive Leaflet/OpenStreetMap map showing incident pins color-coded by severity and status |
| **Coordinator Console** | Role-protected dashboard for verifying incidents, updating statuses, and assigning volunteers |
| **Volunteer Hub** | Volunteers register skills and availability; coordinators assign them to active incidents |
| **Demo Mode** | Full interactive walkthrough with seeded demo data — no real credentials needed |
| **Anonymous Reporting** | No account required to file a report, lowering the barrier for affected residents |
| **Role-Based Access** | Layered permission system: anonymous → volunteer → coordinator → admin |
| **Media Uploads** | Cloudinary-powered image upload with server-side signing (API secret never exposed) |
| **Audit Trail** | Full status history log for every incident, timestamped and attributed |

---

## What Makes ReliefNet Unique

- **Privacy-first:** No phone numbers, national ID, or personal information is required to file a report. Residents in distress can get help without identifying themselves.
- **Anonymous reporting deliberately allowed:** Unlike most incident platforms, ReliefNet treats anonymous reporting as a feature, not a bug — essential during events where trust in institutions may be low.
- **Offline-tolerant map:** Uses OpenStreetMap tiles with no proprietary API key, meaning the map works reliably even when commercial APIs are throttled.
- **Zero-cost hosting model:** Runs on Supabase free tier + Vercel hobby tier, making it viable for small NGOs and community organizations with no tech budget.
- **Coordinator-centric design:** The verification pipeline prevents alert fatigue by separating raw reports from verified actionable incidents.

---

## Target Users

| User Type | How They Use ReliefNet |
|---|---|
| **Disaster-affected residents** | File incident reports, track status of reported incidents |
| **Volunteers** | Register skills and availability, receive assignments, update progress |
| **Relief organizations / NGOs** | Coordinate volunteer deployment, monitor active incidents |
| **Government coordinators** | Triage incoming reports, escalate critical cases, generate situational awareness |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| **Backend / Database** | Supabase (PostgreSQL, Auth, Row Level Security) |
| **Media Storage** | Cloudinary (signed server-side upload) |
| **Maps** | Leaflet + OpenStreetMap (no API key required) |
| **Validation** | Zod (shared client + server schemas) |
| **Forms** | React Hook Form |
| **Deployment** | Vercel (frontend) + Supabase (managed database) |

---

## Project Structure

```
reliefnet/
├── src/
│   ├── app/              # Next.js App Router pages and API routes
│   ├── components/       # Reusable UI components
│   ├── lib/              # Utility libraries (supabase client, cloudinary, zod schemas)
│   └── types/            # Shared TypeScript types
├── supabase/
│   └── migrations/       # Database migration SQL files
├── docs/                 # Project documentation
├── public/               # Static assets
├── .env.example          # Environment variable template
└── README.md
```

---

## Quick Links

- [Setup Guide](./SETUP_GUIDE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Security & Privacy](./SECURITY_AND_PRIVACY.md)
- [System Architecture](./SYSTEM_ARCHITECTURE.md)
- [Cloudinary Integration](./CLOUDINARY_INTEGRATION.md)
- [Demo Script](./DEMO_SCRIPT.md)
- [Testing Report](./TESTING_REPORT.md)
- [Team Contributions](./TEAM_CONTRIBUTIONS.md)
