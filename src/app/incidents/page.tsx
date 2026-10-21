'use client';

import Link from 'next/link';
import { MapPin, Calendar, Users, Filter, Plus } from 'lucide-react';
import { DEMO_INCIDENTS, isDemoMode } from '@/lib/demo-data';
import { DemoBadge, SeverityBadge, StatusBadge } from '@/components/ui/Badge';
import { CATEGORY_LABELS, CATEGORY_ICONS, formatDate, timeAgo } from '@/lib/utils';
import { IncidentCard } from '@/components/incidents/IncidentCard';

export default function IncidentsPage() {
  const demo = isDemoMode();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Active Crisis Incidents
            </h1>
            {demo && <DemoBadge />}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Browse verified, pending, and resolved relief incidents reported by local communities.
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

      {/* Demo mode banner */}
      {demo && (
        <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-xl text-xs text-amber-200">
          <strong className="text-amber-300">DEMO RECORD DATASET:</strong> The incident cards below
          represent mock crisis scenarios (flooding, cyclone damage, medical shortages) designed to test
          and demonstrate the ReliefNet dispatch pipeline.
        </div>
      )}

      {/* Incidents grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEMO_INCIDENTS.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} />
        ))}
      </div>
    </div>
  );
}
