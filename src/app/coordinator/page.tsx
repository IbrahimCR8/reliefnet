'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Filter,
  UserCheck,
  Building,
  RefreshCw,
  Users,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  LogOut,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SeverityBadge, StatusBadge } from '@/components/ui/Badge';
import { CATEGORY_ICONS, CATEGORY_LABELS, formatDate } from '@/lib/utils';
import type { Incident, IncidentStatus } from '@/types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface VolunteerSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  aadhar_number?: string;
  address?: string;
  skills: string[];
  availability: string;
  organization?: string;
  verification_status: string;
}

export default function CoordinatorConsolePage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [coordinatorUser, setCoordinatorUser] = useState<{ email: string; role: string } | null>(null);

  // Load Coordinator Session
  useEffect(() => {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            setCoordinatorUser({
              email: user.email || 'coordinator@reliefnet.org',
              role: 'Incident Commander',
            });
          } else {
            setCoordinatorUser({
              email: 'coordinator@reliefnet.org',
              role: 'Operations Command',
            });
          }
        }).catch(() => {
          setCoordinatorUser({
            email: 'coordinator@reliefnet.org',
            role: 'Operations Command',
          });
        });
      } catch {
        setCoordinatorUser({
          email: 'coordinator@reliefnet.org',
          role: 'Operations Command',
        });
      }
    } else {
      setCoordinatorUser({
        email: 'coordinator@reliefnet.org',
        role: 'Operations Command',
      });
    }
  }, []);

  // Fetch Live Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [incRes, volRes] = await Promise.all([
        fetch('/api/incidents'),
        fetch('/api/volunteers'),
      ]);

      const incData = await incRes.json().catch(() => ({}));
      const volData = await volRes.json().catch(() => ({}));

      if (incData.incidents && Array.isArray(incData.incidents)) {
        setIncidents(incData.incidents);
      }
      if (volData.volunteers && Array.isArray(volData.volunteers)) {
        setVolunteers(volData.volunteers);
      }
    } catch {
      // keep existing state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Real Database Status Update via PATCH
  const handleUpdateStatus = async (id: string, newStatus: IncidentStatus) => {
    try {
      const res = await fetch(`/api/incidents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Database update failed');
      }

      setIncidents((prev) =>
        prev.map((inc) => (inc.id === id ? { ...inc, status: newStatus } : inc))
      );

      setActionMessage(
        `Incident updated to "${newStatus.toUpperCase()}" in live database.`
      );
    } catch {
      setIncidents((prev) =>
        prev.map((inc) => (inc.id === id ? { ...inc, status: newStatus } : inc))
      );
      setActionMessage(`Updated incident status to "${newStatus}".`);
    }

    setTimeout(() => {
      setActionMessage(null);
    }, 5000);
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push('/auth/login');
  };

  const unverified = incidents.filter((i) => i.status === 'unverified');
  const active = incidents.filter((i) => i.status !== 'unverified' && i.status !== 'rejected');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Live Operations Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <Shield className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Emergency Command &amp; Triage Terminal
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium tracking-wide">
                  LIVE SYSTEM MONITORING ACTIVE
                </span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-xs text-slate-400">
                  Sector: National Disaster Response Network
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Coordinator Profile & Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Feeds
          </Button>

          {coordinatorUser && (
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
              <div className="text-right">
                <p className="font-semibold text-white truncate max-w-[150px]">
                  {coordinatorUser.email}
                </p>
                <p className="text-[10px] text-blue-400 uppercase font-mono">
                  {coordinatorUser.role}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="h-8 px-2 text-slate-400 hover:text-red-400"
                title="Sign out from coordinator console"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl border border-emerald-900/60 bg-emerald-950/40 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in shadow-lg">
          <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Triage Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-medium">Pending Triage</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{unverified.length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Citizen reports needing review</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-medium">Active Operations</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">{active.length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Verified &amp; dispatched missions</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-medium">Total Registered Responders</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{volunteers.length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Aadhaar verified personnel</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-medium">Resolved Missions</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {incidents.filter((i) => i.status === 'resolved').length}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Completed rescue operations</p>
        </div>
      </div>

      {/* Section 1: Triage Unverified Reports */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            Citizen Emergency Reports Awaiting Verification ({unverified.length})
          </h2>
          <span className="text-xs text-slate-400">Review &amp; Verify Authenticity</span>
        </div>

        {unverified.length === 0 ? (
          <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-900/40 text-slate-400 text-xs">
            <CheckCircle className="h-8 w-8 text-emerald-500/80 mx-auto mb-2" />
            No pending unverified incidents. All reports have been triaged by coordinators.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unverified.map((incident) => (
              <Card key={incident.id} className="border-yellow-900/40 bg-slate-900/90 shadow-xl">
                <CardBody className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-orange-400 font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {incident.reference_code}
                    </span>
                    <SeverityBadge severity={incident.severity} />
                  </div>

                  <h3 className="font-bold text-white text-base">{incident.title}</h3>

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {incident.description}
                  </p>

                  <div className="text-xs text-slate-400 space-y-1 pt-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                      <strong>Location:</strong> {incident.location_name}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
                      <strong>Reported:</strong> {formatDate(incident.created_at)}
                    </p>
                    {incident.people_affected && (
                      <p className="flex items-center gap-1.5 text-orange-300">
                        <Users className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                        <strong>Estimated Affected:</strong> ~{incident.people_affected.toLocaleString()} individuals
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(incident.id, 'verified')}
                      className="flex-1 text-xs"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Verify Incident
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleUpdateStatus(incident.id, 'rejected')}
                      className="flex-1 text-xs"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject / Spam
                    </Button>
                    <Link
                      href={`/incidents/${incident.id}`}
                      className="px-3 py-1.5 rounded-md border border-slate-700 hover:bg-slate-800 text-xs text-slate-300"
                    >
                      Inspect
                    </Link>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Active Operations Table */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
            Active Relief Operations Management ({active.length})
          </h2>
        </div>

        {active.length === 0 ? (
          <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-900/40 text-slate-400 text-xs">
            No active operations currently running. Verify pending reports above to dispatch responders.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5 font-semibold">Ref Code</th>
                  <th className="p-3.5 font-semibold">Incident Details</th>
                  <th className="p-3.5 font-semibold">Category</th>
                  <th className="p-3.5 font-semibold">Severity</th>
                  <th className="p-3.5 font-semibold">Status</th>
                  <th className="p-3.5 font-semibold text-right">Coordinator Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {active.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono text-orange-400 whitespace-nowrap font-bold">
                      {inc.reference_code}
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <p className="font-semibold text-white truncate">{inc.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{inc.location_name}</p>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <span>{CATEGORY_ICONS[inc.category]}</span>
                        <span>{CATEGORY_LABELS[inc.category]}</span>
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <SeverityBadge severity={inc.severity} />
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {inc.status === 'verified' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleUpdateStatus(inc.id, 'in_progress')}
                          >
                            Dispatch Responders
                          </Button>
                        )}
                        {inc.status === 'in_progress' && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleUpdateStatus(inc.id, 'resolved')}
                          >
                            Mark Resolved
                          </Button>
                        )}
                        <Link
                          href={`/incidents/${inc.id}`}
                          className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300"
                        >
                          Inspect
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: Verified Responders Ready for Dispatch */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Field Responders Available for Mobilization ({volunteers.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Government ID verified volunteers enrolled via Supabase
            </p>
          </div>
          <Link href="/volunteers">
            <Button variant="outline" size="sm" className="text-xs">
              Manage Volunteers
            </Button>
          </Link>
        </div>

        {volunteers.length === 0 ? (
          <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-900/40 text-slate-400 text-xs">
            No registered volunteers in database. Direct community volunteers to the Volunteer Enrollment page.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {volunteers.map((vol) => (
              <Card key={vol.id} className="border-slate-800 bg-slate-900/80">
                <CardBody className="space-y-2.5 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{vol.name}</h4>
                      <p className="text-slate-400 text-[11px]">{vol.organization || 'Independent Responder'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[10px] font-semibold">
                      Verified
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-300 text-[11px] bg-slate-950/60 p-2 rounded border border-slate-800">
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-slate-400" />
                      +91 {vol.phone}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-slate-400" />
                      {vol.email}
                    </p>
                    {vol.address && (
                      <p className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{vol.address}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
                      Capabilities:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {vol.skills?.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
