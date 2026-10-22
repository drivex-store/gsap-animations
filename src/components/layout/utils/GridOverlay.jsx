'use client';

import { useEffect, useState } from 'react';

const EXIT_TIMEOUT_MS = 1830;

export function GridOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState(null);

  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'g') {
        event.preventDefault();
        setIsVisible((prevVisible) => {
          setTransitionPhase(prevVisible ? 'out' : 'in');
          return !prevVisible;
        });
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (transitionPhase !== 'out') {
      return;
    }

    const timerId = setTimeout(() => setTransitionPhase(null), EXIT_TIMEOUT_MS);
    return () => clearTimeout(timerId);
  }, [transitionPhase, EXIT_TIMEOUT_MS]);

  const isHidden = !isVisible && transitionPhase !== 'out';

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]" style={{ visibility: isHidden ? 'hidden' : 'visible' }} aria-hidden="true">
      <div className="v2-container h-full">
        <div className="grid grid-cols-12 gap-16 h-full">
          {Array.from({ length: 12 }).map((_, columnIndex) => (
            <div
              key={columnIndex}
              className="h-full origin-top"
              style={{
                background: 'color-mix(in srgb, var(--brand) 10%, transparent)',
                transform: isVisible ? 'scaleY(1)' : 'scaleY(0)',
                transitionProperty: 'transform',
                transitionDuration: '1500ms',
                transitionTimingFunction: 'var(--ease-power3-in-out)',
                transitionDelay: `${30 * columnIndex}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
