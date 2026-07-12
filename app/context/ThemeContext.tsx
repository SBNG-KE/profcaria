"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'light' | 'dark';
export type ThemePreference = 'system' | Theme;

interface ThemeContextType {
  theme: Theme;
  preference: ThemePreference;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light', preference: 'system', toggleTheme: () => {}, setTheme: () => {}, setPreference: () => {},
});

const STORAGE_KEY = 'ondwira-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemTheme, setSystemTheme] = useState<Theme>('light');
  const theme: Theme = preference === 'system' ? systemTheme : preference;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystem = () => setSystemTheme(media.matches ? 'dark' : 'light');
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    const legacy = localStorage.getItem('profcaria-theme') as Theme | null;
    const restorePreference = () => setPreferenceState(stored && ['system', 'light', 'dark'].includes(stored) ? stored : legacy || 'system');
    restorePreference();
    if (legacy && !stored) localStorage.setItem(STORAGE_KEY, legacy);
    syncSystem();
    media.addEventListener('change', syncSystem);
    return () => media.removeEventListener('change', syncSystem);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme, preference]);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    localStorage.setItem(STORAGE_KEY, next);
    localStorage.removeItem('profcaria-theme');
  };

  return <ThemeContext.Provider value={{
    theme,
    preference,
    setPreference,
    setTheme: (next) => setPreference(next),
    toggleTheme: () => setPreference(theme === 'dark' ? 'light' : 'dark'),
  }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
