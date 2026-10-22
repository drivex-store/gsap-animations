'use client';

// NOTE: module ids: 676040 (TransitionRouterProvider), 406262 (RouterTransition), 842365 (getTransitionTarget)
// Variable Mapping (RouterTransition): a -> RouterTransitionContext, o -> useRouterTransition, e -> children, o -> leave, i -> enter, u -> pathname, s -> isPendingAnimation, c -> setIsPendingAnimation, l -> stage, f -> setStage, d -> pendingPath, p -> setPendingPath, g -> startReactTransition, m -> hasRunEnterRef
// Variable Mapping (getTransitionTarget): i -> transitionTarget, u -> setTransitionTarget
// Variable Mapping (TransitionRouterProvider): s -> RouterContext, c -> extractPathname, l -> isSamePathname, a -> router, i -> pathname, f -> transition, d -> startRouteTransition, p -> push, g -> replace, m -> contextValue

import React, { createContext, useContext, useState, useTransition, useRef, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Helper representing the stripped out logger `((...e) => 0)` from the minified build
const debugLog = (...args) => 0;

// ==========================================
// Module: getTransitionTarget (842365)
// ==========================================

let transitionTarget = null;

export function setTransitionTarget(target) {
  transitionTarget = target || null;
}

export function getTransitionTarget() {
  return transitionTarget;
}

// ==========================================
// Module: RouterTransition (406262)
// ==========================================

const RouterTransitionContext = createContext(null);

export function useRouterTransition() {
  const context = useContext(RouterTransitionContext);
  if (!context) {
    throw new Error('useRouterTransition must be used within TransitionProvider');
  }
  return context;
}

export function RouterTransition({ children, leave, enter }) {
  const pathname = usePathname();
  const [isPendingAnimation, setIsPendingAnimation] = useState(false);
  const [stage, setStage] = useState(undefined);
  const [pendingPath, setPendingPath] = useState(null);
  const [, startReactTransition] = useTransition();
  const hasRunEnterRef = useRef(false);

  debugLog('RouterTransition mounted');

  useEffect(() => {
    if (!isPendingAnimation || hasRunEnterRef.current) return;

    const runEnter = () => {
      if (!hasRunEnterRef.current) {
        hasRunEnterRef.current = true;
        debugLog('Running enter animation');
        setStage('entering');

        startReactTransition(async () => {
          await enter().then((cleanup) => cleanup?.());
          setStage(undefined);
          setIsPendingAnimation(false);
          setPendingPath(null);
        });
      }
    };

    if (!pendingPath || pathname === pendingPath) {
      runEnter();
      return;
    }

    const timeoutId = setTimeout(runEnter, 2000);
    return () => clearTimeout(timeoutId);
  }, [enter, isPendingAnimation, pathname, pendingPath]);

  const contextValue = [
    {
      isPending: !!stage,
      stage,
      pendingPath,
    },
    (callback, targetPath) => {
      debugLog('startRouteTransition called:', {
        targetPath,
        currentStage: stage,
      });

      if (stage) {
        debugLog('Transition blocked - already in progress:', stage);
        return;
      }

      debugLog('Starting leave animation...');
      hasRunEnterRef.current = false;
      setStage('leaving');
      setPendingPath(targetPath);

      startReactTransition(async () => {
        setIsPendingAnimation(true);
        debugLog('Leave animation starting...');
        await leave().then((cleanup) => cleanup?.());
        debugLog('Leave animation complete, executing callback...');
        await callback();
        debugLog('Navigation callback executed');
      });
    },
  ];

  return <RouterTransitionContext.Provider value={contextValue}>{children}</RouterTransitionContext.Provider>;
}

// ==========================================
// Module: TransitionRouterProvider (676040)
// ==========================================

const RouterContext = createContext(null);
export default RouterContext;

function extractPathname(href) {
  if (!href) return null;
  if (typeof href === 'object' && href.pathname) return href.pathname;

  const hrefString = typeof href === 'object' ? href.toString() : href;

  try {
    if (hrefString.startsWith('http://') || hrefString.startsWith('https://')) {
      return new URL(hrefString).pathname;
    }
    const [pathWithoutQuery] = hrefString.split(/[?#]/);
    return pathWithoutQuery || '/';
  } catch {
    return hrefString;
  }
}

function isSamePathname(currentPath, href) {
  const targetPathname = extractPathname(href);
  return !!(!targetPathname || currentPath === targetPathname || (typeof href === 'string' && href.startsWith('#')));
}

export function TransitionRouterProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [transition, startRouteTransition] = useRouterTransition();

  debugLog('Provider mounted, pathname:', pathname, 'transition:', transition);

  const push = useCallback(
    (href, options) => {
      debugLog('push() called:', {
        href,
        pathname,
        options,
      });

      if (isSamePathname(pathname, href)) {
        debugLog('push() - skipping transition (same pathname or query-only)');
        return router.push(href, options);
      }

      const targetPathname = extractPathname(href);
      debugLog('push() - starting transition to:', targetPathname);

      setTransitionTarget(targetPathname);
      router.prefetch?.(href);

      startRouteTransition(() => {
        debugLog('push() - executing navigation');
        router.push(href, options);
      }, targetPathname);
    },
    [router, pathname, startRouteTransition],
  );

  const replace = useCallback(
    (href, options) => {
      debugLog('replace() called:', {
        href,
        pathname,
        options,
      });

      if (isSamePathname(pathname, href)) {
        debugLog('replace() - skipping transition (same pathname or query-only)');
        return router.replace(href, options);
      }

      const targetPathname = extractPathname(href);
      debugLog('replace() - starting transition to:', targetPathname);

      setTransitionTarget(targetPathname);
      router.prefetch?.(href);

      startRouteTransition(() => {
        debugLog('replace() - executing navigation');
        router.replace(href, options);
      }, targetPathname);
    },
    [router, pathname, startRouteTransition],
  );

  const contextValue = useMemo(
    () => ({
      ...router,
      push,
      replace,
      transition,
    }),
    [router, push, replace, transition],
  );

  return <RouterContext.Provider value={contextValue}>{children}</RouterContext.Provider>;
}

export function useTransitionRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error(
      'useTransitionRouter must be used within TransitionRouterProvider. Make sure TransitionRouterProvider wraps your component.',
    );
  }
  return context;
}
