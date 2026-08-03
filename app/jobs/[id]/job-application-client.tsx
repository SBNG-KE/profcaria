'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, BriefcaseBusiness, Check, FileText, Link2, MapPin, ShieldCheck } from 'lucide-react';
import ThemeToggle from '@/app/components/ThemeToggle';
import type { PublicJob } from '@/app/components/LandingPageClient';

type Question = { id: string; prompt: string; type: string; options: string[]; required: boolean };
const pretty = (value: string) => value?.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Not specified';

export default function JobApplicationClient({ jobId, initialJob }: { jobId: string; initialJob: PublicJob & { description: string; requirements: string; benefits: string }; }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetch(`/api/jobs/${jobId}`).then(response => response.json()).then(body => setQuestions(body.questions || [])).catch(() => undefined);
  }, [jobId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setNotice('');
    const data = new FormData(event.currentTarget);
    data.set('answers', JSON.stringify(answers));
    data.set('consent', data.get('consent') ? 'true' : 'false');
    const response = await fetch(`/api/jobs/${jobId}/apply`, { method: 'POST', body: data });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) return setNotice(body.error || 'Application could not be sent.');
    setDone(true);
  }

  const remaining = initialJob.applicationLimit == null ? null : Math.max(0, initialJob.applicationLimit - initialJob.applicationCount);
  return <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
    <header className="border-b-2 border-[var(--text-primary)]"><div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-4 sm:px-7"><Link href="/" className="font-mono text-lg font-black uppercase tracking-[-0.05em]">Profcaria</Link><ThemeToggle showSystem={false} /></div></header>
    <div className="mx-auto max-w-[1320px] px-4 py-7 sm:px-7 sm:py-12">
      <Link href="/#jobs" className="inline-flex items-center gap-2 font-mono text-xs font-black uppercase"><ArrowLeft size={15} /> All jobs</Link>
      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-start">
        <article className="border-2 border-[var(--text-primary)] bg-[var(--surface-raised)] p-6 shadow-[7px_7px_0_var(--text-primary)] sm:p-10">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-primary)]">{initialJob.organization.name}</p>
          <h1 className="mt-4 text-[clamp(2.7rem,7vw,5.5rem)] font-black leading-[0.9] tracking-[-0.06em]">{initialJob.title}</h1>
          <div className="mt-7 flex flex-wrap gap-3 font-mono text-[10px] font-black uppercase"><span className="flex items-center gap-1.5 border border-[var(--text-primary)] px-2.5 py-1.5"><MapPin size={12} />{initialJob.location || pretty(initialJob.locationType)}</span><span className="flex items-center gap-1.5 border border-[var(--text-primary)] px-2.5 py-1.5"><BriefcaseBusiness size={12} />{pretty(initialJob.employmentType)}</span><span className="border border-[var(--text-primary)] px-2.5 py-1.5">{pretty(initialJob.seniority)}</span>{remaining != null && <span className="border border-[var(--accent-primary)] px-2.5 py-1.5 text-[var(--accent-primary)]">{remaining} places left</span>}</div>
          {initialJob.compensation && <p className="mt-6 border-l-4 border-[var(--accent-primary)] pl-4 text-lg font-black">{initialJob.compensation}</p>}
          <div className="mt-10 space-y-9 text-sm leading-7 text-[var(--text-secondary)]"><TextSection title="The work" value={initialJob.description} /><TextSection title="What you need" value={initialJob.requirements} /><TextSection title="What is offered" value={initialJob.benefits} /></div>
        </article>

        <aside className="border-2 border-[var(--text-primary)] bg-[var(--surface-raised)] p-5 sm:p-7 lg:sticky lg:top-6">
          {done ? <div className="py-8 text-center"><span className="mx-auto grid h-14 w-14 place-items-center border-2 border-[var(--text-primary)] bg-emerald-400 text-black shadow-[4px_4px_0_var(--text-primary)]"><Check /></span><h2 className="mt-7 text-3xl font-black tracking-[-0.04em]">Application sent.</h2><p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">The company has your application. Status emails will still reach you. Create an account only if you want to reply in Profcaria chat or track everything in one place.</p><Link href="/?auth=signup" className="mt-7 inline-flex items-center gap-2 border-2 border-[var(--text-primary)] px-4 py-3 font-mono text-xs font-black uppercase shadow-[4px_4px_0_var(--accent-primary)]">Create optional account <ArrowUpRight size={15} /></Link></div>
          : <form onSubmit={submit}>
            <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent-primary)]">Apply without an account</p><h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Your details</h2></div><ShieldCheck className="text-[var(--accent-primary)]" /></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1"><Field label="Full name" name="name" required /><Field label="Email" name="email" type="email" required /><Field label="Phone (optional)" name="phone" /><Field label="County" name="county" placeholder="e.g. Nairobi" /></div>
            {questions.map(question => <QuestionField key={question.id} question={question} value={answers[question.id] || ''} onChange={value => setAnswers(current => ({ ...current, [question.id]: value }))} />)}
            <label className="mt-5 block text-xs font-black">Short note (optional)<textarea name="coverNote" rows={4} maxLength={5000} className="mt-2 w-full border-2 border-[var(--text-primary)] bg-[var(--bg-primary)] p-3 font-normal outline-none focus:shadow-[3px_3px_0_var(--accent-primary)]" /></label>
            <label className="mt-5 block text-xs font-black"><span className="flex items-center gap-2"><Link2 size={14} /> Portfolio link (optional)</span><input name="portfolioUrl" type="url" placeholder="https://" className="mt-2 w-full border-2 border-[var(--text-primary)] bg-[var(--bg-primary)] p-3 font-normal outline-none focus:shadow-[3px_3px_0_var(--accent-primary)]" /></label>
            <label className="mt-5 block border-2 border-dashed border-[var(--text-primary)] p-4 text-xs"><span className="flex items-center gap-2 font-black"><FileText size={15} /> CV or requested document (optional)</span><input name="document" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" className="mt-3 block w-full text-xs" /><span className="mt-2 block leading-5 text-[var(--text-muted)]">PDF, DOCX or TXT, maximum 8 MB. It is inspected before the company can access it.</span></label>
            <label className="mt-5 flex items-start gap-3 bg-[var(--surface-muted)] p-4 text-xs leading-5"><input name="consent" type="checkbox" required className="mt-1" /><span>I consent to Profcaria sharing this application with {initialJob.organization.name} for this job.</span></label>
            {notice && <p role="alert" className="mt-4 border-2 border-red-500 bg-red-500/10 p-3 text-xs text-red-600">{notice}</p>}
            <button disabled={busy} className="mt-5 w-full border-2 border-[var(--text-primary)] bg-[var(--text-primary)] px-5 py-3.5 font-mono text-xs font-black uppercase tracking-wider text-[var(--bg-primary)] shadow-[5px_5px_0_var(--accent-primary)] disabled:opacity-50">{busy ? 'Inspecting and sending...' : 'Submit application'}</button>
          </form>}
        </aside>
      </div>
    </div>
  </main>;
}

function Field({ label, name, type = 'text', required, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) { return <label className="block text-xs font-black">{label}{required && ' *'}<input name={name} type={type} required={required} placeholder={placeholder} className="mt-2 w-full border-2 border-[var(--text-primary)] bg-[var(--bg-primary)] p-3 font-normal outline-none focus:shadow-[3px_3px_0_var(--accent-primary)]" /></label>; }
function TextSection({ title, value }: { title: string; value: string }) { return value ? <section><h2 className="text-2xl font-black tracking-[-0.03em] text-[var(--text-primary)]">{title}</h2><p className="mt-3 whitespace-pre-wrap">{value}</p></section> : null; }
function QuestionField({ question, value, onChange }: { question: Question; value: string; onChange: (value: string) => void }) { return <label className="mt-5 block text-xs font-black">{question.prompt}{question.required && ' *'}{question.type === 'yes_no' || question.type === 'single_choice' ? <select value={value} onChange={event => onChange(event.target.value)} required={question.required} className="mt-2 w-full border-2 border-[var(--text-primary)] bg-[var(--bg-primary)] p-3 font-normal"><option value="">Choose</option>{(question.type === 'yes_no' ? ['Yes', 'No'] : question.options).map(option => <option key={option} value={option}>{option}</option>)}</select> : <textarea value={value} onChange={event => onChange(event.target.value)} required={question.required} rows={3} className="mt-2 w-full border-2 border-[var(--text-primary)] bg-[var(--bg-primary)] p-3 font-normal outline-none" />}</label>; }
