'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Incident } from '@/types';
import { DEMO_INCIDENTS, isDemoMode } from '@/lib/demo-data';
import { isSupabaseConfigured } from '@/lib/supabase/client';

interface UseIncidentsOptions {
  status?: string;
  category?: string;
  severity?: string;
}

interface UseIncidentsResult {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  isDemo: boolean;
}

export function useIncidents(options: UseIncidentsOptions = {}): UseIncidentsResult {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (isDemoMode() || !isSupabaseConfigured()) {
        let filtered = DEMO_INCIDENTS;
        if (options.status) filtered = filtered.filter(i => i.status === options.status);
        if (options.category) filtered = filtered.filter(i => i.category === options.category);
        if (options.severity) filtered = filtered.filter(i => i.severity === options.severity);
        setIncidents(filtered);
      } else {
        const params = new URLSearchParams();
        if (options.status) params.set('status', options.status);
        if (options.category) params.set('category', options.category);
        if (options.severity) params.set('severity', options.severity);

        const res = await fetch(`/api/incidents?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch incidents');
        const data = await res.json();
        setIncidents(data.incidents || []);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [options.status, options.category, options.severity]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isDemoMode() || !isSupabaseConfigured()) {
          let filtered = DEMO_INCIDENTS;
          if (options.status) filtered = filtered.filter(i => i.status === options.status);
          if (options.category) filtered = filtered.filter(i => i.category === options.category);
          if (options.severity) filtered = filtered.filter(i => i.severity === options.severity);
          if (!ignore) setIncidents(filtered);
        } else {
          const params = new URLSearchParams();
          if (options.status) params.set('status', options.status);
          if (options.category) params.set('category', options.category);
          if (options.severity) params.set('severity', options.severity);

          const res = await fetch(`/api/incidents?${params.toString()}`);
          if (!res.ok) throw new Error('Failed to fetch incidents');
          const data = await res.json();
          if (!ignore) setIncidents(data.incidents || []);
        }
      } catch (err) {
        if (!ignore) setError(String(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    void run();

    return () => {
      ignore = true;
    };
  }, [options.status, options.category, options.severity]);

  return {
    incidents,
    loading,
    error,
    refetch: fetchIncidents,
    isDemo: isDemoMode() || !isSupabaseConfigured(),
  };
}
