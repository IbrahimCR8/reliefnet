import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-300">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'w-full rounded-md border bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 transition-colors',
          error
            ? 'border-red-500 focus:border-red-400 focus:ring-red-400/20'
            : 'border-slate-700 focus:border-orange-500 focus:ring-orange-500/20',
          'focus:outline-none focus:ring-2',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-300">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          'w-full rounded-md border bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 transition-colors resize-y min-h-[100px]',
          error
            ? 'border-red-500 focus:border-red-400 focus:ring-red-400/20'
            : 'border-slate-700 focus:border-orange-500 focus:ring-orange-500/20',
          'focus:outline-none focus:ring-2',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, hint, options, className, id, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-300">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <select
        id={id}
        className={cn(
          'w-full rounded-md border bg-slate-800 px-3 py-2 text-sm text-white transition-colors',
          error
            ? 'border-red-500 focus:border-red-400 focus:ring-red-400/20'
            : 'border-slate-700 focus:border-orange-500 focus:ring-orange-500/20',
          'focus:outline-none focus:ring-2',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
