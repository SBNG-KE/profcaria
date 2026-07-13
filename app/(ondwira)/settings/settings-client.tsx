'use client';

import { useEffect, useState } from 'react';
import { Bot, BriefcaseBusiness, ChevronRight, FileText, KeyRound, LockKeyhole, Palette, Phone, Shield, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/app/components/ThemeToggle';
import { useTheme, type FontPreference } from '@/app/context/ThemeContext';

const sections = [
  { title: 'Account and identity', text: 'Name, photo, phone number, email and linked devices', icon: UserRound },
  { title: 'Privacy and safety', text: 'Blocked people, chat locks, visibility and screen privacy', icon: Shield },
  { title: 'Chats and appearance', text: 'Font, theme, wallpaper, stickers and message defaults', icon: Palette },
  { title: 'CVs and documents', text: 'CV versions, certificates, files, writing and saved signatures', icon: FileText, href: '/settings/documents' },
  { title: 'Jobs and applications', text: 'Job preferences, verified work and application history', icon: BriefcaseBusiness, href: '/settings/employment' },
  { title: 'Agent connections', text: 'Connect ChatGPT, Gemini or another agent with scoped access', icon: Bot },
  { title: 'Security', text: 'Passkeys, two-step verification, sessions and recovery', icon: KeyRound },
];

export default function SettingsClient() {
  const router = useRouter();
  const { fontPreference, setFontPreference } = useTheme();
  const [findWork, setFindWork] = useState(false);
  useEffect(() => { const sync = () => setFindWork(localStorage.getItem('ondwira_find_work') === 'true'); sync(); }, []);
  function updateFindWork(enabled: boolean) {
    setFindWork(enabled);
    localStorage.setItem('ondwira_find_work', String(enabled));
    window.dispatchEvent(new Event('ondwira:preferences'));
  }
  const fontOptions: Array<{ value: FontPreference; label: string; sample: string }> = [
    { value: 'modern', label: 'Modern', sample: 'Clear and quiet' },
    { value: 'heritage', label: 'Heritage', sample: 'Established character' },
    { value: 'editorial', label: 'Editorial', sample: 'A printed-page rhythm' },
    { value: 'accessible', label: 'Accessible', sample: 'Maximum legibility' },
    { value: 'system', label: 'Device', sample: 'Follow this device' },
  ];
  return <section className="mx-auto max-w-6xl p-5 sm:p-8"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Your Ondwira</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">Settings</h1><p className="mt-2 text-[var(--text-secondary)]">Your identity, work, files, privacy, and connected agents live here.</p></div><div className="flex items-center gap-3"><ThemeToggle /><div className="flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-2 text-xs font-bold text-[var(--accent-primary)]"><LockKeyhole size={15} /> Private by default</div></div></div><div className="mt-7 rounded-[28px] bg-[var(--accent-primary)] p-6 text-[var(--text-inverse)] sm:flex sm:items-center sm:justify-between"><div className="flex gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10"><BriefcaseBusiness /></span><div><h2 className="font-black">Show Find work</h2><p className="mt-1 text-sm leading-6 opacity-70">Add Find work to Social navigation and allow opportunity discovery.</p></div></div><button onClick={() => updateFindWork(!findWork)} className={`mt-5 flex h-8 w-14 items-center rounded-full p-1 transition sm:mt-0 ${findWork ? 'bg-[var(--accent-warm)]' : 'bg-white/20'}`} aria-pressed={findWork}><span className={`h-6 w-6 rounded-full bg-white shadow transition ${findWork ? 'translate-x-6' : ''}`} /></button></div><div className="mt-5 rounded-[24px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-5"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Typography</p><h2 className="mt-1 font-black">Choose how Ondwira reads</h2></div><span className="text-xs text-[var(--text-muted)]">Saved to your account</span></div><div className="mt-4 grid gap-2 sm:grid-cols-5">{fontOptions.map(option => <button key={option.value} onClick={() => setFontPreference(option.value)} className={`rounded-2xl border p-4 text-left transition ${fontPreference === option.value ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)]' : 'border-[var(--border-secondary)] hover:border-[var(--accent-primary)]'}`}><span className="block text-sm font-black">{option.label}</span><span className="mt-2 block text-xs leading-5 text-[var(--text-secondary)]">{option.sample}</span></button>)}</div></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{sections.map(({ title, text, icon: Icon, ...section }) => <button key={title} onClick={() => 'href' in section && section.href ? router.push(section.href) : undefined} className="group flex items-center gap-4 rounded-[22px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-5 text-left transition hover:border-[var(--accent-primary)] hover:shadow-lg"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><Icon size={20} /></span><span className="min-w-0 flex-1"><span className="block font-black">{title}</span><span className="mt-1 block text-sm leading-5 text-[var(--text-secondary)]">{text}</span></span><ChevronRight size={18} className="text-[var(--text-muted)] transition group-hover:translate-x-0.5" /></button>)}</div><div className="mt-5 flex items-start gap-3 rounded-[22px] border border-[var(--border-secondary)] bg-[var(--surface-muted)] p-5 text-sm leading-6 text-[var(--text-secondary)]"><Phone size={18} className="mt-0.5 shrink-0" /><p>Phone and email belong to one Ondwira account. Workspaces are permissions attached to that account, not a separate employer login.</p></div></section>;
}
