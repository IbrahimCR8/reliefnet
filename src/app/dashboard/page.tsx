'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Activity,
  MapPin,
  ArrowRight,
  Shield,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { useIncidents } from '@/hooks/useIncidents';
import { SeverityBadge, StatusBadge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader, CardTitle, StatCard } from '@/components/ui/Card';
import { CATEGORY_ICONS, CATEGORY_LABELS, timeAgo } from '@/lib/utils';
import { PageLoading } from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
  const { incidents, loading } = useIncidents();

  const total = incidents.length;
  const unverified = incidents.filter((i) => i.status === 'unverified').length;
  const inProgress = incidents.filter((i) => i.status === 'in_progress').length;
  const resolved = incidents.filter((i) => i.status === 'resolved').length;

  const recentIncidents = incidents.slice(0, 5);

  // Compute severity distribution
  const severityCounts = {
    critical: incidents.filter((i) => i.severity === 'critical').length,
    high: incidents.filter((i) => i.severity === 'high').length,
    moderate: incidents.filter((i) => i.severity === 'moderate').length,
    low: incidents.filter((i) => i.severity === 'low').length,
  };
  const maxSeverity = Math.max(...Object.values(severityCounts), 1);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <PageLoading />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Emergency Operations Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time multi-agency situational awareness and crisis relief metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/coordinator"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition-colors"
          >
            <Shield className="h-4 w-4" />
            Coordinator Console
          </Link>
          <Link
            href="/report"
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 hover:bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition-colors"
          >
            <AlertTriangle className="h-4 w-4" />
            Report Incident
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Incidents"
          value={total}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="blue"
          subtitle="Recorded in database"
        />
        <StatCard
          title="Pending Review"
          value={unverified}
          icon={<Clock className="h-6 w-6" />}
          color="yellow"
          subtitle="Awaiting coordinator triage"
        />
        <StatCard
          title="Active Missions"
          value={inProgress}
          icon={<Activity className="h-6 w-6" />}
          color="orange"
          subtitle="Responders on the ground"
        />
        <StatCard
          title="Resolved"
          value={resolved}
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
          subtitle="Relief successfully completed"
        />
      </div>

      {/* Main Content: Recent Incidents & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Incidents Feed (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-400" />
              Latest Field Reports
            </h2>
            <Link
              href="/incidents"
              className="text-xs font-medium text-orange-400 hover:text-orange-300 flex items-center gap-1"
            >
              View all ({total})
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            {recentIncidents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No crisis incidents currently reported in the system.
              </div>
            ) : (
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
                        <MapPin className="h-3 w-3 text-slate-500" />
                        {incident.location_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 self-end sm:self-auto">
                      <span>{timeAgo(incident.created_at)}</span>
                      <Link
                        href={`/incidents/${incident.id}`}
                        className="rounded bg-slate-800 px-2.5 py-1 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Severity Distribution & Quick Tools (1 col) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Severity Breakdown</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              {[
                { label: 'Critical', count: severityCounts.critical, color: 'bg-red-500' },
                { label: 'High Priority', count: severityCounts.high, color: 'bg-orange-500' },
                { label: 'Moderate', count: severityCounts.moderate, color: 'bg-yellow-500' },
                { label: 'Low', count: severityCounts.low, color: 'bg-blue-500' },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="font-semibold text-white">{item.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{
                        width: total > 0 ? `${(item.count / total) * 100}%` : '0%',
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Operations Navigation</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              <Link
                href="/map"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-400" />
                  Live GIS Response Map
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              </Link>
              <Link
                href="/volunteers"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4 text-emerald-400" />
                  Volunteer &amp; Responder Roster
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              </Link>
              <Link
                href="/coordinator"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  Coordinator Triage Queue
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
