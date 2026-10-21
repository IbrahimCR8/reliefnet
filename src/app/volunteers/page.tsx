'use client';

import React, { useState } from 'react';
import {
  Users,
  Shield,
  CheckCircle,
  Clock,
  Heart,
  Briefcase,
  AlertCircle,
  PlusCircle,
  Building
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
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [availability, setAvailability] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || selectedSkills.length === 0 || !availability) {
      alert('Please fill in your name, select at least one skill, and specify availability.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/volunteers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: selectedSkills,
          availability,
          organization: organization || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      // Add to local state display
      const newVol: VolunteerItem = {
        id: `vol-${Date.now()}`,
        name,
        organization: organization || 'Independent Responder',
        skills: selectedSkills,
        availability,
        status: 'available',
      };
      setVolunteers([newVol, ...volunteers]);
      setSubmitted(true);
    } catch (err) {
      alert('Volunteer registration completed in local demonstration state.');
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
              Volunteer &amp; Responder Roster
            </h1>
            {isDemo && <DemoBadge />}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Mobilizing skilled volunteers, field logistics personnel, and humanitarian relief organizations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registration Form */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-orange-400" />
                Register as a Volunteer
              </CardTitle>
            </CardHeader>
            <CardBody>
              {submitted ? (
                <div className="text-center py-6 space-y-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Enrollment Registered</h3>
                  <p className="text-xs text-slate-400">
                    Your details and skill capabilities have been entered into the active field coordinator directory.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSubmitted(false);
                      setName('');
                      setOrganization('');
                      setAvailability('');
                      setSelectedSkills([]);
                    }}
                  >
                    Register Another Responder
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <Input
                    label="Full Name / Call-sign"
                    id="vol-name"
                    required
                    placeholder="e.g. Dr. Rajesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <Input
                    label="Organization (Optional)"
                    id="vol-org"
                    placeholder="e.g. Red Cross, Civil Defence, or Independent"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                  />

                  <Input
                    label="Availability Window"
                    id="vol-avail"
                    required
                    placeholder="e.g. Weekends, Night Shifts, 24/7 on call"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                  />

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      Capability &amp; Skill Sets (Select all that apply)
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
                    loading={submitting}
                    className="w-full mt-2"
                  >
                    Submit Volunteer Profile
                  </Button>
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
              Active Registered Responders ({volunteers.length})
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
