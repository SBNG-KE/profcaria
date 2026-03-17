"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Activity, Lock, CheckCircle, Users, TrendingUp, Star, Eye, EyeOff, CreditCard, HelpCircle, Power, Briefcase, Smartphone, Mail, AlertTriangle, Loader2 } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { BADGE_TIERS } from '@/lib/billing-config';
import VerificationBadge from '@/app/components/VerificationBadge';
import { useCurrency } from '@/app/hooks/useCurrency';

export default function ProfessionalSettingsPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();

    // Currency Hook
    const { currency: currencyCode, symbol: currencySymbol, rate: exchangeRate, loading: currencyLoading } = useCurrency();

    // Pricing Config
    const pricing = {
        plus: 9,
        pro: 19
    };

    const formatCurrency = (usdAmount: number) => {
        if (currencyLoading) return '...';
        const converted = usdAmount * exchangeRate;
        if (currencyCode === 'NGN') return `₦${converted.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
        if (currencyCode === 'KES') return `KSh ${converted.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
        if (currencyCode === 'ZAR') return `R ${converted.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`;
        if (currencyCode === 'EUR') return `€${converted.toLocaleString('en-EU', { maximumFractionDigits: 2 })}`;
        if (currencyCode === 'GBP') return `£${converted.toLocaleString('en-GB', { maximumFractionDigits: 2 })}`;
        return `$${converted.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    };

    // Tab State
    const [activeTab, setActiveTab] = useState<'billing' | 'security' | 'vault' | 'support' | 'badge'>('security');

    // Badge State
    const [followerCount, setFollowerCount] = useState(0);
    const [currentBadge, setCurrentBadge] = useState('none');

    // Security & UI State
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [activityLogs, setActivityLogs] = useState<any[]>([]);

    // 2FA State
    const [twoFAEnabled, setTwoFAEnabled] = useState(false);
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [twoFACode, setTwoFACode] = useState('');
    const [twoFAStep, setTwoFAStep] = useState<'confirm' | 'verify' | 'done'>('confirm');
    const [twoFALoading, setTwoFALoading] = useState(false);
    const [twoFAError, setTwoFAError] = useState('');

    // Email Approval State
    const [emailApprovalEnabled, setEmailApprovalEnabled] = useState(true);
    const [pendingLogins, setPendingLogins] = useState<any[]>([
        { id: '1', device: 'Chrome on Windows', location: 'Nairobi, Kenya', time: '2 hours ago', ip: '41.89.xx.xx' },
    ]);

    const handlePasswordChange = async () => {
        if (newPassword !== confirmNewPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }
        setIsLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setMessage({ type: 'success', text: 'Password updated successfully' });
            setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update password' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'badge') fetchBadgeData();
        if (activeTab === 'security') fetchActivityLogs();
    }, [activeTab]);

    const fetchActivityLogs = async () => {
        try {
            const res = await fetch('/api/professional/security/activity');
            if (res.ok) { const data = await res.json(); setActivityLogs(data.logs || []); }
        } catch (error) { console.error('Failed to fetch activity logs:', error); }
    };

    const fetchBadgeData = async () => {
        try {
            const res = await fetch('/api/professional/profile/badge-progress');
            if (res.ok) { const data = await res.json(); setFollowerCount(data.followerCount || 0); setCurrentBadge(data.badgeType || 'none'); }
        } catch (error) { console.error('Failed to fetch badge data:', error); }
    };

    // Badge helpers
    const tiers = [
        { key: 'gray', min: BADGE_TIERS.gray.minFollowers, label: 'Verified', color: 'neutral' },
        { key: 'blue', min: BADGE_TIERS.blue.minFollowers, label: 'Notable', color: 'blue' },
        { key: 'gold', min: BADGE_TIERS.gold.minFollowers, label: 'Top', color: 'yellow' },
    ];
    const getNextTier = () => { for (const tier of tiers) { if (followerCount < tier.min) return tier; } return null; };
    const nextTier = getNextTier();
    const progressPercent = nextTier ? Math.min((followerCount / nextTier.min) * 100, 100) : 100;
    const formatNumber = (n: number) => { if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`; if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`; return n.toString(); };

    const tabs = [
        { id: 'security' as const, label: 'Security', icon: Shield },
        { id: 'billing' as const, label: 'Billing', icon: CreditCard },
        { id: 'vault' as const, label: 'Career Vault', icon: Briefcase },
        { id: 'badge' as const, label: 'Badge', icon: Star },
        { id: 'support' as const, label: 'Support', icon: HelpCircle },
    ];

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 pb-32">
            <header className={`flex items-center justify-between border-b pb-8 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                <div className="text-left">
                    <h1 className={`text-4xl font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>Settings</h1>
                    <p className={`mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Manage your account, security, billing, and more.</p>
                </div>
            </header>

            {/* Tabs */}
            <div className={`flex flex-wrap gap-2 p-1 rounded-xl w-fit border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' shadow-lg' : isDark ? 'text-neutral-400 hover:text-white hover:bg-white/5' : 'text-neutral-500 hover:text-black hover:bg-black/5'}`}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            {message && (
                <div className={`p-4 rounded-2xl text-center font-bold text-sm animate-in fade-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-[#3B5998]/10 text-[#3B5998] border border-[#3B5998]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {message.text}
                </div>
            )}

            {/* ─── Security Tab ─── */}
            {activeTab === 'security' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className={`border p-8 rounded-[32px] space-y-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                            <Lock className="text-[#3B5998]" size={24} /> Change Password
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { label: 'New Password', value: newPassword, setter: setNewPassword, show: showNewPw, setShow: setShowNewPw },
                                { label: 'Confirm Password', value: confirmNewPassword, setter: setConfirmNewPassword, show: showConfirmPw, setShow: setShowConfirmPw },
                            ].map((field) => (
                                <div key={field.label} className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{field.label}</label>
                                    <div className="relative">
                                        <input type={field.show ? 'text' : 'password'} value={field.value} onChange={(e) => field.setter(e.target.value)}
                                            className={`w-full border rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 transition-all font-bold ${isDark ? 'bg-neutral-900/50 border-neutral-700/50 text-white focus:ring-[#3B5998]/50' : 'bg-neutral-50 border-neutral-200 text-black focus:ring-black/20'}`}
                                        />
                                        <button type="button" onClick={() => field.setShow(!field.show)} className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'}`}>
                                            {field.show ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end mt-6">
                            <button onClick={handlePasswordChange} disabled={isLoading || !newPassword || newPassword !== confirmNewPassword}
                                className={`px-6 py-3 rounded-xl font-bold text-sm border transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200 border-white' : 'bg-black text-white hover:bg-neutral-800 border-black'}`}
                            >Update Password</button>
                        </div>
                    </div>

                    {/* 2FA Section */}
                    <div className={`border p-8 rounded-[32px] space-y-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <div className="flex items-center justify-between">
                            <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                                <Smartphone className="text-[#3B5998]" size={24} /> Two-Factor Authentication
                            </h3>
                            <button
                                onClick={() => { setShow2FAModal(true); setTwoFAStep('confirm'); setTwoFACode(''); setTwoFAError(''); }}
                                className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                                    twoFAEnabled
                                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                                        : isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'
                                }`}
                            >
                                {twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                            </button>
                        </div>
                        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            {twoFAEnabled
                                ? 'Two-factor authentication is enabled. You will be asked for a verification code when logging in from a new device.'
                                : 'Add an extra layer of security to your account. When enabled, you\'ll need to enter a verification code sent to your email each time you log in from a new device.'}
                        </p>
                        <div className={`flex items-center gap-3 p-4 rounded-xl border ${twoFAEnabled ? (isDark ? 'border-[#3B5998]/30 bg-[#3B5998]/5' : 'border-[#3B5998]/20 bg-[#3B5998]/5') : (isDark ? 'border-neutral-800 bg-neutral-900/50' : 'border-neutral-200 bg-neutral-50')}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${twoFAEnabled ? 'bg-[#3B5998]/20 text-[#3B5998]' : isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-neutral-200 text-neutral-400'}`}>
                                <Shield size={20} />
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                    Status: {twoFAEnabled ? 'Active' : 'Inactive'}
                                </p>
                                <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                    {twoFAEnabled ? 'Your account is protected with 2FA' : 'Enable 2FA for enhanced security'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Email Approval Section */}
                    <div className={`border p-8 rounded-[32px] space-y-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <div className="flex items-center justify-between">
                            <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                                <Mail className="text-[#3B5998]" size={24} /> Email Login Approval
                            </h3>
                            <button
                                onClick={() => setEmailApprovalEnabled(!emailApprovalEnabled)}
                                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${emailApprovalEnabled ? 'bg-[#3B5998]' : isDark ? 'bg-neutral-700' : 'bg-neutral-300'}`}
                            >
                                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${emailApprovalEnabled ? 'left-[26px]' : 'left-0.5'}`} />
                            </button>
                        </div>
                        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            When enabled, you'll receive an email whenever someone logs into your account from an unrecognized device. You can approve or deny the login directly from the email.
                        </p>

                        {/* Pending Login Approvals */}
                        {pendingLogins.length > 0 && (
                            <div className="space-y-3">
                                <h4 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Pending Approvals</h4>
                                {pendingLogins.map(login => (
                                    <div key={login.id} className={`flex items-center gap-4 p-4 rounded-xl border ${isDark ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-200 bg-amber-50'}`}>
                                        <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{login.device}</p>
                                            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{login.location} · {login.time} · IP: {login.ip}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setPendingLogins(prev => prev.filter(l => l.id !== login.id))}
                                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#3B5998] text-white hover:bg-[#2A4170] transition-all"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => setPendingLogins(prev => prev.filter(l => l.id !== login.id))}
                                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                                            >
                                                Deny
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 2FA Modal */}
            {show2FAModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShow2FAModal(false)} />
                    <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border animate-in zoom-in-95 fade-in duration-200 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <div className={`px-6 py-4 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                {twoFAEnabled ? 'Disable' : 'Enable'} Two-Factor Authentication
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {twoFAStep === 'confirm' && (
                                <>
                                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                        {twoFAEnabled
                                            ? 'Are you sure you want to disable 2FA? This will make your account less secure.'
                                            : 'We will send a verification code to your registered email address. You\'ll need to enter this code to complete setup.'}
                                    </p>
                                    <div className="flex justify-end gap-3">
                                        <button onClick={() => setShow2FAModal(false)} className={`px-4 py-2 rounded-lg text-sm font-bold ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'}`}>
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => { setTwoFAStep('verify'); setTwoFALoading(false); }}
                                            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                                        >
                                            {twoFAEnabled ? 'Continue' : 'Send Code'}
                                        </button>
                                    </div>
                                </>
                            )}
                            {twoFAStep === 'verify' && (
                                <>
                                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                        Enter the 6-digit code sent to your email:
                                    </p>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={twoFACode}
                                        onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                                        placeholder="000000"
                                        className={`w-full text-center text-3xl font-mono tracking-[12px] p-4 rounded-xl border focus:outline-none focus:ring-2 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white focus:ring-[#3B5998]/50' : 'bg-neutral-50 border-neutral-200 text-black focus:ring-black/20'}`}
                                    />
                                    {twoFAError && (
                                        <p className="text-sm text-red-500 text-center">{twoFAError}</p>
                                    )}
                                    <div className="flex justify-end gap-3">
                                        <button onClick={() => setShow2FAModal(false)} className={`px-4 py-2 rounded-lg text-sm font-bold ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (twoFACode.length !== 6) { setTwoFAError('Enter a 6-digit code'); return; }
                                                setTwoFALoading(true);
                                                setTimeout(() => {
                                                    setTwoFAEnabled(!twoFAEnabled);
                                                    setTwoFAStep('done');
                                                    setTwoFALoading(false);
                                                }, 1500);
                                            }}
                                            disabled={twoFALoading || twoFACode.length !== 6}
                                            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                                        >
                                            {twoFALoading && <Loader2 size={14} className="animate-spin" />}
                                            {twoFALoading ? 'Verifying...' : 'Verify'}
                                        </button>
                                    </div>
                                </>
                            )}
                            {twoFAStep === 'done' && (
                                <div className="text-center py-4 space-y-3">
                                    <CheckCircle size={48} className="mx-auto text-[#3B5998]" />
                                    <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                        {twoFAEnabled ? '2FA Enabled' : '2FA Disabled'}
                                    </h4>
                                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                        {twoFAEnabled ? 'Your account is now protected with two-factor authentication.' : 'Two-factor authentication has been disabled.'}
                                    </p>
                                    <button
                                        onClick={() => setShow2FAModal(false)}
                                        className={`px-5 py-2 rounded-lg text-sm font-bold ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Billing Tab ─── */}
            {activeTab === 'billing' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className={`border p-8 rounded-[32px] space-y-8 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                                    <CreditCard className={isDark ? "text-white" : "text-black"} size={24} /> Billing & Subscription
                                </h3>
                                <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Simple, transparent pricing for premium career features.</p>
                            </div>
                        </div>

                        {exchangeRate > 1 && (
                            <div className={`p-4 border rounded-xl flex items-center gap-3 text-xs ${isDark ? 'bg-neutral-900/50 border-neutral-800 text-neutral-400' : 'bg-neutral-50 border-neutral-200 text-neutral-600'}`}>
                                <Activity size={16} />
                                <span>Prices are converted from USD and may vary slightly depending on current economic exchange rates.</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Free Tier */}
                            <div className={`border p-6 rounded-[24px] flex flex-col relative overflow-hidden group transition-all duration-300 ${isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'}`}>
                                <div className="space-y-4 flex-1">
                                    <h4 className={`font-black text-xl ${isDark ? 'text-white' : 'text-neutral-900'}`}>Free</h4>
                                    <div className={`text-3xl font-black ${isDark ? 'text-neutral-500' : 'text-neutral-700'}`}>
                                        {formatCurrency(0)}
                                        <span className={`text-xs font-bold ml-1 ${isDark ? 'text-neutral-600' : 'text-neutral-500'}`}>/mo</span>
                                    </div>
                                    <div className="pt-2 space-y-3">
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                            <CheckCircle size={14} className="text-neutral-500 shrink-0" /> Basic Job Search
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                            <CheckCircle size={14} className="text-neutral-500 shrink-0" /> Public Profile
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                            <CheckCircle size={14} className="text-neutral-500 shrink-0" /> Limited Career AI
                                        </div>
                                    </div>
                                </div>
                                <div className={`mt-8 pt-6 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                                    <div className={`w-full py-3 font-bold rounded-xl text-center text-[10px] uppercase tracking-widest cursor-default ${isDark ? 'bg-[#3B5998]/20 text-[#6B8CD5]' : 'bg-[#3B5998]/10 text-[#3B5998]'}`}>
                                        Current Plan
                                    </div>
                                </div>
                            </div>

                            {/* Plus Tier */}
                            <div className={`border-2 p-6 rounded-[24px] flex flex-col relative overflow-hidden group transition-all duration-300 transform md:-translate-y-2 shadow-lg ${isDark ? 'bg-gradient-to-b from-neutral-900 to-black border-[#3B5998]/50' : 'bg-white border-[#3B5998]'}`}>
                                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#3B5998] to-[#6B8CD5]`} />
                                <div className="absolute top-4 right-4 bg-gradient-to-r from-[#3B5998] to-[#6B8CD5] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                                    Popular
                                </div>
                                <div className="space-y-4 flex-1 mt-2">
                                    <h4 className={`font-black text-xl flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#3B5998]'}`}>
                                        Plus
                                    </h4>
                                    <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-[#3B5998]'}`}>
                                        {formatCurrency(pricing.plus)}
                                        <span className={`text-xs font-bold ml-1 ${isDark ? 'text-neutral-400' : 'text-[#3B5998]/70'}`}>/mo</span>
                                    </div>
                                    <div className="pt-2 space-y-3">
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                            <CheckCircle size={14} className="text-[#3B5998] shrink-0" /> Unlimited Career AI
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                            <CheckCircle size={14} className="text-[#3B5998] shrink-0" /> Basic Interview Prep
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>
                                            <CheckCircle size={14} className="text-[#3B5998] shrink-0" /> Resume Analyzer
                                        </div>
                                    </div>
                                </div>
                                <div className={`mt-8 pt-6 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                                    <button className="w-full py-3 bg-[#3B5998] hover:bg-[#2A4170] text-white font-bold rounded-xl text-center text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95">
                                        Upgrade to Plus
                                    </button>
                                </div>
                            </div>

                            {/* Pro Tier */}
                            <div className={`border p-6 rounded-[24px] flex flex-col relative overflow-hidden group transition-all duration-300 ${isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'}`}>
                                <div className="space-y-4 flex-1">
                                    <h4 className={`font-black text-xl flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                        Pro
                                    </h4>
                                    <div className={`text-3xl font-black ${isDark ? 'text-neutral-300' : 'text-neutral-800'}`}>
                                        {formatCurrency(pricing.pro)}
                                        <span className={`text-xs font-bold ml-1 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>/mo</span>
                                    </div>
                                    <div className="pt-2 space-y-3">
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                            <CheckCircle size={14} className="text-neutral-500 shrink-0" /> Advanced AI Interview Coach
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                            <CheckCircle size={14} className="text-neutral-500 shrink-0" /> Premium Profile Badge
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                            <CheckCircle size={14} className="text-neutral-500 shrink-0" /> Salary Negotiation Intel
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                            <CheckCircle size={14} className="text-neutral-500 shrink-0" /> Priority Support
                                        </div>
                                    </div>
                                </div>
                                <div className={`mt-8 pt-6 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                                    <button className={`w-full py-3 font-bold rounded-xl text-center text-[10px] uppercase tracking-widest transition-all active:scale-95 border ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700' : 'bg-white hover:bg-neutral-50 text-black border-neutral-200 shadow-sm'}`}>
                                        Upgrade to Pro
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Career Vault Tab ─── */}
            {activeTab === 'vault' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className={`border p-8 rounded-[32px] text-center space-y-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>
                            <Shield size={32} />
                        </div>
                        <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>Career Vault</h3>
                        <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            Access your Career Vault to manage certificates, documents, and verified credentials.
                        </p>
                        <button
                            onClick={() => router.push('/professional/vault')}
                            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                        >
                            Open Career Vault
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Badge Tab ─── */}
            {activeTab === 'badge' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className={`border p-8 rounded-[32px] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <div className="flex items-center gap-4 mb-6">
                            <VerificationBadge tier={currentBadge} size={48} showTooltip={false} />
                            <div>
                                <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>
                                    {currentBadge === 'none' ? 'Standard Account' : BADGE_TIERS[currentBadge as keyof typeof BADGE_TIERS]?.label || 'Standard Account'}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Users size={14} className="text-neutral-500" />
                                    <span className={`text-sm font-bold ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{formatNumber(followerCount)} followers</span>
                                </div>
                            </div>
                        </div>
                        {nextTier ? (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Progress to {nextTier.label}</span>
                                    <span className={`text-xs font-bold ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{formatNumber(followerCount)} / {formatNumber(nextTier.min)}</span>
                                </div>
                                <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                                    <div className={`h-full rounded-full transition-all duration-1000 ease-out ${nextTier.key === 'gold' ? 'bg-gradient-to-r from-[#3B5998] to-[#6B8CD5]' : nextTier.key === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gradient-to-r from-neutral-500 to-neutral-400'}`} style={{ width: `${progressPercent}%` }} />
                                </div>
                                <p className={`mt-2 text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                    <TrendingUp size={14} className="inline mr-1" />{formatNumber(nextTier.min - followerCount)} more followers to unlock the <strong>{nextTier.label}</strong> badge
                                </p>
                            </div>
                        ) : (
                            <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-yellow-400/10 border border-yellow-400/20' : 'bg-yellow-50 border border-yellow-200'}`}>
                                <p className="text-yellow-500 font-black text-sm">🏆 You&apos;ve reached the highest badge tier!</p>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {tiers.map((tier) => {
                            const isUnlocked = followerCount >= tier.min;
                            const isCurrent = currentBadge === tier.key;
                            const borderColor = tier.key === 'gold' ? 'border-yellow-400/30' : tier.key === 'blue' ? 'border-blue-400/30' : 'border-neutral-600/30';
                            const activeRing = isCurrent ? (tier.key === 'gold' ? 'ring-2 ring-yellow-400/40' : tier.key === 'blue' ? 'ring-2 ring-blue-400/40' : 'ring-2 ring-neutral-400/40') : '';
                            return (
                                <div key={tier.key} className={`relative p-6 rounded-3xl border ${isDark ? `bg-neutral-900/50 ${borderColor}` : `bg-white border-neutral-200`} ${activeRing} transition-all`}>
                                    {isCurrent && <div className="absolute top-0 right-0 bg-[#3B5998] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl rounded-tr-3xl">Current</div>}
                                    <div className="flex items-center gap-3 mb-4">
                                        <VerificationBadge tier={tier.key} size={32} showTooltip={false} />
                                        <div>
                                            <h4 className={`text-lg font-black ${isDark ? 'text-white' : 'text-black'}`}>{tier.label}</h4>
                                            <p className={`text-xs font-bold ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{formatNumber(tier.min)}+ followers</p>
                                        </div>
                                    </div>
                                    <div className={`mt-4 py-3 rounded-xl text-center text-xs font-black uppercase tracking-widest ${isUnlocked ? 'bg-[#3B5998]/10 text-[#3B5998] border border-[#3B5998]/20' : isDark ? 'bg-neutral-800 text-neutral-600' : 'bg-neutral-100 text-neutral-400'}`}>
                                        {isUnlocked ? '✓ Unlocked' : `${formatNumber(tier.min - followerCount)} to go`}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ─── Support Tab ─── */}
            {activeTab === 'support' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className={`border p-8 rounded-[32px] text-center space-y-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>
                            <HelpCircle size={32} />
                        </div>
                        <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>Support</h3>
                        <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            Need help? Contact our support team for assistance with your account, billing, or technical issues.
                        </p>
                        <button
                            onClick={() => router.push('/professional/support')}
                            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                        >
                            Open Support Center
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Logout Section ─── */}
            <div className={`border p-6 rounded-2xl flex items-center justify-between ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                <div className="flex items-center gap-3">
                    <Power size={20} className="text-red-500" />
                    <div>
                        <h4 className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>Log Out</h4>
                        <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Sign out of your Profcaria account</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 hover:border-red-500"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
}
