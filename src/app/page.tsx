import Link from 'next/link';
import {
  MapPin, AlertTriangle, Users, CheckCircle,
  ArrowRight, Activity, Shield, Globe
} from 'lucide-react';
import { ReliefNetLogo } from '@/components/ui/Logo';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 py-24 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="flex justify-center mb-6">
            <ReliefNetLogo className="h-16 w-16" />
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
            Coordinating Relief,
            <br />
            <span className="text-orange-500">Saving Lives Together</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-8">
            ReliefNet connects communities, volunteers, and relief organizations during floods, cyclones,
            and other disasters — providing a shared platform for incident reporting, resource coordination,
            and real-time response tracking.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/report"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold px-8 py-3.5 text-base transition-colors shadow-lg shadow-orange-900/30"
            >
              <AlertTriangle className="h-5 w-5" />
              Report an Incident
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 hover:border-slate-600 hover:bg-slate-800 text-white font-semibold px-8 py-3.5 text-base transition-colors"
            >
              <MapPin className="h-5 w-5" />
              View Response Map
            </Link>
          </div>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-red-900/60 bg-red-950/40 px-5 py-2 text-sm text-red-300">
            <Shield className="h-4 w-4" />
            For life-threatening emergencies, always call <strong className="mx-1">112</strong> first.
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="border-y border-slate-800 bg-slate-900/40 py-8 px-4">
        <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: 'Platform Status', value: 'Active', icon: Activity, color: 'text-emerald-400' },
            { label: 'Incident Categories', value: '8', icon: AlertTriangle, color: 'text-orange-400' },
            { label: 'Volunteer Skills', value: 'Multi-domain', icon: Users, color: 'text-blue-400' },
            { label: 'Coverage', value: 'Nation-wide', icon: Globe, color: 'text-purple-400' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Everything Relief Needs</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              A unified platform for every stakeholder in a disaster response.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 hover:border-slate-700 transition-colors"
              >
                <div className={`inline-flex rounded-lg p-3 mb-4 ${f.iconBg}`}>
                  <f.icon className={`h-6 w-6 ${f.iconColor}`} />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-slate-900/30 border-y border-slate-800">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">How ReliefNet Works</h2>
            <p className="text-slate-400">From incident to resolution — a coordinated response.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-orange-600/20 border border-orange-600/40 flex items-center justify-center text-lg font-bold text-orange-400 mb-4">
                  {i + 1}
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-xs text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Join the Relief Effort</h2>
          <p className="text-slate-400 mb-8">
            Whether you are affected, a volunteer, or a coordinator — ReliefNet has a role for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 transition-colors"
            >
              <Users className="h-4 w-4" />
              Register as Volunteer
            </Link>
            <Link
              href="/incidents"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-white font-semibold px-8 py-3 transition-colors"
            >
              View Active Incidents
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    title: 'Incident Reporting',
    description: 'Submit detailed reports with photos, location, and severity from any device.',
    icon: AlertTriangle,
    iconBg: 'bg-orange-900/30',
    iconColor: 'text-orange-400',
  },
  {
    title: 'Interactive Response Map',
    description: 'View all incidents on a live map, filter by category and status.',
    icon: MapPin,
    iconBg: 'bg-blue-900/30',
    iconColor: 'text-blue-400',
  },
  {
    title: 'Volunteer Coordination',
    description: 'Register skills and availability, get assigned to incidents, track tasks.',
    icon: Users,
    iconBg: 'bg-emerald-900/30',
    iconColor: 'text-emerald-400',
  },
  {
    title: 'Coordinator Console',
    description: 'Verify incidents, assign volunteers, and monitor the full response.',
    icon: Shield,
    iconBg: 'bg-purple-900/30',
    iconColor: 'text-purple-400',
  },
  {
    title: 'Status Tracking',
    description: 'Follow incidents from report to resolution with a full audit trail.',
    icon: CheckCircle,
    iconBg: 'bg-slate-800',
    iconColor: 'text-slate-400',
  },
  {
    title: 'Photo Evidence',
    description: 'Attach photos via Cloudinary-optimised uploads for visual verification.',
    icon: Activity,
    iconBg: 'bg-red-900/30',
    iconColor: 'text-red-400',
  },
];

const steps = [
  { title: 'Report', description: 'Submit an incident with photo, location, description, and severity.' },
  { title: 'Verify', description: 'Coordinators review and confirm the report before escalation.' },
  { title: 'Coordinate', description: 'Volunteers are assigned and begin response operations.' },
  { title: 'Resolve', description: 'Coordinators mark incidents resolved with full history recorded.' },
];
