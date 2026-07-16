'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, BriefcaseBusiness, CalendarDays, ChartNoAxesCombined, FileText, MessageCircle, Phone, Search, Settings, ShieldCheck, Users, UserRoundSearch } from 'lucide-react';
import { PixelBackground } from '@/app/components/PixelBackground';
import OndwiraLogo, { OndwiraBadge } from '@/app/components/brand/OndwiraLogo';
import { useTheme } from '@/app/context/ThemeContext';

type Mode = 'social' | 'work';

const socialNav = [
  { label: 'Chats', href: '/social', icon: MessageCircle },
  { label: 'Updates', href: '/social/updates', icon: Bell },
  { label: 'Calls', href: '/social/calls', icon: Phone },
];

const workNav = [
  { label: 'Work chats', href: '/work', icon: MessageCircle },
  { label: 'Meetings', href: '/work/meetings', icon: CalendarDays },
  { label: 'People', href: '/work/people', icon: Users },
  { label: 'Jobs', href: '/work/jobs', icon: BriefcaseBusiness },
  { label: 'Applications', href: '/work/applications', icon: FileText },
  { label: 'Reports', href: '/work/reports', icon: ChartNoAxesCombined },
];

export default function OndwiraShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const mode: Mode = pathname.startsWith('/work') ? 'work' : 'social';
  const [findWorkEnabled, setFindWorkEnabled] = useState(false);

  useEffect(() => {
    const sync = () => setFindWorkEnabled(localStorage.getItem('ondwira_find_work') === 'true');
    sync();
    window.addEventListener('ondwira:preferences', sync);
    return () => window.removeEventListener('ondwira:preferences', sync);
  }, []);

  const nav = mode === 'social' ? socialNav : workNav;
  const changeMode = (next: Mode) => router.push(next === 'social' ? '/social' : '/work');

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors">
      <PixelBackground isDark={theme === 'dark'} className="fixed inset-0 z-0 pointer-events-none" />
      <header className="sticky top-0 z-40 border-b border-[var(--border-secondary)] bg-[color:var(--surface-raised)]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
          <button onClick={() => router.push('/social')} className="flex items-center gap-2.5" aria-label="Ondwira home">
            <OndwiraBadge className="h-9 w-9 rounded-xl" />
            <OndwiraLogo variant="lowercase" className="hidden text-lg sm:inline-flex" markClassName="text-[var(--accent-primary)]" />
          </button>

          <div className="mx-auto flex rounded-full bg-[var(--surface-muted)] p-1 text-xs font-bold sm:text-sm" aria-label="Choose Ondwira mode">
            <button onClick={() => changeMode('social')} className={`rounded-full px-3 py-2 transition sm:px-5 ${mode === 'social' ? 'bg-[var(--surface-raised)] text-[var(--accent-primary)] shadow-sm' : 'text-[var(--text-secondary)]'}`}>Social</button>
            <button onClick={() => changeMode('work')} className={`rounded-full px-3 py-2 transition sm:px-5 ${mode === 'work' ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)] shadow-sm' : 'text-[var(--text-secondary)]'}`}>Work</button>
          </div>

          <button className="grid h-9 w-9 place-items-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]" aria-label="Search"><Search size={19} /></button>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex max-w-[1600px]">
        <aside className="ondwira-scrollbar fixed inset-x-0 bottom-0 z-40 flex h-[4.5rem] touch-pan-x snap-x snap-mandatory items-center justify-start overflow-x-auto overscroll-x-contain border-t border-[var(--border-secondary)] bg-[var(--surface-raised)] px-2 pb-1 md:sticky md:top-16 md:h-[calc(100dvh-4rem)] md:w-60 md:shrink-0 md:touch-pan-y md:snap-none md:flex-col md:items-stretch md:self-start md:overflow-x-hidden md:overflow-y-auto md:overscroll-y-contain md:border-r md:border-t-0 md:p-4">
          <p className="mb-3 hidden px-3 pt-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#8a918b] md:block">{mode === 'social' ? 'Your space' : 'Workspace'}</p>
          {nav.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return <button key={href} onClick={() => router.push(href)} className={`flex min-w-[4.5rem] snap-start flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold transition md:min-w-0 md:snap-none md:flex-row md:gap-3 md:text-sm ${active ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--accent-primary)]'}`}><Icon size={19} /><span className="truncate">{label}</span></button>;
          })}
          {mode === 'social' && findWorkEnabled && <button onClick={() => router.push('/find-work')} className={`flex min-w-[4.5rem] snap-start flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold md:min-w-0 md:snap-none md:flex-row md:gap-3 md:text-sm ${pathname === '/find-work' ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'}`}><UserRoundSearch size={19} /><span>Find work</span></button>}
          <div className="hidden flex-1 md:block" />
          <button onClick={() => router.push('/settings')} className={`flex min-w-[4.5rem] snap-start flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold md:min-w-0 md:snap-none md:flex-row md:gap-3 md:text-sm ${pathname.startsWith('/settings') ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'}`}><Settings size={19} /><span>Settings</span></button>
          <div className="mt-3 hidden rounded-2xl bg-[var(--accent-soft)] p-3 text-xs leading-5 text-[var(--text-secondary)] md:flex md:gap-2"><ShieldCheck size={17} className="mt-0.5 shrink-0" /><span>One account. Work access follows your organisation permissions.</span></div>
        </aside>
        <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
