'use client';

import { forwardRef, useState, useRef, useLayoutEffect, useImperativeHandle, Fragment } from 'react'; // NOTE: module id: 271645
import gsap from 'gsap'; // NOTE: module id: 989970
import { useReveal } from '@/hooks/useReveal'; // NOTE: module id: 228414

const AnimatedHeading = forwardRef(function AnimatedHeading(
  { children, as: Component = 'h2', sizeClass = 'text-h2', className = '', trigger = 'scroll', start = 'top 80%', skip = false },
  ref,
) {
  const containerRef = useRef(null);
  const [lines, setLines] = useState(null);

  // Helper to extract plain text from React nodes
  const extractText = (node) => {
    if (node == null || node === false) return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(extractText).join('');
    return '';
  };

  const plainText = extractText(children);

  // Measure and split text into lines based on visual rendering (top bounds)
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const wordNodes = containerRef.current.querySelectorAll('[data-rh-word]');
    if (wordNodes.length === 0) return;

    const measuredLines = [];
    let currentLine = [];
    let lastTop = -Infinity;
    let lastExplicitLine = -1;

    for (const node of wordNodes) {
      const top = node.getBoundingClientRect().top;
      const explicitLine = Number(node.dataset.rhExplicit ?? -1);
      const isNewExplicitLine = explicitLine !== lastExplicitLine && lastExplicitLine !== -1;

      // If the word drops to a new line visually (> 2px difference in top) or explicitly
      if ((lastTop > -Infinity && top - lastTop > 2) || isNewExplicitLine) {
        measuredLines.push(currentLine.join(' '));
        currentLine = [];
      }

      currentLine.push(node.textContent || '');
      lastTop = top;
      lastExplicitLine = explicitLine;
    }

    if (currentLine.length > 0) {
      measuredLines.push(currentLine.join(' '));
    }

    setLines(measuredLines);
  }, [plainText]);

  const { reveal } = useReveal(containerRef, {
    mode: trigger === 'pageEnter' ? 'hero' : trigger === 'manual' ? 'manual' : 'scroll',
    build:
      skip || !lines
        ? null
        : (element) => {
            const tl = gsap.timeline({ paused: true });
            const lineNodes = element.querySelectorAll('[data-rh-line]');

            for (let i = 0; i < lineNodes.length; i++) {
              const brandBlock = lineNodes[i].querySelector('[data-rh-brand]');
              const fgBlock = lineNodes[i].querySelector('[data-rh-fg]');

              if (!brandBlock || !fgBlock) continue;

              gsap.set([brandBlock, fgBlock], { scaleX: 1, transformOrigin: 'right' });

              const delay = 0.12 * i;
              tl.to(fgBlock, { scaleX: 0, duration: 0.5, ease: 'power3.inOut' }, delay);
              tl.to(brandBlock, { scaleX: 0, duration: 0.5, ease: 'power3.inOut' }, delay + 0.1);
            }
            return tl;
          },
    start: start,
    deps: [lines, skip],
  });

  useImperativeHandle(
    ref,
    () => ({
      reveal: reveal,
    }),
    [reveal],
  );

  const combinedClassName = `${sizeClass} ${className}`.trim();

  // Initial render (measuring phase)
  if (!lines) {
    const splitLines = plainText.split('\n');

    return (
      <Component ref={containerRef} className={combinedClassName} style={{ visibility: 'hidden' }}>
        {splitLines.map((line, i) => (
          <Fragment key={i}>
            {i > 0 && <br />}
            {line
              .split(/\s+/)
              .filter(Boolean)
              .map((word, w) => (
                <Fragment key={w}>
                  {w > 0 && ' '}
                  <span data-rh-word={true} data-rh-explicit={i}>
                    {word}
                  </span>
                </Fragment>
              ))}
          </Fragment>
        ))}
      </Component>
    );
  }

  // Final render (animation phase)
  return (
    <Component ref={containerRef} className={combinedClassName}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          <span data-rh-line={true} className="relative inline-block">
            <span className="block whitespace-nowrap">{line}</span>
            {!skip && (
              <Fragment>
                <span data-rh-brand={true} aria-hidden="true" className="absolute -inset-x-[0.1em] -inset-y-[0.1em] block bg-brand" />
                <span data-rh-fg={true} aria-hidden="true" className="absolute -inset-x-[0.1em] -inset-y-[0.1em] block bg-foreground" />
              </Fragment>
            )}
          </span>
        </Fragment>
      ))}
    </Component>
  );
});

export default AnimatedHeading;
