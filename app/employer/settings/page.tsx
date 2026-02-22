"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Save, Shield, MapPin, Globe, Activity, Lock, CheckCircle, CreditCard, LayoutDashboard, Loader2, Star, Users, TrendingUp } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { useCurrency } from '@/app/hooks/useCurrency';
import { usePayment } from '@/app/hooks/usePayment';
import { BADGE_TIERS } from '@/lib/billing-config';
import VerificationBadge from '@/app/components/VerificationBadge';
import EarlyAdopterBanner from '@/app/components/EarlyAdopterBanner';

function SettingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Currency Hook
    const { currency: currencyCode, symbol: currencySymbol, rate: exchangeRate, loading: currencyLoading } = useCurrency();



    // Check for Paystack redirect
    useEffect(() => {
        const reference = searchParams.get('reference');
        const tab = searchParams.get('tab');

        if (tab === 'billing') setActiveTab('billing');


        if (reference) {
            verifyPayment(reference);
        }
    }, [searchParams]);

    const verifyPayment = async (reference: string) => {
        setIsLoading(true);
        setMessage({ type: 'success', text: 'Verifying payment...' });
        try {
            const res = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reference })
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Payment confirmed! Pro features active.' });
                fetchBilling(); // Refresh data
                // Clear URL params
                router.replace('/employer/settings?tab=billing');
            } else {
                setMessage({ type: 'error', text: 'Payment verification failed.' });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Error verifying payment.' });
        } finally {
            setIsLoading(false);
        }
    };

    const [activeTab, setActiveTab] = useState<'security' | 'billing' | 'badge'>('security');

    // Badge State
    const [followerCount, setFollowerCount] = useState(0);
    const [currentBadge, setCurrentBadge] = useState('none');

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);




    // Security State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');



    const [activityLogs, setActivityLogs] = useState<any[]>([]);

    // Billing State
    const [subscription, setSubscription] = useState<any | null>(null);
    const [derivedPlan, setDerivedPlan] = useState<string | null>(null);
    const [isAutoRenew, setIsAutoRenew] = useState(true);

    // Payment Mode State: { [planId]: 'choose' | 'default' } (if 'choose', UI shows 2 buttons)
    const [paymentModes, setPaymentModes] = useState<Record<string, 'default' | 'choose'>>({});

    // Pricing Config State
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [pricing, setPricing] = useState({
        basic: 0,
        basicOffer: 0,
        pro: 0,
        proOffer: 0,
        enterprise: 0,
        enterpriseOffer: 0,
        yearlyDiscountPercent: 0
    });

    useEffect(() => {
        if (activeTab === 'security') fetchActivityLogs();
        if (activeTab === 'billing') fetchBilling();
        if (activeTab === 'badge') fetchBadgeData();
    }, [activeTab]);

    const fetchBadgeData = async () => {
        try {
            const res = await fetch('/api/employer/profile/badge-progress');
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
    const badgeTiers = [
        { key: 'gray', min: BADGE_TIERS.gray.minFollowers, label: 'Verified', color: 'neutral' },
        { key: 'blue', min: BADGE_TIERS.blue.minFollowers, label: 'Notable', color: 'blue' },
        { key: 'gold', min: BADGE_TIERS.gold.minFollowers, label: 'Top', color: 'yellow' },
    ];

    const getNextBadgeTier = () => {
        for (const tier of badgeTiers) {
            if (followerCount < tier.min) return tier;
        }
        return null;
    };

    const nextBadgeTier = getNextBadgeTier();
    const badgeProgressPercent = nextBadgeTier ? Math.min((followerCount / nextBadgeTier.min) * 100, 100) : 100;

    const formatFollowerNum = (n: number) => {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
        return n.toString();
    };



    const fetchActivityLogs = async () => {
        try {
            const res = await fetch('/api/employer/security/activity');
            if (res.ok) {
                const data = await res.json();
                setActivityLogs(data.logs || []);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    };

    const fetchBilling = async () => {
        try {
            const res = await fetch('/api/employer/billing');
            if (res.ok) {
                const data = await res.json();
                setSubscription(data.subscription);
                if (data.subscription) {
                    setIsAutoRenew(!data.subscription.cancel_at_period_end && !data.subscription.is_one_time);
                }

                // Use the plan returned by the API (which calls getCompanyPlan)
                if (data.plan) {
                    setDerivedPlan(data.plan.toLowerCase());
                } else if (data.subscription?.plan_type) {
                    setDerivedPlan(data.subscription.plan_type.toLowerCase());
                } else if (!data.subscription && data.payments && data.payments.length > 0) {
                    // Fallback heuristics for legacy data without subscription
                    const latest = data.payments[0];
                    const amount = latest.amount;
                    if (amount > 2000000) setDerivedPlan('enterprise');
                    else if (amount > 800000) setDerivedPlan('pro');
                    else setDerivedPlan('basic');
                } else {
                    setDerivedPlan('free');
                }

                // Exchange rate is now handled by client-side hook

                setPricing({
                    basic: data.basic || 25,
                    basicOffer: data.basicOffer || 0,
                    pro: data.pro || 99,
                    proOffer: data.proOffer || 0,
                    enterprise: data.enterprise || 250,
                    enterpriseOffer: data.enterpriseOffer || 0,
                    yearlyDiscountPercent: data.yearlyDiscountPercent || 0
                });
            }
        } catch (error) {
            console.error('Error fetching billing:', error);
        }
    };

    // Payment Hook
    const { startPayment, isLoading: paymentLoading } = usePayment();

    const handleSubscribe = async (plan: 'basic' | 'pro' | 'enterprise', isOneTime: boolean = false) => {
        startPayment({
            plan,
            isOneTime,
            onSuccess: () => {
                setMessage({ type: 'success', text: isOneTime ? 'One-time payment successful! Plan active for 30 days.' : 'Subscription successful! Plan active.' });
                setPaymentModes(prev => ({ ...prev, [plan]: 'default' })); // Reset UI
                fetchBilling(); // Refresh UI
            },
            onError: (err: string) => {
                setMessage({ type: 'error', text: 'Payment failed: ' + err });
            }
        });
    };

    const handleToggleAutoRenew = async () => {
        const newState = !isAutoRenew;
        setIsAutoRenew(newState);
        try {
            const res = await fetch('/api/employer/billing/autorenew', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: newState })
            });

            if (!res.ok) {
                const data = await res.json();
                setIsAutoRenew(!newState); // Revert
                setMessage({ type: 'error', text: data.error || 'Failed to update subscription status.' });
                return;
            }

            if (newState) {
                setMessage({ type: 'success', text: 'Automatic payments enabled. Subscription will auto-renew.' });
            } else {
                setMessage({ type: 'success', text: 'Switched to manual payments. Subscription will expire at term end.' });
            }
        } catch (error) {
            setIsAutoRenew(!newState); // Revert
            setMessage({ type: 'error', text: 'Connection failed.' });
        }
    };

    const handlePortal = async () => {
        alert('To manage your subscription, please check your email for the link from Paystack or contact support to cancel/pause.');
    };



    const handlePasswordChange = async () => {
        if (newPassword !== confirmNewPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        setIsLoading(true);
        setMessage(null);
        try {
            const res = await fetch('/api/employer/security/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: 'success', text: 'Password changed successfully!' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
                fetchActivityLogs();
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to change password.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };



    // Currency Formatter
    const formatCurrency = (usdAmount: number) => {
        if (currencyLoading) return '...';
        const converted = Math.round(usdAmount * exchangeRate);
        return `${currencySymbol}${new Intl.NumberFormat().format(converted)}`;
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 pb-32">
            <header className={`flex items-center justify-between border-b pb-8 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                <div className="text-left">
                    <h1 className={`text-4xl font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>Company Settings</h1>
                    <p className={`mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Manage company profile, security, and billing.</p>
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
                    onClick={() => setActiveTab('billing')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'billing' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' shadow-lg' : isDark ? 'text-neutral-400 hover:text-white hover:bg-white/5' : 'text-neutral-500 hover:text-black hover:bg-black/5'}`}
                >
                    <CreditCard size={16} /> Billing
                </button>
                <button
                    onClick={() => setActiveTab('badge')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'badge' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' shadow-lg' : isDark ? 'text-neutral-400 hover:text-white hover:bg-white/5' : 'text-neutral-500 hover:text-black hover:bg-black/5'}`}
                >
                    <Star size={16} /> Badge
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl text-center font-bold text-sm animate-in fade-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-white/10 text-white border border-white/20' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                    {message.text}
                </div>
            )}

            {activeTab === 'badge' ? (
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
                                        {formatFollowerNum(followerCount)} followers
                                    </span>
                                </div>
                            </div>
                        </div>

                        {nextBadgeTier ? (
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                        Progress to {nextBadgeTier.label}
                                    </span>
                                    <span className={`text-xs font-bold ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                        {formatFollowerNum(followerCount)} / {formatFollowerNum(nextBadgeTier.min)}
                                    </span>
                                </div>
                                <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${nextBadgeTier.key === 'gold' ? 'bg-gradient-to-r from-yellow-500 to-amber-400' : nextBadgeTier.key === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gradient-to-r from-neutral-500 to-neutral-400'}`}
                                        style={{ width: `${badgeProgressPercent}%` }}
                                    />
                                </div>
                                <p className={`mt-2 text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                    <TrendingUp size={14} className="inline mr-1" />
                                    {formatFollowerNum(nextBadgeTier.min - followerCount)} more followers to unlock the <strong>{nextBadgeTier.label}</strong> badge
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
                        {badgeTiers.map((tier) => {
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
                                                {formatFollowerNum(tier.min)}+ followers
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`mt-4 py-3 rounded-xl text-center text-xs font-black uppercase tracking-widest ${isUnlocked ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : isDark ? 'bg-neutral-800 text-neutral-600' : 'bg-neutral-100 text-neutral-400'}`}>
                                        {isUnlocked ? '✓ Unlocked' : `${formatFollowerNum(tier.min - followerCount)} to go`}
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
                                    Badges are earned organically through your company&apos;s follower count. Post quality content, engage with professionals, and grow your network to unlock higher tiers. Badges build trust with top candidates.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'security' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">

                    <div className={`border p-8 rounded-[32px] space-y-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                            <Lock className={isDark ? "text-white" : "text-black"} size={24} /> Change Password
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* ...fields... */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all font-bold ${isDark ? 'bg-neutral-900/50 border-neutral-700/50 text-white focus:ring-neutral-500/50' : 'bg-neutral-50 border-neutral-200 text-black focus:ring-neutral-200'}`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all font-bold ${isDark ? 'bg-neutral-900/50 border-neutral-700/50 text-white focus:ring-neutral-500/50' : 'bg-neutral-50 border-neutral-200 text-black focus:ring-neutral-200'}`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all font-bold ${isDark ? 'bg-neutral-900/50 border-neutral-700/50 text-white focus:ring-neutral-500/50' : 'bg-neutral-50 border-neutral-200 text-black focus:ring-neutral-200'}`}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handlePasswordChange}
                                disabled={isLoading || !currentPassword || !newPassword}
                                className={`px-6 py-3 rounded-xl font-bold text-sm border transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200 border-white' : 'bg-black text-white hover:bg-neutral-800 border-black'}`}
                            >
                                Update Password
                            </button>
                        </div>
                    </div>

                    {/* Logs */}
                    <div className={`border p-8 rounded-[32px] space-y-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                            <Activity className={isDark ? "text-white" : "text-black"} size={24} /> Activity Log
                        </h3>
                        {/* Table... */}
                        <div className="overflow-hidden rounded-xl border border-neutral-800">
                            {/* Desktop Table */}
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
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center italic text-neutral-500">No activity logs found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden divide-y divide-neutral-800">
                                {activityLogs.map((log, i) => (
                                    <div key={i} className={`p-4 flex flex-col gap-2 ${isDark ? 'bg-neutral-900/20' : 'bg-white border-b border-neutral-100 last:border-0'}`}>
                                        <div className="flex justify-between items-start">
                                            <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{log.action}</span>
                                            <span className="text-[10px] text-neutral-500">{new Date(log.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-xs text-neutral-400 flex items-center gap-2">
                                            <span>{log.location_details}</span>
                                            <span>•</span>
                                            <span className="font-mono">{log.ip_address}</span>
                                        </div>
                                    </div>
                                ))}
                                {activityLogs.length === 0 && (
                                    <div className="p-8 text-center italic text-sm text-neutral-500">No activity logs found.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    {/* Early Adopter Promotion Banner */}
                    <EarlyAdopterBanner type="employer" isDark={isDark} />

                    {/* Billing Details */}
                    <div className={`border p-8 rounded-[32px] space-y-8 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                                    <CreditCard className={isDark ? "text-white" : "text-black"} size={24} /> Billing & Subscription
                                </h3>
                                <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Simple, transparent monthly pricing.</p>
                            </div>
                        </div>

                        {exchangeRate > 1 && (
                            <div className={`p-4 border rounded-xl flex items-center gap-3 text-xs ${isDark ? 'bg-neutral-900/50 border-neutral-800 text-neutral-400' : 'bg-neutral-50 border-neutral-200 text-neutral-600'}`}>
                                <Activity size={16} />
                                <span>Prices are converted from USD and may vary slightly depending on current economic exchange rates.</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
                                            <CheckCircle size={14} className="text-neutral-500 shrink-0" /> 1 Job Post/mo
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                            <CheckCircle size={14} className="text-neutral-500 shrink-0" /> 1 Year Analytics History
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                            <CheckCircle size={14} className="text-neutral-500 shrink-0" /> 2 AI Top Match Credits
                                        </div>
                                    </div>
                                </div>
                                <div className={`mt-8 pt-6 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                                    {!subscription ? (
                                        <div className={`w-full py-3 font-bold rounded-xl text-center text-[10px] uppercase tracking-widest cursor-default ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}>
                                            Current Plan
                                        </div>
                                    ) : (
                                        <div className="w-full py-3 bg-transparent text-neutral-600 font-bold rounded-xl text-center text-[10px] uppercase tracking-widest cursor-default">
                                            Included
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Basic Tier */}
                            <div className={`border p-6 rounded-[24px] flex flex-col relative overflow-hidden transition-all duration-300 ${isDark ? 'bg-neutral-900/30 border-neutral-700/50 hover:border-neutral-500' : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-md'}`}>
                                {derivedPlan === 'basic' && (
                                    <div className={`absolute top-0 right-0 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-lg z-20 ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                        Current
                                    </div>
                                )}
                                <div className="space-y-4 flex-1">
                                    <h4 className={`font-black text-xl flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                        Basic
                                        <CheckCircle size={18} className="text-neutral-400" fill="currentColor" fillOpacity={0.2} />
                                        {pricing.basicOffer > 0 && (
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider ${isDark ? 'bg-white/20 text-white' : 'bg-black/10 text-black'}`}>
                                                -{Math.round((1 - pricing.basicOffer / pricing.basic) * 100)}%
                                            </span>
                                        )}
                                    </h4>

                                    <div className="flex flex-col">
                                        {pricing.basicOffer > 0 ? (
                                            <>
                                                <span className="text-xs text-neutral-500 line-through font-bold">
                                                    {formatCurrency(pricing.basic)}
                                                </span>
                                                <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                                    <span className="text-sm text-neutral-400 font-bold mr-0.5">{currencyCode}</span>
                                                    {formatCurrency(pricing.basicOffer).replace(currencyCode, '').replace(currencySymbol, '')}
                                                    <span className={`text-xs font-bold ml-1 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>/mo</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                                <span className="text-sm text-neutral-400 font-bold mr-0.5">{currencyCode}</span>
                                                {formatCurrency(pricing.basic).replace(currencyCode, '').replace(currencySymbol, '')}
                                                <span className={`text-xs font-bold ml-1 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>/mo</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 space-y-3">
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            <CheckCircle size={14} className={isDark ? "text-white" : "text-black"} shrink-0 /> 3 Job Posts/mo
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            <CheckCircle size={14} className={isDark ? "text-white" : "text-black"} shrink-0 /> 3 Years Analytics History
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            <CheckCircle size={14} className={isDark ? "text-white" : "text-black"} shrink-0 /> 5 AI Top Match Credits/job
                                        </div>
                                    </div>
                                </div>
                                <div className={`mt-8 pt-6 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                                    {subscription?.status === 'active' && derivedPlan === 'basic' ? (
                                        <div className="text-center">
                                            <div className={`w-full py-3 font-bold rounded-xl text-[10px] uppercase tracking-widest mb-1 border cursor-default ${isDark ? 'bg-white/10 text-white border-white/20' : 'bg-black/5 text-black border-black/10'}`}>
                                                Active Plan
                                            </div>
                                            {isAutoRenew ? (
                                                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                                                    Renews: {new Date(subscription.current_period_end).toLocaleDateString()}
                                                </p>
                                            ) : (
                                                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                                                    Expires: {new Date(subscription.current_period_end).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="relative overflow-hidden">
                                            <div className={`transition-transform duration-300 ease-in-out flex w-[200%] ${paymentModes['basic'] === 'choose' ? '-translate-x-1/2' : 'translate-x-0'}`}>
                                                {/* Slide 1: Main Button */}
                                                <div className="w-1/2 px-1">
                                                    <button
                                                        onClick={() => setPaymentModes(prev => ({ ...prev, basic: 'choose' }))}
                                                        disabled={isLoading || (subscription?.status === 'active' && !isAutoRenew)}
                                                        className={`w-full py-3 font-black rounded-xl text-center text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-white hover:bg-neutral-200 text-black shadow-white/10' : 'bg-black hover:bg-neutral-800 text-white shadow-black/10'}`}
                                                    >
                                                        {isLoading ? <Loader2 className="animate-spin" size={14} /> : subscription?.status === 'active' ? 'Switch to Basic' : 'Get Basic'}
                                                    </button>
                                                </div>

                                                {/* Slide 2: Options */}
                                                <div className="w-1/2 px-1 flex gap-2">
                                                    <button
                                                        onClick={() => handleSubscribe('basic', true)}
                                                        className={`flex-1 py-3 font-bold rounded-xl text-[9px] uppercase tracking-wider transition-all active:scale-95 ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-black'}`}
                                                    >
                                                        One-Time
                                                    </button>
                                                    <button
                                                        onClick={() => handleSubscribe('basic', false)}
                                                        className={`flex-1 py-3 font-bold rounded-xl text-[9px] uppercase tracking-wider transition-all active:scale-95 ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                                                    >
                                                        Subscribe
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pro Tier ($99) - BEST OFFER */}
                            <div className={`border p-6 rounded-[24px] flex flex-col relative overflow-hidden transition-all duration-300 shadow-xl z-10 scale-[1.02] md:scale-105 ${isDark ? 'bg-neutral-900 border-neutral-600' : 'bg-white border-neutral-300 shadow-neutral-200'}`}>
                                <div className={`absolute top-0 inset-x-0 h-1.5 ${isDark ? 'bg-white' : 'bg-black'}`}></div>
                                {subscription?.plan_type === 'pro' && (
                                    <div className={`absolute top-1.5 right-0 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-lg z-20 ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                        Current
                                    </div>
                                )}
                                <div className="space-y-4 flex-1">
                                    <h4 className={`font-black text-xl flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                        Pro <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>BEST VALUE</span>
                                        <CheckCircle size={18} className="text-blue-400" fill="currentColor" fillOpacity={0.2} />
                                        {pricing.proOffer > 0 && (
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                                -{Math.round((1 - pricing.proOffer / pricing.pro) * 100)}%
                                            </span>
                                        )}
                                    </h4>

                                    <div className="flex flex-col">
                                        {pricing.proOffer > 0 ? (
                                            <>
                                                <span className="text-xs text-neutral-500 line-through font-bold">
                                                    {formatCurrency(pricing.pro)}
                                                </span>
                                                <div className={`text-4xl font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                                    <span className="text-sm text-neutral-400 font-bold mr-0.5">{currencyCode}</span>
                                                    {formatCurrency(pricing.proOffer).replace(currencyCode, '').replace(currencySymbol, '')}
                                                    <span className={`text-xs font-bold ml-1 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>/mo</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className={`text-4xl font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                                <span className="text-sm text-neutral-400 font-bold mr-0.5">{currencyCode}</span>
                                                {formatCurrency(pricing.pro).replace(currencyCode, '').replace(currencySymbol, '')}
                                                <span className={`text-xs font-bold ml-1 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>/mo</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 space-y-3">
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            <CheckCircle size={14} className={isDark ? "text-white" : "text-black"} shrink-0 /> <span className="font-bold">15 Job Posts/mo</span>
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            <CheckCircle size={14} className={isDark ? "text-white" : "text-black"} shrink-0 /> Unlimited Analytics History
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            <CheckCircle size={14} className={isDark ? "text-white" : "text-black"} shrink-0 /> 30 AI Top Match Credits/job
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            <CheckCircle size={14} className={isDark ? "text-white" : "text-black"} shrink-0 /> Location-Restricted Jobs
                                        </div>
                                    </div>
                                </div>
                                <div className={`mt-8 pt-6 border-t ${isDark ? 'border-neutral-700' : 'border-neutral-200'}`}>
                                    {subscription?.status === 'active' && derivedPlan === 'pro' ? (
                                        <div className="text-center">
                                            <div className={`w-full py-3 font-bold rounded-xl text-[10px] uppercase tracking-widest mb-1 border cursor-default ${isDark ? 'bg-white/10 text-white border-white/20' : 'bg-black/5 text-black border-black/10'}`}>
                                                Active Plan
                                            </div>
                                            {isAutoRenew ? (
                                                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                                                    Renews: {new Date(subscription.current_period_end).toLocaleDateString()}
                                                </p>
                                            ) : (
                                                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                                                    Expires: {new Date(subscription.current_period_end).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="relative overflow-hidden">
                                            <div className={`transition-transform duration-300 ease-in-out flex w-[200%] ${paymentModes['pro'] === 'choose' ? '-translate-x-1/2' : 'translate-x-0'}`}>
                                                {/* Slide 1: Main Button */}
                                                <div className="w-1/2 px-1">
                                                    <button
                                                        onClick={() => setPaymentModes(prev => ({ ...prev, pro: 'choose' }))}
                                                        disabled={isLoading || (subscription?.status === 'active' && !isAutoRenew)}
                                                        className={`w-full py-3.5 font-black rounded-xl text-center text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-black hover:bg-neutral-800 text-white'}`}
                                                    >
                                                        {isLoading ? <Loader2 className="animate-spin" size={14} /> : subscription?.status === 'active' ? 'Switch to Pro' : 'Get Pro'}
                                                    </button>
                                                </div>

                                                {/* Slide 2: Options */}
                                                <div className="w-1/2 px-1 flex gap-2">
                                                    <button
                                                        onClick={() => handleSubscribe('pro', true)}
                                                        className={`flex-1 py-3.5 font-bold rounded-xl text-[9px] uppercase tracking-wider transition-all active:scale-95 ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-black'}`}
                                                    >
                                                        One-Time
                                                    </button>
                                                    <button
                                                        onClick={() => handleSubscribe('pro', false)}
                                                        className={`flex-1 py-3.5 font-bold rounded-xl text-[9px] uppercase tracking-wider transition-all active:scale-95 ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                                                    >
                                                        Subscribe
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Enterprise Tier ($250) */}
                            <div className={`border p-6 rounded-[24px] flex flex-col relative overflow-hidden transition-all duration-300 ${derivedPlan === 'enterprise' ? (isDark ? 'border-white shadow-2xl shadow-white/10 bg-neutral-900/50' : 'border-black shadow-2xl shadow-black/10 bg-white') : (isDark ? 'bg-neutral-900/30 border-neutral-700/50 hover:border-neutral-500' : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-md')}`}>
                                {derivedPlan === 'enterprise' && (
                                    <div className={`absolute top-0 right-0 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-lg z-20 ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                        Current
                                    </div>
                                )}
                                <div className="space-y-4 flex-1">
                                    <h4 className={`font-black text-xl flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                        Enterprise
                                        <CheckCircle size={18} className="text-yellow-400" fill="currentColor" fillOpacity={0.2} />
                                        {pricing.enterpriseOffer > 0 && (
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider ${isDark ? 'bg-white/20 text-white' : 'bg-black/10 text-black'}`}>
                                                -{Math.round((1 - pricing.enterpriseOffer / pricing.enterprise) * 100)}%
                                            </span>
                                        )}
                                    </h4>

                                    <div className="flex flex-col">
                                        {pricing.enterpriseOffer > 0 ? (
                                            <>
                                                <span className="text-xs text-neutral-500 line-through font-bold">
                                                    {formatCurrency(pricing.enterprise)}
                                                </span>
                                                <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                                    <span className="text-sm text-neutral-400 font-bold mr-0.5">{currencyCode}</span>
                                                    {formatCurrency(pricing.enterpriseOffer).replace(currencyCode, '').replace(currencySymbol, '')}
                                                    <span className={`text-xs font-bold ml-1 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>/mo</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                                                <span className="text-sm text-neutral-400 font-bold mr-0.5">{currencyCode}</span>
                                                {formatCurrency(pricing.enterprise).replace(currencyCode, '').replace(currencySymbol, '')}
                                                <span className={`text-xs font-bold ml-1 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>/mo</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 space-y-3">
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            <CheckCircle size={14} className={isDark ? "text-white" : "text-black"} shrink-0 /> Unlimited Job Posts
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            <CheckCircle size={14} className={isDark ? "text-white" : "text-black"} shrink-0 /> Unlimited Analytics
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            <CheckCircle size={14} className={isDark ? "text-white" : "text-black"} shrink-0 /> Unlimited AI Top Matches
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            <CheckCircle size={14} className={isDark ? "text-white" : "text-black"} shrink-0 /> Location-Restricted Jobs
                                        </div>
                                    </div>
                                </div>
                                <div className={`mt-8 pt-6 border-t ${isDark ? 'border-neutral-700/50' : 'border-neutral-100'}`}>
                                    {subscription?.status === 'active' && derivedPlan === 'enterprise' ? (
                                        <div className="text-center">
                                            <div className={`w-full py-3 font-bold rounded-xl text-[10px] uppercase tracking-widest mb-1 border cursor-default ${isDark ? 'bg-white/10 text-white border-white/20' : 'bg-black/5 text-black border-black/10'}`}>
                                                Active Plan
                                            </div>
                                            {isAutoRenew ? (
                                                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                                                    Renews: {new Date(subscription.current_period_end).toLocaleDateString()}
                                                </p>
                                            ) : (
                                                <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">
                                                    Expires: {new Date(subscription.current_period_end).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="relative overflow-hidden">
                                            <div className={`transition-transform duration-300 ease-in-out flex w-[200%] ${paymentModes['enterprise'] === 'choose' ? '-translate-x-1/2' : 'translate-x-0'}`}>
                                                {/* Slide 1: Main Button */}
                                                <div className="w-1/2 px-1">
                                                    <button
                                                        onClick={() => setPaymentModes(prev => ({ ...prev, enterprise: 'choose' }))}
                                                        disabled={isLoading || (subscription?.status === 'active' && !isAutoRenew)}
                                                        className={`w-full py-3 font-black rounded-xl text-center text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-black hover:bg-neutral-800 text-white'}`}
                                                    >
                                                        {isLoading ? <Loader2 className="animate-spin" size={14} /> : subscription?.status === 'active' ? 'Switch to Enterprise' : 'Get Enterprise'}
                                                    </button>
                                                </div>

                                                {/* Slide 2: Options */}
                                                <div className="w-1/2 px-1 flex gap-2">
                                                    <button
                                                        onClick={() => handleSubscribe('enterprise', true)}
                                                        className={`flex-1 py-3 font-bold rounded-xl text-[9px] uppercase tracking-wider transition-all active:scale-95 ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-black'}`}
                                                    >
                                                        One-Time
                                                    </button>
                                                    <button
                                                        onClick={() => handleSubscribe('enterprise', false)}
                                                        className={`flex-1 py-3 font-bold rounded-xl text-[9px] uppercase tracking-wider transition-all active:scale-95 ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                                                    >
                                                        Subscribe
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>


                </div>
            )
            }
        </div >
    );
}

export default function EmployerSettingsPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#020617]"><Loader2 className="text-white animate-spin" size={48} /></div>}>
            <SettingsContent />
        </Suspense>
    );
}
