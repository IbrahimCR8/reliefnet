'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Activity,
  Users,
  MapPin,
  ArrowRight,
  Shield,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { DEMO_INCIDENTS, DEMO_STATS, isDemoMode } from '@/lib/demo-data';
import { DemoBadge, SeverityBadge, StatusBadge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle, StatCard } from '@/components/ui/Card';
import { CATEGORY_ICONS, CATEGORY_LABELS, timeAgo, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const isDemo = isDemoMode();
  const stats = DEMO_STATS;
  const recentIncidents = DEMO_INCIDENTS.slice(0, 5);

  // Compute severity distribution
  const severityCounts = {
    critical: DEMO_INCIDENTS.filter((i) => i.severity === 'critical').length,
    high: DEMO_INCIDENTS.filter((i) => i.severity === 'high').length,
    moderate: DEMO_INCIDENTS.filter((i) => i.severity === 'moderate').length,
    low: DEMO_INCIDENTS.filter((i) => i.severity === 'low').length,
  };
  const maxSeverity = Math.max(...Object.values(severityCounts), 1);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Emergency Operations Dashboard
            </h1>
            {isDemo && <DemoBadge />}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time multi-agency situational awareness and crisis relief metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/map"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <MapPin className="h-4 w-4 text-orange-400" />
            Full Map
          </Link>
          <Link
            href="/coordinator"
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-orange-500 transition-colors shadow-sm"
          >
            <Shield className="h-4 w-4" />
            Coordinator Console
          </Link>
        </div>
      </div>

      {isDemo && (
        <div className="p-4 rounded-xl border border-yellow-900/60 bg-yellow-950/30 flex items-start gap-3 text-xs text-yellow-200/90">
          <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-yellow-300">DEMO ENVIRONMENT ACTIVE:</strong> Displayed incidents,
            personnel distributions, and operational tallies represent demonstrative crisis simulation
            records. Real database writes are disabled until live Supabase credentials are configured.
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Reports"
          value={stats.total}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="blue"
          subtitle="Cumulative crisis records"
        />
        <StatCard
          title="Awaiting Review"
          value={stats.unverified}
          icon={<Clock className="h-5 w-5" />}
          color="yellow"
          subtitle="Pending coordinator verification"
        />
        <StatCard
          title="Response in Progress"
          value={stats.in_progress}
          icon={<Activity className="h-5 w-5" />}
          color="orange"
          subtitle="Active field team assignments"
        />
        <StatCard
          title="Resolved Incidents"
          value={stats.resolved}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
          subtitle="Relief objectives achieved"
        />
      </div>

      {/* Main Grid: Recent Activity & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Incidents */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-orange-400" />
              Recent Field Incidents
            </h2>
            <Link
              href="/incidents"
              className="text-xs font-medium text-orange-400 hover:text-orange-300 flex items-center gap-1"
            >
              View all ({DEMO_INCIDENTS.length})
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="divide-y divide-slate-800">
              {recentIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base" role="img" aria-label={CATEGORY_LABELS[incident.category]}>
                        {CATEGORY_ICONS[incident.category]}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {incident.reference_code}
                      </span>
                      <SeverityBadge severity={incident.severity} />
                      <StatusBadge status={incident.status} />
                    </div>
                    <Link
                      href={`/incidents/${incident.id}`}
                      className="font-semibold text-white text-sm hover:text-orange-300 transition-colors block"
                    >
                      {incident.title}
                    </Link>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      {incident.location_name} &bull; {timeAgo(incident.created_at)}
                    </p>
                  </div>

                  <Link
                    href={`/incidents/${incident.id}`}
                    className="self-end sm:self-center px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                  >
                    Details
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Severity Distribution & Quick Actions */}
        <div className="space-y-6">
          {/* Severity Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Severity Distribution</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-red-400 font-medium">Critical</span>
                  <span className="text-slate-400">{severityCounts.critical} reports</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${(severityCounts.critical / maxSeverity) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-orange-400 font-medium">High</span>
                  <span className="text-slate-400">{severityCounts.high} reports</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${(severityCounts.high / maxSeverity) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-yellow-400 font-medium">Moderate</span>
                  <span className="text-slate-400">{severityCounts.moderate} reports</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${(severityCounts.moderate / maxSeverity) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-emerald-400 font-medium">Low</span>
                  <span className="text-slate-400">{severityCounts.low} reports</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(severityCounts.low / maxSeverity) * 100}%` }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Volunteer Overview Widget */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-emerald-400" />
                Volunteer Field Units
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Available Responders</span>
                <span className="font-semibold text-emerald-400">{stats.activeVolunteers} active</span>
              </div>
              <p className="text-xs text-slate-500">
                Responders are mobilized across Medical, Search &amp; Rescue, Logistics, and Shelter teams.
              </p>
              <Link
                href="/volunteers"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors mt-2"
              >
                Open Volunteer Roster
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
