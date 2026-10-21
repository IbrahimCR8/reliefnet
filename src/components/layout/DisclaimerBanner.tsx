'use client';
import { AlertTriangle, Phone } from 'lucide-react';

export function DisclaimerBanner() {
  return (
    <div className="bg-red-950/70 border-b border-red-900/60 py-2 px-4">
      <div className="mx-auto max-w-7xl flex items-center justify-center gap-2 text-xs text-red-300">
        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
        <span>
          <strong>⚠ PROTOTYPE — NOT AN OFFICIAL EMERGENCY SERVICE.</strong> For immediate danger call{' '}
          <strong>112</strong>
          &nbsp;(India) or your local emergency number.
        </span>
        <Phone className="h-3 w-3 flex-shrink-0" />
      </div>
    </div>
  );
}
