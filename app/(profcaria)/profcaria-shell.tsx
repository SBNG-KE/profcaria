'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  UserCog,
  WalletCards,
} from 'lucide-react';
import ProfcariaLogo from '@/app/components/brand/ProfcariaLogo';
import ThemeToggle from '@/app/components/ThemeToggle';

const companyNavigation = [
  { label: 'Overview', href: '/work', icon: LayoutDashboard },
  { label: 'Jobs', href: '/work/jobs', icon: BriefcaseBusiness },
  { label: 'Applicants', href: '/work/applications', icon: FileText },
  { label: 'Interviews', href: '/work/meetings', icon: CalendarClock },
  { label: 'Recruiters', href: '/work/people', icon: UserCog },
  { label: 'Reports', href: '/work/reports', icon: BarChart3 },
  { label: 'Billing', href: '/work/billing', icon: WalletCards },
];

export default function ProfcariaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isCompanyArea = pathname === '/work' || pathname.startsWith('/work/');

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    window.location.assign('/');
  }

  if (!isCompanyArea) {
    return <div className="min-h-dvh bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border-primary)] bg-[var(--bg-primary)]"><div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-5 sm:px-8"><button onClick={() => router.push('/')} className="text-lg"><ProfcariaLogo /></button><ThemeToggle showSystem={false} /></div></header>
      <main>{children}</main>
    </div>;
  }

  return <div className="min-h-dvh bg-[var(--bg-secondary)] text-[var(--text-primary)]">
    <header className="sticky top-0 z-40 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/96 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-7">
        <button onClick={() => router.push('/work')} className="flex min-w-0 items-center gap-3 text-left"><ProfcariaLogo /><span className="hidden h-5 w-px bg-[var(--border-primary)] sm:block" /><span className="hidden truncate text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] sm:block">Hiring workspace</span></button>
        <div className="flex items-center gap-2"><button onClick={() => router.push('/')} className="hidden items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] sm:flex">Public jobs <ExternalLink size={13} /></button><ThemeToggle showSystem={false} /></div>
      </div>
    </header>
    <div className="mx-auto flex max-w-[1600px]">
      <aside className="profcaria-scrollbar fixed inset-x-0 bottom-0 z-40 flex h-[4.75rem] overflow-x-auto border-t border-[var(--border-primary)] bg-[var(--accent-primary)] p-2 text-[var(--text-inverse)] md:sticky md:top-16 md:h-[calc(100dvh-4rem)] md:w-60 md:shrink-0 md:flex-col md:border-r md:border-t-0 md:p-4">
        <div className="hidden px-3 pb-5 pt-2 md:block"><p className="text-[9px] font-bold uppercase tracking-[0.24em] opacity-55">Company console</p><p className="font-editorial mt-2 text-2xl">Hiring operations</p></div>
        {companyNavigation.map(item => {
          const active = item.href === '/work' ? pathname === '/work' : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return <button key={item.href} onClick={() => router.push(item.href)} className={`flex min-w-[5.9rem] flex-1 flex-col items-center justify-center gap-1 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.08em] transition md:mb-1 md:min-w-0 md:flex-none md:flex-row md:justify-start md:gap-3 md:px-3 md:py-3 md:text-[10px] md:tracking-[0.14em] ${active ? 'bg-[var(--bg-primary)] text-[var(--accent-primary)]' : 'opacity-68 hover:bg-white/10 hover:opacity-100'}`}><Icon size={17} /><span>{item.label}</span></button>;
        })}
        <div className="hidden flex-1 md:block" />
        <button onClick={logout} className="hidden items-center gap-3 border-t border-white/15 px-3 pt-5 text-[10px] font-bold uppercase tracking-[0.14em] opacity-70 hover:opacity-100 md:flex"><LogOut size={16} /> Log out</button>
      </aside>
      <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
    </div>
  </div>;
}
