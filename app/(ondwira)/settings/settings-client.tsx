'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import {
  ArrowUpRight,
  Bot,
  BriefcaseBusiness,
  Check,
  CircleDashed,
  FileText,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogOut,
  Palette,
  Phone,
  Shield,
  UserRound,
} from 'lucide-react';
import ThemeToggle from '@/app/components/ThemeToggle';
import { useTheme, type FontPreference } from '@/app/context/ThemeContext';

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
);

const sections = [
  { title: 'CVs and documents', text: 'CV versions, certificates, files, writing and saved signatures.', note: 'Open document room', icon: FileText, href: '/settings/documents' },
  { title: 'Work record', text: 'Job preferences, verified employment and application history.', note: 'Open work record', icon: BriefcaseBusiness, href: '/settings/employment' },
  { title: 'Account and identity', text: 'Your unique username, private phone number and account identity.', note: 'Open identity room', icon: UserRound, href: '/settings/identity' },
  { title: 'Privacy and safety', text: 'Blocked people, chat locks, visibility and screen privacy.', note: 'Being prepared', icon: Shield },
  { title: 'Chats and appearance', text: 'Wallpaper, message defaults, stickers and conversation display.', note: 'Being prepared', icon: Palette },
  { title: 'Agent connections', text: 'Give an external AI agent only the access you approve.', note: 'Being prepared', icon: Bot },
  { title: 'Security', text: 'Passkeys, two-step verification, sessions and recovery.', note: 'Security setup available', icon: KeyRound, href: '/?mode=setup&redirect=/settings' },
] as const;

const fontOptions: Array<{ value: FontPreference; label: string; sample: string }> = [
  { value: 'modern', label: 'Modern', sample: 'Clear and quiet' },
  { value: 'heritage', label: 'Heritage', sample: 'Established character' },
  { value: 'editorial', label: 'Editorial', sample: 'A printed-page rhythm' },
  { value: 'accessible', label: 'Accessible', sample: 'Maximum legibility' },
  { value: 'system', label: 'Device', sample: 'Follow this device' },
];

export default function SettingsClient() {
  const { fontPreference, setFontPreference } = useTheme();
  const [findWork, setFindWork] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  useEffect(() => {
    const sync = () => setFindWork(localStorage.getItem('ondwira_find_work') === 'true');
    const frame = window.requestAnimationFrame(sync);
    window.addEventListener('ondwira:preferences', sync);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('ondwira:preferences', sync);
    };
  }, []);

  function updateFindWork(enabled: boolean) {
    setFindWork(enabled);
    localStorage.setItem('ondwira_find_work', String(enabled));
    window.dispatchEvent(new Event('ondwira:preferences'));
  }

  async function logOut() {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError('');

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Ondwira could not close this session.');

      // Google OAuth can leave a separate local Supabase session behind.
      // Close only this device session; other signed-in devices remain active.
      await supabaseAuth.auth.signOut({ scope: 'local' }).catch(() => undefined);
      window.location.replace('/');
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : 'Ondwira could not close this session.');
      setLoggingOut(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-7 sm:py-9 lg:px-10 lg:py-12">
      <div className="overflow-hidden rounded-[28px] border border-[var(--border-secondary)] bg-[var(--surface-raised)]/90 shadow-[0_24px_80px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:rounded-[34px]">
        <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)]">
          <header className="relative border-b border-[var(--border-secondary)] p-6 sm:p-9 lg:border-b-0 lg:border-r lg:p-12">
            <div className="absolute inset-x-0 top-0 h-1 bg-[var(--accent-primary)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--accent-primary)]">The personal ledger</p>
            <h1 className="mt-5 max-w-2xl font-editorial text-4xl leading-[0.96] tracking-[-0.04em] sm:text-6xl">Your life in Ondwira, arranged around you.</h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">One account holds your identity, conversations and work history. Organisations receive permission to a workspace; they never own your personal account.</p>
            <div className="mt-8 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-secondary)] bg-[var(--surface-muted)] px-4 py-2 text-xs font-bold"><LockKeyhole size={14} className="text-[var(--accent-primary)]" /> Private by default</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-secondary)] bg-[var(--surface-muted)] px-4 py-2 text-xs font-bold"><Check size={14} className="text-[var(--accent-primary)]" /> One account</span>
            </div>
          </header>

          <div className="grid divide-y divide-[var(--border-secondary)]">
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--text-muted)]">Room tone</p><h2 className="mt-2 font-editorial text-2xl">Appearance</h2><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">System, light or dark. Your choice is remembered.</p></div>
                <ThemeToggle />
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between gap-5">
                <div className="flex min-w-0 gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><BriefcaseBusiness size={20} /></span><div><h2 className="font-bold">Find work in Social</h2><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">Show opportunity discovery without turning Social into a public feed.</p></div></div>
                <button type="button" onClick={() => updateFindWork(!findWork)} className={`relative h-8 w-14 shrink-0 rounded-full p-1 transition-colors ${findWork ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border-primary)]'}`} aria-label="Show Find work in Social" aria-pressed={findWork}><span className={`block h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${findWork ? 'translate-x-6' : ''}`} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[26px] border border-[var(--border-secondary)] bg-[var(--surface-raised)]/88 p-5 backdrop-blur-sm sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent-primary)]">Typography cabinet</p><h2 className="mt-2 font-editorial text-3xl">Choose how Ondwira reads</h2></div><span className="text-xs text-[var(--text-muted)]">Saved to your account</span></div>
        <div className="mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-5">
          {fontOptions.map((option) => {
            const selected = fontPreference === option.value;
            return <button key={option.value} type="button" onClick={() => setFontPreference(option.value)} aria-pressed={selected} className={`relative min-h-36 rounded-[20px] border p-4 text-left transition sm:p-5 ${selected ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)] shadow-sm' : 'border-[var(--border-secondary)] bg-[var(--bg-primary)]/40 hover:border-[var(--accent-primary)]'}`}>{selected && <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-[var(--accent-primary)] text-[var(--text-inverse)]"><Check size={12} /></span>}<span className="block font-editorial text-3xl text-[var(--accent-primary)]">Aa</span><span className="mt-4 block text-sm font-black">{option.label}</span><span className="mt-1 block text-[11px] leading-5 text-[var(--text-secondary)]">{option.sample}</span></button>;
          })}
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent-primary)]">Private rooms</p><h2 className="mt-2 font-editorial text-3xl sm:text-4xl">Everything has its proper place.</h2></div><p className="max-w-sm text-xs leading-5 text-[var(--text-muted)]">Available rooms open now. Areas still being moved into Ondwira are clearly marked.</p></div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sections.map(({ title, text, note, icon: Icon, ...section }, index) => {
          const available = 'href' in section && Boolean(section.href);
          const content = <><div className="flex items-start justify-between gap-3"><span className="grid h-12 w-12 place-items-center rounded-[18px] bg-[var(--accent-soft)] text-[var(--accent-primary)]"><Icon size={21} /></span><span className="font-editorial text-xl text-[var(--text-muted)]">0{index + 1}</span></div><h3 className="mt-7 font-editorial text-2xl">{title}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-[var(--text-secondary)]">{text}</p><span className={`mt-6 flex items-center gap-2 border-t border-[var(--border-secondary)] pt-4 text-[10px] font-black uppercase tracking-[0.18em] ${available ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`}>{available ? <ArrowUpRight size={14} /> : <CircleDashed size={14} />}{note}</span></>;
          const className = `group rounded-[24px] border border-[var(--border-secondary)] bg-[var(--surface-raised)]/88 p-5 text-left backdrop-blur-sm transition sm:p-6 ${available ? 'hover:-translate-y-0.5 hover:border-[var(--accent-primary)] hover:shadow-lg' : 'cursor-default opacity-80'}`;
          return available ? <Link key={title} href={section.href} className={className}>{content}</Link> : <article key={title} className={className} aria-label={`${title}, ${note}`}>{content}</article>;
        })}
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-[22px] border border-[var(--border-secondary)] bg-[var(--surface-muted)]/90 p-5 text-sm leading-6 text-[var(--text-secondary)]"><Phone size={18} className="mt-0.5 shrink-0 text-[var(--accent-primary)]" /><p>Phone and email belong to one Ondwira account. Workspaces are permissions attached to that account, never a separate employer login.</p></div>

      <div className="mt-5 flex flex-col gap-5 rounded-[24px] border border-[var(--border-secondary)] bg-[var(--surface-raised)]/90 p-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-[var(--accent-soft)] text-[var(--accent-primary)]"><LogOut size={21} /></span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent-primary)]">This device</p>
            <h2 className="mt-1 font-editorial text-2xl">Leave Ondwira safely</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">Log out of this browser without deleting your account, conversations, documents or work history.</p>
            {logoutError && <p className="mt-2 text-xs font-bold text-red-500" role="alert">{logoutError}</p>}
          </div>
        </div>
        <button type="button" onClick={logOut} disabled={loggingOut} className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--accent-primary)] px-5 py-3 text-sm font-black text-[var(--accent-primary)] transition hover:bg-[var(--accent-primary)] hover:text-[var(--text-inverse)] disabled:cursor-wait disabled:opacity-60 sm:w-auto" aria-label="Log out of Ondwira on this device">
          {loggingOut ? <Loader2 size={17} className="animate-spin" /> : <LogOut size={17} />}
          {loggingOut ? 'Logging out…' : 'Log out'}
        </button>
      </div>
    </section>
  );
}
