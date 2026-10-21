'use client';

import Link from 'next/link';
import { MapPin, Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import { useIncidents } from '@/hooks/useIncidents';
import { IncidentCard } from '@/components/incidents/IncidentCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';

export default function IncidentsPage() {
  const { incidents, loading, error } = useIncidents();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Active Crisis Incidents
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time feed of verified, pending, and active disaster relief incidents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/report"
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 hover:bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Report Incident
          </Link>
          <Link
            href="/map"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors"
          >
            <MapPin className="h-4 w-4 text-orange-400" />
            View Map
          </Link>
        </div>
      </div>

      {loading ? (
        <PageLoading />
      ) : error ? (
        <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl text-xs text-red-300">
          Failed to load live incidents: {error}
        </div>
      ) : incidents.length === 0 ? (
        <EmptyState
          icon={<CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />}
          title="No Active Incidents Reported"
          description="All response sectors are currently clear. When emergencies are submitted, they will appear here in real-time."
          action={
            <Link href="/report">
              <Button variant="primary" className="gap-2 text-xs">
                <Plus className="h-4 w-4" />
                Report an Emergency
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {incidents.map((incident) => (
            <IncidentCard key={incident.id} incident={incident} />
          ))}
        </div>
      )}
    </div>
  );
}
