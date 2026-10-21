import Link from 'next/link';
import { ReliefNetLogo } from '@/components/ui/Logo';
import { Heart, Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ReliefNetLogo className="h-7 w-7" />
              <span className="text-lg font-bold text-white">
                Relief<span className="text-orange-500">Net</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs">
              A community-driven disaster response coordination platform. Built for Hacktober HackDays 2026.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Platform
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              {[
                { href: '/report', label: 'Report an Incident' },
                { href: '/map', label: 'Response Map' },
                { href: '/incidents', label: 'All Incidents' },
                { href: '/volunteers', label: 'Volunteer' },
                { href: '/dashboard', label: 'Coordinator Dashboard' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h3 className="text-sm font-semibold text-orange-500 uppercase tracking-wider mb-3">
              ⚠ Safety Notice
            </h3>
            <p className="text-sm text-slate-400">
              ReliefNet is a <strong className="text-slate-300">prototype</strong> built for a hackathon.
              For life-threatening emergencies, always contact your local emergency services first.
            </p>
            <p className="mt-2 text-sm text-slate-500">India: 112 &bull; Fire: 101 &bull; Police: 100</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 flex items-center gap-1">
            Built with <Heart className="h-3 w-3 text-red-500 mx-1" /> for Hacktober HackDays 2026
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 text-sm"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </Link>
            <span className="text-slate-700 text-xs">© 2026 ReliefNet Hackathon Project</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
