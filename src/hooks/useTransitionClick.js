'use client';

// NOTE: module id: 995289
// Variable Mapping: e -> href, a -> replace, o -> onClick, i -> router, t -> event

import { useContext } from 'react'; // NOTE: module id: 271645
import RouterContext from '@/providers/contexts/RouterContext'; // NOTE: module id: 676040
import { setTransitionTarget } from '@/providers/contexts/RouterContext'; // NOTE: module id: 842365

export function useTransitionClick(href, { replace = false, onClick } = {}) {
  const router = useContext(RouterContext);

  return (event) => {
    onClick?.(event);

    if (
      !event.defaultPrevented &&
      router &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey &&
      event.button !== 1 &&
      typeof href === 'string' &&
      href.startsWith('/')
    ) {
      event.preventDefault();
      setTransitionTarget(href);
      
      if (replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    }
  };
}
