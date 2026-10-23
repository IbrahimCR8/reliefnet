'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Shield,
  Mail,
  Lock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  LogOut,
  MapPin,
  Activity,
  IdCard,
  PhoneCall,
  Clock,
  Phone
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ReliefNetLogo } from '@/components/ui/Logo';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface RealMission {
  incident_id: string;
  reference_code: string;
  title: string;
  category: string;
  severity: string;
  location_name: string;
  description: string;
  assigned_role_task: string;
  assigned_at?: string;
  assigned_by_email?: string;
}

interface VolunteerSession {
  name: string;
  email: string;
  phone?: string;
  volunteer_id_code?: string | null;
  verification_status?: string;
  verification_notes?: string | null;
  status: 'available' | 'deployed';
  mission?: RealMission | null;
}

export default function VolunteerLoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Authenticated state
  const [session, setSession] = useState<VolunteerSession | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const rawId = identifier.trim();
    if (!rawId) {
      setError('Please provide your registered email address or coordinator-issued Volunteer ID.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        let targetEmail = rawId;

        // If the user entered a Volunteer ID instead of an email, look up their registered email
        if (!rawId.includes('@')) {
          const resolveRes = await fetch(`/api/volunteers/my-mission?identifier=${encodeURIComponent(rawId)}`);
          const resolveData = await resolveRes.json().catch(() => ({}));
          if (resolveData?.volunteer?.email) {
            targetEmail = resolveData.volunteer.email;
          } else {
            setError(`No active record found for Volunteer ID "${rawId}". Please verify your Volunteer ID or sign in with your registered email.`);
            setLoading(false);
            return;
          }
        }

        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password,
        });

        if (authError) {
          setError(authError.message);
          return;
        }

        // Strict RBAC: Admins and Coordinators cannot log in as Volunteer!
        const roleRes = await fetch('/api/auth/verify-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, userId: data?.user?.id }),
        });
        const roleData = await roleRes.json().catch(() => ({}));

        if (roleData?.role === 'admin' || roleData?.role === 'coordinator') {
          await supabase.auth.signOut();
          setError(
            `Access Denied: Account (${targetEmail}) is registered as an ${roleData.role.toUpperCase()}. Administrators and Coordinators cannot log in as Volunteers. Please sign in via the Coordinator Console at /coordinator.`
          );
          setLoading(false);
          return;
        }

        // 1. Mark presence online
        fetch('/api/volunteers/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, is_online: true }),
        }).catch(() => {});

        // 2. Fetch real mission and profile details
        const missionRes = await fetch(`/api/volunteers/my-mission?email=${encodeURIComponent(targetEmail)}`);
        const missionData = await missionRes.json().catch(() => ({}));
        const volProfile = missionData?.volunteer;

        setSession({
          name: volProfile?.name || data.user?.user_metadata?.full_name || targetEmail.split('@')[0],
          email: targetEmail,
          phone: volProfile?.phone,
          volunteer_id_code: volProfile?.volunteer_id_code || null,
          verification_status: volProfile?.verification_status || 'pending_review',
          verification_notes: volProfile?.verification_notes || null,
          status: missionData?.has_mission && missionData?.mission ? 'deployed' : 'available',
          mission: missionData?.has_mission ? missionData.mission : null,
        });
      } else {
        setError('Supabase authentication is not configured in .env.local.');
      }
    } catch {
      setError('An unexpected error occurred. Please verify your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    if (session?.email) {
      fetch('/api/volunteers/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.email, is_online: false }),
      }).catch(() => {});
    }
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        supabase.auth.signOut();
      } catch {
        // Ignored
      }
    }
    setSession(null);
    setIdentifier('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ReliefNetLogo className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Users className="h-6 w-6 text-blue-400" />
            Volunteer Portal Login
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Sign in with your Email or Coordinator-issued Volunteer ID and password
          </p>
        </div>

        {session ? (
          /* Logged In Volunteer Dashboard */
          <Card className="border-slate-800 bg-slate-900 shadow-2xl">
            <CardHeader className="border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                    Welcome, {session.name}
                  </CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">{session.email}</p>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-[11px] text-emerald-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Online Now
                </span>
              </div>
            </CardHeader>
            <CardBody className="space-y-6 pt-5">
              {/* Official Volunteer ID Card Banner */}
              <div className="relative rounded-xl border border-blue-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/40 p-4 shadow-xl">
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <IdCard className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase block">
                        ReliefNet Responder Pass
                      </span>
                      <h3 className="font-bold text-white text-base leading-tight">
                        {session.name}
                      </h3>
                    </div>
                  </div>

                  {session.volunteer_id_code ? (
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest block">Volunteer ID</span>
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-700/80">
                        {session.volunteer_id_code}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800 font-medium">
                      Pending ID Issuance
                    </span>
                  )}
                </div>

                <div className="pt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Contact Email</span>
                    <span className="text-slate-200 font-medium truncate block">{session.email}</span>
                  </div>
                  {session.phone && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">Mobile</span>
                      <span className="text-slate-200 font-medium">+91 {session.phone}</span>
                    </div>
                  )}
                </div>

                {/* Verification Status Banner */}
                <div className="mt-3 pt-3 border-t border-slate-800/80">
                  {session.verification_status === 'verified' ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-xs">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      <span className="font-medium">
                        Identity &amp; Interview Verified by Coordinator
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/60 text-amber-300 text-xs">
                      <Clock className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-semibold">Pending Coordinator Verification Call</strong>
                        <p className="text-[10px] text-amber-200/80 mt-0.5 leading-relaxed">
                          A coordinator will call your registered phone number (+91 {session.phone || '...'}) to conduct a brief interview and issue your official Volunteer ID.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Real Assigned Mission OR Clean Standby State */}
              {session.mission ? (
                <div className="border border-orange-500/30 bg-orange-950/20 rounded-xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-orange-400 flex items-center gap-1.5 uppercase tracking-wide">
                      <Activity className="h-4 w-4" />
                      Official Mission Assignment
                    </span>
                    <span className="px-2 py-0.5 rounded bg-orange-900/60 text-orange-300 border border-orange-700 text-[10px] font-bold">
                      {session.mission.reference_code}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">
                      {session.mission.title}
                    </h3>
                    <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                      {session.mission.location_name}
                    </p>
                  </div>

                  <div className="bg-slate-900/90 p-3 rounded-lg text-xs text-slate-300 border border-slate-800 space-y-1.5">
                    <strong className="text-slate-200 block text-[11px] uppercase tracking-wider font-semibold">
                      Coordinator Deployment Instructions:
                    </strong>
                    <p className="leading-relaxed">
                      {session.mission.assigned_role_task}
                    </p>
                    {session.mission.assigned_by_email && (
                      <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                        Dispatched by: {session.mission.assigned_by_email}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/incidents/${session.mission.incident_id}`}
                    className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-medium"
                  >
                    View Incident Details &rarr;
                  </Link>
                </div>
              ) : (
                <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-6 text-center space-y-2">
                  <div className="h-10 w-10 bg-slate-800/80 rounded-full flex items-center justify-center mx-auto text-blue-400">
                    <Shield className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Ready on Standby</h4>
                  <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                    No missions currently assigned. Only verified coordinators and admins can assign relief tasks to volunteers. Once assigned, your real mission briefing will appear here in real time.
                  </p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="space-y-3 pt-2">
                <Link href="/map" className="block w-full">
                  <Button variant="primary" className="w-full gap-2 text-xs">
                    <MapPin className="h-4 w-4" />
                    Open Response GIS Map
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="w-full gap-2 text-xs text-slate-400 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out from Portal
                </Button>
              </div>
            </CardBody>
          </Card>
        ) : (
          /* Login Form (Email OR Volunteer ID + Password) */
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
            {error && (
              <div className="mb-5 p-3 bg-red-950/40 border border-red-700/60 rounded-lg flex gap-2 text-sm text-red-300">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-400" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-slate-400" />
                    Email Address or Volunteer ID
                  </span>
                  <span className="text-xs text-blue-400">e.g. RN-VOL-2026-001</span>
                </label>
                <Input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="volunteer@example.com or RN-VOL-XXXX"
                  required
                  disabled={loading}
                  autoComplete="username"
                />
                <p className="text-xs text-slate-500 mt-1">
                  You can sign in with your registered email or the manual Volunteer ID code given to you by the coordinator.
                </p>
              </div>

              <div>
                <label htmlFor="pass" className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-slate-400" />
                  Password
                </label>
                <Input
                  id="pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full gap-2"
                variant="primary"
              >
                {loading ? 'Signing In…' : 'Sign In as Volunteer'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2 text-sm pt-2 border-t border-slate-800">
              <p className="text-slate-400 text-xs">
                Need to register with Government ID?{' '}
                <Link href="/volunteers" className="text-orange-400 hover:text-orange-300 underline underline-offset-2">
                  Volunteer Register
                </Link>
              </p>
              <p>
                <Link href="/" className="text-slate-500 hover:text-slate-300 transition-colors text-xs inline-block mt-2">
                  ← Back to homepage
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
