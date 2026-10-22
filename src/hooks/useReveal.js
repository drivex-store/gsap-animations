'use client';

// NOTE: module id: 228414
// Variable Mapping: e (arg) -> ref, t (arg) -> mode, o -> build, c -> start, u -> inView, d -> deps
// f -> whenRevealed, m -> timelineRef, h -> hasRevealedRef, x -> buildRef, g -> inViewRef
// p -> checkInView, C -> playReveal
// i -> isRefreshing, r (in useEffect) -> scrollTriggerInstance, a (in useEffect) -> rafId, l (in useEffect) -> cleanupWhenRevealed

import { useRef, useCallback, useEffect } from 'react'; // NOTE: module id: 271645
import gsap from 'gsap'; // NOTE: module id: 989970
import { ScrollTrigger } from 'gsap/ScrollTrigger'; // NOTE: module id: 883495
import { useGSAP } from '@gsap/react'; // NOTE: module id: 365747
import { useAnimation } from '@/providers/AnimationProvider'; // NOTE: module id: 488463
import { perfMeasure } from '@/providers/AnimationProvider'; // NOTE: module id: 991763

gsap.registerPlugin(ScrollTrigger);

let isRefreshing = false;

export function useReveal(ref, { mode = 'scroll', build, start = 'top 85%', inView, deps = [] } = {}) {
  const { whenRevealed } = useAnimation();
  
  const timelineRef = useRef(null);
  const hasRevealedRef = useRef(false);
  
  const buildRef = useRef(build);
  buildRef.current = build;
  
  const inViewRef = useRef(inView);
  inViewRef.current = inView;

  const checkInView = useCallback(() => {
    if (inViewRef.current) return inViewRef.current();
    
    const element = ref.current;
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 0;
    
    return rect.top < 0.9 * viewportHeight && rect.bottom > 0;
  }, [ref]);

  const playReveal = useCallback(() => {
    if (!hasRevealedRef.current && ref.current) {
      hasRevealedRef.current = true;
      if (timelineRef.current) {
        timelineRef.current.restart(true);
      }
    }
  }, [ref]);

  useGSAP(() => {
    const element = ref.current;
    if (!element || !buildRef.current) return;
    
    const timeline = buildRef.current(element);
    timelineRef.current = timeline;
    
    if (hasRevealedRef.current) {
      timeline.restart(true);
    }
    
    return () => {
      timeline?.kill();
      timelineRef.current = null;
    };
  }, { scope: ref, dependencies: [mode, start, ...deps] });

  useEffect(() => {
    if (mode === 'manual') return;
    
    let scrollTriggerInstance = null;
    let rafId = 0;
    
    const cleanupWhenRevealed = whenRevealed(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        hasRevealedRef.current = true;
        if (timelineRef.current) {
          timelineRef.current.progress(1);
        }
        return;
      }
      
      if (mode === 'hero' || checkInView()) {
        playReveal();
      } else {
        rafId = requestAnimationFrame(() => {
          if (ref.current) {
            if (checkInView()) {
              playReveal();
              return;
            }
            
            scrollTriggerInstance = ScrollTrigger.create({
              trigger: ref.current,
              start: start,
              once: true,
              onEnter: playReveal
            });
            
            if (!isRefreshing) {
              isRefreshing = true;
              requestAnimationFrame(() => {
                isRefreshing = false;
                perfMeasure(
                  `ScrollTrigger.refresh (${ScrollTrigger.getAll().length} triggers)`,
                  () => ScrollTrigger.refresh()
                );
              });
            }
          }
        });
      }
    });
    
    return () => {
      cleanupWhenRevealed();
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      scrollTriggerInstance?.kill();
    };
  }, [whenRevealed, mode, start]);

  return { play: playReveal, reveal: playReveal };
}
