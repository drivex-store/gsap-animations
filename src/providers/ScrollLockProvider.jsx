'use client';

// Variable Mapping:
// o -> ScrollLockContext
// e (props) -> children
// a -> lockCountRef
// l, n -> isLocked, setIsLocked
// i -> lockScroll
// s -> unlockScroll

import { createContext, useContext, useRef, useState, useCallback } from 'react'; // NOTE: module id: 271645

const ScrollLockContext = createContext({
  lockScroll: () => {},
  unlockScroll: () => {},
  isLocked: false
});

// NOTE: module id: 441409
export function ScrollLockProvider({ children }) {
  const lockCountRef = useRef(0);
  const [isLocked, setIsLocked] = useState(false);

  const lockScroll = useCallback(() => {
    lockCountRef.current++;
    if (lockCountRef.current === 1) {
      window.lenis?.stop();
      window.lenisApp?.stop();
      setIsLocked(true);
    }
  }, []);

  const unlockScroll = useCallback(() => {
    lockCountRef.current = Math.max(0, lockCountRef.current - 1);
    if (lockCountRef.current === 0) {
      window.lenis?.start();
      window.lenisApp?.start();
      setIsLocked(false);
    }
  }, []);

  return (
    <ScrollLockContext.Provider
      value={{
        lockScroll,
        unlockScroll,
        isLocked
      }}
    >
      {children}
    </ScrollLockContext.Provider>
  );
}

export const useScrollLockContext = () => useContext(ScrollLockContext);
