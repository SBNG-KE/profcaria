"use client"

/**
 * HangingAuthCard.tsx
 * 
 * UNIFIED Auth + Security flow in a single hanging card.
 * 
 * After auth success, if redirect is to /security/setup or /security/verify,
 * it shows the security card inline instead of navigating.
 * 
 * CRITICAL: NO FUNCTION CHANGES - All auth logic preserved exactly.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import {
    User,
    Briefcase,
    ArrowRight,
    Lock,
    Mail,
    Eye,
    EyeOff,
    Check,
    ArrowLeft,
    ChevronDown,
    Search,
    Phone
} from 'lucide-react';

// Common country codes
const COUNTRY_CODES = [
    { code: '+1', label: 'US/CA', flag: '🇺🇸' },
    { code: '+44', label: 'UK', flag: '🇬🇧' },
    { code: '+254', label: 'KE', flag: '🇰🇪' },
    { code: '+234', label: 'NG', flag: '🇳🇬' },
    { code: '+27', label: 'ZA', flag: '🇿🇦' },
    { code: '+91', label: 'IN', flag: '🇮🇳' },
    { code: '+61', label: 'AU', flag: '🇦🇺' },
    { code: '+49', label: 'DE', flag: '🇩🇪' },
    { code: '+33', label: 'FR', flag: '🇫🇷' },
    { code: '+81', label: 'JP', flag: '🇯🇵' },
    { code: '+86', label: 'CN', flag: '🇨🇳' },
    { code: '+55', label: 'BR', flag: '🇧🇷' },
    { code: '+971', label: 'UAE', flag: '🇦🇪' },
    { code: '+966', label: 'SA', flag: '🇸🇦' },
    { code: '+65', label: 'SG', flag: '🇸🇬' },
    { code: '+82', label: 'KR', flag: '🇰🇷' },
    { code: '+31', label: 'NL', flag: '🇳🇱' },
    { code: '+46', label: 'SE', flag: '🇸🇪' },
    { code: '+41', label: 'CH', flag: '🇨🇭' },
    { code: '+34', label: 'ES', flag: '🇪🇸' },
    { code: '+39', label: 'IT', flag: '🇮🇹' },
    { code: '+7', label: 'RU', flag: '🇷🇺' },
    { code: '+52', label: 'MX', flag: '🇲🇽' },
    { code: '+62', label: 'ID', flag: '🇮🇩' },
    { code: '+63', label: 'PH', flag: '🇵🇭' },
    { code: '+20', label: 'EG', flag: '🇪🇬' },
    { code: '+255', label: 'TZ', flag: '🇹🇿' },
    { code: '+256', label: 'UG', flag: '🇺🇬' },
    { code: '+233', label: 'GH', flag: '🇬🇭' },
    { code: '+251', label: 'ET', flag: '🇪🇹' },
];
import { useTheme } from '../context/ThemeContext';
import HangingSecurityCard from './HangingSecurityCard';
import { PixelBackground } from './PixelBackground';

// Supabase client for OAuth only
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
const supabaseAuth = createClient(supabaseUrl, supabaseKey);

// --- SOCIAL PROVIDER ICONS ---
const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const MicrosoftIcon = () => (
    <svg width="18" height="18" viewBox="0 0 21 21">
        <rect x="1" y="1" width="9" height="9" fill="#F25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
        <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
        <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
);


// --- MODERN INPUT COMPONENT ---
interface ModernInputProps {
    type?: string;
    placeholder: string;
    icon?: React.ElementType;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    showPasswordToggle?: boolean;
    passwordVisible?: boolean;
    onTogglePassword?: () => void;
    name?: string;
    theme: 'light' | 'dark';
}

const ModernInput = ({
    type = "text",
    placeholder,
    icon: Icon,
    value,
    onChange,
    showPasswordToggle,
    passwordVisible,
    onTogglePassword,
    name,
    theme
}: ModernInputProps) => {
    const isDark = theme === 'dark';

    return (
        <div className="relative group">
            <div className={`
                absolute top-3 left-0 flex items-center transition-colors duration-300
                ${isDark ? 'text-neutral-500 group-focus-within:text-white' : 'text-neutral-400 group-focus-within:text-black'}
            `}>
                {Icon && <Icon size={18} />}
            </div>

            <input
                type={showPasswordToggle ? (passwordVisible ? "text" : "password") : type}
                value={value}
                onChange={onChange}
                name={name}
                className={`
                    w-full bg-transparent border-b-2 py-3 pl-8 pr-4 text-sm outline-none transition-all duration-300
                    ${isDark
                        ? 'border-neutral-800 text-white placeholder-neutral-600 focus:border-white'
                        : 'border-neutral-200 text-black placeholder-neutral-400 focus:border-black'
                    }
                `}
                placeholder={placeholder}
            />

            {showPasswordToggle && onTogglePassword && (
                <button
                    type="button"
                    onClick={onTogglePassword}
                    className={`
                        absolute top-3 right-0 transition-colors
                        ${isDark ? 'text-neutral-600 hover:text-white' : 'text-neutral-400 hover:text-black'}
                    `}
                >
                    {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            )}
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function HangingAuthCard({
    isOpen,
    onClose,
    initialScreen = 'auth',
    initialTab = 'professional'
}: {
    isOpen: boolean;
    onClose: () => void;
    initialScreen?: 'auth' | 'security_setup' | 'security_verify';
    initialTab?: 'professional' | 'employer';
}) {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // SCREEN: 'auth' | 'security_setup' | 'security_verify'
    const [screen, setScreen] = useState<'auth' | 'security_setup' | 'security_verify'>(initialScreen);

    // AUTH STATE (PRESERVED FROM auth/page.tsx)
    const [globalMode, setGlobalMode] = useState<'login' | 'signup'>('login');
    const [socialLoading, setSocialLoading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'professional' | 'employer'>(initialTab);
    const [loading, setLoading] = useState(false);

    // Professional State
    const [profFirstName, setProfFirstName] = useState('');
    const [profLastName, setProfLastName] = useState('');
    const [profEmail, setProfEmail] = useState('');
    const [profPassword, setProfPassword] = useState('');
    const [profPhone, setProfPhone] = useState('');
    const [profCountryCode, setProfCountryCode] = useState('+1');
    const [passwordVisible, setPasswordVisible] = useState(false);

    // Employer State
    const [empCompanyName, setEmpCompanyName] = useState('');
    const [empWorkEmail, setEmpWorkEmail] = useState('');
    const [empPassword, setEmpPassword] = useState('');
    const [empIndustry, setEmpIndustry] = useState('');
    const [empPhone, setEmpPhone] = useState('');
    const [empCountryCode, setEmpCountryCode] = useState('+1');
    const [industries, setIndustries] = useState<{ name: string, category: string }[]>([]);
    const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
    const [industrySearch, setIndustrySearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsIndustryDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search on open
    useEffect(() => {
        if (isIndustryDropdownOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isIndustryDropdownOpen]);

    // Fetch Industries
    useEffect(() => {
        const fetchIndustries = async () => {
            try {
                const res = await fetch('/api/common/industries');
                if (res.ok) {
                    const data = await res.json();
                    setIndustries(data.industries || []);
                }
            } catch (e) { console.error('Failed to load industries', e); }
        };
        fetchIndustries();
    }, []);

    // Reset state when closed or opened with new screen/tab
    useEffect(() => {
        if (!isOpen) {
            setScreen('auth');
        } else {
            setScreen(initialScreen);
            setActiveTab(initialTab);
        }
    }, [isOpen, initialScreen, initialTab]);

    // Password Validation Helper (UNCHANGED)
    const validatePassword = (password: string) => {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasNonalphas = /\W/.test(password);
        const minLength = password.length >= 12;
        return hasUpperCase && hasLowerCase && hasNumbers && hasNonalphas && minLength;
    };

    // Social Auth Handler
    const handleSocialLogin = async (provider: 'google' | 'azure' | 'apple') => {
        setSocialLoading(provider);
        try {
            // Store role for callback page
            localStorage.setItem('pendingOAuthRole', activeTab);

            const { error } = await supabaseAuth.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                }
            });

            if (error) {
                alert(error.message || 'Social login failed');
                setSocialLoading(null);
            }
            // If successful, the page will redirect — no need to reset loading
        } catch (err: any) {
            alert(err.message || 'Social login failed');
            setSocialLoading(null);
        }
    };

    // Validation Checks (UNCHANGED)
    const isPhoneValid = (phone: string) => /^\d{6,15}$/.test(phone.replace(/\s/g, ''));

    const isProfessionalValid = globalMode === 'login'
        ? (profEmail && profPassword)
        : (profFirstName && profLastName && profEmail && validatePassword(profPassword) && isPhoneValid(profPhone));

    const isEmployerValid = globalMode === 'login'
        ? (empWorkEmail && empPassword)
        : (empCompanyName && empWorkEmail && validatePassword(empPassword) && isPhoneValid(empPhone));

    // Handle redirect - intercept security routes
    const handleRedirect = (redirect: string | undefined | null) => {
        // Check for pending job redirect from careers page
        let pendingJobRedirect: string | null = null;
        try {
            pendingJobRedirect = localStorage.getItem('profcaria_job_redirect');
            if (pendingJobRedirect) localStorage.removeItem('profcaria_job_redirect');
        } catch (e) { /* localStorage not available */ }

        const finalRedirect = pendingJobRedirect || redirect;

        if (!finalRedirect) {
            // Default redirect
            router.push(activeTab === 'professional' ? '/professional/notifications' : '/employer/feed');
            onClose();
            return;
        }

        if (finalRedirect.includes('/security/setup')) {
            setScreen('security_setup');
        } else if (finalRedirect.includes('/security/verify')) {
            setScreen('security_verify');
        } else {
            router.push(finalRedirect);
            onClose();
        }
    };

    // Handlers (UPDATED with Gatekeeper Logic)
    const handlePostAuth = async (redirect: string | undefined | null) => {
        try {
            // Fetch latest security status to decide next step
            const msRes = await fetch('/api/auth/me', { cache: 'no-store' });
            if (msRes.ok) {
                const meData = await msRes.json();
                if (meData.security) {
                    const { hasPasskey, hasTotp, hasEmail } = meData.security;
                    // If any method is set up, go to Verify. Otherwise, go to Setup.
                    if (hasPasskey || hasTotp || hasEmail) {
                        setScreen('security_verify');
                        return;
                    } else {
                        setScreen('security_setup');
                        return;
                    }
                }
            }
            // Fallback if no security data or fetch failed
            handleRedirect(redirect);
        } catch (e) {
            console.error("Auth check failed", e);
            handleRedirect(redirect);
        }
    };

    const handleLogin = async (type: 'professional' | 'employer') => {
        setLoading(true);
        try {
            const endpoint = type === 'professional' ? '/api/professional/login' : '/api/employer/login';
            const email = type === 'professional' ? profEmail : empWorkEmail;
            const password = type === 'professional' ? profPassword : empPassword;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');

            await handlePostAuth(data.redirect);
        } catch (err: any) {
            alert(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (type: 'professional' | 'employer') => {
        setLoading(true);
        try {
            const endpoint = type === 'professional' ? '/api/professional/signup' : '/api/employer/signup';
            const payload = type === 'professional' ? {
                email: profEmail,
                password: profPassword,
                firstName: profFirstName,
                lastName: profLastName,
                role: 'User',
                phoneNumber: `${profCountryCode}${profPhone.replace(/\s/g, '')}`,
            } : {
                companyName: empCompanyName,
                workEmail: empWorkEmail,
                password: empPassword,
                industry: empIndustry,
                phoneNumber: `${empCountryCode}${empPhone.replace(/\s/g, '')}`,
            };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');

            await handlePostAuth(data.redirect);
        } catch (err: any) {
            alert(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // =============================================
    // SECURITY SCREENS (using HangingSecurityCard)
    // =============================================
    if (screen === 'security_setup' || screen === 'security_verify') {
        return (
            <HangingSecurityCard
                isOpen={true}
                onClose={onClose}
                initialMode={screen === 'security_setup' ? 'setup' : 'verify'}
            />
        );
    }

    // =============================================
    // AUTH SCREEN
    // =============================================
    return (
        <div className="fixed inset-0 z-[100] flex justify-center items-start pt-4 md:pt-8 pointer-events-none">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md pointer-events-auto" onClick={onClose} />

            {/* CARD - Enhanced Glassmorphism */}
            <div
                className={`
                    relative pointer-events-auto mt-0
                    w-[95vw] md:w-[90vw] max-w-[500px] max-h-[90vh] overflow-y-auto custom-scrollbar
                    mx-auto
                    rounded-[2rem] p-6 md:p-8 pb-10 md:pb-12
                    transform transition-all duration-500 origin-top
                    ${isDark
                        ? 'bg-[#0A0F1A] shadow-2xl border-neutral-700/50 glow-white'
                        : 'bg-white shadow-2xl border-neutral-200'}
                `}
                style={{
                    animation: 'swing 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                }}
                data-lenis-prevent="true"
            >
                <PixelBackground isDark={isDark} className="absolute inset-0 z-0 pointer-events-none" />

                {/* --- CONTENT --- */}
                <div className="relative z-10 flex flex-col gap-6">

                    {/* TABS (Prof/Emp) */}
                    <div className="flex p-1 rounded-full bg-neutral-100/10 border border-neutral-500/20">
                        {(['professional', 'employer'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                    flex-1 py-3 px-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all
                                    ${activeTab === tab
                                        ? (isDark ? 'bg-white text-black' : 'bg-black text-white')
                                        : 'opacity-50 hover:opacity-100'}
                                `}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* TITLE & TOGGLE */}
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight font-pixel uppercase">
                            {globalMode === 'login' ? 'Welcome Back' : 'Join the Network'}
                        </h2>
                        <div className="flex justify-center gap-2 text-xs font-medium opacity-60">
                            <span>{globalMode === 'login' ? "New here?" : "Already a member?"}</span>
                            <button
                                onClick={() => setGlobalMode(globalMode === 'login' ? 'signup' : 'login')}
                                className="underline hover:opacity-100"
                            >
                                {globalMode === 'login' ? "Create Account" : "Sign In"}
                            </button>
                        </div>
                    </div>

                    {/* SOCIAL LOGIN BUTTONS */}
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => handleSocialLogin('google')}
                            disabled={!!socialLoading}
                            className={`
                                w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-3
                                border transition-all duration-300
                                ${isDark
                                    ? 'border-neutral-700 bg-neutral-900/50 text-white hover:bg-neutral-800'
                                    : 'border-neutral-200 bg-white text-black hover:bg-neutral-50'}
                                ${socialLoading === 'google' ? 'opacity-50 cursor-wait' : ''}
                                ${socialLoading && socialLoading !== 'google' ? 'opacity-30 cursor-not-allowed' : ''}
                            `}
                        >
                            <GoogleIcon />
                            {socialLoading === 'google' ? 'Redirecting...' : 'Continue with Google'}
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSocialLogin('azure')}
                            disabled={!!socialLoading}
                            className={`
                                w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-3
                                border transition-all duration-300
                                ${isDark
                                    ? 'border-neutral-700 bg-neutral-900/50 text-white hover:bg-neutral-800'
                                    : 'border-neutral-200 bg-white text-black hover:bg-neutral-50'}
                                ${socialLoading === 'azure' ? 'opacity-50 cursor-wait' : ''}
                                ${socialLoading && socialLoading !== 'azure' ? 'opacity-30 cursor-not-allowed' : ''}
                            `}
                        >
                            <MicrosoftIcon />
                            {socialLoading === 'azure' ? 'Redirecting...' : 'Continue with Microsoft'}
                        </button>
                    </div>

                    {/* DIVIDER */}
                    <div className="flex items-center gap-4">
                        <div className={`flex-1 h-px ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
                        <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>or</span>
                        <div className={`flex-1 h-px ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
                    </div>

                    {/* FORM */}
                    <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-6">

                        {/* PROFESSIONAL INPUTS */}
                        {activeTab === 'professional' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                {globalMode === 'signup' && (
                                    <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <ModernInput theme={theme} placeholder="First Name" value={profFirstName} onChange={e => setProfFirstName(e.target.value)} icon={User} />
                                        <ModernInput theme={theme} placeholder="Last Name" value={profLastName} onChange={e => setProfLastName(e.target.value)} />
                                    </div>
                                    {/* Phone Number with Country Code */}
                                    <div className="relative group flex gap-2">
                                        <div className="relative">
                                            <div className={`absolute top-3 left-0 flex items-center transition-colors duration-300 ${isDark ? 'text-neutral-500 group-focus-within:text-white' : 'text-neutral-400 group-focus-within:text-black'}`}>
                                                <Phone size={18} />
                                            </div>
                                            <select
                                                value={profCountryCode}
                                                onChange={e => setProfCountryCode(e.target.value)}
                                                className={`w-[100px] bg-transparent border-b-2 py-3 pl-8 pr-1 text-sm outline-none transition-all duration-300 appearance-none cursor-pointer ${isDark ? 'border-neutral-800 text-white focus:border-white' : 'border-neutral-200 text-black focus:border-black'}`}
                                            >
                                                {COUNTRY_CODES.map(c => (
                                                    <option key={c.code} value={c.code} className={isDark ? 'bg-black text-white' : 'bg-white text-black'}>
                                                        {c.flag} {c.code}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="tel"
                                                value={profPhone}
                                                onChange={e => setProfPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                                                placeholder="Phone Number"
                                                className={`w-full bg-transparent border-b-2 py-3 px-2 text-sm outline-none transition-all duration-300 ${isDark ? 'border-neutral-800 text-white placeholder-neutral-600 focus:border-white' : 'border-neutral-200 text-black placeholder-neutral-400 focus:border-black'}`}
                                            />
                                        </div>
                                    </div>
                                    </>
                                )}
                                <ModernInput theme={theme} placeholder="Email" value={profEmail} onChange={e => setProfEmail(e.target.value)} icon={Mail} />
                                <ModernInput theme={theme} placeholder="Password" value={profPassword} onChange={e => setProfPassword(e.target.value)} icon={Lock} type="password" showPasswordToggle passwordVisible={passwordVisible} onTogglePassword={() => setPasswordVisible(!passwordVisible)} />
                            </div>
                        )}

                        {/* EMPLOYER INPUTS */}
                        {activeTab === 'employer' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                {globalMode === 'signup' && (
                                    <>
                                        <ModernInput theme={theme} placeholder="Company Name" value={empCompanyName} onChange={e => setEmpCompanyName(e.target.value)} icon={Briefcase} />

                                        {/* Industry Dropdown (Searchable) */}
                                        <div className="relative group" ref={dropdownRef}>
                                            <div className={`
                                                absolute top-3 left-0 flex items-center transition-colors duration-300
                                                ${isDark ? 'text-neutral-500 group-focus-within:text-white' : 'text-neutral-400 group-focus-within:text-black'}
                                            `}>
                                                <Briefcase size={18} />
                                            </div>

                                            {/* Trigger */}
                                            <div
                                                onClick={() => setIsIndustryDropdownOpen(!isIndustryDropdownOpen)}
                                                className={`
                                                    w-full bg-transparent border-b-2 py-3 pl-8 pr-4 text-sm cursor-pointer flex items-center justify-between transition-all duration-300
                                                    ${isDark
                                                        ? 'border-neutral-800 text-white hover:border-white'
                                                        : 'border-neutral-200 text-black hover:border-black'
                                                    }
                                                    ${isIndustryDropdownOpen ? (isDark ? 'border-white' : 'border-black') : ''}
                                                `}
                                            >
                                                <span className={empIndustry ? (isDark ? 'text-white' : 'text-black') : (isDark ? 'text-neutral-600' : 'text-neutral-400')}>
                                                    {empIndustry || 'Select Industry'}
                                                </span>
                                                <ChevronDown size={18} className={`transition-transform duration-300 ${isIndustryDropdownOpen ? 'rotate-180' : ''} ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`} />
                                            </div>

                                            {/* Dropdown Menu */}
                                            {isIndustryDropdownOpen && (
                                                <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-neutral-200'}`}>

                                                    {/* Search Header */}
                                                    <div className={`p-2 border-b sticky top-0 z-10 ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-neutral-100'}`}>
                                                        <div className="relative">
                                                            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`} />
                                                            <input
                                                                ref={searchInputRef}
                                                                type="text"
                                                                value={industrySearch}
                                                                onChange={(e) => setIndustrySearch(e.target.value)}
                                                                placeholder="Search industries..."
                                                                className={`w-full rounded-xl pl-9 pr-4 py-2 text-sm font-medium focus:outline-none ${isDark ? 'bg-neutral-900 text-white placeholder-neutral-600' : 'bg-neutral-50 text-black placeholder-neutral-400'}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* List */}
                                                    <div className="max-h-[200px] overflow-y-auto p-1 custom-scrollbar" data-lenis-prevent="true">
                                                        {industries.filter(ind => ind.name.toLowerCase().includes(industrySearch.toLowerCase())).length === 0 ? (
                                                            <div className={`p-4 text-center text-xs font-medium uppercase tracking-widest ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                                                No industries found
                                                            </div>
                                                        ) : (
                                                            industries
                                                                .filter(ind => ind.name.toLowerCase().includes(industrySearch.toLowerCase()))
                                                                .map((ind) => {
                                                                    const isSelected = empIndustry === ind.name;
                                                                    return (
                                                                        <button
                                                                            key={ind.name}
                                                                            onClick={() => {
                                                                                setEmpIndustry(ind.name);
                                                                                setIsIndustryDropdownOpen(false);
                                                                                setIndustrySearch('');
                                                                            }}
                                                                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${isSelected
                                                                                ? (isDark ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-black')
                                                                                : (isDark ? 'text-neutral-400 hover:bg-neutral-900 hover:text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black')
                                                                                }`}
                                                                        >
                                                                            {ind.name}
                                                                            {isSelected && <Check size={14} className={isDark ? 'text-white' : 'text-black'} />}
                                                                        </button>
                                                                    );
                                                                })
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                                {/* Phone Number with Country Code */}
                                {globalMode === 'signup' && (
                                    <div className="relative group flex gap-2">
                                        <div className="relative">
                                            <div className={`absolute top-3 left-0 flex items-center transition-colors duration-300 ${isDark ? 'text-neutral-500 group-focus-within:text-white' : 'text-neutral-400 group-focus-within:text-black'}`}>
                                                <Phone size={18} />
                                            </div>
                                            <select
                                                value={empCountryCode}
                                                onChange={e => setEmpCountryCode(e.target.value)}
                                                className={`w-[100px] bg-transparent border-b-2 py-3 pl-8 pr-1 text-sm outline-none transition-all duration-300 appearance-none cursor-pointer ${isDark ? 'border-neutral-800 text-white focus:border-white' : 'border-neutral-200 text-black focus:border-black'}`}
                                            >
                                                {COUNTRY_CODES.map(c => (
                                                    <option key={c.code} value={c.code} className={isDark ? 'bg-black text-white' : 'bg-white text-black'}>
                                                        {c.flag} {c.code}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="tel"
                                                value={empPhone}
                                                onChange={e => setEmpPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                                                placeholder="Phone Number"
                                                className={`w-full bg-transparent border-b-2 py-3 px-2 text-sm outline-none transition-all duration-300 ${isDark ? 'border-neutral-800 text-white placeholder-neutral-600 focus:border-white' : 'border-neutral-200 text-black placeholder-neutral-400 focus:border-black'}`}
                                            />
                                        </div>
                                    </div>
                                )}
                                <ModernInput theme={theme} placeholder="Work Email" value={empWorkEmail} onChange={e => setEmpWorkEmail(e.target.value)} icon={Mail} />
                                <ModernInput theme={theme} placeholder="Password" value={empPassword} onChange={e => setEmpPassword(e.target.value)} icon={Lock} type="password" showPasswordToggle passwordVisible={passwordVisible} onTogglePassword={() => setPasswordVisible(!passwordVisible)} />
                            </div>
                        )}

                        {/* SUBMIT BUTTON */}
                        <button
                            type="button"
                            onClick={() => globalMode === 'login' ? handleLogin(activeTab) : handleSignup(activeTab)}
                            disabled={loading || (activeTab === 'professional' ? !isProfessionalValid : !isEmployerValid)}
                            className={`
                                w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all font-pixel
                                ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}
                                ${loading ? 'opacity-50 cursor-wait' : ''}
                                ${(activeTab === 'professional' ? !isProfessionalValid : !isEmployerValid) ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            {loading ? 'Processing...' : (globalMode === 'login' ? 'Sign In' : 'Get Started')}
                        </button>

                    </form>

                </div>
            </div>
        </div>
    );
}
