"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';
export type ThemePreference = 'system' | Theme;
export type FontPreference = 'modern' | 'heritage' | 'editorial' | 'accessible' | 'system';

interface ThemeContextType {
  theme: Theme;
  preference: ThemePreference;
  fontPreference: FontPreference;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setPreference: (preference: ThemePreference) => void;
  setFontPreference: (font: FontPreference) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light', preference: 'system', fontPreference: 'modern', toggleTheme: () => {}, setTheme: () => {}, setPreference: () => {}, setFontPreference: () => {},
});

const STORAGE_KEY = 'ondwira-theme';
const FONT_STORAGE_KEY = 'ondwira-font';
const themes: ThemePreference[] = ['system', 'light', 'dark'];
const fonts: FontPreference[] = ['modern', 'heritage', 'editorial', 'accessible', 'system'];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') return 'system';
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    const legacy = localStorage.getItem('profcaria-theme') as Theme | null;
    return stored && themes.includes(stored) ? stored : legacy || 'system';
  });
  const [fontPreference, setFontPreferenceState] = useState<FontPreference>(() => {
    if (typeof window === 'undefined') return 'modern';
    const stored = localStorage.getItem(FONT_STORAGE_KEY) as FontPreference | null;
    return stored && fonts.includes(stored) ? stored : 'modern';
  });
  const [systemTheme, setSystemTheme] = useState<Theme>(() => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const theme: Theme = preference === 'system' ? systemTheme : preference;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystem = () => setSystemTheme(media.matches ? 'dark' : 'light');
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    const legacy = localStorage.getItem('profcaria-theme') as Theme | null;
    if (legacy && !stored) localStorage.setItem(STORAGE_KEY, legacy);
    media.addEventListener('change', syncSystem);
    return () => media.removeEventListener('change', syncSystem);
  }, []);

  useEffect(() => {
    fetch('/api/settings/appearance', { cache: 'no-store' }).then(async response => {
      if (!response.ok) return;
      const data = await response.json();
      if (themes.includes(data.theme)) setPreferenceState(data.theme);
      if (fonts.includes(data.fontFamily)) setFontPreferenceState(data.fontFamily);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme, preference]);

  useEffect(() => {
    document.documentElement.dataset.font = fontPreference;
    localStorage.setItem(FONT_STORAGE_KEY, fontPreference);
  }, [fontPreference]);

  const setPreference = (next: ThemePreference) => {
    setPreferenceState(next);
    localStorage.setItem(STORAGE_KEY, next);
    localStorage.removeItem('profcaria-theme');
    fetch('/api/settings/appearance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme: next }) }).catch(() => undefined);
  };

  const setFontPreference = (next: FontPreference) => {
    setFontPreferenceState(next);
    localStorage.setItem(FONT_STORAGE_KEY, next);
    fetch('/api/settings/appearance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fontFamily: next }) }).catch(() => undefined);
  };

  return <ThemeContext.Provider value={{
    theme, preference, fontPreference, setPreference, setFontPreference,
    setTheme: (next) => setPreference(next),
    toggleTheme: () => setPreference(theme === 'dark' ? 'light' : 'dark'),
  }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
