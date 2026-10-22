'use client';

// Variable Mapping: f -> LandingDivider / className, e -> orientation / el, i -> thickness, s -> length, o -> color, l -> duration, a -> delay, c -> ease, h -> start, d -> triggerMode, u -> skip, p -> ref, v -> dividerRef, g -> isHorizontal, x -> scaleProp, b -> origin, w -> reveal, y -> dimensionStyle, k -> style

import { forwardRef, useRef, useImperativeHandle, useEffect } from 'react'; // NOTE: module id: 271645
import gsap from 'gsap'; // NOTE: module id: 989970
import { useReveal } from '@/hooks/useReveal'; // NOTE: module id: 228414

// NOTE: module id: 297428
const LandingDivider = forwardRef(function LandingDivider(
  {
    orientation = 'horizontal',
    thickness = 1,
    length = 'full',
    color,
    duration = 0.8,
    delay = 0,
    ease = 'power3.out',
    start = 'top 85%',
    triggerMode = 'scroll',
    skip = false,
    className = '',
  },
  ref
) {
  const dividerRef = useRef(null);
  const isHorizontal = orientation === 'horizontal';
  const scaleProp = isHorizontal ? 'scaleX' : 'scaleY';
  const origin = isHorizontal ? 'left center' : 'top center';

  const { reveal } = useReveal(dividerRef, {
    mode: triggerMode === 'scroll' ? 'scroll' : 'manual',
    build: skip
      ? null
      : (el) =>
          gsap
            .timeline({ paused: true })
            .fromTo(
              el,
              {
                [scaleProp]: 0,
                transformOrigin: origin,
              },
              {
                [scaleProp]: 1,
                duration,
                delay,
                ease,
              }
            ),
    start,
    deps: [isHorizontal, duration, delay, ease, skip],
  });

  useImperativeHandle(ref, () => ({ reveal }), [reveal]);

  useEffect(() => {
    if (triggerMode === 'immediate' && !skip) {
      reveal();
    }
  }, [triggerMode, skip, reveal]);

  const dimensionStyle = isHorizontal
    ? {
        height: `${thickness}px`,
        width: length === 'full' ? '100%' : length,
      }
    : {
        width: `${thickness}px`,
        height: length === 'full' ? '100%' : length,
      };

  const style = color
    ? {
        ...dimensionStyle,
        backgroundColor: color,
      }
    : dimensionStyle;

  return (
    <div
      ref={dividerRef}
      role="separator"
      aria-orientation={orientation}
      className={`landing-divider ${className}`.trim()}
      style={style}
    />
  );
});

export default LandingDivider;
