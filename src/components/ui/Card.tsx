import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn('px-6 py-5 border-b border-slate-800', className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: CardProps) {
  return (
    <div className={cn('px-6 py-5', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: CardProps) {
  return (
    <h2 className={cn('text-lg font-semibold text-white', className)}>
      {children}
    </h2>
  );
}

export function StatCard({
  title,
  value,
  icon,
  color = 'blue',
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: 'blue' | 'orange' | 'red' | 'green' | 'slate' | 'yellow';
  subtitle?: string;
}) {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-900/30',
    orange: 'text-orange-400 bg-orange-900/30',
    red: 'text-red-400 bg-red-900/30',
    green: 'text-emerald-400 bg-emerald-900/30',
    slate: 'text-slate-400 bg-slate-800',
    yellow: 'text-yellow-400 bg-yellow-900/30',
  };

  return (
    <Card>
      <CardBody className="flex items-start gap-4">
        <div className={cn('rounded-lg p-3', colorMap[color])}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
      </CardBody>
    </Card>
  );
}
