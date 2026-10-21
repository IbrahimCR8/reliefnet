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
  Activity
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, DemoBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ReliefNetLogo } from '@/components/ui/Logo';
import { isDemoMode } from '@/lib/demo-data';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface VolunteerSession {
  name: string;
  email: string;
  status: 'available' | 'deployed';
  assignedMission?: {
    title: string;
    location: string;
    priority: string;
    instructions: string;
  };
}

export default function VolunteerLoginPage() {
  const isDemo = isDemoMode();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Authenticated state
  const [session, setSession] = useState<VolunteerSession | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.includes('@')) {
      setError('Please provide a valid registered email address.');
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
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(authError.message);
          return;
        }

        setSession({
          name: data.user?.user_metadata?.full_name || email.split('@')[0],
          email,
          status: 'deployed',
          assignedMission: {
            title: 'Flood Evacuation & Medical First Aid Support',
            location: 'Begumpet Zone 4, Hyderabad',
            priority: 'High Priority',
            instructions: 'Report to Field Station #3 coordinator. Bring first-aid kit and high-visibility vest.',
          },
        });
      } else {
        // Demo simulation
        setTimeout(() => {
          setSession({
            name: email.split('@')[0].toUpperCase(),
            email,
            status: 'deployed',
            assignedMission: {
              title: 'Flood Evacuation & Medical First Aid Support',
              location: 'Begumpet Zone 4, Hyderabad',
              priority: 'High Priority',
              instructions: 'Report to Field Station #3 coordinator. Bring first-aid kit and high-visibility vest.',
            },
          });
        }, 500);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    setSession(null);
    setEmail('');
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
            Volunteer Login
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Sign in with your email and password to access the responder portal
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
                <Badge className="bg-emerald-950/60 text-emerald-400 border-emerald-800">
                  Government ID Verified
                </Badge>
              </div>
            </CardHeader>
            <CardBody className="space-y-6 pt-5">
              {/* Credentials badge */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Responder Status:</span>
                  <span className="text-emerald-400 font-semibold uppercase tracking-wider">
                    {session.status === 'deployed' ? 'Active Field Deployment' : 'Ready on Standby'}
                  </span>
                </div>
              </div>

              {/* Assigned Mission */}
              {session.assignedMission && (
                <div className="border border-orange-500/30 bg-orange-950/20 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-orange-400 flex items-center gap-1.5 uppercase tracking-wide">
                      <Activity className="h-4 w-4" />
                      Assigned Mission
                    </span>
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                      {session.assignedMission.priority}
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-white">
                    {session.assignedMission.title}
                  </h3>

                  <p className="text-xs text-slate-300 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                    {session.assignedMission.location}
                  </p>

                  <div className="bg-slate-900/80 p-2.5 rounded text-xs text-slate-400 border border-slate-800">
                    <strong className="text-slate-300 block mb-1">Coordinator Dispatch Instructions:</strong>
                    {session.assignedMission.instructions}
                  </div>
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
          /* Login Form (Email and Password only) */
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
            {error && (
              <div className="mb-5 p-3 bg-red-950/40 border border-red-700/60 rounded-lg flex gap-2 text-sm text-red-300">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-400" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-slate-400" />
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="volunteer@example.com"
                  required
                  disabled={loading}
                  autoComplete="email"
                />
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
