import { cn } from '@/libs/utils/className'; // NOTE: module id: 103746
import SpinnerSvg from '@/components/layout/utils/SpinnerSvg'; // NOTE: module id: 461376
export { InlineLoader } from '@/components/layout/Loader/InlineLoader'; // NOTE: module id: 461376
export { QuantumLoader } from '@/components/layout/Loader/QuantumLoader'; // NOTE: module id: 461376

// NOTE: module id: 461376
export default function Loader({
  size = '40',
  speed = '0.9',
  className,
}) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <SpinnerSvg size={size} speed={speed} />
    </div>
  );
}
