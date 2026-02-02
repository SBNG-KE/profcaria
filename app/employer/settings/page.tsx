"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Save, Shield, MapPin, Globe, Activity, Lock, CheckCircle, CreditCard, LayoutDashboard, Loader2 } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { useCurrency } from '@/app/hooks/useCurrency';
import { usePayment } from '@/app/hooks/usePayment';
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

    const [activeTab, setActiveTab] = useState<'security' | 'billing'>('security');

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
    }, [activeTab]);



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
                    setIsAutoRenew(!data.subscription.cancel_at_period_end);
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

    const handleSubscribe = async (plan: 'basic' | 'pro' | 'enterprise') => {
        startPayment({
            plan,
            onSuccess: () => {
                setMessage({ type: 'success', text: 'Payment successful! Updating subscription...' });
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
            </div>

            {message && (
                <div className={`p-4 rounded-2xl text-center font-bold text-sm animate-in fade-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-white/10 text-white border border-white/20' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                    {message.text}
                </div>
            )}

            {activeTab === 'security' ? (
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
                                            <CheckCircle size={14} className={isDark ? "text-white" : "text-black"} shrink-0 /> 5 Job Posts/mo
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            <CheckCircle size={14} className={isDark ? "text-white" : "text-black"} shrink-0 /> 3 Years Analytics History
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            <CheckCircle size={14} className={isDark ? "text-white" : "text-black"} shrink-0 /> 5 AI Top Match Credits
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
                                        <button
                                            onClick={() => handleSubscribe('basic')}
                                            disabled={isLoading || (subscription?.status === 'active' && !isAutoRenew)}
                                            className={`w-full py-3 font-black rounded-xl text-center text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-white hover:bg-neutral-200 text-black shadow-white/10' : 'bg-black hover:bg-neutral-800 text-white shadow-black/10'}`}
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" size={14} /> : subscription?.status === 'active' ? 'Switch to Basic' : 'Get Basic'}
                                        </button>
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
                                            <CheckCircle size={14} className={isDark ? "text-white" : "text-black"} shrink-0 /> <span className="font-bold">30 Job Posts/mo</span>
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            <CheckCircle size={14} className={isDark ? "text-white" : "text-black"} shrink-0 /> Unlimited Analytics History
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            <CheckCircle size={14} className={isDark ? "text-white" : "text-black"} shrink-0 /> 15 AI Top Match Credits (3/job)
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
                                        <button
                                            onClick={() => handleSubscribe('pro')}
                                            disabled={isLoading || (subscription?.status === 'active' && !isAutoRenew)}
                                            className={`w-full py-3.5 font-black rounded-xl text-center text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-black hover:bg-neutral-800 text-white'}`}
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" size={14} /> : subscription?.status === 'active' ? 'Switch to Pro' : 'Get Pro'}
                                        </button>
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
                                        <div className={`flex items-center gap-2 text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-700'}`}>
                                            <CheckCircle size={14} className={isDark ? "text-white" : "text-black"} shrink-0 /> Personal Account Manager
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
                                        <button
                                            onClick={() => handleSubscribe('enterprise')}
                                            disabled={isLoading || (subscription?.status === 'active' && !isAutoRenew)}
                                            className={`w-full py-3 font-black rounded-xl text-center text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-black hover:bg-neutral-800 text-white'}`}
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" size={14} /> : subscription?.status === 'active' ? 'Switch to Enterprise' : 'Get Enterprise'}
                                        </button>
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
