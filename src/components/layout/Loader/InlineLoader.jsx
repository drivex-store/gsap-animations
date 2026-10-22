// Variable Mapping: e -> size, r -> speed, o -> color, i -> className

import { cn } from '@/libs/utils/className'; // NOTE: module id: 103746
import SpinnerSvg from '@/components/layout/utils/SpinnerSvg'; // NOTE: module id: 461376

// NOTE: module id: 461376
export function InlineLoader({
  size = '20',
  speed = '0.9',
  color,
  className,
}) {
  return (
    <span className={cn('inline-flex items-center justify-center', className)}>
      <SpinnerSvg size={size} speed={speed} color={color} />
    </span>
  );
}