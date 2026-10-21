'use client';

import React, { useSyncExternalStore } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import type { Incident } from '@/types';
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  MAP_MARKER_COLORS,
} from '@/lib/utils';
import { SeverityBadge, StatusBadge } from '@/components/ui/Badge';
import { ExternalLink, MapPin } from 'lucide-react';

interface MapComponentProps {
  incidents: Incident[];
  selectedCategory?: string;
  selectedSeverity?: string;
  selectedStatus?: string;
}

const emptySubscribe = () => () => {};

// Fix default leaflet marker icon asset paths once at module scope
if (typeof window !== 'undefined') {
  // @ts-expect-error Leaflet default icon delete
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

export default function MapComponent({
  incidents,
  selectedCategory,
  selectedSeverity,
  selectedStatus,
}: MapComponentProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isClient) {
    return (
      <div className="w-full h-full min-h-[550px] bg-slate-900 flex items-center justify-center text-slate-400">
        Loading interactive map...
      </div>
    );
  }

  // Filter incidents that have valid coordinates
  const validIncidents = incidents.filter(
    (inc) =>
      typeof inc.latitude === 'number' &&
      typeof inc.longitude === 'number' &&
      !isNaN(inc.latitude) &&
      !isNaN(inc.longitude) &&
      (!selectedCategory || inc.category === selectedCategory) &&
      (!selectedSeverity || inc.severity === selectedSeverity) &&
      (!selectedStatus || inc.status === selectedStatus)
  );

  // Default coordinate center (Hyderabad / Deccan India default demo area)
  const defaultCenter: [number, number] = [17.385, 78.4867];
  const center: [number, number] =
    validIncidents.length > 0 && validIncidents[0].latitude && validIncidents[0].longitude
      ? [validIncidents[0].latitude, validIncidents[0].longitude]
      : defaultCenter;

  // Custom marker icon helper
  const createCustomIcon = (status: Incident['status'], category: Incident['category']) => {
    const color = MAP_MARKER_COLORS[status] || '#f97316';
    const iconEmoji = CATEGORY_ICONS[category] || '⚠️';

    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          cursor: pointer;
        ">
          ${iconEmoji}
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -18],
    });
  };

  return (
    <div className="relative w-full h-full min-h-[550px] rounded-xl overflow-hidden border border-slate-800">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full min-h-[550px] z-0"
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validIncidents.map((incident) => {
          if (!incident.latitude || !incident.longitude) return null;

          return (
            <Marker
              key={incident.id}
              position={[incident.latitude, incident.longitude]}
              icon={createCustomIcon(incident.status, incident.category)}
            >
              <Popup className="reliefnet-popup">
                <div className="p-1 max-w-xs space-y-2 text-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-orange-400 font-medium uppercase tracking-wider">
                    <span>{CATEGORY_ICONS[incident.category]}</span>
                    <span>{CATEGORY_LABELS[incident.category]}</span>
                  </div>

                  <h4 className="font-bold text-sm text-white leading-tight">
                    {incident.title}
                  </h4>

                  <p className="text-xs text-slate-300 line-clamp-2">
                    {incident.description}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <SeverityBadge severity={incident.severity} />
                    <StatusBadge status={incident.status} />
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 truncate max-w-[150px]">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {incident.location_name}
                    </span>
                    <Link
                      href={`/incidents/${incident.id}`}
                      className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 font-semibold"
                    >
                      Details
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend overlay */}
      <div className="absolute top-4 right-4 z-[400] bg-slate-950/90 backdrop-blur-md p-3 rounded-lg border border-slate-800 text-xs space-y-1.5 shadow-xl hidden sm:block">
        <p className="font-semibold text-slate-300 mb-1">Status Legend</p>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
          <span className="text-slate-400">Unverified</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="text-slate-400">Verified</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          <span className="text-slate-400">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-400">Resolved</span>
        </div>
      </div>
    </div>
  );
}
