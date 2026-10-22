'use client';

// Variable Mapping: S -> VALID_THEMES, e -> barRef, t -> pathname, n -> scrollState, s -> setScrollState, o -> isMenuOpen, l -> setIsMenuOpen, a -> headerTheme, c -> setHeaderTheme, h -> isScrollLockedRef, d -> detectThemeAtY, u -> isTransitioningRef, m -> headerState, f -> toggleMenu, p -> closeMenu

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'; // NOTE: module id: 271645
import { usePathname } from 'next/navigation'; // NOTE: module id: 618566

const VALID_THEMES = ['light', 'dark', 'brand'];

// NOTE: module id: 76624
export function useHeaderState(barRef) {
  const pathname = usePathname();
  const [scrollState, setScrollState] = useState('top');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [headerTheme, setHeaderTheme] = useState('dark');
  const isScrollLockedRef = useRef(false);

  const detectThemeAtY = useCallback((offsetY) => {
    const sections = document.querySelectorAll('main [data-theme]');
    if (sections.length === 0) return;

    const activeSection = Array.from(sections).find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= offsetY && rect.bottom > offsetY;
    });

    const theme = (activeSection ?? sections[0])?.dataset.theme;
    if (theme && VALID_THEMES.includes(theme)) {
      setHeaderTheme(theme);
    }
  }, []);

  const isTransitioningRef = useRef(false);

  useEffect(() => {
    let timeoutId = 0;

    const handleTransition = (event) => {
      isTransitioningRef.current = true;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        isTransitioningRef.current = false;
      }, 4000);
      setScrollState('top');

      const nextTheme = event.detail?.theme;
      if (nextTheme && VALID_THEMES.includes(nextTheme)) {
        setHeaderTheme(nextTheme);
      }
    };

    window.addEventListener('anm:transition', handleTransition);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('anm:transition', handleTransition);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!isTransitioningRef.current) {
        setScrollState(window.scrollY > 50 ? 'scrolled' : 'top');
        if (barRef.current) {
          detectThemeAtY(barRef.current.offsetTop);
        }
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [detectThemeAtY, barRef]);

  useEffect(() => {
    let isCancelled = false;
    isTransitioningRef.current = false;

    const syncHeader = () => {
      if (!isCancelled && barRef.current) {
        setScrollState(window.scrollY > 50 ? 'scrolled' : 'top');
        detectThemeAtY(barRef.current.offsetTop);
      }
    };

    const headerEl = barRef.current?.closest('.v2-header');
    headerEl?.classList.add('no-transition');
    syncHeader();

    const rafId = requestAnimationFrame(() => {
      syncHeader();
      requestAnimationFrame(() => headerEl?.classList.remove('no-transition'));
    });

    const observer = new MutationObserver(syncHeader);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const disconnectTimeoutId = setTimeout(() => observer.disconnect(), 800);

    return () => {
      isCancelled = true;
      cancelAnimationFrame(rafId);
      observer.disconnect();
      clearTimeout(disconnectTimeoutId);
      headerEl?.classList.remove('no-transition');
    };
  }, [pathname, detectThemeAtY, barRef]);

  const headerState = useMemo(
    () => (isMenuOpen ? 'menuOpen' : scrollState),
    [isMenuOpen, scrollState]
  );

  const toggleMenu = useCallback(() => setIsMenuOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen, closeMenu]);

  useEffect(() => {
    if (isMenuOpen) {
      document.documentElement.classList.add('v2-scroll-locked');
      window.lenis?.stop?.();
      isScrollLockedRef.current = true;
    } else if (isScrollLockedRef.current) {
      document.documentElement.classList.remove('v2-scroll-locked');
      window.lenis?.start?.();
      isScrollLockedRef.current = false;
    }
  }, [isMenuOpen]);

  return {
    scrollState,
    isMenuOpen,
    headerState,
    headerTheme,
    toggleMenu,
    closeMenu,
  };
}
