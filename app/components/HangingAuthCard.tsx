"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Building2, Check, Eye, EyeOff, UserRound } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { PixelBackground } from './PixelBackground';
import ProfcariaLogo, { ProfcariaMark } from './brand/ProfcariaLogo';
import HangingSecurityCard from './HangingSecurityCard';
import { validateProfcariaUsername } from '@/lib/profcaria-username';

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
);

type AuthScreen = 'auth' | 'security_setup' | 'security_verify';
type AuthMode = 'login' | 'signup';
type AccountIntent = 'individual' | 'company';

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
    <path fill="#738D7D" d="M43.6 20.5H42V20H24v8h11.3A12 12 0 0 1 12.7 32l-6.6 5.1A20 20 0 0 0 44 24c0-1.2-.1-2.3-.4-3.5Z" />
    <path fill="#738D7D" d="m6.1 10.9 6.6 4.8A12 12 0 0 1 32 12.1l5.8-5.7A20 20 0 0 0 6.1 10.9Z" />
    <path fill="#3D6254" d="M24 44c5.4 0 10-1.8 13.4-4.9L31.2 34a12 12 0 0 1-18.5-6l-6.6 5.1A20 20 0 0 0 24 44Z" />
    <path fill="#587565" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 6l6.2 5.1C41 35.8 44 30.8 44 24c0-1.2-.1-2.3-.4-3.5Z" />
  </svg>;
}

function Field({ label, type = 'text', value, onChange, autoComplete, placeholder, required = true }: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return <label className="block"><span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.26em] text-[var(--text-muted)]">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} placeholder={placeholder} required={required} className="w-full border-0 border-b border-[var(--border-primary)] bg-transparent px-0 py-3 text-[15px] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)]" /></label>;
}

export default function HangingAuthCard({ isOpen, onClose, initialScreen = 'auth', initialTab = 'individual', initialMode = 'login' }: {
  isOpen: boolean;
  onClose: () => void;
  initialScreen?: AuthScreen;
  initialTab?: AccountIntent | 'professional' | 'employer';
  initialMode?: AuthMode;
}) {
  const { theme, preference, fontPreference } = useTheme();
  const [screen, setScreen] = useState<AuthScreen>(initialScreen);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [intent, setIntent] = useState<AccountIntent>(initialTab === 'company' || initialTab === 'employer' ? 'company' : 'individual');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+254');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setScreen(initialScreen);
    setMode(initialMode);
    setIntent(initialTab === 'company' || initialTab === 'employer' ? 'company' : 'individual');
  }, [initialMode, initialScreen, initialTab, isOpen]);
  useEffect(() => { if (!isOpen) { setError(''); setBusy(false); } }, [isOpen]);

  if (!isOpen) return null;

  const destination = intent === 'company' ? '/work' : '/find-work';
  if (screen === 'security_setup' || screen === 'security_verify') {
    return <HangingSecurityCard isOpen onClose={onClose} initialMode={screen === 'security_setup' ? 'setup' : 'verify'} redirectTo={destination} />;
  }

  const usernameCheck = validateProfcariaUsername(username);
  const valid = mode === 'login'
    ? Boolean(email.trim() && password)
    : Boolean(firstName.trim() && lastName.trim() && email.trim() && password.length >= 8 && usernameCheck.valid && (intent === 'individual' || organizationName.trim().length >= 2));

  async function createOrganization() {
    const response = await fetch('/api/work/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: organizationName.trim() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Your account is ready, but the organisation workspace could not be created.');
  }

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
            username: usernameCheck.username,
            email: email.trim().toLowerCase(),
            password,
            phoneNumber: phone.trim() ? `${countryCode}${phone.replace(/\D/g, '')}` : null,
            onboardingChannel: 'web',
            role: intent === 'company' ? 'Organisation owner' : 'Member',
          };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to continue');

      if (mode === 'signup') {
        if (intent === 'company') await createOrganization();
        await fetch('/api/settings/appearance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme: preference, fontFamily: fontPreference }) }).catch(() => undefined);
      }

      const redirect = data.redirect || destination;
      if (redirect.includes('mode=verify')) setScreen('security_verify');
      else if (redirect.includes('mode=setup')) setScreen('security_setup');
      else window.location.assign(destination);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to continue');
    } finally {
      setBusy(false);
    }
  }

  async function continueWithGoogle() {
    if (busy) return;
    if (mode === 'signup' && intent === 'company' && organizationName.trim().length < 2) {
      setError('Enter your organisation name before continuing with Google.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      localStorage.setItem('pendingOAuthRole', 'account');
      localStorage.setItem('profcariaOAuthIntent', intent);
      localStorage.setItem('profcariaOAuthMode', mode);
      if (mode === 'signup' && intent === 'company') localStorage.setItem('profcariaOAuthOrganization', organizationName.trim());
      else localStorage.removeItem('profcariaOAuthOrganization');
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

  const content = intent === 'company'
    ? {
        eyebrow: 'Company workspace',
        title: mode === 'login' ? 'Welcome back to work.' : 'Build your hiring desk.',
        description: mode === 'login' ? 'Sign in as yourself, then enter every organisation you are authorised to manage.' : 'Create the owner account first. Profcaria will attach a private organisation workspace for your team.',
        asideTitle: <>Hire with<br /><span className="italic">clear authority.</span></>,
        asideBody: 'Company access belongs to real people. Owners can invite recruiters, assign permissions and keep every hiring decision accountable.',
      }
    : {
        eyebrow: 'Individual account',
        title: mode === 'login' ? 'Welcome back.' : 'Keep your career together.',
        description: mode === 'login' ? 'Use the same account to track applications, reply to companies and manage your career records.' : 'Create a private account for applications, conversations and work history. You can join a company later by invitation.',
        asideTitle: <>Your career.<br /><span className="italic">Always yours.</span></>,
        asideBody: 'Apply as an individual, keep your records private and carry your identity between opportunities without exposing personal details.',
      };

  return (
    <div className="profcaria-scrollbar fixed inset-0 z-[100] flex touch-pan-y items-start justify-center overflow-y-scroll overscroll-contain bg-black/55 p-0 backdrop-blur-sm sm:p-4 lg:p-6" data-lenis-prevent data-lenis-prevent-touch data-lenis-prevent-wheel role="dialog" aria-modal="true" aria-label={mode === 'login' ? 'Sign in to Profcaria' : 'Create a Profcaria account'} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="relative my-auto grid min-h-full w-full max-w-5xl overflow-hidden border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-2xl sm:min-h-0 lg:h-[calc(100dvh-3rem)] lg:max-h-[920px] lg:grid-cols-[0.88fr_1.12fr]">
        <PixelBackground isDark={theme === 'dark'} className="pointer-events-none absolute inset-0 z-0" />
        <button onClick={onClose} className="absolute right-5 top-5 z-20 grid h-9 w-9 place-items-center border border-[var(--border-primary)] text-xl text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]" aria-label="Close">×</button>

        <aside className="relative z-10 hidden min-h-0 flex-col justify-between overflow-hidden border-r border-[var(--border-primary)] bg-[var(--accent-primary)] p-10 text-[var(--text-inverse)] lg:flex xl:p-12">
          <ProfcariaMark className="h-24 w-20" />
          <div><p className="font-editorial text-6xl leading-[0.88]">{content.asideTitle}</p><p className="mt-7 max-w-xs text-sm leading-7 opacity-80">{content.asideBody}</p></div>
          <p className="text-[9px] font-bold uppercase tracking-[0.28em] opacity-65">One login · permissioned workspaces</p>
        </aside>

        <div className="profcaria-scrollbar relative z-10 flex min-h-full touch-pan-y flex-col overflow-y-scroll overscroll-y-contain bg-[var(--surface-raised)]/88 px-6 py-8 backdrop-blur-sm sm:px-10 sm:py-10 lg:h-full lg:min-h-0 lg:px-12 xl:px-14" data-lenis-prevent data-lenis-prevent-touch data-lenis-prevent-wheel tabIndex={0} aria-label="Scrollable sign in form">
          <div className="pr-12"><ProfcariaLogo className="text-xl" markClassName="text-[var(--accent-primary)]" /><p className="mt-3 text-[9px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">{content.eyebrow}</p></div>

          <div className="my-auto py-8 sm:py-9">
            <div className="mb-6 flex border-b border-[var(--border-primary)]">
              {(['login', 'signup'] as const).map((item) => <button key={item} onClick={() => { setMode(item); setError(''); }} className={`relative flex-1 pb-4 text-[10px] font-bold uppercase tracking-[0.25em] transition-colors ${mode === item ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{item === 'login' ? 'Sign in' : 'Create account'}{mode === item && <span className="absolute inset-x-0 -bottom-px h-px bg-[var(--accent-primary)]" />}</button>)}
            </div>

            <div className="mb-8 grid grid-cols-2 gap-2" aria-label="Choose how you will use Profcaria">
              {([
                ['individual', UserRound, 'Individual', 'Apply & grow'],
                ['company', Building2, 'Company', 'Hire & manage'],
              ] as const).map(([value, Icon, label, note]) => {
                const active = intent === value;
                return <button key={value} type="button" onClick={() => { setIntent(value); setError(''); }} aria-pressed={active} className={`relative flex items-center gap-3 border px-3 py-3 text-left transition ${active ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)]' : 'border-[var(--border-primary)] bg-[var(--bg-primary)] hover:border-[var(--text-muted)]'}`}><span className={`grid h-9 w-9 shrink-0 place-items-center ${active ? 'bg-[var(--accent-primary)] text-[var(--text-inverse)]' : 'bg-[var(--surface-muted)] text-[var(--text-secondary)]'}`}><Icon size={17} /></span><span><span className="block text-xs font-bold">{label}</span><span className="mt-0.5 hidden text-[9px] uppercase tracking-[0.12em] text-[var(--text-muted)] sm:block">{note}</span></span>{active && <Check size={14} className="absolute right-2 top-2 text-[var(--accent-primary)]" />}</button>;
              })}
            </div>

            <h1 className="font-editorial text-[clamp(2.8rem,5vw,4rem)] leading-[0.95] tracking-[-0.04em]">{content.title}</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[var(--text-secondary)]">{content.description}</p>

            {mode === 'signup' && intent === 'company' && <div className="mt-7"><Field label="Organisation name" value={organizationName} onChange={setOrganizationName} autoComplete="organization" placeholder="The company or organisation you represent" /></div>}

            <button onClick={continueWithGoogle} disabled={busy} className="mt-7 flex w-full items-center justify-center gap-3 border border-[var(--border-primary)] bg-[var(--bg-primary)] px-5 py-3.5 text-sm font-semibold transition-colors hover:border-[var(--accent-primary)] disabled:opacity-50"><GoogleMark />Continue with Google</button>
            <div className="my-6 flex items-center gap-4"><span className="h-px flex-1 bg-[var(--border-primary)]" /><span className="text-[9px] uppercase tracking-[0.24em] text-[var(--text-muted)]">or use email</span><span className="h-px flex-1 bg-[var(--border-primary)]" /></div>

            <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="space-y-5">
              {mode === 'signup' && <div className="grid gap-5 sm:grid-cols-2"><Field label={intent === 'company' ? "Owner's first name" : 'First name'} value={firstName} onChange={setFirstName} autoComplete="given-name" /><Field label={intent === 'company' ? "Owner's last name" : 'Last name'} value={lastName} onChange={setLastName} autoComplete="family-name" /></div>}
              {mode === 'signup' && <div><div className="flex border-b border-[var(--border-primary)] focus-within:border-[var(--accent-primary)]"><span className="py-3 pr-1 text-[15px] text-[var(--accent-primary)]">@</span><input aria-label="Unique username" value={username} onChange={(event) => setUsername(event.target.value.replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30))} autoComplete="username" placeholder="your_unique_name" className="min-w-0 flex-1 bg-transparent py-3 text-[15px] outline-none placeholder:text-[var(--text-muted)]" /></div><p className={`mt-2 text-[10px] leading-4 ${username && !usernameCheck.valid ? 'text-[var(--accent-strong)]' : 'text-[var(--text-muted)]'}`}>{username && !usernameCheck.valid ? usernameCheck.error : intent === 'company' ? 'This identifies the account owner. The organisation keeps its own public name.' : 'People can find you without seeing your phone number.'}</p></div>}
              <Field label={intent === 'company' ? 'Work email address' : 'Email address'} type="email" value={email} onChange={setEmail} autoComplete="email" />
              <label className="block"><span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.26em] text-[var(--text-muted)]">{mode === 'signup' ? 'Password · 8 characters minimum' : 'Password'}</span><div className="flex border-b border-[var(--border-primary)] focus-within:border-[var(--accent-primary)]"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="min-w-0 flex-1 bg-transparent py-3 text-[15px] outline-none" /><button type="button" onClick={() => setShowPassword(current => !current)} className="px-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
              {mode === 'signup' && <div><span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.26em] text-[var(--text-muted)]">Phone number · optional on web</span><div className="flex border-b border-[var(--border-primary)] focus-within:border-[var(--accent-primary)]"><select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="bg-transparent py-3 pr-3 text-sm outline-none"><option value="+254">KE +254</option><option value="+256">UG +256</option><option value="+255">TZ +255</option><option value="+250">RW +250</option><option value="+234">NG +234</option><option value="+27">ZA +27</option><option value="+1">US/CA +1</option><option value="+44">UK +44</option></select><input value={phone} onChange={(event) => setPhone(event.target.value.replace(/[^0-9 ]/g, ''))} inputMode="tel" autoComplete="tel" placeholder="Add now or later in Settings" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-[var(--text-muted)]" /></div></div>}
              {error && <p className="border-l-2 border-[var(--accent-primary)] pl-3 text-sm leading-5 text-[var(--accent-strong)]" role="alert">{error}</p>}
              <button type="submit" disabled={!valid || busy} className="w-full bg-[var(--accent-primary)] px-5 py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-inverse)] transition-opacity disabled:cursor-not-allowed disabled:opacity-45">{busy ? 'Please wait…' : mode === 'login' ? `Continue to ${intent === 'company' ? 'Work' : 'your account'}` : intent === 'company' ? 'Create owner account' : 'Create individual account'}</button>
            </form>
          </div>

          <p className="text-center text-[9px] uppercase tracking-[0.2em] text-[var(--text-muted)]">One person, one login. Company access is permissioned and auditable.</p>
        </div>
      </section>
    </div>
  );
}
