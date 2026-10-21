import Link from 'next/link';
import { MapPin, Users, Clock, ArrowRight } from 'lucide-react';
import type { Incident } from '@/types';
import { SeverityBadge, StatusBadge } from '@/components/ui/Badge';
import { CATEGORY_ICONS, CATEGORY_LABELS, timeAgo } from '@/lib/utils';

interface IncidentCardProps {
  incident: Incident;
}

export function IncidentCard({ incident }: IncidentCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 hover:border-slate-700 transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label={CATEGORY_LABELS[incident.category] || 'Category'}>
              {CATEGORY_ICONS[incident.category] || '⚠️'}
            </span>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {CATEGORY_LABELS[incident.category] || incident.category}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(incident.created_at)}
            </span>
          </div>
        </div>

        <h3 className="font-semibold text-white text-base mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">
          {incident.title}
        </h3>

        {incident.location_name && (
          <p className="text-xs text-slate-400 flex items-center gap-1 mb-3">
            <MapPin className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />
            <span className="truncate">{incident.location_name}</span>
          </p>
        )}

        <p className="text-sm text-slate-400 line-clamp-2 mb-4">
          {incident.description}
        </p>
      </div>

      <div className="pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <SeverityBadge severity={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
          {incident.people_affected !== null && incident.people_affected !== undefined && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-slate-500" />
              ~{incident.people_affected.toLocaleString()}
            </span>
          )}
        </div>

        <Link
          href={`/incidents/${incident.id}`}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
        >
          View Details
          <ArrowRight className="h-3.5 w-3.5 text-orange-400" />
        </Link>
      </div>
    </div>
  );
}
