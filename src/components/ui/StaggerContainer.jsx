'use client';

// NOTE: module id: 460391
// Variable Mapping: e (prop) -> as / Component, l -> children, s -> className, i -> y, o -> duration, c -> ease, u -> delay, d -> stagger, f -> trigger, m -> start, h -> enabled, x -> onReady, g -> restProps
// p -> containerRef, C -> playReveal

import React, { useRef, useEffect } from 'react'; // NOTE: module id: 271645
import gsap from 'gsap'; // NOTE: module id: 989970
import { useReveal } from '@/hooks/useReveal'; // NOTE: module id: 228414

export default function StaggerContainer({
  as: Component = 'div',
  children,
  className = '',
  y = 16,
  duration = 0.7,
  ease = 'power2.out',
  delay = 0,
  stagger = 0,
  trigger = 'pageEnter',
  start = 'top 85%',
  enabled = true,
  onReady,
  ...restProps
}) {
  const containerRef = useRef(null);

  const { play: playReveal } = useReveal(containerRef, {
    mode: trigger === 'pageEnter' ? 'hero' : trigger === 'manual' ? 'manual' : 'scroll',
    build: enabled
      ? (element) => {
          const targets = stagger > 0 ? Array.from(element.children) : [element];
          return gsap.timeline({ paused: true }).fromTo(
            targets,
            {
              autoAlpha: 0,
              y: y
            },
            {
              autoAlpha: 1,
              y: 0,
              duration: duration,
              ease: ease,
              delay: delay,
              stagger: stagger
            }
          );
        }
      : null,
    start: start,
    deps: [enabled, y, duration, ease, delay, stagger]
  });

  useEffect(() => {
    if (trigger === 'manual' && enabled && onReady) {
      onReady(playReveal);
    }
  }, [trigger, enabled, onReady, playReveal]);

  return (
    <Component ref={containerRef} className={className} {...restProps}>
      {children}
    </Component>
  );
}
