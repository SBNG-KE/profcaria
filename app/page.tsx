//app/page.tsx

"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  User,
  Briefcase,
  ArrowRight,
  Lock,
  Mail,
  Upload,
  Phone,
  Globe
} from 'lucide-react';

// --- COMPONENTS ---



// 1. The Pillar Component - Enhanced Visibility & Texture
const Pillar = ({ className }: { className?: string }) => (
  <div className={`relative h-full w-24 flex-shrink-0 flex flex-col items-center justify-end ${className}`}>
    {/* Capital (Top) */}
    <div className="w-32 h-12 bg-gradient-to-b from-slate-600 to-slate-800 rounded-t-sm shadow-2xl mb-1 border-b border-black/50 z-10" />

    {/* Shaft (Main Body) - Fluted effect */}
    <div className="flex-grow w-24 bg-[#1e293b] shadow-2xl relative overflow-hidden flex justify-center border-x border-slate-900">
      {/* Fluting (Vertical Lines) */}
      <div className="w-full h-full flex justify-between px-2 opacity-50">
        <div className="w-2 h-full bg-gradient-to-r from-black/60 to-transparent"></div>
        <div className="w-2 h-full bg-gradient-to-r from-black/60 to-transparent"></div>
        <div className="w-2 h-full bg-gradient-to-r from-black/60 to-transparent"></div>
        <div className="w-2 h-full bg-gradient-to-r from-black/60 to-transparent"></div>
      </div>
      {/* 3D lighting gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 pointer-events-none"></div>
    </div>

    {/* Base (Bottom) */}
    <div className="w-36 h-14 bg-gradient-to-t from-slate-800 to-slate-700 rounded-sm shadow-xl mt-1 border-t border-slate-600/50 z-10" />
  </div>
);

// 2. Input Component
const ModernInput = ({
  type = "text",
  placeholder,
  icon: Icon,
  value,
  onChange,
  onFocus,
  className
}: {
  type?: string;
  placeholder: string;
  icon?: React.ElementType;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  className?: string;
}) => (
  <div className={`relative group ${className}`}>
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
      {Icon && <Icon size={18} />}
    </div>
    <input
      type={type}
      onFocus={onFocus}
      className="w-full bg-slate-900/80 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent block pl-10 p-3.5 placeholder-slate-600 transition-all duration-300 backdrop-blur-md hover:bg-slate-800/80 shadow-inner"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  </div>
);

// 3. Social Auth Button
const SocialButton = ({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) => (
  <button className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-all duration-300 group shadow-lg hover:shadow-blue-900/20">
    <Icon className={`${color} group-hover:scale-110 transition-transform`} size={20} />
    <span className="text-slate-300 font-medium text-sm">{label}</span>
  </button>
);

export default function ProfcariaLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // Global Mode State: 'login' or 'signup' applies to both sides
  const [globalMode, setGlobalMode] = useState<'login' | 'signup'>('login');

  // Focus State: 'professional', 'employer', or null
  const [activeSection, setActiveSection] = useState<'professional' | 'employer' | null>(null);

  // Professional State
  const [profFirstName, setProfFirstName] = useState('');
  const [profLastName, setProfLastName] = useState('');
  const [profEmail, setProfEmail] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [profPassword, setProfPassword] = useState('');
  const [profRole, setProfRole] = useState('');

  // Employer State
  const [empCompanyName, setEmpCompanyName] = useState('');
  const [empWorkEmail, setEmpWorkEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empPassword, setEmpPassword] = useState('');

  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
    }
  };

  // Helper to determine opacity based on active section
  const getOpacity = (section: 'professional' | 'employer') => {
    if (activeSection === null) return 'opacity-100 grayscale-0';
    return activeSection === section ? 'opacity-100 grayscale-0 scale-[1.01]' : 'opacity-30 grayscale blur-[1px]';
  };

  return (
    <div className="min-h-screen bg-[#050b14] text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden flex flex-col relative">

      {/* Background Texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 z-0 mix-blend-overlay"></div>

      {/* --- HEADER --- */}
      <header className="relative z-20 w-full p-6 flex flex-col items-center justify-center mt-2 mb-4">

        {/* Logo Placeholder */}
        <div className="mb-4 w-20 h-20 bg-slate-900/50 border border-dashed border-slate-700 rounded-xl flex items-center justify-center relative overflow-hidden group hover:border-blue-500/50 transition-colors">
          {/* User will add their logo logic/image here */}
          <span className="text-[10px] text-slate-500 text-center px-2">Logo Placeholder</span>
          <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full opacity-50"></div>
        </div>

        {/* Title */}
        <h1 className="text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-lg mb-6">
          Profcaria
        </h1>

        {/* Universal Mode Switcher */}
        <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800 shadow-2xl w-[300px]">
          <button
            onClick={() => { setGlobalMode('login'); setActiveSection(null); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${globalMode === 'login' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setGlobalMode('signup'); setActiveSection(null); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${globalMode === 'signup' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* --- MAIN PANTHEON LAYOUT --- */}
      <main className="flex-grow flex justify-center items-stretch relative z-10 px-0 md:px-8 pb-12 max-w-[1920px] mx-auto w-full h-full">

        {/* PILLAR 1 */}
        <Pillar className="hidden lg:flex" />

        {/* --- SECTION 1: PROFESSIONAL (The Talent) --- */}
        <section
          className={`flex-1 min-w-[320px] max-w-xl flex flex-col p-8 transition-all duration-500 ${getOpacity('professional')}`}
          onClick={() => setActiveSection('professional')}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-900/20 rounded-xl text-blue-400 shadow-inner border border-blue-900/30">
              <User size={28} />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-wide">Professional</h2>
          </div>

          <div className="space-y-5 flex-grow">
            {globalMode === 'signup' && (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ModernInput
                  onFocus={() => setActiveSection('professional')}
                  placeholder="First Name"
                  icon={User}
                  value={profFirstName}
                  onChange={(e) => setProfFirstName(e.target.value)}
                />
                <ModernInput
                  onFocus={() => setActiveSection('professional')}
                  placeholder="Last Name"
                  value={profLastName}
                  onChange={(e) => setProfLastName(e.target.value)}
                />
              </div>
            )}

            <ModernInput
              onFocus={() => setActiveSection('professional')}
              placeholder="Email Address"
              type="email"
              icon={Mail}
              value={profEmail}
              onChange={(e) => setProfEmail(e.target.value)}
            />
            {globalMode === 'signup' && (
              <ModernInput
                onFocus={() => setActiveSection('professional')}
                placeholder="Phone Number"
                type="tel"
                icon={Phone}
                value={profPhone}
                onChange={(e) => setProfPhone(e.target.value)}
              />
            )}
            <ModernInput
              onFocus={() => setActiveSection('professional')}
              placeholder="Password"
              type="password"
              icon={Lock}
              value={profPassword}
              onChange={(e) => setProfPassword(e.target.value)}
            />

            {globalMode === 'signup' ? (
              <ModernInput
                onFocus={() => setActiveSection('professional')}
                placeholder="Current Role / Title"
                icon={Briefcase}
                className="animate-in fade-in slide-in-from-bottom-5 duration-700"
                value={profRole}
                onChange={(e) => setProfRole(e.target.value)}
              />
            ) : (
              <div className="flex justify-end pt-1">
                <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Forgot Password?</button>
              </div>
            )}
          </div>

          <div className="mt-10 flex justify-end">
            <button
              disabled={loading}
              onClick={async () => {
                try {
                  setLoading(true);

                  const res = await fetch(
                    globalMode === 'login'
                      ? '/api/professional/login'
                      : '/api/professional/signup',
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email: profEmail,
                        password: profPassword,
                        firstName: profFirstName,
                        lastName: profLastName,
                        phone: profPhone,
                        role: profRole
                      }),
                    }
                  );

                  if (!res.ok) throw new Error('Auth failed');

                  // ✅ TEMP REDIRECT
                  router.push('/professional/home');
                } catch (err) {
                  console.error(err);
                  alert('Authentication failed');
                } finally {
                  setLoading(false);
                }
              }}
              className="bg-gradient-to-r from-blue-700 to-blue-600 p-5 rounded-full"
            >
              <ArrowRight size={28} />
            </button>

          </div>
        </section>

        {/* PILLAR 2 */}
        <Pillar className="hidden md:flex" />

        {/* --- SECTION 2: CENTRAL GATEWAY (Social & 2FA) --- */}
        <section className="flex-1 min-w-[300px] max-w-md flex flex-col p-6 relative justify-center">
          {/* Mobile divider */}
          <div className="absolute inset-y-8 left-0 w-px bg-gradient-to-b from-transparent via-slate-800 to-transparent md:hidden" />

          <div className="flex justify-center mb-6">
            <div className="p-3 bg-purple-900/10 rounded-full text-purple-400 ring-1 ring-purple-500/20">
              <Globe size={28} />
            </div>
          </div>

          <div className="space-y-4 w-full">
            <SocialButton
              icon={({ className }: { className?: string }) => (
                <svg className={className} viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              label="Continue with Google"
              color=""
            />

            <SocialButton
              icon={({ className }: { className?: string }) => (
                <svg className={className} viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78 1.18-.19 2.31-.89 3.51-.84 1.54.06 2.68.75 3.56 1.77-3.19 1.6-2.66 6.09.52 7.46-.3 1.54-1.12 3-2.67 3.8ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" /></svg>
              )}
              label="Continue with Apple"
              color="text-white"
            />

            <SocialButton
              icon={({ className }: { className?: string }) => (
                <svg className={className} viewBox="0 0 23 23" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path fill="#f35325" d="M1 1h10v10H1z" /><path fill="#81bc06" d="M12 1h10v10H12z" /><path fill="#05a6f0" d="M1 12h10v10H1z" /><path fill="#ffba08" d="M12 12h10v10H12z" /></svg>
              )}
              label="Continue with Microsoft"
              color=""
            />
          </div>
        </section>

        {/* PILLAR 3 */}
        <Pillar className="hidden md:flex" />

        {/* --- SECTION 3: EMPLOYER (The Corporate Side) --- */}
        <section
          className={`flex-1 min-w-[320px] max-w-xl flex flex-col p-8 transition-all duration-500 ${getOpacity('employer')}`}
          onClick={() => setActiveSection('employer')}
        >
          {/* Mobile divider */}
          <div className="absolute inset-y-8 left-0 w-px bg-gradient-to-b from-transparent via-slate-800 to-transparent md:hidden" />

          <div className="flex items-center gap-4 mb-8 justify-end md:justify-start">
            <h2 className="text-2xl font-bold text-slate-100 tracking-wide">Employer</h2>
            <div className="p-3 bg-emerald-900/20 rounded-xl text-emerald-400 shadow-inner border border-emerald-900/30">
              <Briefcase size={28} />
            </div>
          </div>

          <div className="space-y-5 flex-grow">
            {globalMode === 'signup' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-5">
                <ModernInput
                  onFocus={() => setActiveSection('employer')}
                  placeholder="Company Name"
                  icon={Briefcase}
                  value={empCompanyName}
                  onChange={(e) => setEmpCompanyName(e.target.value)}
                />

                {/* Logo Image Picker */}
                <div className="relative group cursor-pointer border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-6 transition-colors text-center bg-slate-900/40">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept="image/*"
                    onChange={handleImageUpload}
                    onFocus={() => setActiveSection('employer')}
                  />
                  {logoPreview ? (
                    <div className="flex items-center gap-3 justify-center">
                      <Image src={logoPreview} alt="Logo" width={48} height={48} unoptimized className="w-12 h-12 rounded-full object-cover border border-slate-600" />
                      <span className="text-sm text-emerald-400 font-medium">Logo Uploaded</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500 group-hover:text-slate-300">
                      <Upload size={24} />
                      <span className="text-sm font-medium">Upload Company Logo</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <ModernInput
              onFocus={() => setActiveSection('employer')}
              placeholder="Work Email"
              type="email"
              icon={Mail}
              value={empWorkEmail}
              onChange={(e) => setEmpWorkEmail(e.target.value)}
            />
            {globalMode === 'signup' && (
              <ModernInput
                onFocus={() => setActiveSection('employer')}
                placeholder="Phone Number"
                type="tel"
                icon={Phone}
                value={empPhone}
                onChange={(e) => setEmpPhone(e.target.value)}
              />
            )}
            <ModernInput
              onFocus={() => setActiveSection('employer')}
              placeholder="Password"
              type="password"
              icon={Lock}
              value={empPassword}
              onChange={(e) => setEmpPassword(e.target.value)}
            />

            {globalMode === 'login' && (
              <div className="flex justify-end pt-1">
                <button className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors">Forgot Password?</button>
              </div>
            )}
          </div>

          <div className="mt-10 flex justify-end">
            <button
              disabled={loading}
              onClick={async () => {
                try {
                  setLoading(true);

                  const res = await fetch(
                    globalMode === 'login'
                      ? '/api/employer/login'
                      : '/api/employer/signup',
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        companyName: empCompanyName,
                        workEmail: empWorkEmail,
                        phone: empPhone,
                        password: empPassword,
                        logoUrl: logoPreview,
                      }),
                    }
                  );

                  if (!res.ok) throw new Error('Auth failed');

                  // ✅ TEMP REDIRECT
                  router.push('/employer/home');
                } catch (err) {
                  console.error(err);
                  alert('Authentication failed');
                } finally {
                  setLoading(false);
                }
              }}
              className="bg-gradient-to-r from-emerald-800 to-emerald-700 p-5 rounded-full"
            >
              <ArrowRight size={28} />
            </button>

          </div>
        </section>

        {/* PILLAR 4 */}
        <Pillar className="hidden lg:flex" />

      </main>

      {/* Footer - Minimal System Status */}
      <footer className="w-full text-center py-4 text-[10px] text-slate-700 bg-[#02050a] z-10">
        <div className="flex justify-center gap-8 font-mono tracking-widest opacity-60">
          <span>SYSTEM_ONLINE</span>
          <span>SECURE_CONNECTION</span>
        </div>
      </footer>

    </div>
  );
}