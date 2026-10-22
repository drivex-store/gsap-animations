'use client';

// NOTE: module id: 254359
// Variable Mapping: E -> ASCII_CHARS, e -> duration, D -> speed, a -> chars, r -> firstColorClass, n -> secondColorClass
// l -> textRef, i -> timelineRef, s -> originalTextRef, o -> isAnimatingRef
// c -> clearStyles, d -> killTimeline, m -> playScramble, h -> generateScrambledText

import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

gsap.registerPlugin(ScrambleTextPlugin);

export const ASCII_CHARS = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$";

export function useScramble({
  duration = 0.5,
  speed = 1,
  chars = ASCII_CHARS,
  firstColorClass = 'scramble-brand',
  secondColorClass = 'scramble-inherit'
} = {}) {
  const textRef = useRef(null);
  const timelineRef = useRef(null);
  const originalTextRef = useRef('');
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    if (textRef.current) {
      originalTextRef.current = textRef.current.innerText ?? '';
    }
  }, []);

  const clearStyles = useCallback(() => {
    const el = textRef.current;
    if (el) {
      gsap.set(el, { clearProps: 'width,height,display,overflow,whiteSpace' });
    }
  }, []);

  const killTimeline = useCallback(() => {
    timelineRef.current?.kill();
    timelineRef.current = null;
    isAnimatingRef.current = false;
    clearStyles();
  }, [clearStyles]);

  const playScramble = useCallback(
    (newText) => {
      const el = textRef.current;
      if (!el || isAnimatingRef.current) return;

      const passedText = typeof newText === 'string' ? newText : null;
      const finalText = passedText ?? (originalTextRef.current || el.innerText || '');

      if (finalText.trim().length === 0) return;

      originalTextRef.current = finalText;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        if (passedText !== null) {
          el.innerText = passedText;
        }
        return;
      }

      killTimeline();
      isAnimatingRef.current = true;

      // Fix dimensions to prevent layout shift
      gsap.set(el, { width: 'auto', height: 'auto', display: 'inline-block', whiteSpace: 'nowrap' });
      gsap.set(el, {
        width: el.offsetWidth,
        height: el.offsetHeight,
        display: 'inline-block',
        overflow: 'hidden',
        whiteSpace: 'nowrap'
      });

      const generateScrambledText = (textStr, charsStr) => {
        let result = '';
        for (let i = 0; i < textStr.length; i++) {
          result += textStr[i] === ' ' ? ' ' : charsStr[Math.floor(Math.random() * charsStr.length)];
        }
        return result;
      };

      const scrambledText = generateScrambledText(finalText, chars);
      const noSpaceLength = finalText.replace(/\s/g, '').length;
      const stepDuration = noSpaceLength > 0 ? duration / noSpaceLength : 0;

      timelineRef.current = gsap.timeline({
        onComplete: () => {
          isAnimatingRef.current = false;
          timelineRef.current = null;
          clearStyles();
        }
      });

      timelineRef.current
        .to(el, {
          duration: duration,
          scrambleText: {
            text: scrambledText,
            chars: chars,
            speed: speed,
            revealDelay: 0.1,
            oldClass: firstColorClass,
            newClass: firstColorClass
          },
          ease: 'none'
        })
        .to(
          el,
          {
            duration: duration,
            scrambleText: {
              text: finalText,
              chars: chars,
              speed: speed,
              revealDelay: 0.1,
              oldClass: firstColorClass,
              newClass: secondColorClass
            },
            ease: 'none'
          },
          stepDuration
        );
    },
    [duration, speed, chars, firstColorClass, secondColorClass, killTimeline, clearStyles]
  );

  useEffect(() => {
    return killTimeline;
  }, [killTimeline]);

  return { ref: textRef, scramble: playScramble, kill: killTimeline };
}
