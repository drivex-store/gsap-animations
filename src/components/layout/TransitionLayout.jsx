'use client';

// NOTE: module id: 791141
// Variable Mapping:
// c -> TRANSITION_CONFIGS, u -> DEFAULT_MARKETING_CONFIG, d -> LIGHT_THEME_ROUTES
// p -> getThemeFromPath, f -> getConfigForLayout, h -> scrollToTop, g -> resolveLayoutType, v -> getFirstSegment, y -> isSameSection
// s -> pathname (usePathname)
// c (hook) -> triggerPageEnter, u (hook) -> revealPage, d (hook) -> onGatesClear
// v (ref) -> groundOverlayRef, w -> isBackForwardNavRef, b -> currentLayoutTypeRef, _ -> previousPathnameRef
// x -> isInterceptedRef, S -> activeTransitionConfigRef, E -> fadedElementsRef, k -> renderedPathnameRef
// A -> leaveAnimationRef, C -> enterAnimationRef
// T -> leave, j -> enter

import React, { useRef, useEffect, useCallback } from 'react'; // NOTE: module id: 271645
import { usePathname } from 'next/navigation'; // NOTE: module id: 618566
import gsap from 'gsap'; // NOTE: module id: 989970
import { RouterTransition } from '@/providers/contexts/RouterContext'; // NOTE: module id: 406262
import { TransitionRouterProvider } from '@/providers/contexts/RouterContext'; // NOTE: module id: 676040
import { useAnimation } from '@/providers/AnimationProvider'; // NOTE: module id: 488463
import { getLayoutType } from '@/libs/configs/getAppChrome'; // NOTE: module id: 107255
import { getTransitionTarget, setTransitionTarget } from '@/providers/contexts/RouterContext'; // NOTE: module id: 842365

const TRANSITION_CONFIGS = {
  app: {
    mechanism: 'fade',
    leave: { duration: 0.3, ease: 'power4.out' },
    enter: { duration: 0.4, ease: 'power4.out' },
  },
  sectionFade: {
    mechanism: 'fade',
    leave: { duration: 0.35, ease: 'power2.out' },
    enter: { duration: 0.5, ease: 'power2.out' },
  },
  marketing: {
    mechanism: 'ground',
    in: { duration: 0.3, ease: 'expo.out' },
    out: { duration: 0.4, ease: 'expo.out' },
  },
  auth: null,
  admin: {
    mechanism: 'fade',
    leave: { duration: 0.3, ease: 'power4.out' },
    enter: { duration: 0.5, ease: 'power4.out' },
  },
  standalone: {
    mechanism: 'ground',
    in: { duration: 0.3, ease: 'expo.out' },
    out: { duration: 0.4, ease: 'expo.out' },
  },
};

const DEFAULT_MARKETING_CONFIG = TRANSITION_CONFIGS.marketing;
const LIGHT_THEME_ROUTES = ['/pricing', '/kits', '/roadmap'];

function getThemeFromPath(path) {
  const baseRoute = (path || '').split(/[?#]/)[0].replace(/(.)\/$/, '$1');
  return LIGHT_THEME_ROUTES.includes(baseRoute) ? 'light' : 'dark';
}

function getConfigForLayout(layout) {
  return layout in TRANSITION_CONFIGS ? TRANSITION_CONFIGS[layout] : DEFAULT_MARKETING_CONFIG;
}

const scrollToTop = () => {
  if (window.lenis) {
    window.lenis.scrollTo(0, { immediate: true });
  } else {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
};

const resolveLayoutType = (pathname) => {
  const type = getLayoutType(pathname);
  if (type !== 'app') return type;
  if (typeof document !== 'undefined' && document.querySelector('[data-anon-app-shell]')) {
    return 'marketing';
  }
  return type;
};

const getFirstSegment = (path) => {
  return (path && typeof path === 'string' && path.split('?')[0].split('#')[0].split('/').filter(Boolean)[0]) || '';
};

const isSameSection = (path1, path2) => {
  const segment1 = getFirstSegment(path1);
  const segment2 = getFirstSegment(path2);
  return segment1 !== '' && segment1 === segment2;
};

// Helper representing the stripped out logger `((...e) => 0)` from the minified build
const debugLog = (...args) => 0;

export default function TransitionLayout({ children }) {
  const pathname = usePathname();
  const { triggerPageEnter, revealPage, onGatesClear } = useAnimation();

  const groundOverlayRef = useRef(null);
  const isBackForwardNavRef = useRef(false);
  const currentLayoutTypeRef = useRef(null);
  const previousPathnameRef = useRef(pathname);
  const isInterceptedRef = useRef(false);
  const activeTransitionConfigRef = useRef(null);
  const fadedElementsRef = useRef([]);
  const renderedPathnameRef = useRef(pathname);

  renderedPathnameRef.current = pathname;
  debugLog('TransitionLayout render, pathname:', pathname);

  useEffect(() => {
    debugLog('Layout type updated:', resolveLayoutType(pathname));
    currentLayoutTypeRef.current = resolveLayoutType(pathname);
  }, [pathname]);

  const leaveAnimationRef = useRef(null);
  const enterAnimationRef = useRef(null);

  useEffect(() => {
    debugLog('Setting up Navigation API listener');

    if (!('navigation' in window)) {
      debugLog('Navigation API not supported, using popstate fallback');
      const handlePopState = () => {
        const currentPath = window.location.pathname;
        if (currentPath !== previousPathnameRef.current) {
          previousPathnameRef.current = currentPath;
          if (enterAnimationRef.current) {
            enterAnimationRef.current();
          }
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }

    debugLog('Navigation API supported, setting up intercept');

    const handleNavigate = (event) => {
      debugLog('navigate event:', {
        type: event.navigationType,
        destination: event.destination?.url,
        canIntercept: event.canIntercept,
        hashChange: event.hashChange,
      });

      if (event.navigationType !== 'traverse') {
        debugLog('Skipping - not a traverse navigation (handled by TransitionRouter)');
        return;
      }
      if (event.hashChange) {
        debugLog('Skipping hash-only change');
        return;
      }

      const targetUrl = new URL(event.destination.url);
      const currentPath = window.location.pathname;

      if (targetUrl.pathname === currentPath) {
        debugLog('Skipping - same pathname');
      } else if (event.canIntercept && leaveAnimationRef.current) {
        debugLog('Intercepting back/forward navigation, running leave animation');
        isInterceptedRef.current = true;
        isBackForwardNavRef.current = true;
        setTransitionTarget(targetUrl.pathname);

        event.intercept({
          handler: async () => {
            debugLog('Intercept handler: running leave animation');
            await leaveAnimationRef.current();
            debugLog('Intercept handler: leave animation complete');
          },
        });
      } else {
        debugLog('Cannot intercept:', {
          canIntercept: event.canIntercept,
          hasLeaveRef: !!leaveAnimationRef.current,
        });
      }
    };

    const handleNavigateSuccess = () => {
      debugLog('navigatesuccess event, isIntercepted:', isInterceptedRef.current);
      if (isInterceptedRef.current && enterAnimationRef.current) {
        isInterceptedRef.current = false;
        debugLog('Running enter animation');
        enterAnimationRef.current();
      }
    };

    window.navigation.addEventListener('navigate', handleNavigate);
    window.navigation.addEventListener('navigatesuccess', handleNavigateSuccess);

    return () => {
      window.navigation.removeEventListener('navigate', handleNavigate);
      window.navigation.removeEventListener('navigatesuccess', handleNavigateSuccess);
    };
  }, []);

  const leave = useCallback(async () => {
    debugLog('leave() called');

    const currentLayout = currentLayoutTypeRef.current;
    const targetPath = getTransitionTarget();
    const targetLayout = targetPath ? resolveLayoutType(targetPath) : currentLayout;
    const currentPath = window.location.pathname;

    let config =
      currentLayout === targetLayout
        ? getConfigForLayout(currentLayout)
        : currentLayout === 'marketing' || targetLayout === 'marketing'
          ? getConfigForLayout('marketing')
          : getConfigForLayout(currentLayout);

    if (config && document.querySelector('[data-anon-sidebar-chrome]') && isSameSection(currentPath, targetPath)) {
      config = getConfigForLayout('sectionFade');
    }

    activeTransitionConfigRef.current = config;
    debugLog(
      'leave() - from:',
      currentLayout,
      'to:',
      targetLayout,
      'sameSection:',
      isSameSection(currentPath, targetPath),
      'config:',
      config,
    );

    if (!config) {
      debugLog('leave() - skipping (no config)');
      return Promise.resolve();
    }

    const theme = config.mechanism === 'ground' ? getThemeFromPath(targetPath) : null;

    queueMicrotask(() => {
      window.dispatchEvent(
        new CustomEvent('anm:transition', {
          detail: { theme },
        }),
      );
    });

    if (config.mechanism === 'ground') {
      const overlay = groundOverlayRef.current;
      const isBackForward = isBackForwardNavRef.current;
      isBackForwardNavRef.current = false;

      if (!overlay || isBackForward || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return Promise.resolve();
      }

      gsap.set(overlay, {
        backgroundColor: getThemeFromPath(targetPath) === 'light' ? '#eeeeee' : '#141314',
        pointerEvents: 'auto',
      });

      return new Promise((resolve) => {
        gsap.to(overlay, {
          autoAlpha: 1,
          ...config.in,
          overwrite: true,
          onComplete: () => {
            scrollToTop();
            resolve();
          },
        });
      });
    }

    const contentElements = document.querySelectorAll('[data-transition-content]');
    const footer = document.querySelector('footer');

    debugLog('leave() - found content elements:', contentElements.length, 'footer:', !!footer);

    if (contentElements.length === 0) {
      debugLog('leave() - no content elements found!');
      scrollToTop();
      return;
    }

    const { duration, ease } = config.leave;
    debugLog('leave() - animating with duration:', duration, 'ease:', ease);

    const elementsToAnimate = Array.from(contentElements);
    if (footer) {
      elementsToAnimate.push(footer);
    }

    fadedElementsRef.current = elementsToAnimate;

    return new Promise((resolve) => {
      const tl = gsap.timeline({
        onComplete: () => {
          debugLog('leave() - animation complete');
          scrollToTop();
          resolve();
        },
      });
      tl.to(contentElements, { opacity: 0, duration, ease }, 0);
      if (footer) {
        tl.to(footer, { opacity: 0, duration, ease }, 0);
      }
    });
  }, []);

  const enter = useCallback(async () => {
    debugLog('enter() called');

    const config = activeTransitionConfigRef.current || getConfigForLayout(resolveLayoutType(pathname));
    debugLog('enter() - config:', config);

    if (!config) {
      debugLog('enter() - skipping (no config)');
      return Promise.resolve();
    }

    const triggerEnterAnimation = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          debugLog('enter() - triggering pageEnter animations');
          triggerPageEnter();
        });
      });
    };

    if (config.mechanism === 'ground') {
      for (let i = 0; i < 60 && renderedPathnameRef.current !== window.location.pathname; i++) {
        await new Promise((r) => setTimeout(r, 16));
      }

      scrollToTop();

      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 1500);
        onGatesClear(() => {
          clearTimeout(timeout);
          resolve();
        });
      });

      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 1000);
        let lastTime = performance.now();
        let fastFrames = 0;

        const checkFrames = (time) => {
          fastFrames = time - lastTime < 40 ? fastFrames + 1 : 0;
          lastTime = time;
          if (fastFrames >= 2) {
            clearTimeout(timeout);
            resolve();
          } else {
            requestAnimationFrame(checkFrames);
          }
        };
        requestAnimationFrame(checkFrames);
      });

      revealPage();

      const overlay = groundOverlayRef.current;
      if (!overlay) return;

      await new Promise((resolve) => {
        gsap.to(overlay, {
          autoAlpha: 0,
          ...config.out,
          overwrite: true,
          onComplete: () => {
            gsap.set(overlay, { pointerEvents: 'none' });
            resolve();
          },
        });
      });
      return;
    }

    const { enter: enterConfig } = config;
    const contentElements = document.querySelectorAll('[data-transition-content]');
    const footer = document.querySelector('footer');

    debugLog('enter() - found content elements:', contentElements.length, 'footer:', !!footer);

    const elementsSet = new Set(contentElements);
    const leftoverElements = fadedElementsRef.current.filter((el) => el && !elementsSet.has(el));

    if (leftoverElements.length) {
      gsap.set(leftoverElements, { opacity: 1 });
    }
    fadedElementsRef.current = [];

    if (contentElements.length === 0) {
      debugLog('enter() - no content elements found!');
      triggerEnterAnimation();
      return;
    }

    const { duration, ease } = enterConfig;
    debugLog('enter() - animating with duration:', duration, 'ease:', ease);

    const tl = gsap.timeline();

    return new Promise((resolve) => {
      tl.fromTo(contentElements, { opacity: 0 }, { opacity: 1, duration, ease }, 0);
      if (footer) {
        tl.fromTo(footer, { opacity: 0 }, { opacity: 1, duration, ease }, 0);
      }
      tl.call(triggerEnterAnimation, [], 0);
      tl.call(() => resolve(), [], '>');
    });
  }, [pathname, triggerPageEnter, revealPage, onGatesClear]);

  useEffect(() => {
    leaveAnimationRef.current = leave;
    enterAnimationRef.current = enter;
  }, [leave, enter]);

  return (
    <RouterTransition leave={leave} enter={enter}>
      <TransitionRouterProvider>
        {children}
        <div ref={groundOverlayRef} aria-hidden="true" className="pointer-events-none invisible fixed inset-0 z-[299] opacity-0" />
      </TransitionRouterProvider>
    </RouterTransition>
  );
}
