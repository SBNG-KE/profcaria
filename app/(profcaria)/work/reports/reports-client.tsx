'use client';

import { useEffect, useState } from 'react';
import { BarChart3, BriefcaseBusiness, Clock3, Eye, Share2, Sparkles, UserCheck } from 'lucide-react';

type Report = {
  metrics: Record<string, number>;
  funnel: Array<{ name: string; value: number }>;
  jobs: Array<{ id: string; title: string; status: string; applications: number; hires: number }>;
};

export default function ReportsClient() {
  const [report, setReport] = useState<Report | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    fetch('/api/work/recruitment/report').then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error); return data;
    }).then(setReport).catch(error => setNotice(error.message));
  }, []);
  const cards = report ? [
    ['Active roles', report.metrics.activeJobs, BriefcaseBusiness],
    ['Applications', report.metrics.totalApplications, BarChart3],
    ['Role views', report.metrics.views, Eye],
    ['Tracked shares', report.metrics.shares, Share2],
    ['Interviews', report.metrics.interviews, Clock3],
    ['Hires', report.metrics.hires, UserCheck],
    ['Screened', `${report.metrics.screeningCoverage}%`, Sparkles],
    ['Days to hire', report.metrics.averageDaysToHire, Clock3],
  ] as const : [];
  const max = Math.max(1, ...(report?.funnel.map(item => item.value) ?? [1]));
  return <section className="mx-auto max-w-7xl p-5 sm:p-8"><header className="border-b border-[var(--border-primary)] pb-8"><p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--accent-primary)]">Work · recruitment intelligence</p><h1 className="font-editorial mt-3 text-5xl sm:text-7xl">Measure the system, not the person.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">See reach, movement, response time, interview activity and hiring outcomes. Assisted screening coverage is visible so automation never disappears into the background.</p></header>
    {notice && <p className="mt-5 rounded-2xl bg-[var(--accent-soft)] p-4 text-sm text-[var(--accent-strong)]">{notice}</p>}
    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, Icon]) => <div key={label} className="rounded-[26px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-5"><Icon size={18} className="text-[var(--accent-primary)]" /><p className="font-editorial mt-7 text-4xl">{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">{label}</p></div>)}</div>
    {report && <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.8fr]"><section className="rounded-[30px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-6"><h2 className="font-editorial text-3xl">Current pipeline</h2><div className="mt-6 space-y-3">{report.funnel.map(item => <div key={item.name} className="grid grid-cols-[110px_1fr_42px] items-center gap-3"><span className="truncate text-xs font-black capitalize">{item.name.replaceAll('_', ' ')}</span><span className="h-3 overflow-hidden rounded-full bg-[var(--surface-muted)]"><span className="block h-full rounded-full bg-[var(--accent-primary)]" style={{ width: `${item.value / max * 100}%` }} /></span><span className="text-right text-xs font-black">{item.value}</span></div>)}</div></section><section className="rounded-[30px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-6"><h2 className="font-editorial text-3xl">Roles by outcome</h2><div className="mt-5 space-y-3">{report.jobs.map(job => <div key={job.id} className="rounded-2xl bg-[var(--surface-muted)] p-4"><div className="flex justify-between gap-3"><p className="text-sm font-black">{job.title}</p><span className="text-[10px] font-black uppercase text-[var(--text-muted)]">{job.status}</span></div><p className="mt-2 text-xs text-[var(--text-secondary)]">{job.applications} applications · {job.hires} hired</p></div>)}{!report.jobs.length && <p className="text-sm text-[var(--text-muted)]">Create a role to begin reporting.</p>}</div></section></div>}
  </section>;
}
