'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, BriefcaseBusiness, CalendarDays, ChartNoAxesCombined, FileText, MessageCircle, Phone, Search, Settings, ShieldCheck, Users, UserRoundSearch } from 'lucide-react';

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
    <div className="min-h-dvh bg-[#f4f1ea] text-[#18251f]">
      <header className="sticky top-0 z-40 border-b border-[#18251f]/10 bg-[#f8f6f0]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
          <button onClick={() => router.push('/social')} className="flex items-center gap-2.5" aria-label="Ondwira home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#183d31] font-black text-[#f6c85f]">O</span>
            <span className="hidden text-lg font-black tracking-[-0.04em] sm:block">ondwira</span>
          </button>

          <div className="mx-auto flex rounded-full bg-[#e9e5dc] p-1 text-sm font-bold" aria-label="Choose Ondwira mode">
            <button onClick={() => changeMode('social')} className={`rounded-full px-5 py-2 transition ${mode === 'social' ? 'bg-white text-[#183d31] shadow-sm' : 'text-[#6f776f]'}`}>Social</button>
            <button onClick={() => changeMode('work')} className={`rounded-full px-5 py-2 transition ${mode === 'work' ? 'bg-[#183d31] text-white shadow-sm' : 'text-[#6f776f]'}`}>Work</button>
          </div>

          <button className="grid h-9 w-9 place-items-center rounded-xl text-[#59655e] hover:bg-white" aria-label="Search"><Search size={19} /></button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        <aside className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-[#18251f]/10 bg-[#fbfaf7] px-2 md:sticky md:top-16 md:h-[calc(100dvh-4rem)] md:w-60 md:shrink-0 md:flex-col md:items-stretch md:justify-start md:border-r md:border-t-0 md:p-4">
          <p className="mb-3 hidden px-3 pt-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#8a918b] md:block">{mode === 'social' ? 'Your space' : 'Workspace'}</p>
          {nav.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return <button key={href} onClick={() => router.push(href)} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold transition md:flex-row md:gap-3 md:text-sm ${active ? 'bg-[#183d31] text-white' : 'text-[#667069] hover:bg-white hover:text-[#183d31]'}`}><Icon size={19} /><span className="truncate">{label}</span></button>;
          })}
          {mode === 'social' && findWorkEnabled && <button onClick={() => router.push('/find-work')} className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold md:flex-row md:gap-3 md:text-sm ${pathname === '/find-work' ? 'bg-[#183d31] text-white' : 'text-[#667069] hover:bg-white'}`}><UserRoundSearch size={19} /><span>Find work</span></button>}
          <div className="hidden flex-1 md:block" />
          <button onClick={() => router.push('/settings')} className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-bold md:flex-row md:gap-3 md:text-sm ${pathname === '/settings' ? 'bg-[#183d31] text-white' : 'text-[#667069] hover:bg-white'}`}><Settings size={19} /><span>Settings</span></button>
          <div className="mt-3 hidden rounded-2xl bg-[#e8efe9] p-3 text-xs leading-5 text-[#476057] md:flex md:gap-2"><ShieldCheck size={17} className="mt-0.5 shrink-0" /><span>Social and work access stay separated by permissions.</span></div>
        </aside>
        <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      </div>
    </div>
  );
}
