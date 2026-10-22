'use client';

// NOTE: module id: 400545
// Variable Mapping: e -> className, r -> containerRef

import { useRef } from 'react'; // NOTE: module id: 271645
import { usePauseOffscreen } from '@/hooks/usePauseOffscreen'; // NOTE: module id: 771267
import { cn } from '@/libs/utils/className'; // NOTE: module id: 103746

export default function StatusIndicator({ className = 'size-8' }) {
  const containerRef = useRef(null);

  usePauseOffscreen(containerRef);

  return (
    <span
      ref={containerRef}
      aria-hidden="true"
      className={cn('relative inline-flex', className)}
    >
      <span className="absolute inset-0 animate-ping bg-brand opacity-60" />
      <span className="relative block size-full bg-brand" />
    </span>
  );
}
