"use client"

/**
 * /auth/callback
 * 
 * Handles the redirect from Supabase Auth after OAuth provider login.
 * Reads the Supabase session, extracts user info, and calls
 * /api/auth/social to create/login the user in the custom auth system.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '@/app/context/ThemeContext';
import { Briefcase, ChevronDown, Search, Check, Loader2 } from 'lucide-react';

// Create a client-side Supabase client for reading the OAuth session
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AuthCallbackPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [status, setStatus] = useState<'loading' | 'needs_completion' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    // Employer completion form state
    const [companyName, setCompanyName] = useState('');
    const [industry, setIndustry] = useState('');
    const [industries, setIndustries] = useState<{ name: string; category: string }[]>([]);
    const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
    const [industrySearch, setIndustrySearch] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Store OAuth data for employer completion
    const [oauthData, setOauthData] = useState<{
        email: string;
        fullName: string;
        provider: string;
        providerId: string;
        role: string;
        token: string;
    } | null>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsIndustryDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search on dropdown open
    useEffect(() => {
        if (isIndustryDropdownOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isIndustryDropdownOpen]);

    // Main effect: handle OAuth callback
    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get the session from Supabase Auth (set via URL hash/params)
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError || !session) {
                    setStatus('error');
                    setErrorMessage('Authentication failed. Please try again.');
                    return;
                }

                const user = session.user;
                const email = user.email;
                const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
                const provider = user.app_metadata?.provider || 'unknown';
                const providerId = user.id;

                // Read the role from localStorage (set before OAuth redirect)
                const pendingRole = localStorage.getItem('pendingOAuthRole') || 'account';
                localStorage.removeItem('pendingOAuthRole');

                const payload: Record<string, string> = {
                    email: email || '',
                    fullName,
                    provider,
                    providerId,
                    role: pendingRole
                };

                // Call our custom social auth API
                const res = await fetch('/api/auth/social', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify(payload),
                });

                const data = await res.json();

                if (data.needsCompletion) {
                    // Employer needs company info — show completion form
                    setOauthData({
                        email: email || '',
                        fullName,
                        provider,
                        providerId,
                        role: pendingRole,
                        token: session.access_token
                    });

                    // Fetch industries for the dropdown
                    try {
                        const indRes = await fetch('/api/common/industries');
                        if (indRes.ok) {
                            const indData = await indRes.json();
                            setIndustries(indData.industries || []);
                        }
                    } catch (e) {
                        console.error('Failed to load industries', e);
                    }

                    setStatus('needs_completion');
                    return;
                }

                if (!res.ok) {
                    setStatus('error');
                    setErrorMessage(data.error || 'Authentication failed');
                    return;
                }

                // Success — redirect
                router.push(data.redirect || '/social');

            } catch (err) {
                console.error('OAuth Callback Error:', err);
                setStatus('error');
                setErrorMessage('Something went wrong. Please try again.');
            }
        };

        handleCallback();
    }, [router]);

    // Handle employer completion form submit
    const handleEmployerComplete = async () => {
        if (!oauthData || !companyName) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/auth/social', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${oauthData.token}`
                },
                body: JSON.stringify({
                    ...oauthData,
                    companyName,
                    industry
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(data.error || 'Failed to create account');
                return;
            }

            router.push(data.redirect || '/employer/feed');
        } catch (err) {
            console.error('Employer Completion Error:', err);
            setErrorMessage('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ------- LOADING STATE -------
    if (status === 'loading') {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>
                <Loader2 className="animate-spin mb-4" size={32} />
                <p className="text-sm font-bold uppercase tracking-widest opacity-60">Authenticating...</p>
            </div>
        );
    }

    // ------- ERROR STATE -------
    if (status === 'error') {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center gap-4 ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>
                <p className="text-lg font-bold">{errorMessage}</p>
                <button
                    onClick={() => router.push('/')}
                    className={`px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                >
                    Back to Home
                </button>
            </div>
        );
    }

    // ------- EMPLOYER COMPLETION FORM -------
    return (
        <div className={`min-h-screen flex items-center justify-center px-4 ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>
            <div className={`w-full max-w-md rounded-[2rem] p-8 border ${isDark ? 'bg-neutral-900/80 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                <h2 className="text-2xl font-black tracking-tight text-center mb-2">Complete Your Profile</h2>
                <p className={`text-center text-sm mb-8 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Just a couple more details to set up your employer account
                </p>

                {errorMessage && (
                    <p className="text-red-500 text-sm text-center mb-4 font-medium">{errorMessage}</p>
                )}

                <div className="space-y-6">
                    {/* Company Name */}
                    <div className="relative group">
                        <div className={`absolute top-3 left-0 flex items-center transition-colors duration-300 ${isDark ? 'text-neutral-500 group-focus-within:text-white' : 'text-neutral-400 group-focus-within:text-black'}`}>
                            <Briefcase size={18} />
                        </div>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Company Name"
                            className={`w-full bg-transparent border-b-2 py-3 pl-8 pr-4 text-sm outline-none transition-all duration-300 ${isDark ? 'border-neutral-800 text-white placeholder-neutral-600 focus:border-white' : 'border-neutral-200 text-black placeholder-neutral-400 focus:border-black'}`}
                        />
                    </div>

                    {/* Industry Dropdown */}
                    <div className="relative group" ref={dropdownRef}>
                        <div className={`absolute top-3 left-0 flex items-center transition-colors duration-300 ${isDark ? 'text-neutral-500 group-focus-within:text-white' : 'text-neutral-400 group-focus-within:text-black'}`}>
                            <Briefcase size={18} />
                        </div>
                        <div
                            onClick={() => setIsIndustryDropdownOpen(!isIndustryDropdownOpen)}
                            className={`w-full bg-transparent border-b-2 py-3 pl-8 pr-4 text-sm cursor-pointer flex items-center justify-between transition-all duration-300 ${isDark ? 'border-neutral-800 text-white hover:border-white' : 'border-neutral-200 text-black hover:border-black'} ${isIndustryDropdownOpen ? (isDark ? 'border-white' : 'border-black') : ''}`}
                        >
                            <span className={industry ? (isDark ? 'text-white' : 'text-black') : (isDark ? 'text-neutral-600' : 'text-neutral-400')}>
                                {industry || 'Select Industry'}
                            </span>
                            <ChevronDown size={18} className={`transition-transform duration-300 ${isIndustryDropdownOpen ? 'rotate-180' : ''} ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`} />
                        </div>

                        {isIndustryDropdownOpen && (
                            <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl border z-50 overflow-hidden ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-neutral-200'}`}>
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
                                <div className="max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                                    {industries.filter(ind => ind.name.toLowerCase().includes(industrySearch.toLowerCase())).length === 0 ? (
                                        <div className={`p-4 text-center text-xs font-medium uppercase tracking-widest ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                            No industries found
                                        </div>
                                    ) : (
                                        industries
                                            .filter(ind => ind.name.toLowerCase().includes(industrySearch.toLowerCase()))
                                            .map((ind) => (
                                                <button
                                                    key={ind.name}
                                                    onClick={() => {
                                                        setIndustry(ind.name);
                                                        setIsIndustryDropdownOpen(false);
                                                        setIndustrySearch('');
                                                    }}
                                                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${industry === ind.name
                                                        ? (isDark ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-black')
                                                        : (isDark ? 'text-neutral-400 hover:bg-neutral-900 hover:text-white' : 'text-neutral-500 hover:bg-neutral-50 hover:text-black')
                                                        }`}
                                                >
                                                    {ind.name}
                                                    {industry === ind.name && <Check size={14} />}
                                                </button>
                                            ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleEmployerComplete}
                        disabled={submitting || !companyName}
                        className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'} ${(submitting || !companyName) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {submitting ? 'Setting up...' : 'Complete Setup'}
                    </button>
                </div>
            </div>
        </div>
    );
}
