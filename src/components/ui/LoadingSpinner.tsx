import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto mb-3" />
        <p className="text-sm text-slate-400">Loading ReliefNet data...</p>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
      <div className="skeleton h-4 w-28" />
      <div className="skeleton h-5 w-full" />
      <div className="skeleton h-4 w-3/4" />
      <div className="flex gap-2 pt-2">
        <div className="skeleton h-6 w-16" />
        <div className="skeleton h-6 w-20" />
      </div>
    </div>
  );
}
