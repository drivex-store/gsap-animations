'use client';

// NOTE: module id: 218091
// Variable Mapping:
// e -> children, s -> type, l -> duration, c -> delay, p -> ease, u -> mask, d -> stagger
// h -> from, f -> animationProps, g -> triggerMode, m -> start, w -> toggleActions, y -> scrollTrigger
// C -> autoSplit, x -> deepSlice, I -> linesClass, v -> wordsClass, b -> charsClass, N -> aria
// S -> propIndex, k -> onComplete, j -> onSplitCallback, $ -> onReady, E -> className, R -> tag (Component), A -> revertOnComplete
// _ -> containerRef, M -> splitTextRef, O -> tweenRef, P -> pageEnterTriggeredRef, B -> fontsReady, F -> setFontsReady

import { useRef, useState, useEffect } from 'react'; // NOTE: module id: 271645
import { useAnimation, usePageEnterAnimation } from '@/providers/AnimationProvider'; // NOTE: module id: 488463
import { gsap, useGSAP, ScrollTrigger, SplitText } from '@/libs/utils/vendor';

export default function AnimatedText({
  children,
  type,
  duration = 0.8,
  delay = 0,
  ease = 'power4.out',
  mask,
  stagger = 0.05,
  from,
  animationProps,
  triggerMode = 'scroll',
  start,
  toggleActions,
  scrollTrigger,
  autoSplit = true,
  deepSlice = true,
  linesClass,
  wordsClass,
  charsClass,
  aria = 'none',
  propIndex = false,
  onComplete,
  onSplitCallback,
  onReady,
  className = '',
  tag: Component = 'div',
  revertOnComplete = false,
  ...restProps
}) {
  const containerRef = useRef(null);
  const splitTextRef = useRef(null);
  const tweenRef = useRef(null);
  const pageEnterTriggeredRef = useRef(false);
  const [fontsReady, setFontsReady] = useState(false);

  // Wait for fonts to load before splitting text to ensure accurate layout calculations
  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  let resolvedType = type;
  let resolvedMask = mask;

  if (resolvedType === undefined && resolvedMask === undefined) {
    resolvedType = 'lines';
    resolvedMask = 'lines';
  }

  const splitType = resolvedType || (resolvedMask ? `${resolvedMask},words` : 'lines,words,chars');
  const animationFromProps = animationProps || from || { opacity: 0, y: 30 };

  const { getHasTriggered } = useAnimation();

  const markAnimationStarted = () => {
    if (containerRef.current) {
      containerRef.current.setAttribute('data-animation-started', 'true');
    }
  };

  usePageEnterAnimation(
    () => {
      pageEnterTriggeredRef.current = true;
      markAnimationStarted();
      if (tweenRef.current) {
        tweenRef.current.restart(true);
      }
    },
    [],
    'AnimatedText',
    triggerMode === 'pageEnter',
  );

  useEffect(() => {
    if (triggerMode === 'pageEnter' && fontsReady && tweenRef.current && getHasTriggered() && pageEnterTriggeredRef.current) {
      const timeoutId = setTimeout(() => {
        if (tweenRef.current) {
          markAnimationStarted();
          tweenRef.current.restart(true);
        }
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [triggerMode, fontsReady, getHasTriggered]);

  useGSAP(
    () => {
      if (!containerRef.current || !fontsReady) return;

      const splitConfig = {
        type: splitType,
        aria: aria,
        deepSlice: deepSlice,
        propIndex: propIndex,
        autoSplit: autoSplit,
        ...(resolvedMask && { mask: resolvedMask }),
        ...(linesClass && { linesClass: linesClass }),
        ...(wordsClass && { wordsClass: wordsClass }),
        ...(charsClass && { charsClass: charsClass }),
        onSplit: (splitInstance) => {
          splitTextRef.current = splitInstance;
          if (onSplitCallback) onSplitCallback(splitInstance);

          const typesArray = splitType.split(',').map((t) => t.trim());
          let targetElements = [];

          if (typesArray.includes('chars') && splitInstance.chars?.length > 0) {
            targetElements = splitInstance.chars;
          } else if (typesArray.includes('words') && splitInstance.words?.length > 0) {
            targetElements = splitInstance.words;
          } else if (typesArray.includes('lines') && splitInstance.lines?.length > 0) {
            targetElements = splitInstance.lines;
          }

          if (targetElements.length === 0) return;

          const tweenConfig = {
            ...animationFromProps,
            duration: duration,
            delay: delay,
            ease: ease,
            stagger: stagger,
            ...(onComplete && {
              onComplete: () => {
                onComplete();
                if (revertOnComplete && splitInstance) {
                  splitInstance.revert();
                }
              },
            }),
          };

          if (triggerMode === 'scroll') {
            const stConfig = {
              trigger: containerRef.current,
              start: start || 'top 80%',
              ...(typeof scrollTrigger === 'object' && scrollTrigger),
            };
            if (toggleActions) {
              stConfig.toggleActions = toggleActions;
            }
            tweenConfig.scrollTrigger = stConfig;
            tweenRef.current = gsap.from(targetElements, tweenConfig);
          } else if (triggerMode === 'immediate') {
            tweenRef.current = gsap.from(targetElements, tweenConfig);
          } else {
            tweenRef.current = gsap.from(targetElements, { ...tweenConfig, paused: true });

            if (triggerMode === 'pageEnter' && pageEnterTriggeredRef.current) {
              markAnimationStarted();
              tweenRef.current.restart(true);
            }

            if (triggerMode === 'manual' && onReady) {
              onReady(() => {
                if (tweenRef.current) {
                  tweenRef.current.restart(true);
                }
              });
            }
          }
          return tweenRef.current;
        },
      };

      splitTextRef.current = SplitText.create(containerRef.current, splitConfig);

      return () => {
        if (tweenRef.current) {
          tweenRef.current.kill();
          tweenRef.current = null;
        }
        if (splitTextRef.current) {
          splitTextRef.current.revert();
          splitTextRef.current = null;
        }
      };
    },
    { scope: containerRef, dependencies: [triggerMode, fontsReady] },
  );

  return (
    <Component
      ref={containerRef}
      className={className}
      data-page-enter-animation={triggerMode === 'pageEnter' ? 'true' : undefined}
      {...restProps}>
      {children}
    </Component>
  );
}
