'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowRight, BriefcaseBusiness, MapPin, Search, X } from 'lucide-react';
import { Analytics } from '@vercel/analytics/next';
import ThemeToggle from './ThemeToggle';
import HangingAuthCard from './HangingAuthCard';
import { ProfcariaMark } from './brand/ProfcariaLogo';
import HomeAccountMenu from './HomeAccountMenu';

export type PublicJob = {
  id: string;
  title: string;
  organization: { name: string };
  summary: string;
  location: string;
  locationType: string;
  employmentType: string;
  seniority: string;
  roleCategory: string;
  compensation: string;
  applicationCount: number;
  applicationLimit: number | null;
  publishedAt: string;
  closesAt: string | null;
  skills: string[];
};

const pretty = (value: string) => value?.replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, letter => letter.toUpperCase()) || 'Not specified';

export default function LandingPageClient() {
  const searchParams = useSearchParams();
  const requestedAuth = searchParams.get('auth');
  const requestedSecurityMode = searchParams.get('mode');
  const requestedIntent = requestedAuth === 'company' || searchParams.get('intent') === 'company' ? 'company' : 'individual';
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [query, setQuery] = useState('');
  const [locationType, setLocationType] = useState('all');
  const [employmentType, setEmploymentType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [authOpen, setAuthOpen] = useState(() => requestedAuth === 'signup' || requestedAuth === 'company' || requestedAuth === 'login' || requestedSecurityMode === 'setup' || requestedSecurityMode === 'verify');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(() => requestedAuth === 'signup' || requestedAuth === 'company' ? 'signup' : 'login');
  const [authIntent, setAuthIntent] = useState<'individual' | 'company'>(requestedIntent);
  const [authScreen, setAuthScreen] = useState<'auth' | 'security_setup' | 'security_verify'>(() => requestedSecurityMode === 'setup' ? 'security_setup' : requestedSecurityMode === 'verify' ? 'security_verify' : 'auth');

  function openAuth(mode: 'login' | 'signup', intent: 'individual' | 'company' = 'individual') {
    setAuthScreen('auth');
    setAuthMode(mode);
    setAuthIntent(intent);
    setAuthOpen(true);
  }

  useEffect(() => {
    fetch('/api/jobs', { cache: 'no-store' })
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'The open register is temporarily unavailable.');
        return body;
      })
      .then(body => setJobs(body.jobs || []))
      .catch(error => setNotice(error.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return jobs.filter(job => {
      const haystack = [job.title, job.organization.name, job.summary, job.location, job.roleCategory, ...job.skills].join(' ').toLowerCase();
      return (!needle || haystack.includes(needle))
        && (locationType === 'all' || job.locationType === locationType)
        && (employmentType === 'all' || job.employmentType === employmentType);
    });
  }, [jobs, query, locationType, employmentType]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    jobs.forEach(job => counts.set(job.roleCategory || 'Other', (counts.get(job.roleCategory || 'Other') || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [jobs]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <HangingAuthCard isOpen={authOpen} onClose={() => setAuthOpen(false)} initialScreen={authScreen} initialMode={authMode} initialTab={authIntent} />

      <header className="relative z-40 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
        <div className="mx-auto flex h-[76px] max-w-[1600px] items-center justify-between px-5 sm:px-9 lg:px-14">
          <Link href="/" className="flex items-center gap-3" aria-label="Profcaria home">
            <ProfcariaMark labelled={false} className="h-10 text-[var(--accent-primary)]" />
            <span className="font-editorial text-[1.75rem] font-semibold tracking-[-0.045em]">Profcaria</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-6" aria-label="Main navigation">
            <button onClick={() => openAuth('signup', 'company')} className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] sm:block">For companies</button>
            <ThemeToggle showSystem={false} />
            <HomeAccountMenu onJoin={() => openAuth('signup')} onSignIn={() => openAuth('login')} />
          </nav>
        </div>
      </header>

      <section className="border-b border-[var(--border-primary)]">
        <div className="mx-auto grid max-w-[1600px] lg:min-h-[700px] lg:grid-cols-[minmax(0,1.42fr)_minmax(360px,.58fr)]">
          <div className="flex flex-col justify-between px-5 py-16 sm:px-9 sm:py-20 lg:px-14 lg:py-24">
            <div>
              <p className="mb-10 flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-secondary)]">
                <span className="h-px w-10 bg-current" /> Kenya&rsquo;s open job register
              </p>
              <h1 className="font-editorial max-w-[980px] text-[clamp(4.4rem,9.2vw,10.4rem)] font-medium leading-[0.78] tracking-[-0.07em]">
                Applying for jobs,<br /><span className="italic">made simple.</span>
              </h1>
              <p className="mt-10 max-w-xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg sm:leading-8">
                Find current work in Kenya, answer only what the company needs, and submit. No adverts. No account required until you need to continue a conversation.
              </p>
            </div>
            <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-[var(--border-primary)] pt-6">
              <a href="#jobs" className="group inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em]">Browse open roles <ArrowDown size={15} className="transition group-hover:translate-y-1" /></a>
              <span className="text-sm text-[var(--text-muted)]">Only genuinely open vacancies appear.</span>
            </div>
          </div>

          <aside className="register-panel relative min-h-[500px] overflow-hidden bg-[var(--accent-primary)] px-8 py-12 text-[var(--text-inverse)] sm:px-12 lg:min-h-full lg:px-14 lg:py-16" aria-label="Open job count">
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-center justify-between border-b border-current/20 pb-5 text-[10px] font-semibold uppercase tracking-[0.24em]">
                <span>Current register</span><span>Kenya</span>
              </div>
              <div className="relative flex min-h-[320px] flex-1 items-center justify-center py-14">
                <div className="register-arch" aria-hidden="true" />
                <div className="relative z-10 text-center">
                  <p className="font-editorial text-[clamp(7rem,13vw,12rem)] font-medium leading-none tracking-[-0.08em]">{loading ? '—' : jobs.length.toString().padStart(2, '0')}</p>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.23em] opacity-70">Open roles</p>
                </div>
              </div>
              <p className="max-w-sm border-t border-current/20 pt-6 text-sm leading-6 opacity-80">A vacancy leaves the public register when its closing time or application limit is reached.</p>
            </div>
          </aside>
        </div>
      </section>

      <section id="jobs" className="mx-auto max-w-[1600px] px-5 py-20 sm:px-9 sm:py-24 lg:px-14 lg:py-28">
        <div className="grid gap-10 border-b border-[var(--border-primary)] pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.58fr)] lg:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[var(--text-muted)]">Available now</p>
            <h2 className="font-editorial mt-3 text-[clamp(3.4rem,6vw,6.5rem)] font-medium leading-none tracking-[-0.055em]">The open register</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[var(--text-secondary)] lg:justify-self-end">Search by role, skill, company or place. Every result below remains open to applications at the moment it is shown.</p>
        </div>

        <div className="grid border-b border-[var(--border-primary)] lg:grid-cols-[minmax(0,1fr)_190px_190px]">
          <label className="flex min-w-0 items-center gap-4 border-b border-[var(--border-primary)] py-5 lg:border-b-0 lg:border-r lg:pr-6">
            <Search size={18} strokeWidth={1.5} />
            <span className="sr-only">Search jobs</span>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search the register" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--text-muted)]" />
            {query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button>}
          </label>
          <FilterSelect label="Work setting" value={locationType} onChange={setLocationType} options={['all', 'onsite', 'hybrid', 'remote']} />
          <FilterSelect label="Job type" value={employmentType} onChange={setEmploymentType} options={['all', 'full_time', 'part_time', 'contract', 'internship', 'apprenticeship', 'freelance']} />
        </div>

        {categories.length > 0 && <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-[var(--border-secondary)] py-5 text-xs text-[var(--text-secondary)]">
          <span className="font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">In demand</span>
          {categories.map(([name, count]) => <button key={name} onClick={() => setQuery(name === 'Other' ? '' : name)} className="border-b border-transparent pb-0.5 transition hover:border-current hover:text-[var(--text-primary)]">{pretty(name)} <span className="ml-1 opacity-55">{count}</span></button>)}
        </div>}

        {loading ? <div className="divide-y divide-[var(--border-secondary)] border-b border-[var(--border-primary)]">{[0, 1, 2, 3].map(i => <div key={i} className="h-36 animate-pulse bg-[var(--surface-muted)]/35" />)}</div>
          : notice ? <EmptyState title="The register is being prepared" body="Open roles are temporarily unavailable. Please return shortly." />
          : filtered.length === 0 ? <EmptyState title="No open roles match this search" body="Try a broader word or remove a filter. Full and closed vacancies are never kept in the register." />
          : <div className="border-b border-[var(--border-primary)]">{filtered.map((job, index) => <JobRow key={job.id} job={job} index={index + 1} />)}</div>}
      </section>

      <section className="border-y border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <div className="mx-auto grid max-w-[1600px] lg:grid-cols-3">
          {[
            ['01', 'Current by design', 'Jobs leave the public register automatically when their closing date or application limit is reached.'],
            ['02', 'Apply without ceremony', 'Open a role, provide the requested details and submit. Creating an account is optional at first.'],
            ['03', 'Continue privately', 'If a company responds, sign in to exchange text, trusted links and screened documents in one place.'],
          ].map(([number, title, body], index) => <article key={number} className={`px-5 py-12 sm:px-9 lg:px-14 lg:py-16 ${index > 0 ? 'border-t border-[var(--border-primary)] lg:border-l lg:border-t-0' : ''}`}>
            <p className="font-editorial text-2xl italic text-[var(--text-muted)]">{number}</p>
            <h3 className="font-editorial mt-12 text-3xl font-medium tracking-[-0.035em]">{title}</h3>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[var(--text-secondary)]">{body}</p>
          </article>)}
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1600px] flex-col gap-7 px-5 py-10 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-9 lg:px-14">
        <p>&copy; {new Date().getFullYear()} Profcaria, Kenya.</p>
        <div className="flex flex-wrap gap-x-7 gap-y-3"><Link href="/pricing">Company pricing</Link><button onClick={() => openAuth('signup')}>Create an individual account</button><button onClick={() => openAuth('signup', 'company')}>Create a company workspace</button><a href="mailto:hello@profcaria.com">Report a problem</a></div>
      </footer>
      <Analytics />
    </main>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="flex items-center justify-between gap-3 border-b border-[var(--border-primary)] py-5 lg:border-b-0 lg:border-r lg:px-6 last:lg:border-r-0"><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={event => onChange(event.target.value)} className="w-full appearance-none bg-transparent text-xs font-semibold uppercase tracking-[0.12em] outline-none">{options.map(option => <option key={option} value={option}>{option === 'all' ? label : pretty(option)}</option>)}</select><span aria-hidden="true" className="text-[10px]">⌄</span></label>;
}

function JobRow({ job, index }: { job: PublicJob; index: number }) {
  const remaining = job.applicationLimit == null ? null : Math.max(0, job.applicationLimit - job.applicationCount);
  return <Link href={`/jobs/${job.id}`} className="group grid gap-6 border-t border-[var(--border-primary)] py-8 transition first:border-t-0 hover:bg-[var(--surface-muted)]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent-primary)] sm:px-4 lg:grid-cols-[50px_minmax(0,1.4fr)_minmax(200px,.62fr)_minmax(180px,.5fr)_40px] lg:items-center lg:px-0">
    <span className="hidden font-editorial text-lg italic text-[var(--text-muted)] lg:block">{String(index).padStart(2, '0')}</span>
    <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{job.organization.name}</p><h3 className="font-editorial mt-2 text-[clamp(1.9rem,3vw,2.8rem)] font-medium leading-none tracking-[-0.04em]">{job.title}</h3></div>
    <div className="text-sm leading-6 text-[var(--text-secondary)]"><span className="flex items-center gap-2"><MapPin size={14} strokeWidth={1.5} />{job.location || pretty(job.locationType)}</span><span className="mt-1 flex items-center gap-2"><BriefcaseBusiness size={14} strokeWidth={1.5} />{pretty(job.employmentType)}</span></div>
    <div className="text-xs leading-5 text-[var(--text-muted)]">{remaining != null ? <><span className="block text-[var(--text-primary)]">{remaining} {remaining === 1 ? 'place' : 'places'} left</span>Application limit applies</> : <><span className="block text-[var(--text-primary)]">Applications open</span>{job.closesAt ? `Closes ${new Date(job.closesAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}` : 'No public limit shown'}</>}</div>
    <ArrowRight size={20} strokeWidth={1.4} className="transition group-hover:translate-x-2" />
  </Link>;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="border-b border-[var(--border-primary)] py-16 sm:py-20"><p className="font-editorial text-4xl font-medium tracking-[-0.035em]">{title}</p><p className="mt-4 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">{body}</p></div>;
}
