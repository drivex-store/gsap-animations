// NOTE: module id: 991642
// Variable Mapping: r.cn -> cn, n -> animationClassNames, e -> children, a -> className

import { cn } from '@/libs/utils/className'; // NOTE: module id: 103746

const animationClassNames =
  'block transition-transform duration-(--duration-snap) ease-(--ease-expo-out) group-hover:-translate-y-full group-data-[active=true]:-translate-y-full';

export default function SlideText({ children, className }) {
  return (
    <span className={cn('relative block overflow-hidden', className)}>
      <span className={animationClassNames}>{children}</span>
      <span aria-hidden="true" className={cn('absolute left-0 top-full w-full', animationClassNames)}>
        {children}
      </span>
    </span>
  );
}
