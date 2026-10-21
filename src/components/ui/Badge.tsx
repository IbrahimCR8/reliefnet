import { cn, SEVERITY_COLORS, STATUS_COLORS } from '@/lib/utils';
import type { IncidentSeverity, IncidentStatus } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        className
      )}
    >
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const labels: Record<IncidentSeverity, string> = {
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    critical: 'Critical',
  };
  return (
    <Badge className={SEVERITY_COLORS[severity]}>
      {severity === 'critical' && '🔴 '}
      {severity === 'high' && '🟠 '}
      {severity === 'moderate' && '🟡 '}
      {severity === 'low' && '🟢 '}
      {labels[severity]}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const labels: Record<IncidentStatus, string> = {
    unverified: 'Unverified',
    verified: 'Verified',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    rejected: 'Rejected',
  };
  return (
    <Badge className={STATUS_COLORS[status]}>
      {labels[status]}
    </Badge>
  );
}

export function DemoBadge() {
  return null;
}
