'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, AlertTriangle, Shield, Users } from 'lucide-react';
import { ReliefNetLogo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/map', label: 'Response Map' },
  { href: '/incidents', label: 'Incidents' },
  { href: '/report', label: 'Report' },
  { href: '/volunteers', label: 'Volunteers' },
  { href: '/coordinator', label: 'Coordinator' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <ReliefNetLogo className="h-8 w-8" />
            <span className="text-xl font-bold text-white tracking-tight">
              Relief<span className="text-orange-500">Net</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'bg-orange-500/10 text-orange-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/report"
              className="flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 transition-colors"
            >
              <AlertTriangle className="h-4 w-4" />
              Report Incident
            </Link>
            <Link
              href="/volunteers/login"
              className="flex items-center gap-1.5 rounded-md border border-slate-700/80 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            >
              <Users className="h-3.5 w-3.5 text-orange-400" />
              Volunteer Login
            </Link>
            <Link
              href="/coordinator"
              className="flex items-center gap-1.5 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-300 hover:text-white hover:bg-blue-500/20 transition-colors"
            >
              <Shield className="h-3.5 w-3.5 text-blue-400" />
              Coordinator Console
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="md:hidden rounded-md p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-orange-500/10 text-orange-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <Link
              href="/report"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <AlertTriangle className="h-4 w-4" />
              Report Incident
            </Link>
            <Link
              href="/volunteers/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300"
            >
              <Users className="h-4 w-4 text-orange-400" />
              Volunteer Login
            </Link>
            <Link
              href="/coordinator"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300"
            >
              <Shield className="h-4 w-4 text-blue-400" />
              Coordinator Console
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
