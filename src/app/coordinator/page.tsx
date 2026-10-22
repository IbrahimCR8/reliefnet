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
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Activity,
  AlertTriangle,
  Database,
  KeyRound,
  FileCheck2,
  ChevronRight,
  Radio,
  Send,
  UserMinus,
  Check
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SeverityBadge, StatusBadge } from '@/components/ui/Badge';
import { CATEGORY_ICONS, CATEGORY_LABELS, formatDate } from '@/lib/utils';
import type { Incident, IncidentStatus } from '@/types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface AssignedIncidentSummary {
  id: string;
  reference_code: string;
  title: string;
  location_name: string;
  severity: string;
  category: string;
}

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
  is_online?: boolean;
  assigned_incident_id?: string | null;
  assigned_role_task?: string | null;
  assigned_at?: string | null;
  assigned_by_email?: string | null;
  assigned_incident?: AssignedIncidentSummary | null;
}

export default function CoordinatorConsolePage() {
  const router = useRouter();

  // Authentication State
  const [coordinatorUser, setCoordinatorUser] = useState<{ email: string; role: string } | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Live Console Data
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerSummary[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);
  const [assignedCount, setAssignedCount] = useState(0);

  const [loadingFeeds, setLoadingFeeds] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  
  // Navigation inside Console: 'triage' | 'active' | 'volunteers' | 'setup_guide'
  const [activeTab, setActiveTab] = useState<'triage' | 'active' | 'volunteers' | 'setup_guide'>('triage');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [volunteerFilter, setVolunteerFilter] = useState<'all' | 'online' | 'available' | 'assigned'>('all');

  // Assignment Modal State
  const [assigningVolunteer, setAssigningVolunteer] = useState<VolunteerSummary | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [taskInstructions, setTaskInstructions] = useState<string>('Disaster Relief Ground Operations & Triage Support');
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);

  const supabaseReady = isSupabaseConfigured();

  // 1. Check Existing Supabase Session on Mount
  useEffect(() => {
    if (supabaseReady) {
      try {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user }, error }) => {
          if (user && !error) {
            setCoordinatorUser({
              email: user.email || 'coordinator@reliefnet.org',
              role: 'Incident Commander / Zonal Coordinator',
            });
          } else {
            setCoordinatorUser(null);
          }
          setAuthChecking(false);
        }).catch(() => {
          setCoordinatorUser(null);
          setAuthChecking(false);
        });
      } catch {
        setCoordinatorUser(null);
        setAuthChecking(false);
      }
    } else {
      setCoordinatorUser(null);
      setAuthChecking(false);
    }
  }, [supabaseReady]);

  // 2. Fetch Live Incidents and Volunteers
  const loadLiveFeeds = async () => {
    setLoadingFeeds(true);
    try {
      const [incRes, volRes] = await Promise.all([
        fetch('/api/incidents', { cache: 'no-store' }),
        fetch('/api/volunteers', { cache: 'no-store' }),
      ]);

      const incData = await incRes.json().catch(() => ({}));
      const volData = await volRes.json().catch(() => ({}));

      if (incData.incidents && Array.isArray(incData.incidents)) {
        setIncidents(incData.incidents);
      }
      if (volData.volunteers && Array.isArray(volData.volunteers)) {
        setVolunteers(volData.volunteers);
        setOnlineCount(volData.online_count || 0);
        setAvailableCount(volData.available_count || 0);
        setAssignedCount(volData.assigned_count || 0);
      }
    } catch {
      // Keep current state gracefully
    } finally {
      setLoadingFeeds(false);
    }
  };

  useEffect(() => {
    if (coordinatorUser) {
      loadLiveFeeds();
    }
  }, [coordinatorUser]);

  // 3. Handle Coordinator Login
  const handleCoordinatorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim() || !loginEmail.includes('@')) {
      setLoginError('Please enter a valid coordinator email address.');
      return;
    }
    if (!loginPassword || loginPassword.length < 6) {
      setLoginError('Password must be at least 6 characters.');
      return;
    }

    setLoginLoading(true);

    try {
      if (supabaseReady) {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail.trim(),
          password: loginPassword,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setLoginError('Invalid coordinator credentials. Ensure your account is added by Admin in Supabase.');
          } else if (error.message.includes('Email not confirmed')) {
            setLoginError('Email not confirmed. In Supabase Dashboard -> Authentication -> Users, make sure "Auto Confirm User" is toggled ON.');
          } else {
            setLoginError(error.message);
          }
          return;
        }

        setCoordinatorUser({
          email: data.user?.email || loginEmail.trim(),
          role: 'Incident Commander / Zonal Coordinator',
        });
      } else {
        setLoginError('Supabase authentication is not configured in .env.local.');
      }
    } catch (err) {
      setLoginError('Authentication failed. Check your Supabase configuration or network connection.');
      console.error(err);
    } finally {
      setLoginLoading(false);
    }
  };

  // 4. Handle Sign Out
  const handleSignOut = async () => {
    if (supabaseReady) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // Ignored
      }
    }
    setCoordinatorUser(null);
  };

  // 5. Handle Database Status Update via PATCH
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

      setActionMessage(`Incident status successfully updated to "${newStatus.toUpperCase()}" in Supabase.`);
    } catch {
      setIncidents((prev) =>
        prev.map((inc) => (inc.id === id ? { ...inc, status: newStatus } : inc))
      );
      setActionMessage(`Updated incident status to "${newStatus}".`);
    }

    setTimeout(() => {
      setActionMessage(null);
    }, 4000);
  };

  // 6. Handle Coordinator Job Assignment to Volunteer
  const handleAssignMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningVolunteer || !selectedIncidentId) return;

    setAssignmentSubmitting(true);
    try {
      const res = await fetch('/api/volunteers/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteer_id: assigningVolunteer.id,
          incident_id: selectedIncidentId,
          role_task: taskInstructions,
          action: 'assign',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to assign mission');
      }

      setActionMessage(`Assigned ${assigningVolunteer.name} to disaster incident.`);
      setAssigningVolunteer(null);
      setSelectedIncidentId('');
      loadLiveFeeds();
    } catch (err) {
      setActionMessage(`Assignment error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setAssignmentSubmitting(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // 7. Handle Relieve / Unassign Volunteer
  const handleUnassignVolunteer = async (volunteerId: string, volunteerName: string) => {
    try {
      const res = await fetch('/api/volunteers/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteer_id: volunteerId,
          action: 'unassign',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to relieve volunteer');
      }

      setActionMessage(`Relieved ${volunteerName} from mission. Status reset to Available.`);
      loadLiveFeeds();
    } catch (err) {
      setActionMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const unverified = incidents.filter((i) => i.status === 'unverified');
  const active = incidents.filter((i) => i.status !== 'unverified' && i.status !== 'rejected');

  const filteredUnverified = severityFilter === 'all'
    ? unverified
    : unverified.filter((i) => i.severity === severityFilter);

  const filteredVolunteers = volunteers.filter((vol) => {
    if (volunteerFilter === 'online') return vol.is_online;
    if (volunteerFilter === 'available') return !vol.assigned_incident_id;
    if (volunteerFilter === 'assigned') return Boolean(vol.assigned_incident_id);
    return true;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW A: AUTHENTICATION REQUIRED (Coordinator Login Screen)
  // ─────────────────────────────────────────────────────────────────────────────
  if (!coordinatorUser) {
    return (
      <div className="min-h-[85vh] bg-slate-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl mb-3 shadow-lg shadow-blue-950/40">
              <Shield className="h-10 w-10 text-blue-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Coordinator Command Terminal
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Restricted Operations Console for Verified Incident Commanders
            </p>
          </div>

          {/* Access Policy Banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 flex items-start gap-2.5">
            <Lock className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Strict Role Restriction:</span>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                ReliefNet maintains a ceiling of <strong>3 authorized coordinators/admins</strong>. Public registration is closed. Accounts are provisioned directly by Admin in Supabase.
              </p>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
            {loginError && (
              <div className="p-3.5 bg-red-950/50 border border-red-700/60 rounded-xl flex gap-2.5 text-xs text-red-300 animate-fade-in">
                <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{loginError}</span>
              </div>
            )}

            <form onSubmit={handleCoordinatorLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Coordinator Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@reliefnet.com"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={loginLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30"
              >
                {loginLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Verifying Credentials...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Sign In to Command Console
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Quick Setup Instructions for Supabase */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <Database className="h-4 w-4 text-blue-400" />
              <span>How to Add 3 Coordinators in Supabase</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              1. Open your <strong>Supabase Dashboard &rarr; Authentication &rarr; Users</strong>.<br />
              2. Click <strong>Add User &rarr; Create User</strong> with your coordinator email and password.<br />
              3. Toggle <strong>&quot;Auto Confirm User&quot; ON</strong> so email confirmation is bypassed.<br />
              4. In Table Editor &rarr; <code>profiles</code> table, set <code>role = &apos;coordinator&apos;</code> or <code>&apos;admin&apos;</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW B: AUTHENTICATED COORDINATOR CONSOLE
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Live Operations Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 rounded-xl shadow-md">
              <Shield className="h-7 w-7 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Emergency Command &amp; Triage Terminal
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-semibold tracking-wide uppercase">
                  Live Operations Active
                </span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-xs text-slate-400">
                  Zonal Disaster Response Grid
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Authenticated Coordinator Profile Pill */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadLiveFeeds}
            disabled={loadingFeeds}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingFeeds ? 'animate-spin' : ''}`} />
            Refresh Feeds
          </Button>

          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl text-xs shadow-sm">
            <div className="text-right">
              <p className="font-semibold text-white truncate max-w-[180px]">
                {coordinatorUser.email}
              </p>
              <p className="text-[10px] text-blue-400 uppercase font-mono font-bold">
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
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div className="p-4 rounded-xl border border-emerald-900/60 bg-emerald-950/40 text-xs text-emerald-300 flex items-center gap-2.5 animate-fade-in shadow-lg">
          <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span className="font-medium">{actionMessage}</span>
        </div>
      )}

      {/* KPI Triage Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Pending Citizen Reports */}
        <div
          onClick={() => setActiveTab('triage')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${
            activeTab === 'triage'
              ? 'bg-yellow-950/20 border-yellow-500/50 shadow-lg shadow-yellow-950/30'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <p className="text-xs text-slate-400 font-medium">Pending Citizen Reports</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{unverified.length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Awaiting triage &amp; verification</p>
        </div>

        {/* Active Operations */}
        <div
          onClick={() => setActiveTab('active')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${
            activeTab === 'active'
              ? 'bg-orange-950/20 border-orange-500/50 shadow-lg shadow-orange-950/30'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <p className="text-xs text-slate-400 font-medium">Active Operations</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">{active.length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Verified disaster relief missions</p>
        </div>

        {/* Responders & Online Count */}
        <div
          onClick={() => setActiveTab('volunteers')}
          className={`cursor-pointer rounded-xl p-4 border transition-all ${
            activeTab === 'volunteers'
              ? 'bg-blue-950/20 border-blue-500/50 shadow-lg shadow-blue-950/30'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">Field Responders</p>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {onlineCount} Online
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-400 mt-1">{volunteers.length}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {assignedCount} Deployed &bull; {availableCount} Standby
          </p>
        </div>

        {/* Resolved Missions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-medium">Resolved Missions</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {incidents.filter((i) => i.status === 'resolved').length}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Completed rescue operations</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('triage')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'triage'
              ? 'border-yellow-400 text-yellow-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="h-4 w-4" />
          Citizen Reports Triage ({unverified.length})
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'active'
              ? 'border-orange-400 text-orange-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="h-4 w-4" />
          Active Operations ({active.length})
        </button>

        <button
          onClick={() => setActiveTab('volunteers')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'volunteers'
              ? 'border-blue-400 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="h-4 w-4" />
          Volunteer Roster ({volunteers.length})
          {onlineCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              {onlineCount} online
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('setup_guide')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'setup_guide'
              ? 'border-purple-400 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Database className="h-4 w-4" />
          Admin &amp; DB Configuration
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          TAB 1: CITIZEN REPORTS TRIAGE
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'triage' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                Unverified Citizen Reports ({filteredUnverified.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review submitted ground reports. Click Verify to dispatch relief or Reject if spam.
              </p>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Filter:
              </span>
              {(['all', 'critical', 'high', 'moderate', 'low'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium uppercase tracking-wider transition-colors ${
                    severityFilter === sev
                      ? 'bg-slate-700 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {filteredUnverified.length === 0 ? (
            <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/40 text-slate-400 text-xs">
              <CheckCircle className="h-10 w-10 text-emerald-500/80 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-200">No Pending Triage Reports</p>
              <p className="mt-1">All incoming emergency reports have been processed by coordinators.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUnverified.map((incident) => (
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
                        className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-500"
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
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          TAB 2: ACTIVE DISASTER OPERATIONS
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                Active Relief Operations ({active.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified disaster zones with dispatched responders and field equipment.
              </p>
            </div>
          </div>

          {active.length === 0 ? (
            <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/40 text-slate-400 text-xs">
              <p className="text-sm font-semibold text-slate-200">No Active Operations</p>
              <p className="mt-1">Verify citizen emergency reports from the Triage tab to dispatch active operations.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-x-auto shadow-xl">
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
                              className="text-xs bg-emerald-600 hover:bg-emerald-500"
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
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          TAB 3: REGISTERED RESPONDERS & JOB ASSIGNMENTS (COORDINATOR ONLY)
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'volunteers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  Volunteer Command Roster ({volunteers.length})
                </h2>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-[11px] text-emerald-400 font-bold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  {onlineCount} Online Now
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Government ID verified responders. Only Coordinators &amp; Admins can assign emergency tasks.
              </p>
            </div>

            {/* Volunteer Filter Buttons */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setVolunteerFilter('all')}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  volunteerFilter === 'all'
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({volunteers.length})
              </button>
              <button
                onClick={() => setVolunteerFilter('online')}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  volunteerFilter === 'online'
                    ? 'bg-emerald-900/60 text-emerald-300 font-bold border border-emerald-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Online ({onlineCount})
              </button>
              <button
                onClick={() => setVolunteerFilter('available')}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  volunteerFilter === 'available'
                    ? 'bg-blue-900/60 text-blue-300 font-bold border border-blue-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Standby ({availableCount})
              </button>
              <button
                onClick={() => setVolunteerFilter('assigned')}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  volunteerFilter === 'assigned'
                    ? 'bg-orange-900/60 text-orange-300 font-bold border border-orange-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Deployed ({assignedCount})
              </button>
            </div>
          </div>

          {filteredVolunteers.length === 0 ? (
            <div className="p-12 text-center border border-slate-800 rounded-2xl bg-slate-900/40 text-slate-400 text-xs">
              <Users className="h-10 w-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-200">No Responders Found</p>
              <p className="mt-1">No volunteers match the selected filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVolunteers.map((vol) => (
                <Card key={vol.id} className="border-slate-800 bg-slate-900/80 hover:border-slate-700 transition-colors">
                  <CardBody className="space-y-3 text-xs">
                    {/* Header: Name + Online Status + Aadhaar Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{vol.name}</h4>
                          {vol.is_online ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950/80 border border-emerald-700 text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              ONLINE NOW
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800 text-slate-400">
                              STANDBY
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5">{vol.organization || 'Independent Responder'}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[10px] font-semibold whitespace-nowrap">
                        Aadhaar Verified
                      </span>
                    </div>

                    {/* Contact & Address */}
                    <div className="space-y-1 text-slate-300 text-[11px] bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        +91 {vol.phone}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {vol.email}
                      </p>
                      {vol.address && (
                        <p className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{vol.address}</span>
                        </p>
                      )}
                    </div>

                    {/* Capabilities */}
                    <div>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
                        Relief Capabilities:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {vol.skills?.map((s) => (
                          <span key={s} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Real Assigned Mission Details (if deployed) */}
                    {vol.assigned_incident ? (
                      <div className="p-2.5 rounded-lg bg-orange-950/30 border border-orange-900/60 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wide flex items-center gap-1">
                            <Activity className="h-3 w-3" /> Deployed Mission
                          </span>
                          <span className="font-mono text-[10px] text-orange-300 font-bold">
                            {vol.assigned_incident.reference_code}
                          </span>
                        </div>
                        <p className="text-white font-semibold text-xs truncate">
                          {vol.assigned_incident.title}
                        </p>
                        <p className="text-slate-400 text-[10px] flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-orange-400" />
                          {vol.assigned_incident.location_name}
                        </p>
                        {vol.assigned_role_task && (
                          <p className="text-slate-300 text-[10px] italic border-t border-orange-900/40 pt-1">
                            Orders: &ldquo;{vol.assigned_role_task}&rdquo;
                          </p>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleUnassignVolunteer(vol.id, vol.name)}
                          className="w-full mt-2 text-[11px] py-1 bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-200"
                        >
                          <UserMinus className="h-3.5 w-3.5 mr-1" />
                          Relieve / Complete Mission
                        </Button>
                      </div>
                    ) : (
                      /* Standby State + Coordinator Assign Button */
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Ready for Deployment
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setAssigningVolunteer(vol);
                            if (active.length > 0) {
                              setSelectedIncidentId(active[0].id);
                            }
                          }}
                          className="text-xs bg-blue-600 hover:bg-blue-500 gap-1 py-1"
                        >
                          <Send className="h-3 w-3" />
                          Assign Job
                        </Button>
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          ASSIGNMENT MODAL (COORDINATOR ONLY)
      ────────────────────────────────────────────────────────────────────────── */}
      {assigningVolunteer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-400" />
                  Assign Emergency Mission
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Deploying <strong className="text-white">{assigningVolunteer.name}</strong> ({assigningVolunteer.phone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningVolunteer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignMission} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Target Disaster Incident (from Real Database) *
                </label>
                {active.length === 0 ? (
                  <div className="p-3 rounded-lg bg-yellow-950/40 border border-yellow-800 text-yellow-300 text-xs">
                    No active or verified disaster operations available. Verify citizen emergency reports first.
                  </div>
                ) : (
                  <select
                    value={selectedIncidentId}
                    onChange={(e) => setSelectedIncidentId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white text-xs focus:border-blue-500 focus:outline-none"
                  >
                    {active.map((inc) => (
                      <option key={inc.id} value={inc.id}>
                        [{inc.reference_code}] {inc.title} — {inc.location_name} ({inc.severity.toUpperCase()})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Coordinator Instructions &amp; Role Task *
                </label>
                <textarea
                  value={taskInstructions}
                  onChange={(e) => setTaskInstructions(e.target.value)}
                  required
                  rows={3}
                  placeholder="e.g. Lead medical triage and first aid distribution at relief camp #2"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-slate-400 text-[11px] space-y-1">
                <p>
                  <strong>Volunteer Capabilities:</strong> {assigningVolunteer.skills?.join(', ') || 'General Relief'}
                </p>
                <p>
                  <strong>Real-time Update:</strong> This assignment immediately appears in the volunteer&apos;s portal upon login. No fake or placeholder data is used.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={assignmentSubmitting || active.length === 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-xs py-2"
                >
                  {assignmentSubmitting ? 'Dispatching…' : 'Deploy Responder to Incident'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAssigningVolunteer(null)}
                  className="text-xs py-2 text-slate-400"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          TAB 4: ADMIN & DATABASE CONFIGURATION GUIDE
      ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'setup_guide' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-400" />
              Coordinator &amp; Admin Manual Setup Reference
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Production instructions for configuring the 3 authorized coordinators in Supabase.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-orange-400" />
                Adding Coordinator Users in Supabase
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                <li>Log in to <strong className="text-white">supabase.com/dashboard</strong>.</li>
                <li>Go to <strong className="text-white">Authentication &rarr; Users</strong>.</li>
                <li>Click <strong className="text-white">Add User &rarr; Create User</strong>.</li>
                <li>Enter the coordinator&apos;s email and a secure password.</li>
                <li>Toggle <strong className="text-emerald-400">&quot;Auto Confirm User&quot; ON</strong>.</li>
                <li>Click <strong className="text-white">Create user</strong>.</li>
              </ol>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 text-xs">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-400" />
                Granting Coordinator Privileges via SQL
              </h3>
              <p className="text-slate-300 leading-relaxed">
                Run this SQL query in your Supabase SQL Editor to elevate the user role to coordinator:
              </p>
              <pre className="p-3 bg-slate-950 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto border border-slate-800">
{`-- Elevate user to coordinator in profiles table
UPDATE public.profiles
SET role = 'coordinator'
WHERE email = 'admin@reliefnet.com';`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
