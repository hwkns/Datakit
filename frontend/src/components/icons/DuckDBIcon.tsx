interface DuckDBIconProps {
  size?: number;
  className?: string;
}

export function DuckDBIcon({ size = 16, className = "" }: DuckDBIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Database cylinders */}
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6a8 3 0 0 0 16 0V6" />
      <line x1="12" y1="6" x2="12" y2="12" />
      
      {/* Duck head and bill */}
      <path d="M12 15a4 4 0 0 0 4 4h1" />
      <path d="M17 19l2-2-2-2" />
      <path d="M8 15a4 4 0 0 1-4 4" />
      
      {/* Duck eye */}
      <circle cx="10" cy="8" r="1" />
    </svg>
  );
}