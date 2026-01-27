"use client"

import React, { useState, useEffect } from 'react';
import { Shield, Activity, Lock, AlertCircle, CheckCircle, CreditCard, Clock, Loader2 } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { useCurrency } from '@/app/hooks/useCurrency';
import { usePayment } from '@/app/hooks/usePayment';
import { PROFESSIONAL_PLANS } from '@/lib/billing-config';

export default function ProfessionalSettingsPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    // Billing State
    const [subscription, setSubscription] = useState<any | null>(null);
    const [currentPlan, setCurrentPlan] = useState<string>('free');

    // Security & UI State (Restored)
    const [activeTab, setActiveTab] = useState<'security' | 'billing'>('security');
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
            // Placeholder for actual API call
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

    // Currency & Payment
    const { currency: currencyCode, symbol: currencySymbol, rate: exchangeRate, loading: currencyLoading } = useCurrency();
    const { startPayment, isLoading: paymentLoading } = usePayment();

    useEffect(() => {
        if (activeTab === 'billing') fetchBilling();
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

    const fetchBilling = async () => {
        try {
            const res = await fetch('/api/professional/billing');
            if (res.ok) {
                const data = await res.json();
                setSubscription(data.subscription);
                setCurrentPlan(data.plan || 'free');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubscribe = (planName: string) => {
        startPayment({
            plan: planName,
            onSuccess: () => {
                setMessage({ type: 'success', text: `Successfully subscribed to ${planName}!` });
                fetchBilling();
            },
            onError: (err) => setMessage({ type: 'error', text: err })
        });
    };

    // Currency Formatter
    const formatPrice = (usd: number) => {
        if (currencyLoading) return '...';
        return `${currencySymbol}${new Intl.NumberFormat().format(Math.round(usd * exchangeRate))}`;
    };

    const renderPlanCard = (id: string, name: string, price: number, badgeColor: string, features: string[]) => {
        const isCurrent = currentPlan === id;
        const colorClass = badgeColor === 'gold' ? 'text-yellow-400' : badgeColor === 'blue' ? 'text-blue-400' : 'text-neutral-400';
        const bgClass = badgeColor === 'gold' ? 'bg-yellow-400/10 border-yellow-400/20' : badgeColor === 'blue' ? 'bg-blue-400/10 border-blue-400/20' : 'bg-neutral-800/50 border-neutral-700';

        return (
            <div key={id} className={`relative p-6 rounded-3xl border flex flex-col ${isCurrent ? 'border-emerald-500 shadow-2xl shadow-emerald-500/10 scale-105 z-10 bg-neutral-900' : `bg-neutral-900/50 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`} transition-all hover:border-neutral-600`}>
                {isCurrent && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                        Current Plan
                    </div>
                )}

                <div className="mb-4">
                    <h4 className={`text-lg font-black uppercase tracking-wide flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                        {name}
                        {badgeColor !== 'none' && (
                            <CheckCircle size={18} className={colorClass} fill="currentColor" fillOpacity={0.2} />
                        )}
                    </h4>
                    <div className="mt-2 text-3xl font-black text-white">
                        {price === 0 ? 'Free' : (
                            <>
                                {formatPrice(price)}<span className="text-sm text-neutral-500 font-bold">/mo</span>
                            </>
                        )}
                    </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                    {features.map((f, i) => (
                        <li key={i} className="flex items-center gap-3 text-xs font-bold text-neutral-400">
                            <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                            {f}
                        </li>
                    ))}
                </ul>

                <button
                    onClick={() => handleSubscribe(id)}
                    disabled={isCurrent || paymentLoading}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isCurrent
                        ? 'bg-neutral-800 text-neutral-500 cursor-default'
                        : 'bg-white hover:bg-neutral-200 text-black shadow-lg hover:shadow-xl active:scale-95'
                        }`}
                >
                    {paymentLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : isCurrent ? 'Active' : 'Upgrade'}
                </button>
            </div>
        );
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 pb-32">
            <header className={`flex items-center justify-between border-b pb-8 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                <div className="text-left">
                    <h1 className={`text-4xl font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>Settings</h1>
                    <p className={`mt-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Manage your security and billing.</p>
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
            </div>

            {message && (
                <div className={`p-4 rounded-2xl text-center font-bold text-sm animate-in fade-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {message.text}
                </div>
            )}

            {activeTab === 'security' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    {/* Security Content (Same as before) */}
                    <div className={`border p-8 rounded-[32px] space-y-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                            <Lock className="text-emerald-500" size={24} /> Change Password
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all font-bold ${isDark ? 'bg-neutral-900/50 border-neutral-700/50 text-white focus:ring-emerald-500/50' : 'bg-neutral-50 border-neutral-200 text-black focus:ring-black/20'}`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all font-bold ${isDark ? 'bg-slate-900/50 border-slate-700/50 text-white focus:ring-emerald-500/50' : 'bg-neutral-50 border-neutral-200 text-black focus:ring-black/20'}`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-neutral-500'}`}>Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all font-bold ${isDark ? 'bg-neutral-900/50 border-neutral-700/50 text-white focus:ring-emerald-500/50' : 'bg-neutral-50 border-neutral-200 text-black focus:ring-black/20'}`}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handlePasswordChange}
                                disabled={isLoading || !currentPassword || !newPassword}
                                className={`px-6 py-3 rounded-xl font-bold text-sm border transition-all ${isDark ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/20' : 'bg-black text-white hover:bg-neutral-800 border-black'}`}
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
                            <table className={`w-full text-left text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                <thead className={`font-bold uppercase text-xs tracking-wider ${isDark ? 'bg-neutral-900 text-neutral-200' : 'bg-neutral-50 text-neutral-700'}`}>
                                    <tr>
                                        <th className="p-4">Action</th>
                                        <th className="p-4">Location Details</th>
                                        <th className="p-4">IP Address</th>
                                        <th className="p-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-neutral-200'}`}>
                                    {activityLogs.map((log, i) => (
                                        <tr key={i} className={`transition-colors ${isDark ? 'hover:bg-slate-800/30' : 'hover:bg-neutral-50'}`}>
                                            <td className={`p-4 font-bold ${isDark ? 'text-white' : 'text-black'}`}>{log.action}</td>
                                            <td className="p-4">{log.location_details}</td>
                                            <td className="p-4 font-mono text-xs">{log.ip_address}</td>
                                            <td className="p-4">{new Date(log.created_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {activityLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className={`p-8 text-center italic ${isDark ? 'text-slate-600' : 'text-neutral-400'}`}>No activity logs found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {renderPlanCard(
                            'free',
                            PROFESSIONAL_PLANS.free.name,
                            PROFESSIONAL_PLANS.free.priceMonthly,
                            PROFESSIONAL_PLANS.free.badge,
                            [...PROFESSIONAL_PLANS.free.features]
                        )}
                        {renderPlanCard(
                            'basic',
                            PROFESSIONAL_PLANS.basic.name,
                            PROFESSIONAL_PLANS.basic.priceMonthly,
                            PROFESSIONAL_PLANS.basic.badge,
                            [...PROFESSIONAL_PLANS.basic.features]
                        )}
                        {renderPlanCard(
                            'standard',
                            PROFESSIONAL_PLANS.standard.name,
                            PROFESSIONAL_PLANS.standard.priceMonthly,
                            PROFESSIONAL_PLANS.standard.badge,
                            [...PROFESSIONAL_PLANS.standard.features]
                        )}
                        {renderPlanCard(
                            'premium',
                            PROFESSIONAL_PLANS.premium.name,
                            PROFESSIONAL_PLANS.premium.priceMonthly,
                            PROFESSIONAL_PLANS.premium.badge,
                            [...PROFESSIONAL_PLANS.premium.features]
                        )}
                    </div>

                    <div className={`p-6 rounded-2xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <Activity className="text-blue-500" size={24} />
                            </div>
                            <div>
                                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-black'}`}>About Subscriptions</h3>
                                <p className={`mt-1 text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                    Subscriptions are billed monthly. You can cancel at any time. Higher tiers give you more visibility in the algorithm and special verification badges that build trust with employers.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

