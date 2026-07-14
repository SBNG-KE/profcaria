"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '../context/ThemeContext';
import { PixelBackground } from './PixelBackground';
import OndwiraLogo, { OndwiraMark } from './brand/OndwiraLogo';
import HangingSecurityCard from './HangingSecurityCard';

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
);

type AuthScreen = 'auth' | 'security_setup' | 'security_verify';

function Field({ label, type = 'text', value, onChange, autoComplete, required = true }: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return <label className="block"><span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.26em] text-[var(--text-muted)]">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} required={required} className="w-full border-0 border-b border-[var(--border-primary)] bg-transparent px-0 py-3 text-[15px] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)]" /></label>;
}

export default function HangingAuthCard({ isOpen, onClose, initialScreen = 'auth' }: {
  isOpen: boolean;
  onClose: () => void;
  initialScreen?: AuthScreen;
  initialTab?: 'professional' | 'employer';
}) {
  const { theme, preference, fontPreference } = useTheme();
  const [screen, setScreen] = useState<AuthScreen>(initialScreen);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+254');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (isOpen) setScreen(initialScreen); }, [initialScreen, isOpen]);
  useEffect(() => { if (!isOpen) { setError(''); setBusy(false); } }, [isOpen]);

  if (!isOpen) return null;
  if (screen === 'security_setup' || screen === 'security_verify') {
    return <HangingSecurityCard isOpen onClose={onClose} initialMode={screen === 'security_setup' ? 'setup' : 'verify'} />;
  }

  const valid = mode === 'login'
    ? Boolean(email.trim() && password)
    : Boolean(firstName.trim() && lastName.trim() && email.trim() && password.length >= 8 && phone.trim());

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    setError('');
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/professional/signup';
      const payload = mode === 'login'
        ? { email: email.trim().toLowerCase(), password }
        : {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim().toLowerCase(),
            password,
            phoneNumber: `${countryCode}${phone.replace(/\D/g, '')}`,
            role: 'Member',
          };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to continue');
      if (mode === 'signup') {
        await fetch('/api/settings/appearance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme: preference, fontFamily: fontPreference }) }).catch(() => undefined);
      }
      const redirect = data.redirect || (mode === 'signup' ? '/?mode=setup&redirect=/social' : '/social');
      if (redirect.includes('mode=verify')) setScreen('security_verify');
      else if (redirect.includes('mode=setup')) setScreen('security_setup');
      else window.location.assign(redirect);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to continue');
    } finally {
      setBusy(false);
    }
  }

  async function continueWithGoogle() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      localStorage.setItem('pendingOAuthRole', 'account');
      const { error: oauthError } = await supabaseAuth.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { prompt: 'select_account' } },
      });
      if (oauthError) throw oauthError;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Google sign-in could not start');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/55 p-0 backdrop-blur-sm sm:p-4 lg:p-6" role="dialog" aria-modal="true" aria-label={mode === 'login' ? 'Sign in to Ondwira' : 'Create an Ondwira account'} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="relative my-auto grid min-h-full w-full max-w-5xl overflow-hidden border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-2xl sm:min-h-0 lg:h-[min(760px,calc(100dvh-3rem))] lg:grid-cols-[0.9fr_1.1fr]">
        <PixelBackground isDark={theme === 'dark'} className="absolute inset-0 z-0 pointer-events-none" />
        <button onClick={onClose} className="absolute right-5 top-5 z-20 h-9 w-9 border border-[var(--border-primary)] text-lg text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]" aria-label="Close">×</button>

        <aside className="relative z-10 hidden min-h-0 flex-col justify-between overflow-hidden border-r border-[var(--border-primary)] bg-[var(--accent-primary)] p-10 text-[var(--text-inverse)] lg:flex xl:p-12">
          <OndwiraMark className="h-24 w-20" />
          <div><p className="font-editorial text-6xl leading-[0.88]">One entrance.<br /><span className="italic">Every chapter.</span></p><p className="mt-7 max-w-xs text-sm leading-7 opacity-80">Your social life and work life remain clearly separated by permissions, while the account always remains yours.</p></div>
          <p className="text-[9px] font-bold uppercase tracking-[0.28em] opacity-65">Private by structure · continuous by design</p>
        </aside>

        <div className="relative z-10 flex min-h-full flex-col overflow-y-auto overscroll-contain bg-[var(--surface-raised)]/82 px-6 py-8 backdrop-blur-sm sm:px-10 sm:py-10 lg:min-h-0 lg:px-12 lg:py-10 xl:px-14">
          <div className="pr-12"><OndwiraLogo className="text-xl" markClassName="text-[var(--accent-primary)]" /><p className="mt-3 text-[9px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">One personal account</p></div>

          <div className="my-auto py-9 sm:py-10">
            <div className="mb-10 flex border-b border-[var(--border-primary)]">
              {(['login', 'signup'] as const).map((item) => <button key={item} onClick={() => { setMode(item); setError(''); }} className={`relative flex-1 pb-4 text-[10px] font-bold uppercase tracking-[0.25em] transition-colors ${mode === item ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{item === 'login' ? 'Sign in' : 'Create account'}{mode === item && <span className="absolute inset-x-0 -bottom-px h-px bg-[var(--accent-primary)]" />}</button>)}
            </div>

            <h1 className="font-editorial text-5xl leading-none">{mode === 'login' ? 'Welcome back.' : 'Begin your ledger.'}</h1>
            <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)]">{mode === 'login' ? 'Enter the same account for Social and Work.' : 'You will create organisations from Work—not a separate employer identity.'}</p>

            <button onClick={continueWithGoogle} disabled={busy} className="mt-8 flex w-full items-center justify-center gap-3 border border-[var(--border-primary)] bg-[var(--bg-primary)] px-5 py-3.5 text-sm font-semibold transition-colors hover:border-[var(--accent-primary)] disabled:opacity-50"><span className="font-bold text-[#4285f4]">G</span>Continue with Google</button>
            <div className="my-7 flex items-center gap-4"><span className="h-px flex-1 bg-[var(--border-primary)]" /><span className="text-[9px] uppercase tracking-[0.24em] text-[var(--text-muted)]">or use email</span><span className="h-px flex-1 bg-[var(--border-primary)]" /></div>

            <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="space-y-5">
              {mode === 'signup' && <div className="grid gap-5 sm:grid-cols-2"><Field label="First name" value={firstName} onChange={setFirstName} autoComplete="given-name" /><Field label="Last name" value={lastName} onChange={setLastName} autoComplete="family-name" /></div>}
              <Field label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" />
              <Field label={mode === 'signup' ? 'Password · 8 characters minimum' : 'Password'} type="password" value={password} onChange={setPassword} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              {mode === 'signup' && <div><span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.26em] text-[var(--text-muted)]">Phone number</span><div className="flex border-b border-[var(--border-primary)] focus-within:border-[var(--accent-primary)]"><select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="bg-transparent py-3 pr-3 text-sm outline-none"><option value="+254">KE +254</option><option value="+256">UG +256</option><option value="+255">TZ +255</option><option value="+250">RW +250</option><option value="+234">NG +234</option><option value="+27">ZA +27</option><option value="+1">US/CA +1</option><option value="+44">UK +44</option></select><input value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^0-9 ]/g, ''))} inputMode="tel" autoComplete="tel" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" /></div></div>}
              {error && <p className="border-l-2 border-[var(--accent-primary)] pl-3 text-sm text-[var(--accent-strong)]" role="alert">{error}</p>}
              <button type="submit" disabled={!valid || busy} className="w-full bg-[var(--accent-primary)] px-5 py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-inverse)] transition-opacity disabled:cursor-not-allowed disabled:opacity-45">{busy ? 'Please wait…' : mode === 'login' ? 'Enter Ondwira' : 'Create one account'}</button>
            </form>
          </div>

          <p className="text-center text-[9px] uppercase tracking-[0.2em] text-[var(--text-muted)]">By continuing, you accept Ondwira’s terms and privacy commitments.</p>
        </div>
      </section>
    </div>
  );
}
