'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationMiniMapProps {
  latitude: number;
  longitude: number;
  onPositionChange: (lat: number, lon: number) => void;
}

const emptySubscribe = () => () => {};

// Marker icon for the interactive pin
const pinIcon = L.divIcon({
  className: 'custom-pin-marker',
  html: `
    <div style="
      background-color: #f97316;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5);
    ">
      <div style="
        width: 10px;
        height: 10px;
        background-color: #ffffff;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Map click handler helper component
function MapClickHandler({ onPositionChange }: { onPositionChange: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Map view pan updater when props change
function MapCenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

export default function LocationMiniMap({
  latitude,
  longitude,
  onPositionChange,
}: LocationMiniMapProps) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isClient) {
    return (
      <div className="w-full h-56 bg-slate-900/80 rounded-lg flex items-center justify-center border border-slate-700 text-xs text-slate-400">
        Loading map picker...
      </div>
    );
  }

  const center: [number, number] = [latitude, longitude];

  return (
    <div className="relative w-full h-56 rounded-lg overflow-hidden border border-slate-700 shadow-inner">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full z-0 cursor-crosshair"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={center}
          icon={pinIcon}
          draggable={true}
          eventHandlers={{
            dragend(e) {
              const marker = e.target;
              const pos = marker.getLatLng();
              onPositionChange(pos.lat, pos.lng);
            },
          }}
        />
        <MapClickHandler onPositionChange={onPositionChange} />
        <MapCenterUpdater center={center} />
      </MapContainer>
      <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-sm text-[11px] text-slate-300 px-2.5 py-1 rounded border border-slate-800 text-center pointer-events-none z-[400]">
        Click anywhere on the map or drag the pin to adjust incident location
      </div>
    </div>
  );
}
