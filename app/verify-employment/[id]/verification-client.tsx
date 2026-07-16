'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

type Verification = { workerName: string; role: string; organization: string; employmentType: string; startedAt: string; endedAt: string | null; requestedFor: string; expiresAt: string };

export default function VerificationClient({ id }: { id: string }) {
  const [record, setRecord] = useState<Verification | null>(null);
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState('');
  const token = typeof window === 'undefined' ? '' : new URLSearchParams(location.search).get('token') || '';
  useEffect(() => { if (!token) return; fetch(`/api/verify-employment/${id}?token=${encodeURIComponent(token)}`).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; }).then(data => setRecord(data.verification)).catch(error => setNotice(error.message)); }, [id, token]);
  async function respond(responseValue: string) { const response = await fetch(`/api/verify-employment/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, response: responseValue, note }) }); const data = await response.json(); setNotice(response.ok ? 'Your response has been recorded. You can close this page.' : data.error); if (response.ok) setRecord(null); }
  return <main className="min-h-dvh bg-[#141416] p-5 text-[#f3eee7] sm:p-10"><div className="mx-auto max-w-3xl rounded-[34px] border border-white/10 bg-[#1d1d20] p-7 sm:p-10"><ShieldCheck className="text-[#cb7248]" /><p className="mt-8 text-xs font-black uppercase tracking-[0.28em] text-[#cb7248]">Ondwira work verification</p><h1 className="mt-3 font-serif text-5xl">Confirm only what you know.</h1>{record && <div className="mt-8 rounded-[26px] bg-[#151517] p-6"><p className="text-sm text-white/50">Person</p><p className="mt-1 text-xl font-bold">{record.workerName}</p><p className="mt-5 text-sm text-white/50">Employment presented</p><p className="mt-1 text-lg font-bold">{record.role} · {record.organization}</p><p className="mt-2 text-sm text-white/65">{record.startedAt} — {record.endedAt || 'Present'}</p><textarea value={note} onChange={event => setNote(event.target.value)} rows={4} className="mt-6 w-full rounded-2xl bg-white/5 p-4 outline-none" placeholder="Optional clarification, discrepancy or reason" /><div className="mt-4 grid gap-2 sm:grid-cols-3"><button onClick={() => respond('confirmed')} className="rounded-2xl bg-[#cb7248] p-3 text-sm font-black text-black">Confirm</button><button onClick={() => respond('partially_confirmed')} className="rounded-2xl border border-white/20 p-3 text-sm font-black">Partly confirm</button><button onClick={() => respond('declined')} className="rounded-2xl border border-red-500 p-3 text-sm font-black text-red-400">Cannot confirm</button></div></div>}{notice && <p className="mt-6 rounded-2xl bg-white/5 p-4 text-sm">{notice}</p>}<p className="mt-8 text-xs leading-6 text-white/40">This page does not create an Ondwira account and exposes only the role and dates the person asked you to verify.</p></div></main>;
}
