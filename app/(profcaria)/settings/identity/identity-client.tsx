'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, AtSign, Check, EyeOff, LoaderCircle, Phone, ShieldCheck } from 'lucide-react';
import { validateProfcariaPhone, validateProfcariaUsername } from '@/lib/profcaria-username';

type Identity = {
  username: string;
  hasCustomUsername: boolean;
  phoneNumber: string;
  phoneVerified: boolean;
};

export default function IdentityClient() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/settings/identity', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load your identity.');
        setIdentity(data.identity);
        setUsername(data.identity.username);
        setPhoneNumber(data.identity.phoneNumber);
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unable to load your identity.'))
      .finally(() => setBusy(false));
  }, []);

  const usernameResult = validateProfcariaUsername(username);
  const phoneResult = validateProfcariaPhone(phoneNumber);
  const usernameChanged = Boolean(identity && usernameResult.username !== identity.username);
  const phoneChanged = Boolean(identity && phoneNumber.trim() !== identity.phoneNumber);
  const changed = usernameChanged || phoneChanged;
  const usernameReady = !usernameChanged || usernameResult.valid;

  async function save() {
    if (!identity || !usernameReady || !phoneResult.valid || !changed || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/settings/identity', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(usernameChanged ? { username: usernameResult.username } : {}),
          ...(phoneChanged ? { phoneNumber } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save your identity.');
      setIdentity(data.identity);
      setUsername(data.identity.username);
      setPhoneNumber(data.identity.phoneNumber);
      setMessage('Your Profcaria identity has been saved.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save your identity.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-7 sm:py-10 lg:px-10 lg:py-12">
      <Link href="/settings" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--text-secondary)] transition hover:text-[var(--accent-primary)]">
        <ArrowLeft size={15} /> Settings
      </Link>

      <div className="mt-5 overflow-hidden rounded-[30px] border border-[var(--border-secondary)] bg-[var(--surface-raised)]/90 backdrop-blur-sm">
        <header className="grid border-b border-[var(--border-secondary)] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-6 sm:p-9 lg:p-12">
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[var(--accent-primary)]">Account and identity</p>
            <h1 className="mt-4 max-w-2xl font-editorial text-4xl leading-[0.98] sm:text-6xl">Your sign-in works without a username.</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">Email or Google identifies your account. Choose a public @handle only if you want a memorable profile link or username-based company invitation.</p>
          </div>
          <div className="grid content-center gap-4 border-t border-[var(--border-secondary)] bg-[var(--surface-muted)]/65 p-6 sm:p-9 lg:border-l lg:border-t-0">
            <IdentityPoint icon={<AtSign size={20} />} title="Public handle · optional" text="Useful for profile links and exact invitations, never for signing in." />
            <IdentityPoint icon={<EyeOff size={20} />} title="Private by default" text="Your internal account handle, email and phone stay hidden." />
          </div>
        </header>

        <div className="grid gap-5 p-6 sm:p-9 lg:grid-cols-2 lg:p-12">
          <label className="rounded-[24px] border border-[var(--border-secondary)] bg-[var(--bg-primary)]/35 p-5">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]"><AtSign size={15} /> Public handle · optional</span>
            <div className="mt-5 flex border-b border-[var(--border-primary)] focus-within:border-[var(--accent-primary)]">
              <span className="py-3 pr-1 text-xl text-[var(--accent-primary)]">@</span>
              <input value={username} disabled={busy && !identity} onChange={(event) => setUsername(event.target.value.replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30))} autoComplete="username" placeholder="Choose later if useful" className="min-w-0 flex-1 bg-transparent py-3 text-xl outline-none placeholder:text-[var(--text-muted)]" />
            </div>
            <span className={`mt-3 block text-xs leading-5 ${username && !usernameResult.valid ? 'text-[var(--accent-strong)]' : 'text-[var(--text-secondary)]'}`}>
              {username && !usernameResult.valid ? usernameResult.error : identity?.hasCustomUsername ? 'Your memorable profile and exact invitation handle.' : 'Not needed for login, applying, company chat or hiring.'}
            </span>
          </label>

          <label className="rounded-[24px] border border-[var(--border-secondary)] bg-[var(--bg-primary)]/35 p-5">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]"><Phone size={15} /> Private phone · optional</span>
            <input value={phoneNumber} disabled={busy && !identity} onChange={(event) => setPhoneNumber(event.target.value.replace(/[^0-9+ ()-]/g, ''))} inputMode="tel" autoComplete="tel" placeholder="+254…" className="mt-5 w-full border-0 border-b border-[var(--border-primary)] bg-transparent py-3 text-xl outline-none focus:border-[var(--accent-primary)]" />
            <span className={`mt-3 flex items-center gap-2 text-xs leading-5 ${phoneNumber && !phoneResult.valid ? 'text-[var(--accent-strong)]' : 'text-[var(--text-secondary)]'}`}>
              {identity?.phoneVerified ? <><ShieldCheck size={15} className="text-[var(--accent-primary)]" /> Verified</> : phoneNumber ? 'A changed number must be verified before trusted phone features.' : 'Add this later only if you want phone-based recovery or features.'}
            </span>
          </label>
        </div>

        <div className="flex flex-col gap-4 border-t border-[var(--border-secondary)] p-6 sm:flex-row sm:items-center sm:justify-between sm:px-9 lg:px-12">
          <div aria-live="polite">
            {error && <p className="text-sm text-[var(--accent-strong)]">{error}</p>}
            {message && <p className="flex items-center gap-2 text-sm"><Check size={16} className="text-[var(--accent-primary)]" />{message}</p>}
            {busy && !identity && <p className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><LoaderCircle size={16} className="animate-spin" />Loading your identity…</p>}
          </div>
          <button type="button" onClick={save} disabled={!changed || !usernameReady || !phoneResult.valid || busy} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent-primary)] px-7 text-xs font-black uppercase tracking-[0.18em] text-[var(--text-inverse)] disabled:cursor-not-allowed disabled:opacity-45">
            {busy && identity ? 'Saving…' : 'Save identity'}
          </button>
        </div>
      </div>
    </section>
  );
}

function IdentityPoint({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">{icon}</span><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{text}</p></div></div>;
}
