'use client';

// NOTE: module id: 771267
// Variable Mapping: e -> ref, u (inside useEffect) -> element, t -> observer, e (inside callback) -> entry, u (inside forEach) -> animation

import { useEffect } from 'react'; // NOTE: module id: 271645

export function usePauseOffscreen(ref) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      element.getAnimations({ subtree: true }).forEach((animation) => {
        if (entry.isIntersecting) {
          animation.play();
        } else {
          animation.pause();
        }
      });
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);
}
