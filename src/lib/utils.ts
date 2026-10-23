import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { IncidentCategory, IncidentSeverity, IncidentStatus } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Reference codes ───────────────────────────────────────────────────────────
export function generateReferenceCode(): string {
  const prefix = 'RN';
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${year}-${rand}`;
}

// ── Label helpers ─────────────────────────────────────────────────────────────
export const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  flood: 'Flood',
  cyclone: 'Cyclone',
  fire: 'Fire',
  infrastructure_damage: 'Infrastructure Damage',
  medical_assistance: 'Medical Assistance',
  food_water: 'Food & Water',
  shelter: 'Shelter',
  other: 'Other',
};

export const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  critical: 'Critical',
};

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  unverified: 'Unverified',
  verified: 'Verified',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  low: 'bg-emerald-900/40 text-emerald-300 border-emerald-700',
  moderate: 'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  high: 'bg-orange-900/40 text-orange-300 border-orange-700',
  critical: 'bg-red-900/40 text-red-300 border-red-700',
};

export const STATUS_COLORS: Record<IncidentStatus, string> = {
  unverified: 'bg-slate-700/60 text-slate-300 border-slate-600',
  verified: 'bg-blue-900/40 text-blue-300 border-blue-700',
  in_progress: 'bg-orange-900/40 text-orange-300 border-orange-700',
  resolved: 'bg-emerald-900/40 text-emerald-300 border-emerald-700',
  rejected: 'bg-red-900/40 text-red-300 border-red-700',
};

export const CATEGORY_ICONS: Record<IncidentCategory, string> = {
  flood: '🌊',
  cyclone: '🌀',
  fire: '🔥',
  infrastructure_damage: '🏗️',
  medical_assistance: '🏥',
  food_water: '🍽️',
  shelter: '🏠',
  other: '⚠️',
};

// ── Map marker colours ────────────────────────────────────────────────────────
export const MAP_MARKER_COLORS: Record<IncidentStatus, string> = {
  unverified: '#94a3b8',
  verified: '#3b82f6',
  in_progress: '#f97316',
  resolved: '#10b981',
  rejected: '#ef4444',
};

// ── Date formatting ───────────────────────────────────────────────────────────
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(dateStr));
}

export function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const isServer = typeof window === 'undefined';
  const timestamp = new Date(dateStr).getTime();
  if (isNaN(timestamp)) return '';
  const now = isServer ? 1792569600000 : Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ── File validation ───────────────────────────────────────────────────────────
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `File type not allowed. Accepted: JPEG, PNG, WebP, GIF.`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`;
  }
  return null;
}

// ── Geospatial & Distance Helpers ─────────────────────────────────────────────

/**
 * Calculates great-circle distance between two coordinate pairs in kilometers using the Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats a distance in kilometers into a human-friendly string (e.g. "450 m" or "3.2 km")
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}
