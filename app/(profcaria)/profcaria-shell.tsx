'use client';

import { usePathname, useRouter } from 'next/navigation';
import { BriefcaseBusiness, FileText, MessageSquareText, Settings } from 'lucide-react';
import ProfcariaLogo from '@/app/components/brand/ProfcariaLogo';
import ThemeToggle from '@/app/components/ThemeToggle';

const navigation = [
  { label: 'Jobs', href: '/find-work', icon: BriefcaseBusiness },
  { label: 'Applications', href: '/work/applications', icon: FileText },
  { label: 'Messages', href: '/work', icon: MessageSquareText },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function ProfcariaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  return <div className="min-h-dvh bg-[var(--bg-primary)] text-[var(--text-primary)]">
    <header className="sticky top-0 z-40 border-b-2 border-[var(--text-primary)] bg-[var(--bg-primary)]/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6"><button onClick={() => router.push('/')} className="text-lg"><ProfcariaLogo /></button><ThemeToggle showSystem={false} /></div></header>
    <div className="mx-auto flex max-w-[1500px]">
      <aside className="profcaria-scrollbar fixed inset-x-0 bottom-0 z-40 flex h-[4.5rem] overflow-x-auto border-t-2 border-[var(--text-primary)] bg-[var(--surface-raised)] p-2 md:sticky md:top-16 md:h-[calc(100dvh-4rem)] md:w-56 md:shrink-0 md:flex-col md:border-r-2 md:border-t-0 md:p-4">
        {navigation.map(item => { const active = pathname === item.href || (item.href !== '/work' && pathname.startsWith(`${item.href}/`)); const Icon = item.icon; return <button key={item.href} onClick={() => router.push(item.href)} className={`flex min-w-[5.5rem] flex-1 flex-col items-center justify-center gap-1 border-2 px-3 py-2 font-mono text-[10px] font-black uppercase md:mb-2 md:min-w-0 md:flex-none md:flex-row md:justify-start md:gap-3 md:text-xs ${active ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-[3px_3px_0_var(--accent-primary)]' : 'border-transparent hover:bg-[var(--surface-muted)]'}`}><Icon size={17} /><span>{item.label}</span></button>; })}
        <div className="hidden flex-1 md:block" /><p className="hidden border-t border-[var(--border-primary)] pt-4 text-xs leading-5 text-[var(--text-muted)] md:block">Sign in is only required to track applications and reply to companies.</p>
      </aside>
      <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
    </div>
  </div>;
}
