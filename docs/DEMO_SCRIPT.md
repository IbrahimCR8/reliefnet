# 5-Minute Hackathon Presentation & Demo Script
## ReliefNet — Disaster Response Intelligence Platform

Use this step-by-step presentation script to showcase ReliefNet to Hacktober HackDays 2026 judges.

---

### Segment 1: The Problem & The Mission (0:00 – 1:00)
- **Visual:** Open [http://localhost:3000](http://localhost:3000) (ReliefNet Landing Page).
- **Speaker Pitch:**
  > "During natural disasters like the recent cyclones and urban flash floods across South Asia, the #1 bottleneck is not a lack of willing volunteers or emergency supplies — it is a severe coordination breakdown. Affected communities struggle to broadcast where help is needed, and relief agencies lack real-time situational awareness.
  >
  > We built **ReliefNet**, an open intelligence platform that unites affected citizens, volunteer responders, and multi-agency relief coordinators into one synchronized operational picture."
- **Point out:** The emergency disclaimer banner and immediate action buttons ("Report an Incident", "View Response Map").

---

### Segment 2: Incident Reporting & Cloudinary Photo Proof (1:00 – 2:00)
- **Visual:** Navigate to `/report`.
- **Action:**
  1. Fill in a sample incident:
     - **Title:** `Severe inundation near Old Town Bridge — 15 families stranded`
     - **Category:** `Flood`
     - **Severity:** `Critical`
     - **Location:** `River Road, Old Town Bridge`
     - **People Affected:** `65`
     - **Description:** `Water levels rose past 4 feet in under 2 hours. Ground floor apartments submerged. Need evacuation rafts and medical support.`
  2. Highlight the **Cloudinary Photographic Evidence** section. Explain how signed server uploads protect API secrets while streaming photos to Cloudinary CDN with automatic WebP compression.
  3. Click **Submit Incident Report**.
- **Result:** Display the instant confirmation modal with the official **Reference ID** (e.g. `RN-2026-XXXXX`) and explain that new reports are held as `UNVERIFIED` to prevent panic or spam.

---

### Segment 3: Interactive Geospatial Response Map (2:00 – 3:00)
- **Visual:** Navigate to `/map`.
- **Action:**
  1. Pan and zoom across the Leaflet/OpenStreetMap interface.
  2. Click on a marker to show the incident popup with status color, urgency badge, and direct detail link.
  3. Filter by **Hazard Type** (e.g. `Flood`) and **Severity** (e.g. `Critical`).
  4. Toggle between the **Map View** and the **Accessible List View** (for low-bandwidth or visually impaired responders).

---

### Segment 4: Operations Dashboard & Volunteer Roster (3:00 – 4:00)
- **Visual:** Navigate to `/dashboard`, then `/volunteers`.
- **Action:**
  1. On `/dashboard`, showcase the live KPIs: Total Reports, Awaiting Review, In Progress, and Resolved.
  2. Show the **Severity Distribution Graph** and recent field activity log.
  3. Navigate to `/volunteers`. Demonstrate the volunteer roster showing responder specializations (Water Rescue, First Aid, Emergency Comms) and submit a new volunteer registration.

---

### Segment 5: Coordinator Console & Technical Architecture (4:00 – 5:00)
- **Visual:** Navigate to `/coordinator`.
- **Action:**
  1. Show the **Incoming Reports Awaiting Verification** queue.
  2. Click **Verify Report** on an unverified incident. Show the instant status escalation to active dispatch.
  3. Conclude with technical highlights: Next.js 16, Supabase PostgreSQL with Row Level Security, Cloudinary media pipeline, and 17 automated tests passing.
- **Speaker Closing:**
  > "ReliefNet turns chaos into coordinated action — helping humanitarian teams reach victims faster when every minute counts. Thank you!"
