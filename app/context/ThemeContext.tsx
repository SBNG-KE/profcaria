"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Create context with default value to prevent error during SSR
const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => { },
  setTheme: () => { },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // On mount, check device preference or stored preference
  useEffect(() => {
    setMounted(true);

    // Check localStorage first (user's explicit choice)
    try {
      const storedTheme = localStorage.getItem('profcaria-theme') as Theme | null;

      if (storedTheme) {
        setThemeState(storedTheme);
      } else {
        // Check device/browser preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setThemeState(prefersDark ? 'dark' : 'light');
      }
    } catch (e) {
      // localStorage not available (SSR), use default
    }

    // Listen for system theme changes
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        // Only auto-switch if user hasn't set explicit preference
        if (!localStorage.getItem('profcaria-theme')) {
          setThemeState(e.matches ? 'dark' : 'light');
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch (e) {
      // matchMedia not available
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (mounted && typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
    try {
      localStorage.setItem('profcaria-theme', newTheme);
    } catch (e) {
      // localStorage not available
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('profcaria-theme', newTheme);
    } catch (e) {
      // localStorage not available
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
