'use client';

// Variable Mapping:
// o -> THEME_STORAGE_KEY
// a -> DEFAULT_THEME
// l -> ThemeContext
// e (props) -> children
// n, i -> theme, setThemeState
// s, u -> systemTheme, setSystemTheme
// c, d -> isMounted, setIsMounted
// m -> resolvedTheme
// p -> setTheme
// y -> contextValue

import { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react'; // NOTE: module id: 271645

const THEME_STORAGE_KEY = 'theme';
const DEFAULT_THEME = 'dark';
const ThemeContext = createContext(null);

// NOTE: module id: 914899
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(DEFAULT_THEME);
  const [systemTheme, setSystemTheme] = useState(DEFAULT_THEME);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setThemeState(() => {
      try {
        return window.localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
      } catch (e) {
        return DEFAULT_THEME;
      }
    });

    setSystemTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setIsMounted(true);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setSystemTheme(e.matches ? 'dark' : 'light');

    mediaQuery.addEventListener?.('change', handleChange);
    return () => mediaQuery.removeEventListener?.('change', handleChange);
  }, []);

  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    if (!isMounted) return;

    if (typeof document !== 'undefined') {
      // Temporarily disable transitions to prevent flashing
      const style = document.createElement('style');
      style.appendChild(
        document.createTextNode(
          '*,*::before,*::after{transition:none !important;animation-duration:0s !important;animation-delay:0s !important;}',
        ),
      );
      document.head.appendChild(style);

      // Force reflow
      window.getComputedStyle(document.body).opacity;

      requestAnimationFrame(() => {
        document.head.removeChild(style);
      });

      // Apply theme class
      const root = document.documentElement;
      if (resolvedTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [isMounted, resolvedTheme]);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {}
  }, []);

  const contextValue = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
