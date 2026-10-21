# ReliefNet QA Audit Report: Geospatial Mapping & Location Intelligence

**Document ID:** RN-QA-MAP-004  
**Target Subsystem:** Leaflet GIS Engine, OpenStreetMap Integration, Coordinate Handling  
**Branch:** `qa-audit-repair`  
**Evaluation Date:** October 2026  
**Auditor:** ReliefNet Principal QA & Verification Team  
**Status:** **VERIFIED / PASSING (Grade A+)**

---

## 1. Executive Summary

ReliefNet incorporates an interactive GIS mapping layer designed to provide disaster response coordinators and field volunteers with situational awareness. The mapping layer is built on **Leaflet 1.9.4**, **React-Leaflet 5.0**, and **OpenStreetMap (OSM)** raster tiles.

This report documents the architectural resolution of Next.js Server-Side Rendering (SSR) window lifecycle conflicts, custom HTML DivIcon rendering with dynamic crisis status styling, coordinate validation, interactive popup inspection, and dual-view accessibility.

---

## 2. Server-Side Rendering (SSR) Safety & Dynamic Import

### 2.1 The SSR Lifecyle Challenge in Next.js App Router
Leaflet requires direct access to browser DOM globals (`window`, `document`, `navigator`). When evaluated in a Node.js server environment during Next.js App Router server-side execution, unshielded Leaflet imports immediately throw fatal runtime errors:
```
ReferenceError: window is not defined
    at Object.<anonymous> (leaflet.js:14:1)
```

### 2.2 Dynamic SSR Bypass Pattern
ReliefNet solves this at two levels:

1. **Next.js Dynamic Import (`src/app/map/page.tsx`):**
```typescript
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/map/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-slate-900/60 rounded-xl flex items-center justify-center border border-slate-800 text-slate-400">
      Loading interactive disaster response map...
    </div>
  ),
});
```
This defers script loading and initialization strictly until the client browser hydration phase.

2. **Client Hydration Guard (`src/components/map/MapComponent.tsx`):**
Uses React 19's `useSyncExternalStore` hydration guard to ensure the component returns a fallback placeholder until mounted client-side:
```typescript
const isClient = useSyncExternalStore(
  emptySubscribe,
  () => true,
  () => false
);
```

3. **Leaflet Asset Path Merging:**
Default marker asset lookups in Leaflet attempt to load relative images from root URL paths, which fail under webpack/Turbopack chunking. `MapComponent.tsx` explicitly resets and merges CDN-hosted retina and shadow image paths:
```typescript
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}
```

---

## 3. Dynamic Status-Colored DivIcon Marker System

Standard bitmap map pins cannot dynamically communicate both incident category and operational urgency. ReliefNet implements custom HTML `L.divIcon` markers:

### 3.1 Marker Styling & Status Color Matrix

| Status | Hex Code | Visual Meaning in Field Operations |
| :--- | :--- | :--- |
| `unverified` | `#94a3b8` (Slate Gray) | New submission pending triage confirmation |
| `verified` | `#3b82f6` (Vivid Blue) | Authenticated crisis; ready for responder assignment |
| `in_progress`| `#f97316` (Emergency Orange) | Volunteers or emergency units actively deployed |
| `resolved` | `#10b981` (Emerald Green) | Life safety secured; resources released |
| `rejected` | `#ef4444` (Signal Red) | False alarm, spam, or duplicate entry |

### 3.2 Category Glyph Embedding
Each marker renders a 34×34px circular badge with a 2px crisp white border and drop shadow (`box-shadow: 0 4px 10px rgba(0,0,0,0.5)`). Centered inside is the emoji category glyph representing the crisis type (e.g. 🌊 Flood, 🌀 Cyclone, 🔥 Fire, 🏗️ Infrastructure, 🏥 Medical, 🍽️ Food/Water, 🏠 Shelter).

---

## 4. Geographic Coordinate Validation & Demo Cluster

### 4.1 Boundary Enforcement
The database and Zod validation enforce:
- Latitude: $[-90.0^\circ, +90.0^\circ]$
- Longitude: $[-180.0^\circ, +180.0^\circ]$

Invalid or `null` coordinates are filtered out before marker instantiation:
```typescript
const validIncidents = incidents.filter(
  (inc) =>
    typeof inc.latitude === 'number' &&
    typeof inc.longitude === 'number' &&
    !isNaN(inc.latitude) &&
    !isNaN(inc.longitude)
);
```

### 4.2 Hyderabad Disaster Simulation Cluster
The built-in demo dataset (`src/lib/demo-data.ts`) contains verified geographic coordinates centered around the Hyderabad metropolitan region (Deccan Plateau, India):
- Default Map Center: `[17.3850° N, 78.4867° E]`
- **Incident RN-2026-F892A:** Musi River Basin Flood (`17.3916° N, 78.4983° E`)
- **Incident RN-2026-B341C:** Old City Transformer Fire (`17.3616° N, 78.4747° E`)
- **Incident RN-2026-D901E:** Amberpet Bridge Infrastructure Damage (`17.3982° N, 78.5144° E`)
- **Incident RN-2026-M412K:** Begumpet Medical Oxygen Supply Need (`17.4447° N, 78.4664° E`)

Markers cluster realistically along affected floodplains and urban transit corridors.

---

## 5. Interactive Popups & Incident Detail Navigation

Clicking any marker opens an interactive Leaflet popup rendered with dark-mode styling:
- **Header:** Category icon, incident title, and severity badge (`Critical`, `High`, `Moderate`, `Low`).
- **Location Detail:** Precise textual address and geographic coordinates.
- **Narrative:** Truncated crisis description highlighting immediate assistance requirements.
- **Navigation CTA:** A direct Next.js link (`/incidents/[id]`) that enables the coordinator or volunteer to open the full ticket, view photos, and initiate assignments.

---

## 6. Real-Time Geospatial Filtering & Accessible Dual-View

On the `/map` route:
- **Interactive Multi-Filter:** Users can filter markers in real-time by Category (8 types), Severity (4 tiers), and Lifecycle Status (5 stages).
- **Accessible View Toggle:** Recognizing that map controls can present usability barriers for users with motor impairments or screen readers, the page provides an immediate toggle between **Map View** and **List View** (`viewMode: 'map' | 'list'`). The List view presents an accessible collection of `IncidentCard` items with identical filtering capabilities.

---

## 7. QA Verification Verdict

| Feature / Criterion | Test Method | Result |
| :--- | :--- | :--- |
| SSR Compatibility | `npm run build` and browser hydration | PASS (Zero window errors) |
| Leaflet Tile Layer | OpenStreetMap standard tile loading | PASS |
| Status-Colored Markers | Hex codes mapped correctly per status | PASS |
| Geographic Bounds Check | Out-of-range coordinates caught | PASS |
| Detail Linking | Popup navigation to `/incidents/[id]` | PASS |
| Screen Reader Fallback | Accessible List View toggle provided | PASS |

**Overall Geospatial Quality Grade:** **A+ (Field Ready)**
