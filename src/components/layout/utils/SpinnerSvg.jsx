import { cn } from '@/libs/utils/className'; // NOTE: module id: 103746

// NOTE: module id: 461376
export default function SpinnerSvg({
  size = 40,
  speed = '0.9',
  color = 'var(--brand)',
  className,
}) {
  const numericSize = Number(size) || 40;
  const durationSeconds = Math.min(2, Math.max(0.5, 1 / (Number(speed) || 0.9)));

  return (
    <svg
      role="status"
      aria-label="Loading"
      className={cn('animate-spin', className)}
      width={numericSize}
      height={numericSize}
      viewBox="0 0 24 24"
      fill="none"
      style={{
        color,
        animationDuration: `${durationSeconds}s`,
      }}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="2.5"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
