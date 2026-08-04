'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, BriefcaseBusiness, Building2, Clock3, MapPin, Search, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import { Analytics } from '@vercel/analytics/next';
import ThemeToggle from './ThemeToggle';
import HangingAuthCard from './HangingAuthCard';

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
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [query, setQuery] = useState('');
  const [locationType, setLocationType] = useState('all');
  const [employmentType, setEmploymentType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    fetch('/api/jobs', { cache: 'no-store' })
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Jobs are temporarily unavailable.');
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
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [jobs]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <HangingAuthCard isOpen={authOpen} onClose={() => setAuthOpen(false)} initialScreen="auth" />
      <header className="sticky top-0 z-40 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-7">
          <Link href="/" className="flex items-center gap-3 font-mono text-lg font-black uppercase tracking-[-0.05em]" aria-label="Profcaria home">
            <span className="apex-mark grid h-9 w-9 place-items-center border-2 border-[var(--text-primary)] text-xs text-[var(--text-inverse)]">PC</span>
            Profcaria
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main navigation">
            <Link href="/employer/home" className="hidden px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-[var(--surface-muted)] sm:block">For companies</Link>
            <ThemeToggle showSystem={false} />
            <button onClick={() => setAuthOpen(true)} className="border-2 border-[var(--text-primary)] bg-[var(--text-primary)] px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--bg-primary)] shadow-[3px_3px_0_var(--accent-primary)] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_var(--accent-primary)] sm:px-5">Sign in</button>
          </nav>
        </div>
      </header>

      <section className="apex-hero relative border-b-2 border-[var(--text-primary)]">
        <div className="apex-field absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative mx-auto grid min-h-[690px] max-w-[1440px] gap-12 px-4 py-16 sm:px-7 sm:py-24 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
          <div>
            <div className="mb-8 flex items-center gap-4"><span className="h-px w-14 bg-[var(--accent-secondary)]" /><p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-[var(--accent-secondary-strong)]">Kenya / Open work / Verified limits</p></div>
            <h1 className="max-w-5xl text-[clamp(3.7rem,9vw,9.4rem)] font-black leading-[0.79] tracking-[-0.08em]">Applying for jobs,<br /><span className="apex-spectrum-text">made simple.</span></h1>
            <p className="mt-8 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">See a role. Open it. Answer only what the company needs. Submit. An account is optional until you need to reply to a company.</p>
          </div>
          <div className="apex-command-card border-2 border-[var(--text-primary)] bg-[var(--surface-raised)] p-6 font-mono sm:p-8">
            <div className="flex items-start justify-between gap-6"><div><p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent-primary)]">Vacancy truth protocol</p><p className="mt-4 text-6xl font-black tracking-[-0.1em]">{jobs.length.toString().padStart(2, '0')}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Open Kenyan roles</p></div><div className="apex-orbit shrink-0" aria-hidden="true" /></div>
            <div className="mt-12 grid grid-cols-[10px_1fr] gap-4 border-t border-[var(--border-primary)] pt-5"><span className="mt-1 h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--accent-secondary)] shadow-[0_0_18px_var(--accent-secondary)]" /><p className="text-xs leading-5 text-[var(--text-secondary)]">Every vacancy disappears automatically when its application limit or closing time is reached.</p></div>
          </div>
        </div>
      </section>

      <section id="jobs" className="mx-auto max-w-[1440px] px-4 py-10 sm:px-7 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit border-2 border-[var(--text-primary)] bg-[var(--surface-raised)] p-5 lg:sticky lg:top-24">
            <div className="flex items-center gap-2 border-b border-[var(--border-primary)] pb-4 font-mono text-xs font-black uppercase"><SlidersHorizontal size={15} /> Narrow the list</div>
            <FilterSelect label="Work setting" value={locationType} onChange={setLocationType} options={['all', 'onsite', 'hybrid', 'remote']} />
            <FilterSelect label="Job type" value={employmentType} onChange={setEmploymentType} options={['all', 'full_time', 'part_time', 'contract', 'internship', 'apprenticeship', 'freelance']} />
            <div className="mt-7 border-t border-[var(--border-primary)] pt-5">
              <p className="font-mono text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Most requested</p>
              <div className="mt-3 space-y-2 text-sm">
                {categories.length ? categories.map(([name, count]) => <button key={name} onClick={() => setQuery(name === 'Other' ? '' : name)} className="flex w-full justify-between text-left hover:text-[var(--accent-primary)]"><span>{pretty(name)}</span><span className="font-mono text-xs">{count}</span></button>) : <p className="text-xs leading-5 text-[var(--text-muted)]">Category demand appears as companies publish roles.</p>}
              </div>
            </div>
          </aside>

          <div>
            <div className="flex flex-col gap-4 border-b-2 border-[var(--text-primary)] pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-primary)]">All open work</p><h2 className="mt-1 text-3xl font-black tracking-[-0.04em]">Jobs in Kenya</h2></div>
              <label className="flex min-w-0 items-center gap-3 border-2 border-[var(--text-primary)] bg-[var(--surface-raised)] px-4 py-3 sm:w-[360px]"><Search size={17} /><span className="sr-only">Search jobs</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Role, skill, company or place" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]" />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={15} /></button>}</label>
            </div>

            {loading ? <div className="grid gap-4 py-7 sm:grid-cols-2">{[0, 1, 2, 3].map(i => <div key={i} className="h-64 animate-pulse border-2 border-[var(--border-primary)] bg-[var(--surface-muted)]" />)}</div>
              : notice ? <EmptyState title="Jobs could not load" body={notice} />
              : filtered.length === 0 ? <EmptyState title="No matching open jobs" body="Remove a filter or try a broader search. Closed and full vacancies never appear here." />
              : <div className="grid gap-4 py-7 sm:grid-cols-2">{filtered.map(job => <JobCard key={job.id} job={job} />)}</div>}
          </div>
        </div>
      </section>

      <section className="relative border-y-2 border-[var(--text-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[var(--accent-primary)]">
        <div className="mx-auto grid max-w-[1440px] gap-px bg-[var(--text-primary)] sm:grid-cols-3">
          {[
            [ShieldCheck, 'Safer evidence', 'Links and documents are held for security inspection before they reach a conversation.'],
            [Clock3, 'Honest availability', 'Jobs close automatically at their date or application cap—whichever comes first.'],
            [Building2, 'Company accountability', 'Companies sign in to publish, manage candidates, reply, pay and respond to reports.'],
          ].map(([Icon, title, body]) => {
            const FeatureIcon = Icon as typeof ShieldCheck;
            return <article key={String(title)} className="bg-[var(--bg-tertiary)] p-7 sm:p-9"><FeatureIcon size={22} className="text-[var(--accent-secondary-strong)]" /><p className="mt-12 font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[var(--accent-primary)]">0{['Safer evidence','Honest availability','Company accountability'].indexOf(String(title)) + 1}</p><h3 className="mt-3 text-xl font-black">{String(title)}</h3><p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{String(body)}</p></article>;
          })}
        </div>
      </section>

      <footer className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-10 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <p>Profcaria / Kenya / {new Date().getFullYear()}</p>
        <div className="flex flex-wrap gap-5"><Link href="/pricing">Company pricing</Link><button onClick={() => setAuthOpen(true)}>Sign up or log in</button><a href="mailto:hello@profcaria.com">Report a problem</a></div>
      </footer>
      <Analytics />
    </main>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="mt-5 block"><span className="font-mono text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">{label}</span><select value={value} onChange={event => onChange(event.target.value)} className="mt-2 w-full border-2 border-[var(--text-primary)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm outline-none">{options.map(option => <option key={option} value={option}>{option === 'all' ? 'All' : pretty(option)}</option>)}</select></label>;
}

function JobCard({ job }: { job: PublicJob }) {
  const remaining = job.applicationLimit == null ? null : Math.max(0, job.applicationLimit - job.applicationCount);
  return <Link href={`/jobs/${job.id}`} className="apex-job-card group flex min-h-64 flex-col border-2 border-[var(--text-primary)] bg-[var(--surface-raised)] p-5 shadow-[5px_5px_0_var(--border-primary)] transition hover:-translate-y-1 hover:shadow-[7px_7px_0_var(--accent-primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-soft)] sm:p-6">
    <div className="flex items-start justify-between gap-5"><div className="grid h-10 w-10 place-items-center border-2 border-[var(--text-primary)] bg-[var(--surface-muted)] font-mono text-xs font-black">{job.organization.name.slice(0, 2).toUpperCase()}</div><ArrowUpRight className="transition group-hover:translate-x-1 group-hover:-translate-y-1" /></div>
    <div className="mt-6"><p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent-primary)]">{job.organization.name}</p><h3 className="mt-2 text-2xl font-black leading-tight tracking-[-0.04em]">{job.title}</h3><p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">{job.summary || 'Open the role to see the work, requirements and application questions.'}</p></div>
    <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--border-primary)] pt-5 font-mono text-[10px] font-bold uppercase text-[var(--text-muted)]"><span className="flex items-center gap-1.5"><MapPin size={12} />{job.location || pretty(job.locationType)}</span><span className="flex items-center gap-1.5"><BriefcaseBusiness size={12} />{pretty(job.employmentType)}</span>{remaining != null && <span>{remaining} application {remaining === 1 ? 'place' : 'places'} left</span>}</div>
  </Link>;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="my-7 border-2 border-dashed border-[var(--text-primary)] p-10 text-center"><BriefcaseBusiness className="mx-auto text-[var(--accent-primary)]" /><h3 className="mt-5 text-xl font-black">{title}</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">{body}</p></div>;
}
