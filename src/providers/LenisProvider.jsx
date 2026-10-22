'use client';


import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Original module ID: 776017
// Original React module ID: 271645
// Original GSAP module ID: 989970
// Original ScrollTrigger module ID: 883495

gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext(null);

class LenisStore {
  constructor(state) {
    this.state = state;
  }

  listeners = [];

  set(state) {
    this.state = state;

    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  subscribe(listener) {
    this.listeners = [...this.listeners, listener];

    return () => {
      this.listeners = this.listeners.filter(
        (item) => item !== listener,
      );
    };
  }

  get() {
    return this.state;
  }
}

const lenisStore = new LenisStore(null);

function useStore(store) {
  const [state, setState] = useState(store.get());

  useEffect(() => {
    return store.subscribe(setState);
  }, [store]);

  return state;
}

export function useLenis(callback, dependencies = [], priority = 0) {
  const context = useContext(LenisContext);
  const storeState = useStore(lenisStore);

  const {
    lenis,
    addCallback,
    removeCallback,
  } = context ?? storeState ?? {};

  useEffect(() => {
    if (!callback || !addCallback || !removeCallback || !lenis) {
      return;
    }

    addCallback(callback, priority);
    callback(lenis);

    return () => {
      removeCallback(callback);
    };
  }, [
    lenis,
    addCallback,
    removeCallback,
    priority,
    ...dependencies,
  ]);

  return lenis;
}

function LenisGSAP() {
  const lenis = useLenis(() => {
    ScrollTrigger.update();
  });

  useEffect(() => {
    if (!lenis) return;

    window.lenis = lenis;

    const onTick = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(onTick, false, true);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      delete window.lenis;
    };
  }, [lenis]);

  return null;
}

// Original module ID: 776017
const LenisProvider = forwardRef(function LenisProvider(
  {
    children,
    root = false,
    options = {},
    autoRaf = true,
    ...props
  },
  forwardedRef,
) {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);
  const [lenis, setLenis] = useState(undefined);

  useImperativeHandle(
    forwardedRef,
    () => ({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      lenis,
    }),
    [lenis],
  );

  useEffect(() => {
    const instance = new Lenis({
      ...options,
      ...(wrapperRef.current && contentRef.current
        ? {
            wrapper: wrapperRef.current,
            content: contentRef.current,
          }
        : {}),
      autoRaf: options?.autoRaf ?? autoRaf,
    });

    setLenis(instance);

    return () => {
      instance.destroy();
      setLenis(undefined);
    };
  }, [
    root,
    JSON.stringify({
      ...options,
      wrapper: null,
      content: null,
    }),
  ]);

  const callbacks = useRef([]);

  const addCallback = useCallback((callback, priority) => {
    callbacks.current.push({ callback, priority });

    callbacks.current.sort(
      (a, b) => a.priority - b.priority,
    );
  }, []);

  const removeCallback = useCallback((callback) => {
    callbacks.current = callbacks.current.filter(
      (item) => item.callback !== callback,
    );
  }, []);

  useEffect(() => {
    if (!root || !lenis) return;

    lenisStore.set({
      lenis,
      addCallback,
      removeCallback,
    });

    return () => {
      lenisStore.set(null);
    };
  }, [root, lenis, addCallback, removeCallback]);

  useEffect(() => {
    if (!lenis) return;

    const onScroll = (event) => {
      for (let index = 0; index < callbacks.current.length; index++) {
        callbacks.current[index]?.callback(event);
      }
    };

    lenis.on('scroll', onScroll);

    return () => {
      lenis.off('scroll', onScroll);
    };
  }, [lenis]);

  if (!children) return null;

  return (
    <LenisContext.Provider
      value={{
        lenis,
        addCallback,
        removeCallback,
      }}
    >
      {root && root !== 'asChild' ? (
        <>
          <LenisGSAP />
          {children}
        </>
      ) : (
        <div ref={wrapperRef} {...props}>
          <div ref={contentRef}>{children}</div>
        </div>
      )}
    </LenisContext.Provider>
  );
});

export default LenisProvider;

