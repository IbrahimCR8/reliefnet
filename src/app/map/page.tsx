'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useIncidents } from '@/hooks/useIncidents';
import { CATEGORY_LABELS } from '@/lib/utils';
import { Filter, Layers, List, Map as MapIcon } from 'lucide-react';
import { IncidentCard } from '@/components/incidents/IncidentCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoading } from '@/components/ui/LoadingSpinner';

// Dynamic import with SSR false for Leaflet (browser only)
const MapComponent = dynamic(() => import('@/components/map/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-slate-900/60 rounded-xl flex items-center justify-center border border-slate-800 text-slate-400">
      Loading interactive disaster response map...
    </div>
  ),
});

export default function ResponseMapPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const { incidents, loading, isDemo } = useIncidents({
    category: selectedCategory || undefined,
    severity: selectedSeverity || undefined,
    status: selectedStatus || undefined,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Disaster Response Map
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time geospatial intelligence of verified and incoming crisis incidents.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-orange-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            Map View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-orange-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Accessible List
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Filter by Hazard Type
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Filter by Urgency / Severity
          </label>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="moderate">Moderate</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Filter by Operational Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
          >
            <option value="">All Statuses</option>
            <option value="unverified">Unverified</option>
            <option value="verified">Verified</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <PageLoading />
      ) : (
        <>
          {viewMode === 'map' ? (
            <div className="h-[620px] w-full">
              <MapComponent
                incidents={incidents}
                selectedCategory={selectedCategory}
                selectedSeverity={selectedSeverity}
                selectedStatus={selectedStatus}
              />
            </div>
          ) : (
            <div>
              {incidents.length === 0 ? (
                <EmptyState
                  title="No incidents found"
                  description="Try adjusting your filter criteria to display reported disaster areas."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {incidents.map((incident) => (
                    <IncidentCard key={incident.id} incident={incident} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Attribution & Notice */}
      <div className="text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2 pt-2 border-t border-slate-900">
        <span>Map data &copy; OpenStreetMap contributors &bull; Cartography by Leaflet</span>
        <span>Notice: Reported locations reflect initial field estimates and are subject to verification.</span>
      </div>
    </div>
  );
}
