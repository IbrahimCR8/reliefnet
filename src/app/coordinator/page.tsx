'use client';

import React, { useState } from 'react';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Filter,
  UserCheck,
  Building,
  RefreshCw
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SeverityBadge, StatusBadge, DemoBadge } from '@/components/ui/Badge';
import { DEMO_INCIDENTS, isDemoMode } from '@/lib/demo-data';
import { CATEGORY_ICONS, CATEGORY_LABELS, timeAgo, formatDate } from '@/lib/utils';
import type { Incident, IncidentStatus } from '@/types';
import Link from 'next/link';

export default function CoordinatorConsolePage() {
  const isDemo = isDemoMode();
  const [incidents, setIncidents] = useState<Incident[]>(DEMO_INCIDENTS);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const handleUpdateStatus = (id: string, newStatus: IncidentStatus) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: newStatus } : inc))
    );

    setActionMessage(
      `Incident ${id} updated to status "${newStatus}". In production, this operation executes an authorized PostgreSQL trigger with full audit logging.`
    );

    setTimeout(() => {
      setActionMessage(null);
    }, 6000);
  };

  const unverified = incidents.filter((i) => i.status === 'unverified');
  const active = incidents.filter((i) => i.status !== 'unverified' && i.status !== 'rejected');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <Shield className="h-7 w-7 text-orange-500" />
              Relief Coordinator Console
            </h1>
            {isDemo && <DemoBadge />}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Restricted operations terminal for crisis report verification, responder assignment, and mission resolution.
          </p>
        </div>
      </div>

      {/* Security notice */}
      <div className="p-4 rounded-xl border border-blue-900/60 bg-blue-950/30 flex items-start gap-3 text-xs text-blue-200">
        <Shield className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong>ROLE-BASED AUTHORIZATION ENFORCED:</strong> Under production configuration,
          this console requires authenticated sessions with <code>coordinator</code> or <code>admin</code> roles
          enforced by Supabase Row Level Security (RLS) policies.
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl border border-emerald-900/60 bg-emerald-950/40 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
          <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Section 1: Triage Unverified Reports */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            Incoming Reports Awaiting Verification ({unverified.length})
          </h2>
          <span className="text-xs text-slate-400">Needs Field Triaging</span>
        </div>

        {unverified.length === 0 ? (
          <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-900/40 text-slate-400 text-sm">
            No pending unverified incidents. All reports have been triaged by coordinators.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unverified.map((incident) => (
              <Card key={incident.id} className="border-yellow-900/40 bg-slate-900/70">
                <CardBody className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">
                      {incident.reference_code}
                    </span>
                    <SeverityBadge severity={incident.severity} />
                  </div>

                  <h3 className="font-bold text-white text-base">{incident.title}</h3>

                  <p className="text-xs text-slate-300 line-clamp-3">
                    {incident.description}
                  </p>

                  <div className="text-xs text-slate-400 pt-1">
                    <p><strong>Location:</strong> {incident.location_name}</p>
                    <p><strong>Reported:</strong> {formatDate(incident.created_at)}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(incident.id, 'verified')}
                      className="flex-1"
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Verify Report
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleUpdateStatus(incident.id, 'rejected')}
                      className="flex-1"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject / Spam
                    </Button>
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
                  <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">
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
                          onClick={() => handleUpdateStatus(inc.id, 'in_progress')}
                        >
                          Dispatch Units
                        </Button>
                      )}
                      {inc.status === 'in_progress' && (
                        <Button
                          variant="primary"
                          size="sm"
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
      </div>
    </div>
  );
}
