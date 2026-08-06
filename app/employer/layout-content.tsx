'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, BriefcaseBusiness, Building2, ChevronLeft, ChevronRight, CreditCard, FilePlus2, LayoutDashboard, LogOut, Menu, MessageSquareText, Settings, ShieldCheck, Users, X } from 'lucide-react';
import ThemeToggle from '@/app/components/ThemeToggle';
import ProfcariaLogo from '@/app/components/brand/ProfcariaLogo';
import { useNotificationContext } from '@/app/context/NotificationContext';

const sections = [
  { label: 'Workspace', items: [
    { href: '/employer/home', label: 'Overview', icon: LayoutDashboard },
    { href: '/employer/jobs', label: 'Jobs', icon: BriefcaseBusiness },
    { href: '/employer/jobs/create', label: 'Create job', icon: FilePlus2 },
    { href: '/employer/applications', label: 'Applicants', icon: Users },
  ]},
  { label: 'Decide', items: [
    { href: '/employer/messages', label: 'Messages', icon: MessageSquareText },
    { href: '/employer/analytics', label: 'Insights', icon: BarChart3 },
    { href: '/employer/recruiter-ai', label: 'ATS & AI', icon: ShieldCheck },
  ]},
  { label: 'Company', items: [
    { href: '/employer/billing', label: 'Billing & wallet', icon: CreditCard },
    { href: '/employer/settings', label: 'Settings', icon: Settings },
  ]},
];

export default function EmployerLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount } = useNotificationContext();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [company, setCompany] = useState('Company workspace');

  useEffect(() => {
    const saved = localStorage.getItem('profcaria-company-sidebar');
    setCollapsed(saved === 'collapsed');
    fetch('/api/auth/me').then(response => response.ok ? response.json() : null).then(body => {
      if (!body?.uid) return router.replace('/?auth=company');
      setCompany(body.profile?.companyName || body.profile?.name || body.name || 'Company workspace');
    }).catch(() => undefined);
  }, [router]);

  function toggleCollapsed() {
    setCollapsed(value => { const next = !value; localStorage.setItem('profcaria-company-sidebar', next ? 'collapsed' : 'open'); return next; });
  }
  async function logout() { await fetch('/api/auth/logout', { method: 'POST' }); router.replace('/'); }

  const sidebar = <aside className={`flex h-full flex-col border-r-2 border-[var(--text-primary)] bg-[var(--surface-raised)] transition-[width] ${collapsed ? 'w-[76px]' : 'w-[264px]'}`}>
    <div className="flex h-16 items-center justify-between border-b border-[var(--border-primary)] px-4"><Link href="/" className="overflow-hidden">{collapsed ? <span className="font-editorial text-xl font-semibold">P</span> : <ProfcariaLogo className="text-lg" />}</Link><button onClick={toggleCollapsed} className="hidden lg:block" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button></div>
    {!collapsed && <div className="border-b border-[var(--border-primary)] px-5 py-4"><p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Company</p><p className="mt-1 truncate text-sm font-black">{company}</p></div>}
    <nav className="profcaria-scrollbar flex-1 overflow-y-auto px-3 py-4">{sections.map(section => <div key={section.label} className="mb-6">{!collapsed && <p className="mb-2 px-2 font-mono text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">{section.label}</p>}{section.items.map(item => { const active = pathname === item.href || (item.href !== '/employer/home' && pathname.startsWith(item.href)); const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} title={collapsed ? item.label : undefined} className={`mb-1 flex h-11 items-center gap-3 border-2 px-3 text-sm font-bold ${active ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-[3px_3px_0_var(--accent-primary)]' : 'border-transparent hover:border-[var(--border-primary)] hover:bg-[var(--surface-muted)]'}`}><Icon size={17} className="shrink-0" />{!collapsed && <span>{item.label}</span>}{!collapsed && item.label === 'Messages' && unreadCount > 0 && <span className="ml-auto bg-[var(--accent-primary)] px-1.5 py-0.5 font-mono text-[9px] text-white">{unreadCount}</span>}</Link>; })}</div>)}</nav>
    <div className="border-t-2 border-[var(--text-primary)] p-3"><button onClick={logout} className="flex h-11 w-full items-center gap-3 px-3 text-sm font-bold hover:bg-red-500/10 hover:text-red-600"><LogOut size={17} />{!collapsed && 'Sign out'}</button></div>
  </aside>;

  return <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
    <div className="fixed inset-y-0 left-0 z-50 hidden lg:block">{sidebar}</div>
    {open && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-label="Close navigation" /><div className="relative h-full w-[264px]">{sidebar}</div></div>}
    <div className={`transition-[padding] ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-[264px]'}`}>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b-2 border-[var(--text-primary)] bg-[var(--bg-primary)]/95 px-4 backdrop-blur sm:px-6"><div className="flex items-center gap-3"><button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></button><div><p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-[var(--accent-primary)]">Company console</p><p className="text-sm font-black">{sections.flatMap(s => s.items).find(item => pathname === item.href || (item.href !== '/employer/home' && pathname.startsWith(item.href)))?.label || 'Workspace'}</p></div></div><div className="flex items-center gap-3"><Link href="/" className="hidden font-mono text-[10px] font-black uppercase sm:block">View public jobs</Link><ThemeToggle showSystem={false} /></div></header>
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  </div>;
}
