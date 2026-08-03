'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-react';

function Result() {
  const params = useSearchParams();
  const reference = params.get('reference') || params.get('trxref');
  const [state, setState] = useState<'checking' | 'success' | 'pending' | 'failed'>('checking');
  const [message, setMessage] = useState('Confirming the transaction with Paystack.');
  useEffect(() => {
    if (!reference) { setState('failed'); setMessage('The payment reference is missing.'); return; }
    void fetch(`/api/payments/paystack/verify?reference=${encodeURIComponent(reference)}`, { cache: 'no-store' })
      .then(async response => ({ response, body: await response.json().catch(() => ({})) }))
      .then(({ response, body }) => {
        if (response.ok && body.success) { setState('success'); setMessage('Your Profcaria wallet has been updated.'); }
        else if (response.status === 202) { setState('pending'); setMessage('Paystack is still processing this transaction. Refresh the wallet shortly.'); }
        else { setState('failed'); setMessage(body.error || 'The transaction could not be verified.'); }
      }).catch(() => { setState('failed'); setMessage('Verification could not be completed. Your wallet was not credited.'); });
  }, [reference]);
  const Icon = state === 'success' ? CheckCircle2 : state === 'failed' ? XCircle : LoaderCircle;
  return <main className="grid min-h-screen place-items-center bg-[var(--bg-primary)] p-5 text-[var(--text-primary)]"><section className="w-full max-w-lg border-2 border-[var(--text-primary)] bg-[var(--surface-raised)] p-8 text-center shadow-[8px_8px_0_var(--accent-primary)]"><Icon size={52} className={`mx-auto ${state === 'checking' ? 'animate-spin' : state === 'success' ? 'text-emerald-500' : state === 'failed' ? 'text-red-500' : 'text-amber-500'}`} /><p className="mt-7 font-mono text-[10px] font-black uppercase tracking-[0.2em]">Paystack / {state}</p><h1 className="mt-3 text-3xl font-black">{state === 'success' ? 'Payment confirmed' : state === 'failed' ? 'Not credited' : 'Checking payment'}</h1><p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{message}</p><Link href="/employer/billing" className="mt-8 inline-block border-2 border-[var(--text-primary)] px-5 py-3 font-mono text-xs font-black uppercase">Return to wallet</Link></section></main>;
}

export default function PaystackCallbackPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[var(--bg-primary)]" />}><Result /></Suspense>;
}
