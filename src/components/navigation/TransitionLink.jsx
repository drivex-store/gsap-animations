'use client';

// NOTE: module id: 101836, 101836
// Variable Mapping: r -> TransitionLink, e -> href, t -> onClick, r (prop) -> children, n -> restProps, l -> ref, i -> handleClick

import { forwardRef } from 'react'; // NOTE: module id: 271645
import Link from 'next/link'; // NOTE: module id: 522016
import { useTransitionClick } from '@/hooks/useTransitionClick'; // NOTE: module id: 995289

const TransitionLink = forwardRef(function TransitionLink({ href, onClick, children, ...restProps }, ref) {
  const handleClick = useTransitionClick(href, { onClick });

  return (
    <Link ref={ref} href={href} onClick={handleClick} {...restProps}>
      {children}
    </Link>
  );
});

export default TransitionLink;
