'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  Loader2,
  Navigation,
  CheckCircle,
  AlertCircle,
  X,
  Map as MapIcon,
} from 'lucide-react';
import type { GeocodeLocation } from '@/lib/geocoding';

// Dynamic import of mini map to prevent SSR Leaflet errors
const LocationMiniMap = dynamic(
  () => import('@/components/location/LocationMiniMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-56 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-700 text-xs text-slate-400">
        Loading interactive map...
      </div>
    ),
  }
);

interface LocationSearchInputProps {
  label?: string;
  id?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  error?: string;
  disabled?: boolean;
  onLocationSelect: (location: {
    location_name: string;
    latitude: number | null;
    longitude: number | null;
    formatted_address?: string;
  }) => void;
}

export function LocationSearchInput({
  label = 'Location, Address, Area, or Landmark',
  id = 'location_name',
  required = true,
  placeholder = 'e.g. Velachery, Chennai or Marina Beach or 600042',
  defaultValue = '',
  error,
  disabled = false,
  onLocationSelect,
}: LocationSearchInputProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<GeocodeLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<GeocodeLocation | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Map coordinates (default to Hyderabad demo area if none selected)
  const [mapCoords, setMapCoords] = useState<{ lat: number; lon: number }>({
    lat: 17.385,
    lon: 78.4867,
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Click outside to dismiss suggestions dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced geocoding search
  const performSearch = useCallback(async (text: string) => {
    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(text.trim())}&limit=5`);
      if (!res.ok) {
        throw new Error('Geocoding service unavailable');
      }
      const data = await res.json();
      const results: GeocodeLocation[] = data.results || [];
      setSuggestions(results);
      setShowDropdown(true);

      if (results.length === 0) {
        setSearchError('No matching places found. Try entering a nearby landmark, city, or PIN code.');
      }
    } catch {
      setSearchError('Location search is currently degraded. You may still type the address manually.');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedLocation(null);

    // Let parent know text updated even before geocode selection
    onLocationSelect({
      location_name: val,
      latitude: null,
      longitude: null,
    });

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (val.trim().length >= 2) {
      debounceTimer.current = setTimeout(() => {
        performSearch(val);
      }, 350);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
      setSearchError(null);
    }
  };

  // User selects an autocomplete suggestion
  const handleSelectSuggestion = (loc: GeocodeLocation) => {
    const resolvedName = loc.display_name;

    setQuery(resolvedName);
    setSelectedLocation(loc);
    setMapCoords({ lat: loc.latitude, lon: loc.longitude });
    setShowDropdown(false);
    setSearchError(null);

    onLocationSelect({
      location_name: resolvedName,
      latitude: loc.latitude,
      longitude: loc.longitude,
      formatted_address: loc.display_name,
    });
  };

  // Clear input
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setSelectedLocation(null);
    setShowDropdown(false);
    setSearchError(null);
    onLocationSelect({
      location_name: '',
      latitude: null,
      longitude: null,
    });
    inputRef.current?.focus();
  };

  // Browser Geolocation ("Use Current Location")
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setSearchError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setSearchError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMapCoords({ lat: latitude, lon: longitude });

        try {
          const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            const loc: GeocodeLocation = data.location;
            setQuery(loc.display_name);
            setSelectedLocation(loc);
            onLocationSelect({
              location_name: loc.display_name,
              latitude: loc.latitude,
              longitude: loc.longitude,
              formatted_address: loc.display_name,
            });
          } else {
            const fallbackName = `Current Position (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
            setQuery(fallbackName);
            onLocationSelect({
              location_name: fallbackName,
              latitude,
              longitude,
            });
          }
        } catch {
          const fallbackName = `Current Position (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          setQuery(fallbackName);
          onLocationSelect({
            location_name: fallbackName,
            latitude,
            longitude,
          });
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setGpsLoading(false);
        setSearchError(
          err.code === 1
            ? 'Location permission denied. Please enter an address manually.'
            : 'Unable to detect current GPS position.'
        );
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Handler when user clicks/drags pin on the mini map
  const handleMapPinChange = async (lat: number, lon: number) => {
    setMapCoords({ lat, lon });

    try {
      const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const data = await res.json();
        const loc: GeocodeLocation = data.location;
        setQuery(loc.display_name);
        setSelectedLocation(loc);
        onLocationSelect({
          location_name: loc.display_name,
          latitude: loc.latitude,
          longitude: loc.longitude,
          formatted_address: loc.display_name,
        });
      } else {
        const customName = `Selected Map Location`;
        setQuery(customName);
        onLocationSelect({
          location_name: customName,
          latitude: lat,
          longitude: lon,
        });
      }
    } catch {
      const customName = `Selected Map Location`;
      setQuery(customName);
      onLocationSelect({
        location_name: customName,
        latitude: lat,
        longitude: lon,
      });
    }
  };

  return (
    <div className="space-y-2">
      {/* Label and auxiliary actions */}
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-medium text-slate-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={disabled || gpsLoading}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-400 hover:text-orange-300 transition-colors disabled:opacity-50"
            title="Detect location automatically via browser GPS"
          >
            {gpsLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Navigation className="h-3 w-3" />
            )}
            Use My Location
          </button>
          <span className="text-slate-600 text-[10px]">&bull;</span>
          <button
            type="button"
            onClick={() => setShowMapPicker(!showMapPicker)}
            disabled={disabled}
            className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${
              showMapPicker
                ? 'text-orange-400 underline'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Click to place a pin directly on an interactive map"
          >
            <MapIcon className="h-3 w-3" />
            {showMapPicker ? 'Hide Map Picker' : 'Pick on Map'}
          </button>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
        </div>

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className={`w-full bg-slate-900 border rounded-lg pl-9 pr-9 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
            error
              ? 'border-red-500 focus:border-red-400'
              : 'border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
          }`}
        />

        {query && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
            title="Clear location"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Autocomplete Dropdown */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-800"
          >
            {suggestions.length > 0 ? (
              suggestions.map((loc) => (
                <button
                  key={loc.place_id}
                  type="button"
                  onClick={() => handleSelectSuggestion(loc)}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 group"
                >
                  <MapPin className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {loc.name || loc.display_name.split(',')[0]}
                    </p>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {loc.display_name}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                {searchError || 'No locations found. Try entering a nearby landmark or PIN code.'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resolved Confirmation Badge */}
      {selectedLocation && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-950/40 border border-emerald-800/60 rounded-md text-xs text-emerald-300">
          <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
          <span className="truncate">
            Location resolved: <strong>{selectedLocation.name || selectedLocation.display_name.split(',')[0]}</strong>
          </span>
        </div>
      )}

      {/* Helpful Search Warning / Error */}
      {searchError && !selectedLocation && !showDropdown && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>{searchError}</span>
        </div>
      )}

      {/* Form Validation Error */}
      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Optional Interactive Map Picker */}
      {showMapPicker && (
        <div className="pt-2">
          <LocationMiniMap
            latitude={mapCoords.lat}
            longitude={mapCoords.lon}
            onPositionChange={handleMapPinChange}
          />
        </div>
      )}
    </div>
  );
}
