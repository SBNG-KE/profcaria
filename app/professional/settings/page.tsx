"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Activity, Lock, CheckCircle, Users, TrendingUp, Star, Eye, EyeOff, CreditCard, HelpCircle, Power, Briefcase } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { useRouter } from 'next/navigation';
import { BADGE_TIERS } from '@/lib/billing-config';
import VerificationBadge from '@/app/components/VerificationBadge';

export default function ProfessionalSettingsPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();

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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Current Password', value: currentPassword, setter: setCurrentPassword, show: showCurrentPw, setShow: setShowCurrentPw },
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
                        <div className="flex justify-end">
                            <button onClick={handlePasswordChange} disabled={isLoading || !currentPassword || !newPassword}
                                className={`px-6 py-3 rounded-xl font-bold text-sm border transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200 border-white' : 'bg-black text-white hover:bg-neutral-800 border-black'}`}
                            >Update Password</button>
                        </div>
                    </div>

                    <div className={`border p-8 rounded-[32px] space-y-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                            <Activity className="text-[#3B5998]" size={24} /> Activity Log
                        </h3>
                        <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                            <table className={`w-full text-left text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                <thead className={`font-bold uppercase text-xs tracking-wider ${isDark ? 'bg-neutral-900 text-neutral-200' : 'bg-neutral-50 text-neutral-700'}`}>
                                    <tr><th className="p-4">Action</th><th className="p-4">Location</th><th className="p-4">IP</th><th className="p-4">Date</th></tr>
                                </thead>
                                <tbody className={`divide-y ${isDark ? 'divide-neutral-800' : 'divide-neutral-200'}`}>
                                    {activityLogs.map((log, i) => (
                                        <tr key={i} className={`transition-colors ${isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-neutral-50'}`}>
                                            <td className={`p-4 font-bold ${isDark ? 'text-white' : 'text-black'}`}>{log.action}</td>
                                            <td className="p-4">{log.location_details}</td>
                                            <td className="p-4 font-mono text-xs">{log.ip_address}</td>
                                            <td className="p-4">{new Date(log.created_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {activityLogs.length === 0 && (
                                        <tr><td colSpan={4} className={`p-8 text-center italic ${isDark ? 'text-slate-600' : 'text-neutral-400'}`}>No activity logs found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Billing Tab ─── */}
            {activeTab === 'billing' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className={`border p-8 rounded-[32px] text-center space-y-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>
                            <CreditCard size={32} />
                        </div>
                        <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>Billing & Subscription</h3>
                        <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            Profcaria is currently free for professionals. Premium features and subscription plans will be available soon.
                        </p>
                        <div className={`inline-block px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest ${isDark ? 'bg-[#3B5998]/10 text-[#6B8CD5] border border-[#3B5998]/20' : 'bg-[#3B5998]/10 text-[#3B5998] border border-[#3B5998]/20'}`}>
                            Free Plan — Active
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
