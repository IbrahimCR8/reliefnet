import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30', className)}>
      {icon && (
        <div className="mb-4 text-slate-500">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-200 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 max-w-md mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}
