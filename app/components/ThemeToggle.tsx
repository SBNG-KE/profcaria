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
  return <div className="flex border border-[var(--border-primary)] bg-[var(--surface-muted)] p-1 shadow-[3px_3px_0_var(--border-primary)]" aria-label="Appearance">
    {choices.filter(({ value }) => props.showSystem !== false || value !== 'system').map(({ value, label, icon: Icon }) => <button key={value} onClick={() => setPreference(value)} title={label} aria-label={`${label} appearance`} aria-pressed={preference === value} className={`grid h-8 w-8 place-items-center transition ${preference === value ? 'bg-[var(--text-primary)] text-[var(--accent-secondary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--accent-primary)]'}`}><Icon size={15} /></button>)}
  </div>;
}
