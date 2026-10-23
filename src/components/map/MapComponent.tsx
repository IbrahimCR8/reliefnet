'use client';

import React, { useSyncExternalStore, useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import type { Incident } from '@/types';
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  MAP_MARKER_COLORS,
  calculateDistanceKm,
  formatDistance,
} from '@/lib/utils';
import { SeverityBadge, StatusBadge } from '@/components/ui/Badge';
import { ExternalLink, MapPin, Search } from 'lucide-react';

export interface SearchedLocation {
  latitude: number;
  longitude: number;
  name: string;
  display_name: string;
}

interface MapComponentProps {
  incidents: Incident[];
  selectedCategory?: string;
  selectedSeverity?: string;
  selectedStatus?: string;
  searchedLocation?: SearchedLocation | null;
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

// Controller to fly map to searched location
function MapFlyController({ location }: { location?: SearchedLocation | null }) {
  const map = useMap();
  useEffect(() => {
    if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
      map.flyTo([location.latitude, location.longitude], 14, {
        duration: 1.2,
      });
    }
  }, [location, map]);
  return null;
}

// Interactive map click inspector for reverse geocoding
function MapClickInspector({
  onMapClick,
}: {
  onMapClick: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Search location custom marker icon
const searchMarkerIcon = L.divIcon({
  className: 'search-location-marker',
  html: `
    <div style="
      background-color: #3b82f6;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 16px rgba(59, 130, 246, 0.8), 0 4px 10px rgba(0,0,0,0.5);
      animation: pulse 2s infinite;
      cursor: pointer;
    ">
      <span style="font-size: 18px;">📍</span>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

// Click inspection marker icon
const inspectedMarkerIcon = L.divIcon({
  className: 'inspected-location-marker',
  html: `
    <div style="
      background-color: #8b5cf6;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    ">
      <span style="font-size: 15px;">🔍</span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

export default function MapComponent({
  incidents,
  selectedCategory,
  selectedSeverity,
  selectedStatus,
  searchedLocation,
}: MapComponentProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [clickedPoint, setClickedPoint] = useState<{
    lat: number;
    lon: number;
    address?: string;
    loading: boolean;
  } | null>(null);

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
      inc.status !== 'rejected' &&
      (!selectedCategory || inc.category === selectedCategory) &&
      (!selectedSeverity || inc.severity === selectedSeverity) &&
      (!selectedStatus || inc.status === selectedStatus)
  );

  // Default coordinate center
  const defaultCenter: [number, number] = [17.385, 78.4867];
  const center: [number, number] = searchedLocation
    ? [searchedLocation.latitude, searchedLocation.longitude]
    : validIncidents.length > 0 && validIncidents[0].latitude && validIncidents[0].longitude
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

  // Handle map click to inspect location with reverse geocoding
  const handleMapClick = async (lat: number, lon: number) => {
    setClickedPoint({ lat, lon, loading: true });
    try {
      const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const data = await res.json();
        setClickedPoint({
          lat,
          lon,
          address: data.location?.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
          loading: false,
        });
      } else {
        setClickedPoint({
          lat,
          lon,
          address: `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
          loading: false,
        });
      }
    } catch {
      setClickedPoint({
        lat,
        lon,
        address: `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
        loading: false,
      });
    }
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

        <MapFlyController location={searchedLocation} />
        <MapClickInspector onMapClick={handleMapClick} />

        {/* Searched Location Marker */}
        {searchedLocation && (
          <Marker
            position={[searchedLocation.latitude, searchedLocation.longitude]}
            icon={searchMarkerIcon}
          >
            <Popup className="reliefnet-popup" autoPan={false}>
              <div className="p-1 max-w-xs space-y-1.5 text-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold uppercase tracking-wider">
                  <Search className="h-3 w-3" />
                  <span>Searched Location</span>
                </div>
                <h4 className="font-bold text-sm text-white leading-tight">
                  {searchedLocation.name}
                </h4>
                <p className="text-xs text-slate-300">
                  {searchedLocation.display_name}
                </p>

                {/* Proximity calculation to nearest incident */}
                {validIncidents.length > 0 && (() => {
                  let nearestInc = validIncidents[0];
                  let minDistance = calculateDistanceKm(
                    searchedLocation.latitude,
                    searchedLocation.longitude,
                    nearestInc.latitude!,
                    nearestInc.longitude!
                  );

                  for (let i = 1; i < validIncidents.length; i++) {
                    const inc = validIncidents[i];
                    const dist = calculateDistanceKm(
                      searchedLocation.latitude,
                      searchedLocation.longitude,
                      inc.latitude!,
                      inc.longitude!
                    );
                    if (dist < minDistance) {
                      minDistance = dist;
                      nearestInc = inc;
                    }
                  }

                  return (
                    <div className="pt-1.5 border-t border-slate-700/60 text-[11px] text-slate-400">
                      Nearest hazard: <strong className="text-white">{nearestInc.title}</strong> (~{formatDistance(minDistance)} away)
                    </div>
                  );
                })()}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Clicked Map Point Marker */}
        {clickedPoint && (
          <Marker
            position={[clickedPoint.lat, clickedPoint.lon]}
            icon={inspectedMarkerIcon}
          >
            <Popup className="reliefnet-popup">
              <div className="p-1 max-w-xs space-y-1.5 text-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold uppercase tracking-wider">
                  <MapPin className="h-3 w-3" />
                  <span>Inspected Map Point</span>
                </div>
                <p className="text-xs text-slate-200">
                  {clickedPoint.loading ? 'Resolving address...' : clickedPoint.address}
                </p>
                <div className="pt-1 text-[10px] text-slate-500">
                  Click another area to inspect or search by place name above
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* All Valid Incidents Markers */}
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
        {searchedLocation && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-400 animate-ping" />
            <span className="text-blue-300 font-medium">Search Result</span>
          </div>
        )}
      </div>

      {/* Instructions pill */}
      <div className="absolute bottom-4 left-4 z-[400] bg-slate-950/85 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 hidden md:block">
        💡 Tip: Click anywhere on the map to inspect readable address & landmarks
      </div>
    </div>
  );
}
