'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Clock3, CreditCard, RefreshCw, ShieldCheck, WalletCards } from 'lucide-react';

type WalletResponse = {
  wallet: { balance_kes: number; reserved_kes: number; updated_at: string | null };
  payments: Array<{ reference: string; status: string; amount_kes: number; currency: string; channel?: string | null; paid_at?: string | null; created_at: string }>;
  paystack: { configured: boolean; mode: 'test' | 'live' | 'unconfigured' };
};

const presets = [500, 1000, 2500, 5000];
const money = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 2 });

export default function BillingPage({ organizationId = '' }: { organizationId?: string }) {
  const [data, setData] = useState<WalletResponse | null>(null);
  const [amount, setAmount] = useState(1000);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/payments/wallet${organizationId ? `?organizationId=${encodeURIComponent(organizationId)}` : ''}`, { cache: 'no-store' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setMessage(body.error || 'Wallet could not be loaded.');
    else setData(body);
    setLoading(false);
  }, [organizationId]);

  useEffect(() => { void load(); }, [load]);

  async function startTopup() {
    setStarting(true);
    setMessage('');
    try {
      const response = await fetch('/api/payments/paystack/initialize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amountKes: amount, organizationId: organizationId || undefined }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Top-up could not start.');
      window.location.assign(body.authorizationUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Top-up could not start.');
      setStarting(false);
    }
  }

  return <main className="p-4 sm:p-7 lg:p-10"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-primary)]">Company / billing</p><h1 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Wallet & usage</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">Prepay in Kenyan shillings. Applicant capacity, document handling and optional AI are deducted only when used.</p></div><button onClick={() => void load()} className="flex items-center gap-2 border-2 border-[var(--text-primary)] px-4 py-2 font-mono text-xs font-black uppercase"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</button></div>

    <div className="mt-9 grid gap-5 lg:grid-cols-[1fr_420px]">
      <section className="border-2 border-[var(--text-primary)] bg-[var(--text-primary)] p-7 text-[var(--bg-primary)] shadow-[7px_7px_0_var(--accent-primary)]"><WalletCards /><p className="mt-12 font-mono text-[10px] font-black uppercase tracking-wider opacity-70">Available balance</p><p className="mt-2 text-5xl font-black tracking-[-0.05em] sm:text-7xl">{money.format(Number(data?.wallet.balance_kes || 0))}</p><p className="mt-4 text-sm opacity-70">Reserved: {money.format(Number(data?.wallet.reserved_kes || 0))}</p><div className="mt-10 flex flex-wrap gap-3 text-xs"><span className="border border-current px-3 py-2">KES only</span><span className="border border-current px-3 py-2">No mandatory subscription</span><span className="border border-current px-3 py-2">Idempotent credits</span></div></section>

      <section className="border-2 border-[var(--text-primary)] bg-[var(--surface-raised)] p-6"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] font-black uppercase tracking-wider">Add money</p><h2 className="mt-2 text-2xl font-black">Paystack top-up</h2></div><CreditCard /></div><div className="mt-6 grid grid-cols-2 gap-2">{presets.map(value => <button key={value} onClick={() => setAmount(value)} className={`border-2 px-3 py-3 font-mono text-xs font-black ${amount === value ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'border-[var(--border-primary)]'}`}>KES {value.toLocaleString()}</button>)}</div><label className="mt-5 block font-mono text-[10px] font-black uppercase">Custom amount<input type="number" min={100} max={1000000} step="0.01" value={amount} onChange={event => setAmount(Number(event.target.value))} className="mt-2 w-full border-2 border-[var(--text-primary)] bg-[var(--bg-primary)] px-4 py-3 text-base outline-none" /></label><button disabled={starting || !data?.paystack.configured || amount < 100} onClick={() => void startTopup()} className="mt-5 flex w-full items-center justify-center gap-2 border-2 border-[var(--text-primary)] bg-[var(--accent-primary)] px-4 py-4 font-mono text-xs font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-45">{starting ? 'Opening secure checkout…' : <>Continue to Paystack <ArrowUpRight size={15} /></>}</button><p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">{data?.paystack.configured ? `Provider connected in ${data.paystack.mode} mode.` : 'Connection-ready. Add the Paystack test secret key to enable checkout.'}</p>{message && <p className="mt-4 border-2 border-red-500 bg-red-500/10 p-3 text-xs font-bold text-red-600">{message}</p>}</section>
    </div>

    <section className="mt-10"><div className="flex items-center gap-2"><Clock3 size={18} /><h2 className="text-2xl font-black">Payment history</h2></div><div className="mt-4 overflow-x-auto border-2 border-[var(--text-primary)]"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b-2 border-[var(--text-primary)] bg-[var(--surface-muted)] font-mono text-[10px] uppercase"><tr><th className="p-4">Reference</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Channel</th><th className="p-4">Created</th></tr></thead><tbody>{(data?.payments || []).map(payment => <tr key={payment.reference} className="border-b border-[var(--border-primary)] last:border-0"><td className="p-4 font-mono text-xs">{payment.reference}</td><td className="p-4 font-black">{money.format(Number(payment.amount_kes))}</td><td className="p-4"><span className="inline-flex items-center gap-1 font-mono text-[10px] font-black uppercase">{payment.status === 'success' ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Clock3 size={13} />}{payment.status}</span></td><td className="p-4">{payment.channel || '—'}</td><td className="p-4">{new Date(payment.created_at).toLocaleString('en-KE')}</td></tr>)}{!loading && !data?.payments.length && <tr><td colSpan={5} className="p-10 text-center text-[var(--text-secondary)]">No payment attempts yet.</td></tr>}</tbody></table></div></section>

    <div className="mt-8 grid gap-4 sm:grid-cols-2"><article className="border-2 border-[var(--text-primary)] p-5"><ShieldCheck className="text-[var(--accent-primary)]" /><h3 className="mt-6 font-black">Credits are server verified</h3><p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">A browser return alone never credits a wallet. Amount, currency and provider status must match the stored transaction.</p></article><article className="border-2 border-[var(--text-primary)] p-5"><CheckCircle2 className="text-[var(--accent-primary)]" /><h3 className="mt-6 font-black">Safe to retry</h3><p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">Callback and webhook processing are idempotent, so the same successful reference cannot top up twice.</p></article></div>
  </div></main>;
}
