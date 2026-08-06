'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { BriefcaseBusiness, ChevronDown, LogOut, MessageSquareText } from 'lucide-react';
import HomeMessagesDrawer from './HomeMessagesDrawer';

type Account = {
  id: string;
  schema: 'professional' | 'employer';
  hasCompanyWorkspace?: boolean;
  profile?: { firstName?: string; lastName?: string; companyName?: string };
};

export default function HomeAccountMenu({ onSignIn }: { onSignIn: () => void }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me?optional=1', { cache: 'no-store' })
      .then(async response => response.ok ? response.json() : null)
      .then(data => setAccount(data?.id ? data : null))
      .catch(() => setAccount(null));
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (!account) return <button onClick={onSignIn} className="border border-[var(--accent-primary)] bg-[var(--accent-primary)] px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--text-inverse)] transition hover:bg-[var(--accent-strong)] sm:px-6 sm:text-[11px] sm:tracking-[0.15em]">Sign in</button>;

  const profile = account.profile || {};
  const personName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
  const name = personName || profile.companyName || 'Account';

  async function logout() {
    if (signingOut) return;
    setSigningOut(true);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!);
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    window.location.assign('/');
  }

  return <>
    <div ref={menuRef} className="relative">
      <button onClick={() => setMenuOpen(current => !current)} className="flex max-w-[180px] items-center gap-2 border border-[var(--accent-primary)] bg-[var(--accent-primary)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-inverse)] transition hover:bg-[var(--accent-strong)] sm:max-w-[260px] sm:px-5" aria-expanded={menuOpen}>
        <span className="truncate">{name}</span><ChevronDown size={14} className={`shrink-0 transition ${menuOpen ? 'rotate-180' : ''}`} />
      </button>
      {menuOpen && <div className="absolute right-0 top-[calc(100%+10px)] w-56 border border-[var(--border-primary)] bg-[var(--surface-raised)] p-1.5 shadow-xl">
        {account.hasCompanyWorkspace && <Link href="/work" className="flex items-center gap-3 px-3 py-3 text-sm font-semibold transition hover:bg-[var(--surface-muted)]"><BriefcaseBusiness size={17} />Company workspace</Link>}
        <button onClick={() => { setMenuOpen(false); setMessagesOpen(true); }} className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm font-semibold transition hover:bg-[var(--surface-muted)]"><MessageSquareText size={17} />Messages</button>
        <button onClick={logout} disabled={signingOut} className="flex w-full items-center gap-3 border-t border-[var(--border-secondary)] px-3 py-3 text-left text-sm font-semibold transition hover:bg-[var(--surface-muted)] disabled:opacity-50"><LogOut size={17} />{signingOut ? 'Signing out...' : 'Log out'}</button>
      </div>}
    </div>
    <HomeMessagesDrawer isOpen={messagesOpen} onClose={() => setMessagesOpen(false)} />
  </>;
}
