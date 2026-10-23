'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useIncidents } from '@/hooks/useIncidents';
import { CATEGORY_LABELS, calculateDistanceKm, formatDistance } from '@/lib/utils';
import { Filter, Layers, List, Map as MapIcon, Search, MapPin, X, Loader2 } from 'lucide-react';
import { IncidentCard } from '@/components/incidents/IncidentCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import type { SearchedLocation } from '@/components/map/MapComponent';
import type { GeocodeLocation } from '@/lib/geocoding';

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

  // Location search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<GeocodeLocation[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<SearchedLocation | null>(null);

  const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  const { incidents, loading } = useIncidents({
    category: selectedCategory || undefined,
    severity: selectedSeverity || undefined,
    status: selectedStatus || undefined,
  });

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(e.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }

    if (val.trim().length >= 2) {
      setSearchLoading(true);
      searchDebounceTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/geocode?q=${encodeURIComponent(val.trim())}&limit=5`);
          if (res.ok) {
            const data = await res.json();
            setSearchSuggestions(data.results || []);
            setShowSearchDropdown(true);
          }
        } catch {
          setSearchSuggestions([]);
        } finally {
          setSearchLoading(false);
        }
      }, 350);
    } else {
      setSearchSuggestions([]);
      setShowSearchDropdown(false);
      setSearchLoading(false);
    }
  };

  const handleSelectLocation = (loc: GeocodeLocation) => {
    const primaryName = loc.name || loc.display_name.split(',')[0].trim();
    setSearchedLocation({
      latitude: loc.latitude,
      longitude: loc.longitude,
      name: primaryName,
      display_name: loc.display_name,
    });
    setSearchQuery(primaryName);
    setShowSearchDropdown(false);
  };

  const handleClearLocationSearch = () => {
    setSearchQuery('');
    setSearchedLocation(null);
    setSearchSuggestions([]);
    setShowSearchDropdown(false);
  };

  // Sort incidents by distance if location is searched and in list mode
  const sortedIncidents = [...incidents].sort((a, b) => {
    if (!searchedLocation) return 0;
    if (!a.latitude || !a.longitude) return 1;
    if (!b.latitude || !b.longitude) return -1;
    const distA = calculateDistanceKm(
      searchedLocation.latitude,
      searchedLocation.longitude,
      a.latitude,
      a.longitude
    );
    const distB = calculateDistanceKm(
      searchedLocation.latitude,
      searchedLocation.longitude,
      b.latitude,
      b.longitude
    );
    return distA - distB;
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

      {/* Location Search & Filter Controls */}
      <div className="space-y-3">
        {/* Universal Place Search Bar */}
        <div className="relative" ref={searchDropdownRef}>
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition-all shadow-sm">
            {searchLoading ? (
              <Loader2 className="h-4 w-4 text-orange-400 animate-spin mr-2.5 flex-shrink-0" />
            ) : (
              <Search className="h-4 w-4 text-slate-400 mr-2.5 flex-shrink-0" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={() => {
                if (searchSuggestions.length > 0) setShowSearchDropdown(true);
              }}
              placeholder="Search map by location, landmark, area, city or PIN (e.g. Velachery, Chennai, Marina Beach, 600042)..."
              className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearLocationSearch}
                className="text-slate-400 hover:text-white p-1"
                title="Clear location search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchDropdown && searchSuggestions.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-800">
              {searchSuggestions.map((loc) => (
                <button
                  key={loc.place_id}
                  type="button"
                  onClick={() => handleSelectLocation(loc)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-800 transition-colors flex items-start gap-2.5"
                >
                  <MapPin className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {loc.name || loc.display_name.split(',')[0]}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {loc.display_name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active searched location filter chip */}
        {searchedLocation && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-blue-950/40 border border-blue-800/60 rounded-lg text-xs text-blue-300">
            <span className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
              <span>Map focused on: <strong>{searchedLocation.name}</strong> ({searchedLocation.display_name})</span>
            </span>
            <button
              type="button"
              onClick={handleClearLocationSearch}
              className="text-blue-400 hover:text-blue-200 text-xs font-medium ml-2 underline"
            >
              Reset Center
            </button>
          </div>
        )}

        {/* Filter Dropdowns Bar */}
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
                searchedLocation={searchedLocation}
              />
            </div>
          ) : (
            <div>
              {sortedIncidents.length === 0 ? (
                <EmptyState
                  title="No incidents found"
                  description="Try adjusting your filter criteria to display reported disaster areas."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sortedIncidents.map((incident) => (
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
