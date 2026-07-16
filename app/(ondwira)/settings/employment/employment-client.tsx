'use client';

import { useCallback, useEffect, useState } from 'react';
import { BriefcaseBusiness, CirclePlus, Link2, ShieldCheck, X } from 'lucide-react';

type Record = {
  id: string; title: string; status: string; started_at: string | null; ended_at: string | null; source: string;
  organizationName: string; verification_status: string; verification_method: string | null;
  verificationRequests: Array<{ id: string; status: string; requested_at: string }>;
};

export default function EmploymentClient() {
  const [history, setHistory] = useState<Record[]>([]);
  const [notice, setNotice] = useState('');
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<Record | null>(null);
  const [form, setForm] = useState({ title: '', organizationName: '', employmentType: 'full_time', startedAt: '', endedAt: '', targetEmail: '' });
  const load = useCallback(() => fetch('/api/settings/employment').then(async response => {
    const data = await response.json(); if (!response.ok) throw new Error(data.error); return data;
  }).then(data => setHistory(data.history ?? [])), []);
  useEffect(() => { load().catch(error => setNotice(error.message)); }, [load]);

  async function add() {
    const response = await fetch('/api/settings/employment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error || 'History could not be added.');
    setAdding(false); setForm({ title: '', organizationName: '', employmentType: 'full_time', startedAt: '', endedAt: '', targetEmail: '' });
    setNotice('Earlier employment added as self-declared history. You can now request verification.');
    await load();
  }
  async function verify() {
    if (!verifying) return;
    const response = await fetch('/api/settings/employment', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request_verification', recordId: verifying.id, targetName: verifying.organizationName, targetEmail: form.targetEmail }),
    });
    const data = await response.json();
    if (!response.ok) return setNotice(data.error || 'Verification could not be created.');
    await navigator.clipboard?.writeText(`${location.origin}${data.verificationLink}`);
    setNotice('A secure verification link was created and copied. Send it to the organisation contact; connected email agents can deliver it later.');
    setVerifying(null); await load();
  }

  return <section className="mx-auto max-w-6xl p-5 sm:p-8"><header className="flex flex-col justify-between gap-5 border-b border-[var(--border-primary)] pb-7 sm:flex-row sm:items-end"><div><p className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--accent-primary)]">Settings · work record</p><h1 className="font-editorial mt-3 text-5xl sm:text-7xl">Your working life, with provenance.</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">Ondwira-created employment verifies itself. Earlier roles begin as self-declared and can be supported by documents or confirmed by the organisation.</p></div><button onClick={() => setAdding(true)} className="flex w-fit items-center gap-2 rounded-full bg-[var(--accent-primary)] px-5 py-3 text-sm font-black text-[var(--text-inverse)]"><CirclePlus size={18} /> Add earlier role</button></header>
    {notice && <div className="mt-5 flex justify-between rounded-2xl bg-[var(--accent-soft)] p-4 text-sm text-[var(--accent-strong)]"><span>{notice}</span><button onClick={() => setNotice('')}><X size={15} /></button></div>}
    <div className="mt-7 grid gap-4 lg:grid-cols-2">{history.map(item => <article key={item.id} className="rounded-[28px] border border-[var(--border-secondary)] bg-[var(--surface-raised)] p-6"><div className="flex items-start justify-between gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]"><BriefcaseBusiness /></span><span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[10px] font-black uppercase tracking-wider">{item.status}</span></div><p className="mt-6 text-[10px] font-black uppercase tracking-wider text-[var(--accent-primary)]">{item.organizationName}</p><h2 className="font-editorial mt-2 text-3xl">{item.title}</h2><p className="mt-3 text-xs text-[var(--text-muted)]">{item.started_at || 'Start unknown'} — {item.ended_at || 'Present'}</p><div className="mt-5 flex items-center gap-2 rounded-2xl bg-[var(--surface-muted)] p-4"><ShieldCheck size={17} className="text-[var(--accent-primary)]" /><div><p className="text-xs font-black capitalize">{item.verification_status.replaceAll('_', ' ')}</p><p className="text-[10px] text-[var(--text-muted)]">{item.verification_method === 'ondwira_lifecycle' ? 'Verified automatically from signed employment events' : item.source === 'manual' ? 'Added by you; evidence and confirmation remain separate' : 'Imported lifecycle record'}</p></div></div>{item.source === 'manual' && item.verification_status !== 'verified' && <button onClick={() => { setVerifying(item); setForm(current => ({ ...current, targetEmail: '' })); }} className="mt-4 flex items-center gap-2 rounded-full border border-[var(--border-primary)] px-4 py-2 text-xs font-black"><Link2 size={14} /> Request verification</button>}</article>)}{!history.length && <div className="rounded-[28px] border border-dashed border-[var(--border-primary)] bg-[var(--surface-raised)] p-12 text-center lg:col-span-2"><BriefcaseBusiness className="mx-auto text-[var(--text-muted)]" /><h2 className="font-editorial mt-4 text-3xl">No work record yet.</h2></div>}</div>
    {adding && <Modal title="Add earlier employment" close={() => setAdding(false)}><input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} className="mt-5 w-full rounded-2xl bg-[var(--surface-muted)] p-3" placeholder="Role title" /><input value={form.organizationName} onChange={event => setForm({ ...form, organizationName: event.target.value })} className="mt-3 w-full rounded-2xl bg-[var(--surface-muted)] p-3" placeholder="Organisation name" /><div className="mt-3 grid grid-cols-2 gap-3"><input type="date" value={form.startedAt} onChange={event => setForm({ ...form, startedAt: event.target.value })} className="rounded-2xl bg-[var(--surface-muted)] p-3" /><input type="date" value={form.endedAt} onChange={event => setForm({ ...form, endedAt: event.target.value })} className="rounded-2xl bg-[var(--surface-muted)] p-3" /></div><button onClick={add} disabled={!form.title || !form.organizationName || !form.startedAt} className="mt-4 w-full rounded-2xl bg-[var(--accent-primary)] p-3 text-sm font-black text-[var(--text-inverse)] disabled:opacity-40">Add as self-declared</button></Modal>}
    {verifying && <Modal title={`Verify ${verifying.organizationName}`} close={() => setVerifying(null)}><p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">A secure one-use link lets an authorised contact confirm the role and dates. Their response becomes part of the verification trail.</p><input type="email" value={form.targetEmail} onChange={event => setForm({ ...form, targetEmail: event.target.value })} className="mt-5 w-full rounded-2xl bg-[var(--surface-muted)] p-3" placeholder="Organisation contact work email" /><button onClick={verify} disabled={!form.targetEmail.includes('@')} className="mt-4 w-full rounded-2xl bg-[var(--accent-primary)] p-3 text-sm font-black text-[var(--text-inverse)] disabled:opacity-40">Create secure link</button></Modal>}
  </section>;
}

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/65 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-[30px] border border-white/10 bg-[var(--surface-raised)] p-6"><div className="flex justify-between"><h2 className="font-editorial text-3xl">{title}</h2><button onClick={close}><X /></button></div>{children}</div></div>;
}
