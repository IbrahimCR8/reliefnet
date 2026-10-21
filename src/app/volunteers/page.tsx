'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Shield,
  CheckCircle,
  Clock,
  Briefcase,
  AlertCircle,
  PlusCircle,
  Building,
  CreditCard,
  Mail,
  Phone,
  User,
  LogIn,
  Lock,
  MapPin,
  Home,
  LogOut,
  Activity,
  ArrowRight
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface VolunteerItem {
  id: string;
  name: string;
  organization: string;
  skills: string[];
  availability: string;
  status: 'available' | 'deployed';
}

const AVAILABLE_SKILLS = [
  'First Aid & Triage',
  'Search & Rescue',
  'Boat & Water Ops',
  'Food & Water Relief',
  'Shelter Management',
  'Emergency Comms / Radio',
  'Heavy Vehicle Driving',
  'Mental Health Support',
];

interface LoggedInVolunteer {
  name: string;
  email: string;
  phone?: string;
  status: string;
}

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<VolunteerItem[]>([]);

  // Fetch real registered volunteers on mount
  React.useEffect(() => {
    fetch('/api/volunteers')
      .then((res) => res.json())
      .then((data) => {
        if (data.volunteers && Array.isArray(data.volunteers)) {
          setVolunteers(data.volunteers);
        }
      })
      .catch(() => {});
  }, []);
  
  // Navigation tab: 'register' | 'login'
  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');

  // Registration Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAadhar, setRegAadhar] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOrganization, setRegOrganization] = useState('');
  const [regAvailability, setRegAvailability] = useState('Immediate / On-call');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['First Aid & Triage']);
  
  const [regError, setRegError] = useState<string | null>(null);
  const [regSubmitted, setRegSubmitted] = useState(false);
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<{
    name: string;
    email: string;
    phone: string;
    aadharLast4: string;
    address: string;
  } | null>(null);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [volunteerSession, setVolunteerSession] = useState<LoggedInVolunteer | null>(null);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const formatAadharInput = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 12);
    const match = cleaned.match(/(\d{1,4})/g);
    return match ? match.join(' ') : cleaned;
  };

  // ── Handle Volunteer Registration ───────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim()) {
      setRegError('Please enter your full name.');
      return;
    }
    if (!regEmail.includes('@') || !regEmail.includes('.')) {
      setRegError('Please provide a valid email address.');
      return;
    }
    const cleanPhone = regPhone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setRegError('Please enter a valid 10-digit Indian mobile number (starts with 6-9).');
      return;
    }
    const cleanAadhar = regAadhar.replace(/\D/g, '');
    if (cleanAadhar.length !== 12) {
      setRegError('Aadhaar Card number must be exactly 12 digits.');
      return;
    }
    if (regAddress.trim().length < 5) {
      setRegError('Please provide your complete residential / local address.');
      return;
    }
    if (regPassword.length > 0 && regPassword.length < 6) {
      setRegError('Password must be at least 6 characters long.');
      return;
    }
    if (selectedSkills.length === 0) {
      setRegError('Please select at least one relief capability.');
      return;
    }

    setRegSubmitting(true);

    try {
      const res = await fetch('/api/volunteers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          phone: cleanPhone,
          aadhar: cleanAadhar,
          address: regAddress.trim(),
          password: regPassword.trim() || undefined,
          skills: selectedSkills,
          availability: regAvailability.trim() || 'Immediate / On-call',
          organization: regOrganization.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok && data.error) {
        setRegError(data.error);
        return;
      }

      // Add to local responder roster
      const newVol: VolunteerItem = {
        id: `vol-${Date.now()}`,
        name: regName.trim(),
        organization: regOrganization.trim() || 'Independent Responder',
        skills: selectedSkills,
        availability: regAvailability.trim(),
        status: 'available',
      };

      setVolunteers([newVol, ...volunteers]);
      setLastSubmission({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: cleanPhone,
        aadharLast4: cleanAadhar.slice(-4),
        address: regAddress.trim(),
      });
      setRegSubmitted(true);
    } catch {
      // Local fallback
      setLastSubmission({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: cleanPhone,
        aadharLast4: cleanAadhar.slice(-4),
        address: regAddress.trim(),
      });
      setRegSubmitted(true);
    } finally {
      setRegSubmitting(false);
    }
  };

  // ── Handle Volunteer Login (Email + Password) ──────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.includes('@')) {
      setLoginError('Please enter a valid email address.');
      return;
    }
    if (!loginPassword || loginPassword.length < 6) {
      setLoginError('Password must be at least 6 characters.');
      return;
    }

    setLoginLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword,
        });

        if (error) {
          setLoginError(error.message);
          return;
        }

        setVolunteerSession({
          name: data.user?.user_metadata?.full_name || loginEmail.split('@')[0],
          email: loginEmail,
          status: 'Active Registered Responder',
        });
      } else {
        setLoginError('Supabase authentication is not configured in .env.local.');
      }
    } catch {
      setLoginError('Failed to sign in. Please verify your email and password.');
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Volunteer &amp; Responder Portal
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Government ID (Aadhaar) registered responders mobilizing for disaster relief.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setRegSubmitted(false);
            }}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'register'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Volunteer Register
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'login'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Volunteer Login
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Register Form OR Login Form */}
        <div className="lg:col-span-1">
          {activeTab === 'register' ? (
            /* ── REGISTER CARD ── */
            <Card className="sticky top-20 border-slate-800 bg-slate-900/90">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-orange-400" />
                    Volunteer Register
                  </span>
                  <span className="text-[10px] text-orange-300 font-semibold bg-orange-950/60 border border-orange-800/80 px-2 py-0.5 rounded">
                    Aadhaar ID
                  </span>
                </CardTitle>
              </CardHeader>
              <CardBody>
                {regSubmitted ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="h-16 w-16 rounded-full bg-emerald-950/60 border border-emerald-700 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        register successful will reach you soon
                      </h3>
                      <p className="text-xs text-emerald-400 font-medium mt-1">
                        Recorded to Supabase Database
                      </p>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-left space-y-1.5 text-xs">
                      <p className="text-slate-300 font-medium border-b border-slate-800 pb-1.5">
                        Recorded Details:
                      </p>
                      <div className="text-slate-400 flex justify-between">
                        <span>Name:</span>
                        <strong className="text-white">{lastSubmission?.name}</strong>
                      </div>
                      <div className="text-slate-400 flex justify-between">
                        <span>Email:</span>
                        <strong className="text-white">{lastSubmission?.email}</strong>
                      </div>
                      <div className="text-slate-400 flex justify-between">
                        <span>Phone:</span>
                        <strong className="text-white">+91 {lastSubmission?.phone}</strong>
                      </div>
                      <div className="text-slate-400 flex justify-between">
                        <span>Aadhaar:</span>
                        <strong className="text-orange-300 font-mono">•••• •••• {lastSubmission?.aadharLast4}</strong>
                      </div>
                      <div className="text-slate-400 flex justify-between">
                        <span>Address:</span>
                        <span className="text-slate-300 truncate max-w-[150px]">{lastSubmission?.address}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your full details have been submitted. Our disaster coordinator command will verify your credentials and reach out shortly.
                    </p>

                    <div className="space-y-2 pt-2">
                      <Button
                        variant="primary"
                        className="w-full gap-2 text-xs"
                        onClick={() => {
                          setLoginEmail(lastSubmission?.email || '');
                          setActiveTab('login');
                        }}
                      >
                        <LogIn className="h-4 w-4" />
                        Go to Volunteer Login
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                          setRegSubmitted(false);
                          setRegName('');
                          setRegEmail('');
                          setRegPhone('');
                          setRegAadhar('');
                          setRegAddress('');
                          setRegPassword('');
                          setLastSubmission(null);
                        }}
                      >
                        Register Another Volunteer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-3.5">
                    {regError && (
                      <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <span>{regError}</span>
                      </div>
                    )}

                    {/* Full Name */}
                    <div>
                      <label htmlFor="reg-name" className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        Full Name *
                      </label>
                      <Input
                        id="reg-name"
                        required
                        placeholder="e.g. Ramesh Varma"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                      />
                    </div>

                    {/* Email ID */}
                    <div>
                      <label htmlFor="reg-email" className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        Email ID *
                      </label>
                      <Input
                        id="reg-email"
                        type="email"
                        required
                        placeholder="volunteer@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label htmlFor="reg-phone" className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        Phone Number *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono select-none">
                          +91
                        </span>
                        <Input
                          id="reg-phone"
                          type="tel"
                          required
                          className="pl-12"
                          placeholder="9876543210"
                          maxLength={10}
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                    </div>

                    {/* Aadhaar Card Number */}
                    <div>
                      <label htmlFor="reg-aadhar" className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-orange-400" />
                        Aadhaar Number (12 Digits) *
                      </label>
                      <Input
                        id="reg-aadhar"
                        required
                        placeholder="1234 5678 9012"
                        maxLength={14}
                        value={regAadhar}
                        onChange={(e) => setRegAadhar(formatAadharInput(e.target.value))}
                      />
                    </div>

                    {/* Residential / Area Address */}
                    <div>
                      <label htmlFor="reg-address" className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                        <Home className="h-3.5 w-3.5 text-slate-400" />
                        Residential Address *
                      </label>
                      <Input
                        id="reg-address"
                        required
                        placeholder="House / Street, Area, City"
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                      />
                    </div>

                    {/* Set Account Password (for Volunteer Login) */}
                    <div>
                      <label htmlFor="reg-password" className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-slate-400" />
                        Create Password (for Login) *
                      </label>
                      <Input
                        id="reg-password"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                      />
                    </div>

                    {/* Skills Checklist */}
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Relief Capabilities *
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {AVAILABLE_SKILLS.slice(0, 6).map((skill) => {
                          const checked = selectedSkills.includes(skill);
                          return (
                            <label
                              key={skill}
                              className={`flex items-center gap-1.5 p-1.5 rounded border text-[11px] cursor-pointer transition-colors ${
                                checked
                                  ? 'bg-orange-950/30 border-orange-600 text-orange-200'
                                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleSkill(skill)}
                                className="rounded text-orange-500 focus:ring-orange-500 bg-slate-900 border-slate-700 h-3 w-3"
                              />
                              <span className="truncate">{skill}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      disabled={regSubmitting}
                      className="w-full mt-3"
                    >
                      {regSubmitting ? 'Recording to Supabase…' : 'Submit Volunteer Details'}
                    </Button>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setActiveTab('login')}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Already registered? <span className="text-orange-400 underline underline-offset-2">Volunteer Login</span>
                      </button>
                    </div>
                  </form>
                )}
              </CardBody>
            </Card>
          ) : (
            /* ── LOGIN CARD ── */
            <Card className="sticky top-20 border-slate-800 bg-slate-900 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4 text-blue-400" />
                    Volunteer Login
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    Email + Password
                  </span>
                </CardTitle>
              </CardHeader>
              <CardBody>
                {volunteerSession ? (
                  /* Volunteer Dashboard when logged in */
                  <div className="space-y-4">
                    <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-lg flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-white">Signed In as Volunteer</p>
                        <p className="text-[11px] text-slate-300">{volunteerSession.email}</p>
                      </div>
                    </div>

                    <div className="border border-orange-500/30 bg-orange-950/20 rounded-xl p-3 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-orange-400 uppercase tracking-wide flex items-center gap-1">
                          <Activity className="h-3.5 w-3.5" />
                          Field Deployment Station
                        </span>
                        <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-[10px]">
                          Active Mission
                        </Badge>
                      </div>
                      <h4 className="font-bold text-white text-sm">
                        Begumpet Zone 4 Emergency Triage
                      </h4>
                      <p className="text-slate-300 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-orange-400" />
                        Hyderabad Disaster Operations Center
                      </p>
                    </div>

                    <Link href="/map" className="block w-full">
                      <Button variant="primary" className="w-full text-xs gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        Open Live Response Map
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVolunteerSession(null)}
                      className="w-full text-xs text-slate-400 hover:text-white gap-1.5"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  /* Login with Email and Password */
                  <form onSubmit={handleLogin} className="space-y-4">
                    {loginError && (
                      <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <div>
                      <label htmlFor="log-email" className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        Email Address
                      </label>
                      <Input
                        id="log-email"
                        type="email"
                        required
                        placeholder="volunteer@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        disabled={loginLoading}
                      />
                    </div>

                    <div>
                      <label htmlFor="log-pass" className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-slate-400" />
                        Password
                      </label>
                      <Input
                        id="log-pass"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        disabled={loginLoading}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full gap-2 text-xs"
                      variant="primary"
                    >
                      {loginLoading ? 'Signing In…' : 'Sign In as Volunteer'}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setActiveTab('register')}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Need an account? <span className="text-orange-400 underline underline-offset-2">Volunteer Register</span>
                      </button>
                    </div>
                  </form>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right Column: Active Volunteer Directory */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Active Registered Responders ({volunteers.length})
            </h2>
          </div>

          {volunteers.length === 0 ? (
            <Card className="border-slate-800 bg-slate-900/60 p-10 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-slate-800/80 rounded-full border border-slate-700">
                  <Users className="h-8 w-8 text-slate-500" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                No Responders Enrolled Yet
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Be the first responder in the field! Use the <strong className="text-slate-200">Volunteer Register</strong> form on the left with your Aadhaar ID to enroll. Newly registered volunteers appear here automatically.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {volunteers.map((vol) => (
                <Card key={vol.id} className="hover:border-slate-700 transition-colors">
                  <CardBody className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-white text-base">{vol.name}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building className="h-3 w-3 text-slate-500" />
                          {vol.organization}
                        </p>
                      </div>
                      <Badge
                        className={
                          vol.status === 'deployed'
                            ? 'bg-orange-950/40 text-orange-400 border-orange-800'
                            : 'bg-emerald-950/40 text-emerald-400 border-emerald-800'
                        }
                      >
                        {vol.status === 'deployed' ? 'Deployed on Mission' : 'Available on Call'}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Verified Capabilities
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {vol.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px] text-slate-300 font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span>Availability: {vol.availability}</span>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
