'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, FileText, MapPin, ShieldCheck, X } from 'lucide-react';

type Question = { id: string; prompt: string; type: string; options: string[]; required: boolean };
type Document = { id: string; title: string; kind: string; credentialIssuer?: string };
type Job = {
  title: string; summary: string; description: string; requirements: string; benefits: string; compensation: string;
  location: string; locationType: string; employmentType: string; organization: { name: string }; questions: Question[];
};

export default function JobDetailClient({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<Job | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [coverNote, setCoverNote] = useState('');
  const [application, setApplication] = useState<{ status: string } | null>(null);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const ref = new URLSearchParams(location.search).get('ref');
    fetch(`/api/find-work/jobs/${jobId}${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error); return data;
    }).then(data => { setJob(data.job); setDocuments(data.documents ?? []); setApplication(data.application); setShareCode(data.shareCode); })
      .catch(error => setNotice(error.message));
  }, [jobId]);
  const requiredComplete = useMemo(() => job?.questions.every(question => !question.required || answers[question.id]?.trim()) ?? false, [job, answers]);

  async function apply() {
    setBusy(true); setNotice('Creating your consented evidence snapshot…');
    const response = await fetch(`/api/find-work/jobs/${jobId}/apply`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, documentIds: selected, coverNote, shareCode, consent }),
    });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setNotice(data.error || 'Application could not be submitted.');
    setApplication({ status: data.status }); setNotice(`Application submitted and placed in ${String(data.status).replaceAll('_', ' ')}.`);
  }
  if (!job) return <div className="p-8">{notice || 'Loading role…'}</div>;
  return <section className="mx-auto max-w-6xl p-5 sm:p-8"><Link href="/find-work" className="inline-flex items-center gap-2 text-sm font-black"><ArrowLeft size={17} /> Find work</Link>
    <div className="mt-6 grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
      <article className="rounded-[32px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-6 sm:p-9"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--accent-primary)]">{job.organization.name}</p><h1 className="font-editorial mt-3 text-5xl leading-none sm:text-6xl">{job.title}</h1><p className="mt-4 flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]"><MapPin size={15} />{job.location || job.locationType} · {job.employmentType.replaceAll('_', ' ')}</p>{job.compensation && <p className="mt-3 text-sm font-black text-[var(--accent-primary)]">{job.compensation}</p>}<div className="mt-8 space-y-7 text-sm leading-7 text-[var(--text-secondary)]"><TextBlock title="The work" text={job.description} /><TextBlock title="What helps" text={job.requirements} /><TextBlock title="What is offered" text={job.benefits} /></div></article>
      <aside className="h-fit rounded-[32px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-wider text-[var(--accent-primary)]">Private application room</p><h2 className="font-editorial mt-1 text-3xl">{application ? 'Application recorded.' : 'Bring selected evidence.'}</h2></div><ShieldCheck className="text-[var(--accent-primary)]" /></div>
        {application ? <div className="mt-6 rounded-2xl bg-[var(--accent-soft)] p-5"><p className="text-sm font-black capitalize">{application.status.replaceAll('_', ' ')}</p><p className="mt-2 text-xs leading-5 text-[var(--accent-strong)]">Follow interviews, offers and the complete status trail from Work → Applications.</p><Link href="/work/applications" className="mt-4 inline-block text-xs font-black underline">Open my applications</Link></div> : <>
          {job.questions.map(question => <label key={question.id} className="mt-5 block text-xs font-black">{question.prompt}{question.required && ' *'}{question.type === 'yes_no' ? <select value={answers[question.id] || ''} onChange={event => setAnswers(current => ({ ...current, [question.id]: event.target.value }))} className="mt-2 w-full rounded-2xl bg-[var(--surface-muted)] p-3 font-normal"><option value="">Choose</option><option value="yes">Yes</option><option value="no">No</option></select> : <textarea value={answers[question.id] || ''} onChange={event => setAnswers(current => ({ ...current, [question.id]: event.target.value }))} rows={3} className="mt-2 w-full rounded-2xl bg-[var(--surface-muted)] p-3 font-normal outline-none" />}</label>)}
          <textarea value={coverNote} onChange={event => setCoverNote(event.target.value)} rows={4} className="mt-5 w-full rounded-2xl bg-[var(--surface-muted)] p-4 text-sm outline-none" placeholder="Optional note to the hiring team" />
          <div className="mt-5"><p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Share from your Settings documents</p><div className="mt-2 max-h-56 space-y-2 overflow-y-auto">{documents.map(document => { const checked = selected.includes(document.id); return <button key={document.id} onClick={() => setSelected(current => checked ? current.filter(id => id !== document.id) : [...current, document.id])} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${checked ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)]' : 'border-[var(--border-secondary)]'}`}><FileText size={17} /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-black">{document.title}</span><span className="text-[10px] text-[var(--text-muted)]">{document.kind}{document.credentialIssuer ? ` · ${document.credentialIssuer}` : ''}</span></span>{checked && <Check size={15} />}</button>; })}{!documents.length && <p className="rounded-2xl border border-dashed border-[var(--border-primary)] p-4 text-xs text-[var(--text-muted)]">No saved documents yet. You can still answer the questions, or add documents in Settings first.</p>}</div></div>
          <label className="mt-5 flex items-start gap-3 rounded-2xl bg-[var(--surface-muted)] p-4 text-xs leading-5"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1" /><span>I consent to share these selected documents, answers and a snapshot of my employment history with this organisation for this application. I can later revoke document access.</span></label>
          <button onClick={apply} disabled={busy || !consent || !requiredComplete} className="mt-5 w-full rounded-2xl bg-[var(--accent-primary)] px-5 py-3.5 text-sm font-black text-[var(--text-inverse)] disabled:opacity-40">{busy ? 'Submitting…' : 'Submit once'}</button>
        </>}
        {notice && <div className="mt-4 flex justify-between rounded-2xl bg-[var(--accent-soft)] p-3 text-xs text-[var(--accent-strong)]"><span>{notice}</span><button onClick={() => setNotice('')}><X size={14} /></button></div>}
      </aside>
    </div>
  </section>;
}

function TextBlock({ title, text }: { title: string; text: string }) {
  return text ? <section><h2 className="font-editorial text-2xl text-[var(--text-primary)]">{title}</h2><p className="mt-2 whitespace-pre-wrap">{text}</p></section> : null;
}
