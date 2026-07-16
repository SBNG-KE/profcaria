'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, BriefcaseBusiness, CirclePlus, Copy, Pause, Play, Share2, ShieldCheck, Users, X } from 'lucide-react';

type Organization = { id: string; name: string; role: string; canManage: boolean };
type Screening = { mode: string; required_skills: string[]; require_verified_history: boolean };
type Job = {
  id: string; title: string; summary: string; description: string; location: string; locationType: string;
  employmentType: string; status: string; visibility: string; applicationCount: number; hiredCount: number;
  closesAt: string | null; organizationId: string; organization?: { name: string }; canManage: boolean; screening?: Screening;
};
type Question = { prompt: string; required: boolean; knockout: boolean; expectedAnswer: string };

const blank = {
  title: '', summary: '', description: '', requirements: '', benefits: '', compensation: '', location: '',
  locationType: 'remote', employmentType: 'full_time', seniority: 'mid', visibility: 'public', closesAt: '',
  skills: '', screeningMode: 'assist', requiredSkills: '', preferredSkills: '', requiredDocuments: '',
  minimumYears: '', requireVerifiedHistory: false, blindReview: false,
};

export default function WorkJobsClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [form, setForm] = useState(blank);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const response = await fetch(`/api/work/jobs${organizationId ? `?organizationId=${organizationId}` : ''}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Jobs could not be loaded.');
    setJobs(data.jobs ?? []);
    setOrganizations(data.organizations ?? []);
    if (!organizationId && data.organizations?.[0]) setOrganizationId(data.organizations[0].id);
  }, [organizationId]);
  useEffect(() => { load().catch(error => setNotice(error.message)).finally(() => setLoading(false)); }, [load]);

  const selectedOrganization = organizations.find(item => item.id === organizationId);
  const totals = useMemo(() => ({
    open: jobs.filter(job => job.status === 'published').length,
    applications: jobs.reduce((sum, job) => sum + job.applicationCount, 0),
    hires: jobs.reduce((sum, job) => sum + job.hiredCount, 0),
  }), [jobs]);

  async function create(status: 'draft' | 'published') {
    setBusy(true); setNotice('Validating the role and preparing its hiring ledger…');
    const response = await fetch('/api/work/jobs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId, status, title: form.title, summary: form.summary, description: form.description,
        requirements: form.requirements, benefits: form.benefits, compensation: form.compensation,
        location: form.location, locationType: form.locationType, employmentType: form.employmentType,
        seniority: form.seniority, visibility: form.visibility, closesAt: form.closesAt || null,
        skillTags: form.skills.split(',').map(item => item.trim()).filter(Boolean), blindReview: form.blindReview,
        questions: questions.filter(item => item.prompt.trim()).map(item => ({
          prompt: item.prompt, type: item.knockout ? 'yes_no' : 'long_text', required: item.required,
          knockout: item.knockout, expectedAnswer: item.knockout ? item.expectedAnswer : null, weight: item.knockout ? 20 : 0,
        })),
        screening: {
          mode: form.screeningMode,
          requiredSkills: form.requiredSkills.split(',').map(item => item.trim()).filter(Boolean),
          preferredSkills: form.preferredSkills.split(',').map(item => item.trim()).filter(Boolean),
          requiredDocumentKinds: form.requiredDocuments.split(',').map(item => item.trim()).filter(Boolean),
          minimumYears: form.minimumYears ? Number(form.minimumYears) : null,
          requireVerifiedHistory: form.requireVerifiedHistory,
          autoShortlistScore: form.screeningMode === 'triage' ? 80 : null,
          autoHoldBelowScore: form.screeningMode === 'triage' ? 30 : null,
        },
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) return setNotice(data.error || 'Job could not be created.');
    setCreating(false); setForm(blank); setQuestions([]);
    setNotice(status === 'published' ? 'Role published. Applications, screening and analytics are active.' : 'Draft saved privately.');
    await load();
  }

  async function changeStatus(job: Job, status: string) {
    const response = await fetch(`/api/work/jobs/${job.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error || 'Job could not be updated.');
    setNotice(status === 'paused' ? 'Applications paused without losing the pipeline.' : 'Job is accepting applications again.');
    await load();
  }

  async function share(job: Job) {
    const response = await fetch(`/api/work/jobs/${job.id}/share`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channel: 'copy' }),
    });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error || 'Share link could not be created.');
    await navigator.clipboard?.writeText(data.link);
    setNotice('A tracked application link was copied. Opens and applications will appear in Reports.');
  }

  return <section className="mx-auto max-w-7xl p-5 sm:p-8">
    <header className="flex flex-col justify-between gap-5 border-b border-[var(--border-primary)] pb-7 lg:flex-row lg:items-end">
      <div><p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--accent-primary)]">Work · opportunity ledger</p><h1 className="font-editorial mt-3 text-5xl sm:text-7xl">Create work worth joining.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">Publish once, share anywhere, screen fairly, interview, contract and start employment without moving the candidate between systems.</p></div>
      <button onClick={() => setCreating(true)} disabled={!selectedOrganization?.canManage} className="flex w-fit items-center gap-2 rounded-full bg-[var(--accent-primary)] px-5 py-3 text-sm font-black text-[var(--text-inverse)] disabled:opacity-40"><CirclePlus size={18} /> Create role</button>
    </header>

    {notice && <div className="mt-5 flex justify-between rounded-2xl bg-[var(--accent-soft)] p-4 text-sm text-[var(--accent-strong)]"><span>{notice}</span><button onClick={() => setNotice('')}><X size={15} /></button></div>}
    <div className="mt-5 flex flex-wrap gap-2">{organizations.map(item => <button key={item.id} onClick={() => setOrganizationId(item.id)} className={`rounded-full px-4 py-2 text-xs font-black ${organizationId === item.id ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)]' : 'border border-[var(--border-primary)] bg-[var(--surface-raised)]'}`}>{item.name}</button>)}</div>

    <div className="mt-6 grid gap-3 sm:grid-cols-3">{[['Open roles', totals.open], ['Applications', totals.applications], ['People hired', totals.hires]].map(([label, value]) => <div key={label} className="rounded-[24px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-5"><p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">{label}</p><p className="font-editorial mt-3 text-4xl">{value}</p></div>)}</div>

    <div className="mt-6 grid gap-4 lg:grid-cols-2">{jobs.map(job => <article key={job.id} className="rounded-[30px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-6">
      <div className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><BriefcaseBusiness /></span><span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[10px] font-black uppercase tracking-wider">{job.status}</span></div>
      <p className="mt-6 text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">{job.organization?.name} · {job.employmentType.replaceAll('_', ' ')}</p>
      <h2 className="font-editorial mt-2 text-3xl">{job.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">{job.summary || job.description}</p>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center"><Mini icon={Users} value={job.applicationCount} label="applications" /><Mini icon={ShieldCheck} value={job.screening?.mode || 'off'} label="screening" /><Mini icon={BarChart3} value={job.hiredCount} label="hired" /></div>
      <div className="mt-5 flex flex-wrap gap-2">{job.status === 'published' && <button onClick={() => share(job)} className="flex items-center gap-2 rounded-full bg-[var(--accent-primary)] px-4 py-2.5 text-xs font-black text-[var(--text-inverse)]"><Share2 size={14} /> Share</button>}{job.status === 'published' && <button onClick={() => changeStatus(job, 'paused')} className="flex items-center gap-2 rounded-full border border-[var(--border-primary)] px-4 py-2.5 text-xs font-black"><Pause size={14} /> Pause</button>}{['paused', 'draft'].includes(job.status) && <button onClick={() => changeStatus(job, 'published')} className="flex items-center gap-2 rounded-full bg-[var(--accent-primary)] px-4 py-2.5 text-xs font-black text-[var(--text-inverse)]"><Play size={14} /> Publish</button>}<button onClick={() => navigator.clipboard?.writeText(job.id)} className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border-primary)]" title="Copy role id"><Copy size={14} /></button></div>
    </article>)}{!loading && !jobs.length && <div className="rounded-[30px] border border-dashed border-[var(--border-primary)] bg-[var(--surface-raised)] p-12 text-center lg:col-span-2"><BriefcaseBusiness className="mx-auto text-[var(--text-muted)]" /><h2 className="font-editorial mt-4 text-3xl">No role ledger yet.</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Create a draft and shape the screening policy before publishing.</p></div>}</div>

    {creating && <JobComposer organizationName={selectedOrganization?.name || 'Organisation'} form={form} setForm={setForm} questions={questions} setQuestions={setQuestions} busy={busy} close={() => setCreating(false)} create={create} />}
  </section>;
}

function Mini({ icon: Icon, value, label }: { icon: typeof Users; value: string | number; label: string }) {
  return <div className="rounded-2xl bg-[var(--surface-muted)] p-3"><Icon size={15} className="mx-auto text-[var(--accent-primary)]" /><p className="mt-2 text-sm font-black">{value}</p><p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">{label}</p></div>;
}

function JobComposer({ organizationName, form, setForm, questions, setQuestions, busy, close, create }: {
  organizationName: string; form: typeof blank; setForm: (value: typeof blank) => void;
  questions: Question[]; setQuestions: (value: Question[]) => void; busy: boolean; close: () => void;
  create: (status: 'draft' | 'published') => void;
}) {
  const field = (key: keyof typeof blank, value: string | boolean) => setForm({ ...form, [key]: value });
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 p-3 backdrop-blur-sm"><div className="mx-auto my-4 grid w-full max-w-6xl overflow-hidden rounded-[34px] border border-white/10 bg-[var(--surface-raised)] shadow-2xl lg:grid-cols-[0.7fr_1.3fr]">
    <aside className="bg-[var(--accent-primary)] p-7 text-[var(--text-inverse)] sm:p-10"><p className="text-[10px] font-black uppercase tracking-[0.25em] opacity-60">{organizationName}</p><h2 className="font-editorial mt-5 text-5xl leading-none">One role. One complete trail.</h2><p className="mt-5 text-sm leading-7 opacity-70">Ondwira records the publication, every tracked share, consented evidence, human reviews, AI assistance, interviews, offers, signatures and employment events.</p><div className="mt-10 space-y-3 text-xs font-bold"><p>• AI never uses protected personal attributes.</p><p>• AI can hold or shortlist for review, never silently reject.</p><p>• Candidates apply with documents already in Settings.</p></div></aside>
    <main className="ondwira-scrollbar max-h-[94dvh] overflow-y-auto p-5 sm:p-8"><div className="flex justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--accent-primary)]">Role atelier</p><h3 className="font-editorial mt-1 text-4xl">Define the work clearly.</h3></div><button onClick={close}><X /></button></div>
      <input autoFocus value={form.title} onChange={event => field('title', event.target.value)} className="mt-6 w-full rounded-2xl bg-[var(--surface-muted)] p-4 outline-none" placeholder="Professional role title" />
      <input value={form.summary} onChange={event => field('summary', event.target.value)} className="mt-3 w-full rounded-2xl bg-[var(--surface-muted)] p-4 outline-none" placeholder="One-sentence role promise" />
      <textarea value={form.description} onChange={event => field('description', event.target.value)} rows={6} className="mt-3 w-full rounded-2xl bg-[var(--surface-muted)] p-4 outline-none" placeholder="Responsibilities, outcomes and how the person will work…" />
      <div className="mt-3 grid gap-3 sm:grid-cols-2"><textarea value={form.requirements} onChange={event => field('requirements', event.target.value)} rows={4} className="rounded-2xl bg-[var(--surface-muted)] p-4 outline-none" placeholder="Requirements" /><textarea value={form.benefits} onChange={event => field('benefits', event.target.value)} rows={4} className="rounded-2xl bg-[var(--surface-muted)] p-4 outline-none" placeholder="Benefits and support" /></div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3"><select value={form.employmentType} onChange={event => field('employmentType', event.target.value)} className="rounded-2xl bg-[var(--surface-muted)] p-3"><option value="full_time">Full time</option><option value="part_time">Part time</option><option value="contract">Contract</option><option value="internship">Internship</option><option value="freelance">Freelance</option></select><select value={form.locationType} onChange={event => field('locationType', event.target.value)} className="rounded-2xl bg-[var(--surface-muted)] p-3"><option value="remote">Remote</option><option value="hybrid">Hybrid</option><option value="onsite">On-site</option><option value="flexible">Flexible</option></select><input value={form.location} onChange={event => field('location', event.target.value)} className="rounded-2xl bg-[var(--surface-muted)] p-3 outline-none" placeholder="Location" /></div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3"><input value={form.compensation} onChange={event => field('compensation', event.target.value)} className="rounded-2xl bg-[var(--surface-muted)] p-3 outline-none" placeholder="Compensation range" /><input value={form.skills} onChange={event => field('skills', event.target.value)} className="rounded-2xl bg-[var(--surface-muted)] p-3 outline-none" placeholder="Skills, comma separated" /><input type="datetime-local" value={form.closesAt} onChange={event => field('closesAt', event.target.value)} className="rounded-2xl bg-[var(--surface-muted)] p-3 outline-none" /></div>
      <section className="mt-6 rounded-[24px] border border-[var(--border-secondary)] p-5"><div className="flex justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-[var(--accent-primary)]">Application questions</p><p className="mt-1 text-sm text-[var(--text-secondary)]">Keep the application short; evidence already lives in Settings.</p></div><button onClick={() => setQuestions([...questions, { prompt: '', required: true, knockout: false, expectedAnswer: 'yes' }])} className="rounded-full border border-[var(--border-primary)] px-3 text-xs font-black">Add</button></div>{questions.map((question, index) => <div key={index} className="mt-3 rounded-2xl bg-[var(--surface-muted)] p-3"><input value={question.prompt} onChange={event => setQuestions(questions.map((item, i) => i === index ? { ...item, prompt: event.target.value } : item))} className="w-full bg-transparent text-sm outline-none" placeholder="Question" /><div className="mt-3 flex flex-wrap gap-4 text-xs"><label><input type="checkbox" checked={question.required} onChange={event => setQuestions(questions.map((item, i) => i === index ? { ...item, required: event.target.checked } : item))} /> Required</label><label><input type="checkbox" checked={question.knockout} onChange={event => setQuestions(questions.map((item, i) => i === index ? { ...item, knockout: event.target.checked } : item))} /> Yes/no screening rule</label>{question.knockout && <select value={question.expectedAnswer} onChange={event => setQuestions(questions.map((item, i) => i === index ? { ...item, expectedAnswer: event.target.value } : item))} className="bg-transparent"><option value="yes">Expected: yes</option><option value="no">Expected: no</option></select>}<button onClick={() => setQuestions(questions.filter((_, i) => i !== index))} className="ml-auto text-red-500">Remove</button></div></div>)}</section>
      <section className="mt-4 rounded-[24px] border border-[var(--border-secondary)] p-5"><p className="text-[10px] font-black uppercase tracking-wider text-[var(--accent-primary)]">Fair screening assistant</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><select value={form.screeningMode} onChange={event => field('screeningMode', event.target.value)} className="rounded-2xl bg-[var(--surface-muted)] p-3"><option value="off">Off</option><option value="assist">Score for human review</option><option value="triage">Triage to shortlist / review / hold</option></select><input type="number" min="0" step="0.5" value={form.minimumYears} onChange={event => field('minimumYears', event.target.value)} className="rounded-2xl bg-[var(--surface-muted)] p-3" placeholder="Minimum years" /><input value={form.requiredSkills} onChange={event => field('requiredSkills', event.target.value)} className="rounded-2xl bg-[var(--surface-muted)] p-3" placeholder="Required skills" /><input value={form.preferredSkills} onChange={event => field('preferredSkills', event.target.value)} className="rounded-2xl bg-[var(--surface-muted)] p-3" placeholder="Preferred skills" /><input value={form.requiredDocuments} onChange={event => field('requiredDocuments', event.target.value)} className="rounded-2xl bg-[var(--surface-muted)] p-3" placeholder="Required document kinds: cv, certificate" /><div className="space-y-2 rounded-2xl bg-[var(--surface-muted)] p-3 text-xs"><label className="block"><input type="checkbox" checked={form.requireVerifiedHistory} onChange={event => field('requireVerifiedHistory', event.target.checked)} /> Require verified history</label><label className="block"><input type="checkbox" checked={form.blindReview} onChange={event => field('blindReview', event.target.checked)} /> Hide candidate name in the early pipeline</label></div></div></section>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row"><button onClick={() => create('draft')} disabled={busy || form.title.trim().length < 2 || form.description.trim().length < 30} className="flex-1 rounded-2xl border border-[var(--border-primary)] px-4 py-3 text-sm font-black disabled:opacity-40">Save private draft</button><button onClick={() => create('published')} disabled={busy || form.title.trim().length < 2 || form.description.trim().length < 30} className="flex-1 rounded-2xl bg-[var(--accent-primary)] px-4 py-3 text-sm font-black text-[var(--text-inverse)] disabled:opacity-40">{busy ? 'Preparing…' : 'Validate and publish'}</button></div>
    </main>
  </div></div>;
}
