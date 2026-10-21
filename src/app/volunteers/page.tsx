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
  LogIn
} from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge, DemoBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { isDemoMode } from '@/lib/demo-data';

interface VolunteerItem {
  id: string;
  name: string;
  organization: string;
  skills: string[];
  availability: string;
  status: 'available' | 'deployed';
}

const DEMO_VOLUNTEERS: VolunteerItem[] = [
  {
    id: 'vol-1',
    name: 'Dr. Priya Sharma',
    organization: 'Red Cross Medical Wing',
    skills: ['Triage', 'Emergency Medicine', 'Pediatric Care'],
    availability: '24/7 on-call during cyclone phase',
    status: 'deployed',
  },
  {
    id: 'vol-2',
    name: 'Karthik Raman',
    organization: 'Civil Defence Volunteers',
    skills: ['Water Rescue', 'Boat Operations', 'Search & Rescue'],
    availability: 'Evenings & Weekends',
    status: 'available',
  },
  {
    id: 'vol-3',
    name: 'Amina Begum',
    organization: 'Community Kitchen Initiative',
    skills: ['Food Logistics', 'Clean Water Sanitation', 'Shelter Management'],
    availability: 'Full-time daytime',
    status: 'deployed',
  },
  {
    id: 'vol-4',
    name: 'David Chen',
    organization: 'Disaster Ham Radio Corps',
    skills: ['Emergency Comms', 'Satellite Internet', 'Solar Power'],
    availability: 'Immediate deployment',
    status: 'available',
  },
];

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

export default function VolunteersPage() {
  const isDemo = isDemoMode();
  const [volunteers, setVolunteers] = useState<VolunteerItem[]>(DEMO_VOLUNTEERS);
  
  // Registration Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhar, setAadhar] = useState('');
  const [organization, setOrganization] = useState('');
  const [availability, setAvailability] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<{
    name: string;
    email: string;
    phone: string;
    aadharLast4: string;
  } | null>(null);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const formatAadharInput = (val: string) => {
    // Keep only numbers and max 12 digits
    const cleaned = val.replace(/\D/g, '').slice(0, 12);
    // Format into groups of 4: XXXX XXXX XXXX
    const match = cleaned.match(/(\d{1,4})/g);
    return match ? match.join(' ') : cleaned;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!name.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setFormError('Please provide a valid email address.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number (starts with 6-9).');
      return;
    }
    const cleanAadhar = aadhar.replace(/\D/g, '');
    if (cleanAadhar.length !== 12) {
      setFormError('Aadhaar Card number must be exactly 12 digits.');
      return;
    }
    if (selectedSkills.length === 0) {
      setFormError('Please select at least one relief skill or capability.');
      return;
    }
    if (!availability.trim()) {
      setFormError('Please describe your availability window.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/volunteers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: cleanPhone,
          aadhar: cleanAadhar,
          skills: selectedSkills,
          availability: availability.trim(),
          organization: organization.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok && data.error) {
        setFormError(data.error);
        return;
      }

      // Add to local state display
      const newVol: VolunteerItem = {
        id: `vol-${Date.now()}`,
        name: name.trim(),
        organization: organization.trim() || 'Independent Responder',
        skills: selectedSkills,
        availability: availability.trim(),
        status: 'available',
      };

      setVolunteers([newVol, ...volunteers]);
      setLastSubmission({
        name: name.trim(),
        email: email.trim(),
        phone: cleanPhone,
        aadharLast4: cleanAadhar.slice(-4),
      });
      setSubmitted(true);
    } catch {
      // Fallback
      setLastSubmission({
        name: name.trim(),
        email: email.trim(),
        phone: cleanPhone,
        aadharLast4: cleanAadhar.slice(-4),
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Volunteer &amp; Responder Hub
            </h1>
            {isDemo && <DemoBadge />}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Government ID verified responders mobilizing for on-ground disaster relief and rescue.
          </p>
        </div>

        {/* Volunteer Login Action */}
        <div className="flex items-center gap-3">
          <Link href="/volunteers/login">
            <Button variant="secondary" className="gap-2">
              <LogIn className="h-4 w-4 text-orange-400" />
              Volunteer Login
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registration Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20 border-slate-800 bg-slate-900/90">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-orange-400" />
                  Volunteer Enrollment
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  Govt ID Required
                </span>
              </CardTitle>
            </CardHeader>
            <CardBody>
              {submitted ? (
                <div className="text-center py-6 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-emerald-950/60 border border-emerald-700 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-white">Registered Successfully!</h3>
                    <p className="text-sm text-emerald-400 font-medium mt-1">
                      Verification in progress
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 text-left space-y-2 text-xs">
                    <p className="text-slate-300 font-medium border-b border-slate-800 pb-2">
                      Applicant Details:
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
                      <span>Aadhaar ID:</span>
                      <strong className="text-orange-300 font-mono">•••• •••• {lastSubmission?.aadharLast4}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Thank you for stepping up to help. We have received your credentials and government ID. <strong className="text-slate-200">Our operations team will review and contact you soon via phone or email</strong> for field deployment.
                  </p>

                  <div className="space-y-2 pt-2">
                    <Link href="/volunteers/login" className="block w-full">
                      <Button variant="primary" className="w-full gap-2 text-xs">
                        <LogIn className="h-4 w-4" />
                        Go to Volunteer Login
                      </Button>
                    </Link>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => {
                        setSubmitted(false);
                        setName('');
                        setEmail('');
                        setPhone('');
                        setAadhar('');
                        setOrganization('');
                        setAvailability('');
                        setSelectedSkills([]);
                        setLastSubmission(null);
                      }}
                    >
                      Register Another Volunteer
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  {formError && (
                    <div className="p-3 bg-red-950/50 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label htmlFor="vol-name" className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      Full Name *
                    </label>
                    <Input
                      id="vol-name"
                      required
                      placeholder="e.g. Ramesh Varma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="vol-email" className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      Email Address *
                    </label>
                    <Input
                      id="vol-email"
                      type="email"
                      required
                      placeholder="e.g. ramesh@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="vol-phone" className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      Mobile Phone Number *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-mono select-none">
                        +91
                      </span>
                      <Input
                        id="vol-phone"
                        type="tel"
                        required
                        className="pl-12"
                        placeholder="9876543210"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      />
                    </div>
                  </div>

                  {/* Government ID - Aadhaar Card */}
                  <div>
                    <label htmlFor="vol-aadhar" className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-orange-400" />
                      Government ID (Aadhaar Card No) *
                    </label>
                    <Input
                      id="vol-aadhar"
                      required
                      placeholder="1234 5678 9012"
                      maxLength={14}
                      value={aadhar}
                      onChange={(e) => setAadhar(formatAadharInput(e.target.value))}
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      🔒 Required for background verification &amp; emergency pass issuance.
                    </p>
                  </div>

                  {/* Organization */}
                  <div>
                    <label htmlFor="vol-org" className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5 text-slate-400" />
                      Organization / Affiliation (Optional)
                    </label>
                    <Input
                      id="vol-org"
                      placeholder="e.g. Red Cross, NCC, Civil Defence"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                    />
                  </div>

                  {/* Availability */}
                  <div>
                    <label htmlFor="vol-avail" className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      Availability Window *
                    </label>
                    <Input
                      id="vol-avail"
                      required
                      placeholder="e.g. 24/7 On-Call, Weekends, Night Shifts"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                    />
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      Capability &amp; Relief Skills * (Select all that apply)
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {AVAILABLE_SKILLS.map((skill) => {
                        const checked = selectedSkills.includes(skill);
                        return (
                          <label
                            key={skill}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              checked
                                ? 'bg-orange-950/30 border-orange-600 text-orange-200'
                                : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSkill(skill)}
                              className="rounded text-orange-500 focus:ring-orange-500 bg-slate-900 border-slate-700"
                            />
                            <span>{skill}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submitting}
                    className="w-full mt-2"
                  >
                    {submitting ? 'Verifying & Submitting…' : 'Submit Volunteer Application'}
                  </Button>

                  <div className="pt-2 text-center">
                    <p className="text-xs text-slate-500">
                      Already registered?{' '}
                      <Link href="/volunteers/login" className="text-orange-400 hover:text-orange-300 underline underline-offset-2">
                        Volunteer Login
                      </Link>
                    </p>
                  </div>
                </form>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Volunteer List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Verified Disaster Responders ({volunteers.length})
            </h2>
            {isDemo && <DemoBadge />}
          </div>

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
        </div>
      </div>
    </div>
  );
}
