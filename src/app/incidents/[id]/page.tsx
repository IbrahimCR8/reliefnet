/* eslint-disable @next/next/no-img-element */
'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  ArrowLeft,
  Shield,
  Activity,
  Users,
  Camera,
  ZoomIn,
  ExternalLink,
  X
} from 'lucide-react';
import { SeverityBadge, StatusBadge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { PageLoading } from '@/components/ui/LoadingSpinner';
import {
  formatDate,
  timeAgo,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
} from '@/lib/utils';
import type { Incident, IncidentStatusHistory } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function IncidentDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [statusHistory, setStatusHistory] = useState<IncidentStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/incidents/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        if (data.incident) {
          setIncident(data.incident);
          setStatusHistory(data.history || []);
        }
      })
      .catch(() => {
        setIncident(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <PageLoading />
      </div>
    );
  }

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
          {/* Photographic Evidence Card */}
          {incident.incident_media && incident.incident_media.length > 0 && (
            <Card className="border-orange-500/30 bg-slate-900/90 shadow-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Camera className="h-4 w-4 text-orange-400" />
                  Photographic Ground Evidence ({incident.incident_media.length})
                </CardTitle>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  ✓ Verified Image Upload
                </span>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {incident.incident_media.map((media, idx) => (
                    <div
                      key={media.id || idx}
                      className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer hover:border-orange-500/70 transition-all shadow-md"
                      onClick={() => setLightboxImage(media.cloudinary_url)}
                    >
                      <div className="relative h-56 w-full">
                        <img
                          src={media.cloudinary_url}
                          alt={`Evidence photo ${idx + 1} for ${incident.reference_code}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 text-white border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                            <ZoomIn className="h-3.5 w-3.5 text-orange-400" />
                            Click to Enlarge
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1.5 text-slate-300 truncate max-w-[180px]">
                          <Camera className="h-3 w-3 text-orange-400 flex-shrink-0" />
                          Photo #{idx + 1}
                        </span>
                        <span>{formatDate(media.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5 italic">
                  <span>💡</span>
                  Click on any ground photo to open the interactive inspection lightbox.
                </p>
              </CardBody>
            </Card>
          )}

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
                  {statusHistory.map((hist) => (
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
                  Reported By (Citizen Contact)
                </span>
                <div className="space-y-0.5">
                  <p className="text-slate-200 font-medium">
                    {incident.reporter_name || 'Ground Citizen Observer'}
                  </p>
                  {incident.reporter_phone && (
                    <a
                      href={`tel:${incident.reporter_phone}`}
                      className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 font-mono"
                    >
                      📞 {incident.reporter_phone}
                    </a>
                  )}
                </div>
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
                  Location Status
                </span>
                {incident.latitude !== null && incident.longitude !== null ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                      ✓ Mapped on Satellite Grid
                    </span>
                    <Link
                      href="/map"
                      className="text-xs text-orange-400 hover:text-orange-300 underline font-medium"
                    >
                      View on Map →
                    </Link>
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs">Awaiting coordinate resolution</span>
                )}
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

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-orange-400" />
                <span className="text-xs font-bold text-white font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {incident.reference_code}
                </span>
                <span className="text-xs text-slate-300 font-semibold truncate max-w-md">
                  {incident.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs"
                  title="Open full-resolution image"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Original</span>
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Close inspection view"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-auto max-h-[70vh] flex items-center justify-center bg-black/80 p-4">
              <img
                src={lightboxImage}
                alt="Enlarged incident evidence"
                className="max-h-[66vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
              <span className="truncate flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                {incident.location_name}
              </span>
              <span className="text-slate-500 font-mono text-[11px]">ReliefNet Photographic Verification</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
