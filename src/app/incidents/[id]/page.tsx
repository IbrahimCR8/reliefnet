'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  ArrowLeft,
  ImageIcon,
  Shield,
  Activity,
  CheckCircle,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { DEMO_INCIDENTS, DEMO_STATUS_HISTORY, isDemoMode } from '@/lib/demo-data';
import { DemoBadge, SeverityBadge, StatusBadge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import {
  formatDate,
  timeAgo,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
} from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function IncidentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const demo = isDemoMode();

  const incident = DEMO_INCIDENTS.find((i) => i.id === id);
  const statusHistory = DEMO_STATUS_HISTORY.filter((h) => h.incident_id === id);

  if (!incident) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-white px-4">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ⚠️
          </div>
          <h1 className="text-2xl font-bold mb-2">Incident Record Not Found</h1>
          <p className="text-slate-400 text-sm mb-6">
            The requested incident reference <code className="bg-slate-800 px-2 py-0.5 rounded text-orange-400 font-mono">{id}</code> does not exist or has been archived.
          </p>
          <Link
            href="/incidents"
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Active Incidents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/incidents"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Incidents Feed
        </Link>
      </div>

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono font-bold bg-slate-800 border border-slate-700 text-orange-400 px-2.5 py-1 rounded-md">
              {incident.reference_code}
            </span>
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
            {demo && <DemoBadge />}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {incident.title}
          </h1>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-base" role="img" aria-label={CATEGORY_LABELS[incident.category]}>
              {CATEGORY_ICONS[incident.category]}
            </span>
            <span className="font-semibold text-slate-300">
              {CATEGORY_LABELS[incident.category]}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-500" />
              {incident.location_name}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-500" />
              Reported {timeAgo(incident.created_at)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/coordinator"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Shield className="h-4 w-4 text-orange-400" />
            Triage in Console
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Details & History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Incident Overview &amp; Field Situation</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                {incident.description}
              </p>
            </CardBody>
          </Card>

          {/* Assistance Requested */}
          {incident.assistance_requested && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-orange-400 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Requested Emergency Assistance
                </CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-slate-200 text-sm leading-relaxed bg-slate-950/40 p-4 rounded-lg border border-slate-800">
                  {incident.assistance_requested}
                </p>
              </CardBody>
            </Card>
          )}

          {/* Response Lifecycle & Status Audit Trail */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                Response Timeline &amp; Status History
              </CardTitle>
            </CardHeader>
            <CardBody>
              {statusHistory.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-2">
                  Initial report submission pending first coordinator audit log.
                </div>
              ) : (
                <div className="relative border-l border-slate-800 ml-3 space-y-6 py-2">
                  {statusHistory.map((hist, idx) => (
                    <div key={hist.id} className="relative pl-6">
                      <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-orange-500 border-2 border-slate-900" />
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-white capitalize">
                          Status updated to: <span className="text-orange-400">{hist.new_status}</span>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatDate(hist.created_at)}
                        </span>
                      </div>
                      {hist.notes && (
                        <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                          {hist.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column (1 Col): Metadata & Location Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Incident Metadata</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4 text-xs">
              <div>
                <span className="text-slate-500 block uppercase tracking-wider font-semibold mb-0.5">
                  Verification Status
                </span>
                <span className="text-slate-200 font-medium">
                  {incident.verified_at ? `Verified on ${formatDate(incident.verified_at)}` : 'Awaiting coordinator triage'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block uppercase tracking-wider font-semibold mb-0.5">
                  Affected Persons
                </span>
                <span className="text-slate-200 font-medium">
                  {incident.people_affected !== null ? `~${incident.people_affected.toLocaleString()} individuals estimated` : 'Not confirmed'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block uppercase tracking-wider font-semibold mb-0.5">
                  Geospatial Coordinates
                </span>
                <span className="font-mono text-slate-300">
                  {incident.latitude !== null && incident.longitude !== null
                    ? `${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}`
                    : 'Coordinates not provided'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block uppercase tracking-wider font-semibold mb-0.5">
                  First Reported
                </span>
                <span className="text-slate-300">
                  {formatDate(incident.created_at)}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block uppercase tracking-wider font-semibold mb-0.5">
                  Last Updated
                </span>
                <span className="text-slate-300">
                  {formatDate(incident.updated_at)}
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coordination Actions</CardTitle>
            </CardHeader>
            <CardBody className="space-y-2">
              <Link
                href="/map"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <MapPin className="h-4 w-4 text-orange-400" />
                Inspect on Emergency Map
              </Link>
              <Link
                href="/volunteers"
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 p-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Users className="h-4 w-4 text-blue-400" />
                Mobilize Volunteer Units
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
