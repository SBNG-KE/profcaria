"use client"

import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePreference } from '../context/ThemeContext';

export default function ThemeToggle(props: { theme?: 'light' | 'dark'; onToggle?: () => void; showSystem?: boolean }) {
  const { preference, setPreference } = useTheme();
  const choices: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
    { value: 'system', label: 'System', icon: Laptop },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ];
  return <div className="flex items-center border border-[var(--border-primary)] bg-transparent p-0.5" aria-label="Appearance">
    {choices.filter(({ value }) => props.showSystem !== false || value !== 'system').map(({ value, label, icon: Icon }) => <button key={value} onClick={() => setPreference(value)} title={label} aria-label={`${label} appearance`} aria-pressed={preference === value} className={`grid h-8 w-8 place-items-center transition ${preference === value ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}><Icon size={14} strokeWidth={1.5} /></button>)}
  </div>;
}
