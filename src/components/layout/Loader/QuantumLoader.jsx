'use client';

// Variable Mapping: r -> React, a -> size, o -> speed, i -> color, u -> className, e -> ldrsModule

import { useEffect } from 'react'; // NOTE: module id: 271645
import { cn } from '@/libs/utils/className'; // NOTE: module id: 103746

// NOTE: module id: 461376
export function QuantumLoader({ size = '45', speed = '1.75', color, className }) {
  useEffect(() => {
    import('ldrs') // NOTE: module id: 751841
      .then((ldrsModule) => ldrsModule.quantum.register())
      .catch(() => {});
  }, []);

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <l-quantum size={size} speed={speed} color={color || 'rgb(168, 85, 247)'} />
    </div>
  );
}
