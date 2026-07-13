"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import Lenis from 'lenis';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import HangingAuthCard from './HangingAuthCard';
import HangingContactCard from './HangingContactCard';
import { PixelBackground } from './PixelBackground';
import OndwiraLogo, { OndwiraMark } from './brand/OndwiraLogo';
import { useTheme } from '../context/ThemeContext';

const chapters = [
  ['01', 'Talk freely', 'Private conversations, groups, calls and updates live in Social.'],
  ['02', 'Find your next chapter', 'Discover work and apply with the verified information you already keep.'],
  ['03', 'Enter work', 'A signed offer can place you into the right organisation and groups automatically.'],
  ['04', 'Carry your history', 'When work ends, access closes while your verified experience remains yours.'],
];

function Rule({ label }: { label: string }) {
  return <div className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)]"><span className="h-px flex-1 bg-[var(--border-primary)]" /><span>{label}</span><span className="h-px flex-1 bg-[var(--border-primary)]" /></div>;
}

export default function LandingPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [authOpen, setAuthOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);
  const queryMode = searchParams.get('mode');
  const queryAuth = searchParams.get('auth');
  const queryScreen: 'auth' | 'security_setup' | 'security_verify' = queryMode === 'verify' ? 'security_verify' : queryMode === 'setup' ? 'security_setup' : 'auth';
  const authVisible = authOpen || Boolean(queryMode || queryAuth);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.05, smoothWheel: true, touchMultiplier: 1.5 });
    lenisRef.current = lenis;
    let frame = 0;
    const tick = (time: number) => { lenis.raf(time); frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); lenis.destroy(); lenisRef.current = null; };
  }, []);

  useEffect(() => {
    if (searchParams.get('mode')) return;
    fetch('/api/auth/me', { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) return;
      const data = await response.json();
      if (data.uid || data.id) router.replace('/social');
    }).catch(() => undefined);
  }, [router, searchParams]);

  useEffect(() => {
    const open = authVisible || contactOpen;
    if (open) lenisRef.current?.stop(); else lenisRef.current?.start();
    document.documentElement.style.overflow = open ? 'hidden' : '';
    return () => { document.documentElement.style.overflow = ''; };
  }, [authVisible, contactOpen]);

  const openAuth = () => setAuthOpen(true);
  const closeAuth = () => { setAuthOpen(false); if (queryMode || queryAuth) router.replace('/'); };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent-soft)]">
      <PixelBackground isDark={theme === 'dark'} className="fixed inset-0 z-0 pointer-events-none" />
      <HangingAuthCard isOpen={authVisible} onClose={closeAuth} initialScreen={queryScreen} />
      <HangingContactCard isOpen={contactOpen} onClose={() => setContactOpen(false)} />

      <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--border-secondary)] bg-[color:var(--bg-primary)]/88 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1480px] items-center justify-between px-5 md:px-10">
          <a href="#top" className="text-[22px] text-[var(--text-primary)]"><OndwiraLogo /></a>
          <nav className="hidden items-center gap-9 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)] md:flex">
            <a href="#one-account" className="transition-colors hover:text-[var(--accent-primary)]">One account</a>
            <a href="#continuity" className="transition-colors hover:text-[var(--accent-primary)]">Continuity</a>
            <a href="#private" className="transition-colors hover:text-[var(--accent-primary)]">Privacy</a>
          </nav>
          <div className="flex items-center gap-3 md:gap-6">
            <ThemeToggle />
            <button onClick={openAuth} className="border border-[var(--accent-primary)] bg-[var(--accent-primary)] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--text-inverse)] transition-transform hover:-translate-y-0.5 md:px-6">Enter Ondwira</button>
          </div>
        </div>
      </header>

      <section id="top" className="relative z-10 mx-auto grid min-h-screen max-w-[1480px] items-center gap-12 px-5 pb-20 pt-32 md:px-10 lg:grid-cols-[1.25fr_0.75fr] lg:pt-28">
        <div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-8 text-[10px] font-bold uppercase tracking-[0.38em] text-[var(--accent-primary)]">Private correspondence · work continuity</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.08 }} className="font-editorial max-w-5xl text-[clamp(4.2rem,9.6vw,10rem)] font-medium leading-[0.78] tracking-[-0.055em]">
            Your life,<br /><span className="ml-[0.12em] italic text-[var(--accent-primary)]">kept together.</span>
          </motion.h1>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.45 }} className="mt-12 flex max-w-2xl flex-col gap-8 border-t border-[var(--border-primary)] pt-7 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-md text-base leading-7 text-[var(--text-secondary)]">One private account for the people you know, the work you do, and the proof you carry forward.</p>
            <button onClick={openAuth} className="group shrink-0 text-left text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--text-primary)]">Create your account<span className="mt-2 block h-px w-full origin-left bg-[var(--accent-primary)] transition-transform group-hover:scale-x-75" /></button>
          </motion.div>
        </div>

        <motion.aside initial={{ opacity: 0, x: 25 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.25 }} className="relative mx-auto w-full max-w-md border border-[var(--border-primary)] bg-[var(--surface-raised)]/78 p-5 shadow-[var(--shadow-glow)] backdrop-blur-sm lg:mr-0">
          <div className="absolute -left-3 -top-3 h-6 w-6 border-l border-t border-[var(--accent-primary)]" />
          <div className="absolute -bottom-3 -right-3 h-6 w-6 border-b border-r border-[var(--accent-primary)]" />
          <div className="flex min-h-[520px] flex-col border border-[var(--border-secondary)] px-7 py-8">
            <div className="flex items-start justify-between">
              <div><p className="text-[9px] font-bold uppercase tracking-[0.32em] text-[var(--text-muted)]">Personal ledger</p><p className="font-editorial mt-2 text-3xl">A life in continuity</p></div>
              <OndwiraMark className="h-16 w-12 text-[var(--accent-primary)]" />
            </div>
            <div className="my-8 h-px bg-[var(--border-primary)]" />
            <dl className="space-y-7">
              {[['Social', 'People, groups, calls and updates'], ['Opportunity', 'Jobs and applications without repetition'], ['Work', 'Teams, meetings and signed agreements'], ['Archive', 'Documents and verified experience']].map(([term, detail], index) => <div key={term} className="grid grid-cols-[36px_1fr] gap-4"><dt className="font-editorial text-xl italic text-[var(--accent-primary)]">{String(index + 1).padStart(2, '0')}</dt><dd><p className="font-semibold">{term}</p><p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{detail}</p></dd></div>)}
            </dl>
            <div className="mt-auto border-t border-[var(--border-primary)] pt-5 text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Owned by you · shared by permission</div>
          </div>
        </motion.aside>
      </section>

      <section id="one-account" className="relative z-10 border-y border-[var(--border-primary)] bg-[var(--surface-raised)]/52 px-5 py-28 backdrop-blur-[2px] md:px-10 md:py-36">
        <div className="mx-auto max-w-[1320px]">
          <Rule label="The Ondwira principle" />
          <div className="mx-auto mt-16 max-w-5xl text-center">
            <p className="font-editorial text-[clamp(2.8rem,6vw,6rem)] leading-[0.96] tracking-[-0.035em]">Not a social account beside a work account.</p>
            <p className="font-editorial mt-4 text-[clamp(2.8rem,6vw,6rem)] italic leading-[0.96] tracking-[-0.035em] text-[var(--accent-primary)]">One person. Two clear spaces.</p>
          </div>
          <div className="mt-24 grid border border-[var(--border-primary)] md:grid-cols-2">
            <article className="min-h-[390px] border-b border-[var(--border-primary)] p-8 md:border-b-0 md:border-r md:p-12"><p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[var(--accent-primary)]">Social</p><h2 className="font-editorial mt-8 text-6xl">Be present.</h2><p className="mt-8 max-w-md text-base leading-8 text-[var(--text-secondary)]">Private chats, chosen groups, calls and temporary updates. Finding work is available when you want it, never forced into your personal conversations.</p></article>
            <article className="min-h-[390px] p-8 md:p-12"><p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[var(--accent-primary)]">Work</p><h2 className="font-editorial mt-8 text-6xl">Do the work.</h2><p className="mt-8 max-w-md text-base leading-8 text-[var(--text-secondary)]">Organisation conversations, meetings, people, roles, applications, contracts and reports—opened only by the permissions your work requires.</p></article>
          </div>
        </div>
      </section>

      <section id="continuity" className="relative z-10 mx-auto max-w-[1320px] px-5 py-28 md:px-10 md:py-40">
        <div className="grid gap-16 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="lg:sticky lg:top-32 lg:self-start"><p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[var(--accent-primary)]">From conversation to career</p><h2 className="font-editorial mt-8 text-6xl leading-[0.92] md:text-8xl">Nothing important needs to be entered twice.</h2></div>
          <div className="border-t border-[var(--border-primary)]">
            {chapters.map(([number, title, copy]) => <article key={number} className="grid gap-6 border-b border-[var(--border-primary)] py-10 sm:grid-cols-[70px_1fr] md:py-14"><p className="font-editorial text-2xl italic text-[var(--accent-primary)]">{number}</p><div><h3 className="font-editorial text-4xl md:text-5xl">{title}</h3><p className="mt-4 max-w-xl text-base leading-7 text-[var(--text-secondary)]">{copy}</p></div></article>)}
          </div>
        </div>
      </section>

      <section id="private" className="relative z-10 bg-[var(--accent-primary)] px-5 py-28 text-[var(--text-inverse)] md:px-10 md:py-36">
        <div className="mx-auto grid max-w-[1320px] gap-14 lg:grid-cols-2 lg:items-end">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.34em] opacity-70">Privacy is structure</p><h2 className="font-editorial mt-7 text-6xl leading-[0.9] md:text-8xl">Your employer does not own your life.</h2></div>
          <div className="border-t border-current/30 pt-8"><p className="max-w-xl text-lg leading-8 opacity-85">Work access can begin and end automatically. Your personal conversations, documents and verified history remain yours. Every share is deliberate, every agreement keeps its exact version, and sensitive actions require confirmation.</p><button onClick={openAuth} className="mt-10 border-b border-current pb-2 text-[11px] font-bold uppercase tracking-[0.28em]">Begin with one account</button></div>
        </div>
      </section>

      <footer className="relative z-10 px-5 py-24 md:px-10">
        <div className="mx-auto max-w-[1320px]">
          <OndwiraLogo className="text-[clamp(2.5rem,8vw,7rem)]" markClassName="text-[var(--accent-primary)]" />
          <div className="mt-14 flex flex-col gap-7 border-t border-[var(--border-primary)] pt-7 text-[10px] uppercase tracking-[0.23em] text-[var(--text-muted)] md:flex-row md:items-center md:justify-between"><p>© {new Date().getFullYear()} Ondwira. One account, carried forward.</p><button onClick={() => setContactOpen(true)} className="text-left transition-colors hover:text-[var(--accent-primary)]">Contact Ondwira</button></div>
        </div>
      </footer>
      <Analytics />
    </main>
  );
}
