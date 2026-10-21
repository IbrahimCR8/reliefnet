interface LogoProps {
  className?: string;
  size?: number;
}

export function ReliefNetLogo({ className = 'h-8 w-8', size }: LogoProps) {
  return (
    <svg
      className={className}
      width={size || 36}
      height={size || 36}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ReliefNet Logo"
      role="img"
      style={{ display: 'inline-block' }}
    >
      {/* Shield background */}
      <path
        d="M20 2L4 9v10c0 9.2 6.8 17.8 16 20 9.2-2.2 16-10.8 16-20V9L20 2z"
        fill="#1e3a5f"
        stroke="#3b82f6"
        strokeWidth="1.5"
      />
      {/* Cross symbol */}
      <rect x="17" y="11" width="6" height="18" rx="1.5" fill="#f97316" />
      <rect x="11" y="17" width="18" height="6" rx="1.5" fill="#f97316" />
    </svg>
  );
}
