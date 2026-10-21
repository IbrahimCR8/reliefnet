'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Incident } from '@/types';
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
      if (!isSupabaseConfigured()) {
        // Production mode without mock data
        setIncidents([]);
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
      setError(err instanceof Error ? err.message : String(err));
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
        if (!isSupabaseConfigured()) {
          if (!ignore) setIncidents([]);
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
        if (!ignore) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    run();
    return () => {
      ignore = true;
    };
  }, [options.status, options.category, options.severity]);

  return {
    incidents,
    loading,
    error,
    refetch: fetchIncidents,
    isDemo: false,
  };
}
