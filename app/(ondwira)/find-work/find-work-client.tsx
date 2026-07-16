'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BriefcaseBusiness, MapPin, Search, ShieldCheck, Sparkles, X } from 'lucide-react';

type Job = {
  id: string; title: string; summary: string; description: string; location: string; locationType: string;
  employmentType: string; seniority: string; organization?: { name: string }; skillTags: string[];
  match: { score: number; reasons: string[] }; application: { status: string } | null; closesAt: string | null;
};

export default function FindWorkClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [query, setQuery] = useState('');
  const [locationType, setLocationType] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (locationType) params.set('locationType', locationType);
    if (employmentType) params.set('employmentType', employmentType);
    const response = await fetch(`/api/find-work/jobs?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Open roles could not be loaded.');
    setJobs(data.jobs ?? []);
  }, [query, locationType, employmentType]);
  useEffect(() => {
    const timer = setTimeout(() => load().catch(error => setNotice(error.message)).finally(() => setLoading(false)), 250);
    return () => clearTimeout(timer);
  }, [load]);

  return <section className="mx-auto max-w-7xl p-5 sm:p-8">
    <header className="border-b border-[var(--border-primary)] pb-8"><div className="flex items-center gap-3"><p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--accent-primary)]">Social · private opportunity room</p><span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--accent-strong)]">Optional</span></div><h1 className="font-editorial mt-3 max-w-5xl text-5xl leading-[0.95] sm:text-7xl">See the work. Bring your evidence once.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">Your CVs, certificates and verified history remain in Settings. Applying shares only what you choose, with a recorded consent trail.</p></header>
    <div className="mt-6 grid gap-3 rounded-[28px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-4 lg:grid-cols-[1fr_190px_190px]"><label className="flex items-center gap-3 rounded-2xl bg-[var(--surface-muted)] px-4 py-3"><Search size={18} className="text-[var(--text-muted)]" /><input value={query} onChange={event => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Role, skill, location or organisation" /></label><select value={locationType} onChange={event => setLocationType(event.target.value)} className="rounded-2xl bg-[var(--surface-muted)] p-3 text-sm"><option value="">Any place</option><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option><option value="flexible">Flexible</option></select><select value={employmentType} onChange={event => setEmploymentType(event.target.value)} className="rounded-2xl bg-[var(--surface-muted)] p-3 text-sm"><option value="">Any arrangement</option><option value="full_time">Full time</option><option value="part_time">Part time</option><option value="contract">Contract</option><option value="internship">Internship</option><option value="freelance">Freelance</option></select></div>
    {notice && <div className="mt-4 flex justify-between rounded-2xl bg-[var(--accent-soft)] p-4 text-sm text-[var(--accent-strong)]"><span>{notice}</span><button onClick={() => setNotice('')}><X size={15} /></button></div>}
    <div className="mt-6 grid gap-4 lg:grid-cols-2">{jobs.map(job => <Link href={`/find-work/${job.id}`} key={job.id} className="group rounded-[30px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-6 transition hover:border-[var(--accent-primary)]">
      <div className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><BriefcaseBusiness /></span><span className="flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[10px] font-black uppercase tracking-wider"><Sparkles size={12} /> {job.match.score}% evidence match</span></div>
      <p className="mt-6 text-[10px] font-black uppercase tracking-wider text-[var(--accent-primary)]">{job.organization?.name}</p><h2 className="font-editorial mt-2 text-3xl">{job.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">{job.summary || job.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">{job.skillTags.slice(0, 5).map(skill => <span key={skill} className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[10px] font-bold">{skill}</span>)}</div>
      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-[var(--text-muted)]"><ShieldCheck size={14} className="mt-0.5 shrink-0 text-[var(--accent-primary)]" />{job.match.reasons[0]}</p>
      <div className="mt-5 flex items-center justify-between border-t border-[var(--border-secondary)] pt-4 text-xs font-bold text-[var(--text-muted)]"><span><MapPin size={14} className="mr-1 inline" />{job.location || job.locationType}</span><span className={job.application ? 'text-[var(--accent-primary)]' : ''}>{job.application ? job.application.status.replaceAll('_', ' ') : 'Open role →'}</span></div>
    </Link>)}{!loading && !jobs.length && <div className="rounded-[30px] border border-dashed border-[var(--border-primary)] bg-[var(--surface-raised)] p-12 text-center lg:col-span-2"><Search className="mx-auto text-[var(--text-muted)]" /><h2 className="font-editorial mt-4 text-3xl">No open role matches that room.</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Try a wider search or remove one filter.</p></div>}</div>
  </section>;
}
