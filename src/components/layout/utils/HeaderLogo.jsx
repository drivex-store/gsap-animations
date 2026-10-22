'use client';

// NOTE: module id: 635566
// Variable Mapping: e.className -> className, c -> handleClick, u -> logoIconRef

import { useRef } from 'react'; // NOTE: module id: 271645
import Link from 'next/link'; // NOTE: module id: 522016
import LogoText from '@/assets/logos/LogoText'; // NOTE: module id: 867584
import AnimatedWordmark from '@/components/animations/AnimatedWordmark'; // NOTE: module id: 503433
import { cn } from '@/libs/utils/className'; // NOTE: module id: 103746
import { useTransitionClick } from '@/hooks/useTransitionClick'; // NOTE: module id: 995289
import { t } from '@/libs/utils/i18n'; // NOTE: module id: 398682

export default function Logo({ className }) {
  const handleClick = useTransitionClick('/');
  const logoIconRef = useRef(null);

  return (
    <Link
      href="/"
      onClick={handleClick}
      onMouseEnter={() => logoIconRef.current?.play()}
      aria-label="Annnimate - Home"
      className={cn('flex shrink-0 items-end justify-start gap-8', className)}>
      <span className="flex items-end gap-6">
        <AnimatedWordmark ref={logoIconRef} className="h-[15px] lg:h-[18px]" />
        <LogoText className="h-[15px] w-auto text-foreground lg:h-[18px]" />
      </span>
      <span className="-mb-2 mt-auto text-[9px] text-foreground-muted lg:text-[10px]">{t('common.header.logoByline')}</span>
    </Link>
  );
}
