'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowRight, Bell, BriefcaseBusiness, Check, ChevronDown, MapPin, Search, X } from 'lucide-react';
import { Analytics } from '@vercel/analytics/next';
import ThemeToggle from './ThemeToggle';
import HangingAuthCard from './HangingAuthCard';
import ProfcariaLogo from './brand/ProfcariaLogo';
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
const canonicalFilterValue = (value: string) => value?.trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/^on_site$/, 'onsite') || '';

const workSettingOptions = [
  { value: 'all', label: 'All work settings' },
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote' },
  { value: 'flexible', label: 'Flexible' },
];

const jobTypeOptions = [
  { value: 'all', label: 'All job types' },
  { value: 'full_time', label: 'Full time' },
  { value: 'part_time', label: 'Part time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'internship', label: 'Internship' },
  { value: 'apprenticeship', label: 'Apprenticeship' },
  { value: 'freelance', label: 'Freelance' },
];

export default function LandingPageClient() {
  const searchParams = useSearchParams();
  const requestedAuth = searchParams.get('auth');
  const requestedSecurityMode = searchParams.get('mode');
  const requestedIntent = requestedAuth === 'company' || searchParams.get('intent') === 'company' ? 'company' : 'individual';
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [query, setQuery] = useState('');
  const [roleCategory, setRoleCategory] = useState('all');
  const [locationType, setLocationType] = useState('all');
  const [employmentType, setEmploymentType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [viewerAuthenticated, setViewerAuthenticated] = useState(false);
  const [savingAlert, setSavingAlert] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);
  const [alertNotice, setAlertNotice] = useState('');
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
    fetch('/api/auth/me?optional=1').then(response => response.ok ? response.json() : null)
      .then(body => setViewerAuthenticated(Boolean(body?.authenticated))).catch(() => undefined);
  }, []);

  async function saveCurrentSearch() {
    if (!viewerAuthenticated) {
      setAlertNotice('Sign in or create a free individual account to receive tailored job alerts.');
      openAuth('login');
      return;
    }
    setSavingAlert(true);
    setAlertNotice('');
    const categoryLabel = categoryOptions.find(option => option.value === roleCategory)?.label;
    try {
      const response = await fetch('/api/job-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: roleCategory === 'all' ? (query.trim() ? `Jobs matching ${query.trim()}` : 'All open jobs') : `${categoryLabel} jobs`,
          query,
          roleCategories: roleCategory === 'all' ? [] : [roleCategory],
          locationTypes: locationType === 'all' ? [] : [locationType],
          employmentTypes: employmentType === 'all' ? [] : [employmentType],
          frequency: 'instant',
          emailEnabled: true,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'This alert could not be saved.');
      setAlertSaved(true);
    } catch (error) {
      setAlertNotice(error instanceof Error ? error.message : 'This alert could not be saved.');
    } finally {
      setSavingAlert(false);
    }
  }

  useEffect(() => {
    setAlertSaved(false);
    setAlertNotice('');
  }, [query, roleCategory, locationType, employmentType]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return jobs.filter(job => {
      const haystack = [job.title, job.organization.name, job.summary, job.location, job.roleCategory, ...job.skills].join(' ').toLowerCase();
      return (!needle || haystack.includes(needle))
        && (locationType === 'all' || canonicalFilterValue(job.locationType) === locationType)
        && (employmentType === 'all' || canonicalFilterValue(job.employmentType) === employmentType)
        && (roleCategory === 'all' || canonicalFilterValue(job.roleCategory) === roleCategory);
    });
  }, [jobs, query, locationType, employmentType, roleCategory]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    jobs.forEach(job => counts.set(job.roleCategory || 'Other', (counts.get(job.roleCategory || 'Other') || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [jobs]);

  const categoryOptions = useMemo(() => [
    { value: 'all', label: 'All job domains' },
    ...[...new Map(jobs.map(job => [canonicalFilterValue(job.roleCategory || 'Other'), pretty(job.roleCategory || 'Other')])).entries()]
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label })),
  ], [jobs]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <HangingAuthCard isOpen={authOpen} onClose={() => setAuthOpen(false)} initialScreen={authScreen} initialMode={authMode} initialTab={authIntent} />

      <header className="relative z-40 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
        <div className="mx-auto flex h-[64px] max-w-[1600px] items-center justify-between gap-3 px-4 sm:h-[68px] sm:px-9 lg:px-12">
          <Link href="/" className="min-w-0 shrink" aria-label="Profcaria home"><ProfcariaLogo className="text-[1.35rem] sm:text-[1.65rem]" /></Link>
          <nav className="flex shrink-0 items-center gap-1.5 sm:gap-4" aria-label="Main navigation">
            <ThemeToggle showSystem={false} />
            <HomeAccountMenu onSignIn={() => openAuth('login')} />
          </nav>
        </div>
      </header>

      <section className="border-b border-[var(--border-primary)]">
        <div className="mx-auto grid max-w-[1600px] lg:min-h-[320px] lg:grid-cols-[minmax(0,1.48fr)_minmax(290px,.52fr)]">
          <div className="flex flex-col px-5 py-7 sm:px-9 sm:py-8 lg:px-12 lg:py-8">
            <div>
              <p className="mb-4 flex items-center gap-3 text-[8px] font-semibold uppercase tracking-[0.23em] text-[var(--text-secondary)] sm:text-[9px]">
                <span className="h-px w-8 bg-current" /> Kenya&rsquo;s open job register
              </p>
              <h1 className="font-editorial max-w-[780px] text-[clamp(2.7rem,4.6vw,5.4rem)] font-medium leading-[0.84] tracking-[-0.06em]">
                Applying for jobs, <span className="block italic sm:inline">made simple.</span>
              </h1>
              <p className="mt-4 max-w-2xl text-[13px] leading-5 text-[var(--text-secondary)] sm:text-sm sm:leading-6">
                Find current work in Kenya, answer only what the company needs, and submit. No adverts. No account required until you need to continue a conversation.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-2 border-t border-[var(--border-primary)] pt-4">
              <a href="#jobs" className="group inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] sm:text-[11px]">Browse open roles <ArrowDown size={14} className="transition group-hover:translate-y-1" /></a>
              <span className="text-xs text-[var(--text-muted)] sm:text-[13px]">Only genuinely open vacancies appear.</span>
            </div>
          </div>

          <aside className="register-panel relative overflow-hidden bg-[var(--accent-primary)] px-5 py-4 text-[var(--text-inverse)] sm:px-9 lg:min-h-full lg:px-9 lg:py-6" aria-label="Open job count">
            <div className="relative z-10 flex h-full items-center justify-between gap-6 lg:flex-col lg:items-stretch">
              <div className="flex flex-col items-start gap-2 text-[8px] font-semibold uppercase tracking-[0.2em] lg:w-full lg:flex-row lg:items-center lg:justify-between lg:border-b lg:border-current/20 lg:pb-3">
                <span>Current register</span><span>Kenya</span>
              </div>
              <div className="relative flex shrink-0 items-center justify-center lg:min-h-[155px] lg:flex-1 lg:py-5">
                <div className="register-arch hidden lg:block" aria-hidden="true" />
                <div className="relative z-10 text-center">
                  <p className="font-editorial text-5xl font-medium leading-none tracking-[-0.08em] lg:text-[clamp(4.2rem,6vw,6.5rem)]">{loading ? '—' : jobs.length.toString().padStart(2, '0')}</p>
                  <p className="mt-1 text-[8px] font-semibold uppercase tracking-[0.2em] opacity-70 lg:mt-2 lg:text-[9px]">Open roles</p>
                </div>
              </div>
              <p className="hidden max-w-sm border-t border-current/20 pt-3 text-[11px] leading-4 opacity-75 lg:block">Vacancies leave automatically when their closing time or application limit is reached.</p>
            </div>
          </aside>
        </div>
      </section>

      <section id="jobs" className="mx-auto max-w-[1600px] px-5 py-7 sm:px-9 sm:py-8 lg:px-12 lg:py-9">
        <div className="grid gap-3 border-b border-[var(--border-primary)] pb-4 sm:grid-cols-[minmax(0,1fr)_minmax(260px,.65fr)] sm:items-end">
          <div>
            <p className="text-[8px] font-semibold uppercase tracking-[0.23em] text-[var(--text-muted)] sm:text-[9px]">Available now</p>
            <h2 className="font-editorial mt-1 text-[clamp(2.2rem,3.4vw,3.7rem)] font-medium leading-none tracking-[-0.05em]">The open register</h2>
          </div>
          <p className="max-w-xl text-xs leading-5 text-[var(--text-secondary)] sm:justify-self-end">Search by role, skill, company or place. Every result shown remains open to applications.</p>
        </div>

        <div className="grid border-b border-[var(--border-primary)] sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_210px_180px_180px]">
          <label className="flex min-w-0 items-center gap-3 border-b border-[var(--border-primary)] py-4 lg:border-b-0 lg:border-r lg:pr-5">
            <Search size={17} strokeWidth={1.5} />
            <span className="sr-only">Search jobs</span>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search the register" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]" />
            {query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={16} /></button>}
          </label>
          <FilterSelect label="Job domain" value={roleCategory} onChange={setRoleCategory} options={categoryOptions} />
          <FilterSelect label="Work setting" value={locationType} onChange={setLocationType} options={workSettingOptions} />
          <FilterSelect label="Job type" value={employmentType} onChange={setEmploymentType} options={jobTypeOptions} />
        </div>

        {categories.length > 0 && <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-[var(--border-secondary)] py-5 text-xs text-[var(--text-secondary)]">
          <span className="font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">In demand</span>
          {categories.map(([name, count]) => { const value = canonicalFilterValue(name); const active = roleCategory === value; return <button key={name} onClick={() => setRoleCategory(current => current === value ? 'all' : value)} aria-pressed={active} className={`border-b pb-0.5 transition hover:text-[var(--text-primary)] ${active ? 'border-current text-[var(--text-primary)]' : 'border-transparent'}`}>{pretty(name)} <span className="ml-1 opacity-55">{count}</span></button>; })}
        </div>}

        <div className="flex flex-col gap-3 border-b border-[var(--border-secondary)] py-4 text-xs text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between">
          <span>{alertNotice || (loading ? 'Reading the current register...' : `${filtered.length} ${filtered.length === 1 ? 'role' : 'roles'} match your choices.`)}</span>
          <button type="button" onClick={saveCurrentSearch} disabled={savingAlert || alertSaved} className="inline-flex w-fit items-center gap-2 border border-[var(--border-primary)] px-4 py-2.5 font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-primary)] disabled:cursor-default disabled:bg-[var(--accent-soft)]">
            {alertSaved ? <Check size={15} /> : <Bell size={15} />}{alertSaved ? 'Alert saved' : savingAlert ? 'Saving...' : 'Save job alert'}
          </button>
        </div>

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
        <div className="flex flex-wrap gap-x-7 gap-y-3"><Link href="/pricing">Company pricing</Link><button onClick={() => openAuth('signup')}>Create an individual account</button><button onClick={() => openAuth('signup', 'company')}>Create a company workspace</button><a href="mailto:hello@profcaria.com?subject=Contact%20Profcaria">Contact us</a></div>
      </footer>
      <Analytics />
    </main>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return <label className="relative flex min-w-0 items-center border-b border-[var(--border-primary)] lg:border-b-0 lg:border-r last:lg:border-r-0"><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={event => onChange(event.target.value)} className="h-full min-h-12 w-full cursor-pointer appearance-none bg-transparent py-4 pl-4 pr-10 text-[10px] font-semibold uppercase tracking-[0.1em] outline-none focus:bg-[var(--surface-muted)] lg:px-5 lg:pr-10">{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown aria-hidden="true" size={14} className="pointer-events-none absolute right-4 text-[var(--text-muted)]" /></label>;
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
