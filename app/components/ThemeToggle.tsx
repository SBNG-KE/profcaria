"use client"

import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePreference } from '../context/ThemeContext';

export default function ThemeToggle(props: { theme?: 'light' | 'dark'; onToggle?: () => void }) {
  void props;
  const { preference, setPreference } = useTheme();
  const choices: Array<{ value: ThemePreference; label: string; icon: typeof Sun }> = [
    { value: 'system', label: 'System', icon: Laptop },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
  ];
  return <div className="flex rounded-full border border-[var(--border-primary)] bg-[var(--surface-muted)] p-1" aria-label="Appearance">
    {choices.map(({ value, label, icon: Icon }) => <button key={value} onClick={() => setPreference(value)} title={label} aria-label={`${label} appearance`} aria-pressed={preference === value} className={`grid h-8 w-8 place-items-center rounded-full transition ${preference === value ? 'bg-[var(--surface-raised)] text-[var(--accent-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}><Icon size={15} /></button>)}
  </div>;
}
