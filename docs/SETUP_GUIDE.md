# Local Setup, Configuration & Deployment Guide
## ReliefNet — Disaster Response Intelligence Platform

Follow this comprehensive guide to set up, run, test, and deploy ReliefNet on Windows or Linux environments.

---

## 1. Prerequisites

- **Node.js:** v18.0.0 or later (tested on v24.18.0)
- **Package Manager:** `npm` v9.0.0 or later (tested on v11.16.0)
- **Version Control:** Git

Verify in PowerShell:
```powershell
node --version
npm --version
git --version
```

---

## 2. Quick Local Start (Demonstration Mode)

ReliefNet includes a built-in, secure **Demonstration Mode** that operates instantly without needing external cloud credentials:

```powershell
# Navigate to the project root
cd C:\Reliefnet

# Run automated tests
npm test

# Start local Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. All major features (Map, Incident Reporting, Dashboard, Volunteer Roster, Coordinator Console) will be active with realistic, clearly labeled simulated crisis records.

---

## 3. Full Production Cloud Configuration

To connect live Supabase PostgreSQL database and Cloudinary media pipelines:

### Step 3.1: Environment File Setup
Create `.env.local` in `C:\Reliefnet` by copying `.env.example`:
```powershell
Copy-Item .env.example .env.local
```

### Step 3.2: Supabase Setup
1. Create a free account and new project at [supabase.com](https://supabase.com).
2. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
3. Open the **SQL Editor** in your Supabase dashboard and run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql` (Creates tables, enums, triggers)
   - `supabase/migrations/002_rls_policies.sql` (Applies Row Level Security)
4. Follow `supabase/migrations/003_coordinator_setup.md` to elevate your account to coordinator.

### Step 3.3: Cloudinary Setup
1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. From your Cloudinary Dashboard copy:
   - `Cloud Name` → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `API Key` → `CLOUDINARY_API_KEY`
   - `API Secret` → `CLOUDINARY_API_SECRET`
3. Optional: Create an unsigned upload preset named `reliefnet-incidents` in Cloudinary settings.

---

## 4. Production Build & Deployment

### Build Check
```powershell
cd C:\Reliefnet
npm run build
```

### Deploying to Vercel
1. Push your repository to GitHub.
2. Import the project in [vercel.com](https://vercel.com).
3. Configure the environment variables from `.env.local` in the Vercel project settings.
4. Click **Deploy**. Vercel will build the Next.js application automatically.
