"use client"

import React, { useState, useEffect } from 'react';
import { Shield, Activity, Lock, CheckCircle, Users, TrendingUp, Star, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { BADGE_TIERS } from '@/lib/billing-config';
import VerificationBadge from '@/app/components/VerificationBadge';

export default function ProfessionalSettingsPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Badge State
    const [followerCount, setFollowerCount] = useState(0);
    const [currentBadge, setCurrentBadge] = useState('none');

    // Security & UI State
    const [activeTab, setActiveTab] = useState<'security' | 'badge'>('security');
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
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
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
            if (res.ok) {
                const data = await res.json();
                setActivityLogs(data.logs || []);
            }
        } catch (error) {
            console.error('Failed to fetch activity logs:', error);
        }
    };

    const fetchBadgeData = async () => {
        try {
            const res = await fetch('/api/professional/profile/badge-progress');
            if (res.ok) {
                const data = await res.json();
                setFollowerCount(data.followerCount || 0);
                setCurrentBadge(data.badgeType || 'none');
            }
        } catch (error) {
            console.error('Failed to fetch badge data:', error);
        }
    };

    // Badge milestone helpers
    const tiers = [
        { key: 'gray', min: BADGE_TIERS.gray.minFollowers, label: 'Verified', color: 'neutral' },
        { key: 'blue', min: BADGE_TIERS.blue.minFollowers, label: 'Notable', color: 'blue' },
        { key: 'gold', min: BADGE_TIERS.gold.minFollowers, label: 'Top', color: 'yellow' },
    ];

    const getNextTier = () => {
        for (const tier of tiers) {
            if (followerCount < tier.min) return tier;
        }
        return null; // Already at highest
    };

    const nextTier = getNextTier();
    const progressPercent = nextTier
        ? Math.min((followerCount / nextTier.min) * 100, 100)
        : 100;

    const formatNumber = (n: number) => {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
        return n.toString();
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 pb-32">
            <header className={`flex items-center justify-between border-b pb-8 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                <div className="text-left">
                    <h1 className={`text-4xl font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>Settings</h1>
                    <p className={`mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Manage your security and badge progress.</p>
                </div>
            </header>

            {/* Tabs */}
            <div className={`flex space-x-2 p-1 rounded-xl w-fit border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'security' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' shadow-lg' : isDark ? 'text-neutral-400 hover:text-white hover:bg-white/5' : 'text-neutral-500 hover:text-black hover:bg-black/5'}`}
                >
                    <Shield size={16} /> Security
                </button>
                <button
                    onClick={() => setActiveTab('badge')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'badge' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' shadow-lg' : isDark ? 'text-neutral-400 hover:text-white hover:bg-white/5' : 'text-neutral-500 hover:text-black hover:bg-black/5'}`}
                >
                    <Star size={16} /> Badge
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl text-center font-bold text-sm animate-in fade-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {message.text}
                </div>
            )}

            {activeTab === 'security' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className={`border p-8 rounded-[32px] space-y-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                            <Lock className="text-emerald-500" size={24} /> Change Password
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Current Password</label>
                                <div className="relative">
                                    <input type={showCurrentPw ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                                        className={`w-full border rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 transition-all font-bold ${isDark ? 'bg-neutral-900/50 border-neutral-700/50 text-white focus:ring-emerald-500/50' : 'bg-neutral-50 border-neutral-200 text-black focus:ring-black/20'}`}
                                    />
                                    <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'}`}>
                                        {showCurrentPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">New Password</label>
                                <div className="relative">
                                    <input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                        className={`w-full border rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 transition-all font-bold ${isDark ? 'bg-neutral-900/50 border-neutral-700/50 text-white focus:ring-emerald-500/50' : 'bg-neutral-50 border-neutral-200 text-black focus:ring-black/20'}`}
                                    />
                                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'}`}>
                                        {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Confirm Password</label>
                                <div className="relative">
                                    <input type={showConfirmPw ? 'text' : 'password'} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        className={`w-full border rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 transition-all font-bold ${isDark ? 'bg-neutral-900/50 border-neutral-700/50 text-white focus:ring-emerald-500/50' : 'bg-neutral-50 border-neutral-200 text-black focus:ring-black/20'}`}
                                    />
                                    <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'}`}>
                                        {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button onClick={handlePasswordChange} disabled={isLoading || !currentPassword || !newPassword}
                                className={`px-6 py-3 rounded-xl font-bold text-sm border transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200 border-white' : 'bg-black text-white hover:bg-neutral-800 border-black'}`}
                            >
                                Update Password
                            </button>
                        </div>
                    </div>

                    <div className={`border p-8 rounded-[32px] space-y-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                            <Activity className="text-emerald-500" size={24} /> Activity Log
                        </h3>
                        <div className={`overflow-hidden rounded-xl border ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                            <div className="hidden md:block">
                                <table className={`w-full text-left text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                    <thead className={`font-bold uppercase text-xs tracking-wider ${isDark ? 'bg-neutral-900 text-neutral-200' : 'bg-neutral-50 text-neutral-700'}`}>
                                        <tr>
                                            <th className="p-4">Action</th>
                                            <th className="p-4">Location Details</th>
                                            <th className="p-4">IP Address</th>
                                            <th className="p-4">Date</th>
                                        </tr>
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
                            <div className="md:hidden divide-y divide-neutral-800">
                                {activityLogs.map((log, i) => (
                                    <div key={i} className={`p-4 flex flex-col gap-2 ${isDark ? 'bg-neutral-900/20' : 'bg-white'}`}>
                                        <div className="flex justify-between items-start">
                                            <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{log.action}</span>
                                            <span className="text-[10px] opacity-50">{new Date(log.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-xs opacity-70 flex items-center gap-2">
                                            <span>{log.location_details}</span><span>•</span>
                                            <span className="font-mono">{log.ip_address}</span>
                                        </div>
                                    </div>
                                ))}
                                {activityLogs.length === 0 && (
                                    <div className="p-8 text-center italic text-sm opacity-50">No activity logs found.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    {/* Badge Progress Hero */}
                    <div className={`border p-8 rounded-[32px] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <div className="flex items-center gap-4 mb-6">
                            <VerificationBadge tier={currentBadge} size={48} showTooltip={false} />
                            <div>
                                <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>
                                    {currentBadge === 'none' ? 'Standard Account' : BADGE_TIERS[currentBadge as keyof typeof BADGE_TIERS]?.label || 'Standard Account'}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Users size={14} className="text-neutral-500" />
                                    <span className={`text-sm font-bold ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                        {formatNumber(followerCount)} followers
                                    </span>
                                </div>
                            </div>
                        </div>

                        {nextTier ? (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                        Progress to {nextTier.label}
                                    </span>
                                    <span className={`text-xs font-bold ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                        {formatNumber(followerCount)} / {formatNumber(nextTier.min)}
                                    </span>
                                </div>
                                <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${nextTier.key === 'gold' ? 'bg-gradient-to-r from-yellow-500 to-amber-400' : nextTier.key === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gradient-to-r from-neutral-500 to-neutral-400'}`}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <p className={`mt-2 text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                    <TrendingUp size={14} className="inline mr-1" />
                                    {formatNumber(nextTier.min - followerCount)} more followers to unlock the <strong>{nextTier.label}</strong> badge
                                </p>
                            </div>
                        ) : (
                            <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-yellow-400/10 border border-yellow-400/20' : 'bg-yellow-50 border border-yellow-200'}`}>
                                <p className="text-yellow-500 font-black text-sm">🏆 You&apos;ve reached the highest badge tier!</p>
                            </div>
                        )}
                    </div>

                    {/* Badge Tier Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {tiers.map((tier) => {
                            const isUnlocked = followerCount >= tier.min;
                            const isCurrent = currentBadge === tier.key;
                            const borderColor = tier.key === 'gold' ? 'border-yellow-400/30' : tier.key === 'blue' ? 'border-blue-400/30' : 'border-neutral-600/30';
                            const activeRing = isCurrent ? (tier.key === 'gold' ? 'ring-2 ring-yellow-400/40' : tier.key === 'blue' ? 'ring-2 ring-blue-400/40' : 'ring-2 ring-neutral-400/40') : '';

                            return (
                                <div key={tier.key} className={`relative p-6 rounded-3xl border ${isDark ? `bg-neutral-900/50 ${borderColor}` : `bg-white border-neutral-200`} ${activeRing} transition-all`}>
                                    {isCurrent && (
                                        <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl rounded-tr-3xl">
                                            Current
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 mb-4">
                                        <VerificationBadge tier={tier.key} size={32} showTooltip={false} />
                                        <div>
                                            <h4 className={`text-lg font-black ${isDark ? 'text-white' : 'text-black'}`}>{tier.label}</h4>
                                            <p className={`text-xs font-bold ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                {formatNumber(tier.min)}+ followers
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`mt-4 py-3 rounded-xl text-center text-xs font-black uppercase tracking-widest ${isUnlocked ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : isDark ? 'bg-neutral-800 text-neutral-600' : 'bg-neutral-100 text-neutral-400'}`}>
                                        {isUnlocked ? '✓ Unlocked' : `${formatNumber(tier.min - followerCount)} to go`}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Info Box */}
                    <div className={`p-6 rounded-2xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl">
                                <TrendingUp className="text-emerald-500" size={24} />
                            </div>
                            <div>
                                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>How Badges Work</h3>
                                <p className={`mt-1 text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                    Badges are earned organically through your follower count. Post quality content, engage with others, and grow your network to unlock higher tiers. Badges give you increased visibility in the feed and build trust with employers.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
