'use client';

// NOTE: module id: 488463 (AnimationProvider), 991763 (perfLog)
// Variable Mapping (perfLog): a -> isPerfLoggingEnabledCache, o -> checkPerfLogging, i -> getCurrentTime, u -> perfLog, s -> perfMeasure
// Variable Mapping (AnimationProvider): c -> AnimationContext, l -> DEFAULT_CONTEXT_VALUE, f -> useAnimation, a -> pathname, o -> currentPathRef, i -> revealedPathRef, l -> revealed, f -> setRevealed, d -> subscribersRef, p -> gatesRef, g -> onGatesClearCbRef, m -> isPendingRevealRef, h -> revealPage, y -> whenRevealed, v -> addReadyGate, b -> onGatesClear, _ -> triggerPageEnter, x -> getHasTriggered

import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// ==========================================
// Module: perfLog (991763)
// ==========================================

let isPerfLoggingEnabledCache = null;

function checkPerfLogging() {
  if (isPerfLoggingEnabledCache !== null) return isPerfLoggingEnabledCache;
  try {
    isPerfLoggingEnabledCache = new URLSearchParams(window.location.search).has('perf') || window.localStorage?.getItem('anm-perf') === '1';
  } catch {
    isPerfLoggingEnabledCache = false;
  }
  if (isPerfLoggingEnabledCache) {
    console.log('%c[perf] debug logging ON (remove ?perf=1 to silence)', 'color:#fd551d;font-weight:bold');
  }
  return isPerfLoggingEnabledCache;
}

const getCurrentTime = () => (typeof performance !== 'undefined' ? performance.now() : 0);

export function perfLog(message, data) {
  if (!checkPerfLogging()) return;
  const seconds = (getCurrentTime() / 1000).toFixed(2);
  if (data !== undefined) {
    console.log(`[perf +${seconds}s] ${message}`, data);
  } else {
    console.log(`[perf +${seconds}s] ${message}`);
  }
}

export function perfMeasure(name, fn) {
  if (!checkPerfLogging()) return fn();
  const start = getCurrentTime();
  const result = fn();
  console.log(`[perf] ${name} took ${(getCurrentTime() - start).toFixed(1)}ms`);
  return result;
}

// ==========================================
// Module: AnimationProvider (488463)
// ==========================================

const AnimationContext = createContext(null);

const DEFAULT_CONTEXT_VALUE = {
  revealed: false,
  revealPage: () => {},
  whenRevealed: () => {},
  addReadyGate: () => () => {},
  onGatesClear: () => () => {},
  triggerPageEnter: () => {},
  getHasTriggered: () => false,
};

export function useAnimation() {
  const context = useContext(AnimationContext);
  return context || DEFAULT_CONTEXT_VALUE;
}

// Helper representing the stripped out logger `((...e) => 0)` from the minified build
const debugLog = (...args) => 0;

export function AnimationProvider({ children }) {
  const pathname = usePathname();

  const currentPathRef = useRef(pathname);
  currentPathRef.current = pathname;

  const revealedPathRef = useRef(null);
  const [revealed, setRevealed] = useState(false);

  const subscribersRef = useRef(new Set());
  const gatesRef = useRef(new Set());
  const onGatesClearCbRef = useRef(null);
  const isPendingRevealRef = useRef(false);

  const revealPage = useCallback(() => {
    if (revealedPathRef.current === currentPathRef.current) {
      debugLog('revealPage skipped - already revealed:', currentPathRef.current);
      return;
    }

    revealedPathRef.current = currentPathRef.current;
    setRevealed(true);
    debugLog(`revealPage (${currentPathRef.current}), subscribers: ${subscribersRef.current.size}`);

    perfLog('revealPage() fired', {
      path: currentPathRef.current,
      subscribers: subscribersRef.current.size,
    });

    if (typeof document !== 'undefined') {
      document.querySelectorAll('[data-page-enter-animation]').forEach((el) => {
        el.setAttribute('data-animation-started', 'true');
      });
    }

    perfMeasure('reveal wave (all whenRevealed callbacks)', () => {
      Array.from(subscribersRef.current).forEach((callback) => {
        try {
          callback();
        } catch (error) {
          console.error('Error in whenRevealed callback:', error);
        }
      });
    });
  }, []);

  const whenRevealed = useCallback((callback) => {
    if (revealedPathRef.current === currentPathRef.current) {
      try {
        callback();
      } catch (error) {
        console.error('Error in whenRevealed callback:', error);
      }
      return () => {};
    }

    subscribersRef.current.add(callback);
    return () => subscribersRef.current.delete(callback);
  }, []);

  useEffect(() => {
    if (revealedPathRef.current !== pathname) {
      setRevealed(false);
    }
  }, [pathname]);

  const addReadyGate = useCallback(
    (gateId) => {
      gatesRef.current.add(gateId);
      debugLog(`addReadyGate: ${gateId}, open: ${[...gatesRef.current].join(', ')}`);

      let hasReleased = false;
      return () => {
        if (!hasReleased) {
          hasReleased = true;
          gatesRef.current.delete(gateId);
          debugLog(`gate released: ${gateId}, remaining: ${[...gatesRef.current].join(', ') || '(none)'}`);

          if (gatesRef.current.size === 0) {
            onGatesClearCbRef.current?.();
            if (isPendingRevealRef.current) {
              isPendingRevealRef.current = false;
              revealPage();
            }
          }
        }
      };
    },
    [revealPage],
  );

  const onGatesClear = useCallback((callback) => {
    onGatesClearCbRef.current = callback;
    if (gatesRef.current.size === 0) {
      callback();
    }
    return () => {
      if (onGatesClearCbRef.current === callback) {
        onGatesClearCbRef.current = null;
      }
    };
  }, []);

  const triggerPageEnter = useCallback(() => {
    if (gatesRef.current.size > 0) {
      isPendingRevealRef.current = true;
      return;
    }
    revealPage();
  }, [revealPage]);

  const getHasTriggered = useCallback(() => {
    return revealedPathRef.current === currentPathRef.current;
  }, []);

  return (
    <AnimationContext.Provider
      value={{
        revealed,
        revealPage,
        whenRevealed,
        addReadyGate,
        onGatesClear,
        triggerPageEnter,
        getHasTriggered,
      }}>
      {children}
    </AnimationContext.Provider>
  );
}

export function usePageEnterAnimation(callback, dependencies = [], name = '', isEnabled = true) {
  const { whenRevealed } = useAnimation();
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  useEffect(() => {
    if (isEnabled) {
      return whenRevealed(() => callbackRef.current());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whenRevealed, isEnabled, ...dependencies]);
}
