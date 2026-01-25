"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Save, Shield, MapPin, Globe, Activity, Lock, CheckCircle, CreditCard, LayoutDashboard, Loader2 } from 'lucide-react';
import { useCurrency } from '@/app/hooks/useCurrency';

function SettingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

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

    const handleSubscribe = async (plan: 'basic' | 'pro' | 'enterprise') => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/payments/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan, billingCycle })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url; // Redirect to Paystack
            } else {
                alert('Failed to start checkout: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
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
            <header className="flex items-center justify-between border-b border-neutral-800 pb-8">
                <div className="text-left">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Company Settings</h1>
                    <p className="text-neutral-400 mt-2">Manage company profile, security, and billing.</p>
                </div>

            </header>

            {/* Tabs */}
            <div className="flex space-x-2 bg-neutral-900/50 p-1 rounded-xl w-fit border border-neutral-800">

                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'security' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Shield size={16} /> Security
                </button>
                <button
                    onClick={() => setActiveTab('billing')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'billing' ? 'bg-white text-black shadow-lg' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
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

                    <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-[32px] space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Lock className="text-white" size={24} /> Change Password
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* ...fields... */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full bg-neutral-900/50 border border-neutral-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-neutral-500/50 transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-neutral-900/50 border border-neutral-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-neutral-500/50 transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    className="w-full bg-neutral-900/50 border border-neutral-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-neutral-500/50 transition-all font-bold"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handlePasswordChange}
                                disabled={isLoading || !currentPassword || !newPassword}
                                className="px-6 py-3 bg-white text-black hover:bg-neutral-200 rounded-xl font-bold text-sm border border-transparent transition-all"
                            >
                                Update Password
                            </button>
                        </div>
                    </div>

                    {/* Logs */}
                    <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-[32px] space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Activity className="text-white" size={24} /> Activity Log
                        </h3>
                        {/* Table... */}
                        <div className="overflow-hidden rounded-xl border border-neutral-800">
                            <table className="w-full text-left text-sm text-neutral-400">
                                <thead className="bg-neutral-900 text-neutral-200 font-bold uppercase text-xs tracking-wider">
                                    <tr>
                                        <th className="p-4">Action</th>
                                        <th className="p-4">Location Details</th>
                                        <th className="p-4">IP Address</th>
                                        <th className="p-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800">
                                    {activityLogs.map((log, i) => (
                                        <tr key={i} className="hover:bg-neutral-800/30 transition-colors">
                                            <td className="p-4 font-bold text-white">{log.action}</td>
                                            <td className="p-4">{log.location_details}</td>
                                            <td className="p-4 font-mono text-xs">{log.ip_address}</td>
                                            <td className="p-4">{new Date(log.created_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    {/* Billing Details */}
                    <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-[32px] space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <CreditCard className="text-white" size={24} /> Billing & Subscription
                                </h3>
                                <p className="text-neutral-400 text-sm mt-1">Simple, transparent monthly pricing.</p>
                            </div>
                        </div>

                        {exchangeRate > 1 && (
                            <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl flex items-center gap-3 text-xs text-neutral-400">
                                <Activity size={16} />
                                <span>Prices are converted from USD and may vary slightly depending on current economic exchange rates.</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {/* Free Tier */}
                            <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-[24px] flex flex-col relative overflow-hidden group hover:border-neutral-700 transition-colors">
                                <div className="space-y-3 flex-1">
                                    <h4 className="font-black text-lg text-white">Free</h4>
                                    <div className="text-2xl font-black text-neutral-500">
                                        {formatCurrency(0)}
                                        <span className="text-[10px] text-neutral-600 font-bold ml-1">/mo</span>
                                    </div>
                                    <div className="pt-2 space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] text-neutral-300 font-medium">
                                            <CheckCircle size={12} className="text-neutral-500" /> 1 Job Post/mo
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-neutral-300 font-medium">
                                            <CheckCircle size={12} className="text-neutral-500" /> 1 Year Analytics History
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-neutral-800">
                                    {!subscription ? (
                                        <div className="w-full py-2 bg-neutral-800 text-neutral-400 font-bold rounded-xl text-center text-[9px] uppercase tracking-widest cursor-default">
                                            Current Plan
                                        </div>
                                    ) : (
                                        <div className="w-full py-2 bg-transparent text-neutral-600 font-bold rounded-xl text-center text-[9px] uppercase tracking-widest cursor-default">
                                            Included
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Basic Tier */}
                            <div className="bg-neutral-900/30 border border-neutral-700/50 p-5 rounded-[24px] flex flex-col relative overflow-hidden hover:border-neutral-500 transition-colors">
                                {derivedPlan === 'basic' && (
                                    <div className="absolute top-0 right-0 bg-white text-black text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-xl shadow-lg">
                                        Current
                                    </div>
                                )}
                                <div className="space-y-3 flex-1">
                                    <h4 className="font-black text-lg text-white flex items-center gap-2">
                                        Basic
                                        {pricing.basicOffer > 0 && (
                                            <span className="bg-white/20 text-white text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider">
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
                                                <div className="text-2xl font-black text-white">
                                                    <span className="text-xs text-neutral-400 font-bold mr-0.5">{currencyCode}</span>
                                                    {formatCurrency(pricing.basicOffer).replace(currencyCode, '').replace(currencySymbol, '')}
                                                    <span className="text-[10px] text-neutral-500 font-bold ml-1">/mo</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-2xl font-black text-white">
                                                <span className="text-xs text-neutral-400 font-bold mr-0.5">{currencyCode}</span>
                                                {formatCurrency(pricing.basic).replace(currencyCode, '').replace(currencySymbol, '')}
                                                <span className="text-[10px] text-neutral-500 font-bold ml-1">/mo</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] text-neutral-200 font-medium">
                                            <CheckCircle size={12} className="text-white shrink-0" /> 5 Job Posts/mo
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-neutral-200 font-medium">
                                            <CheckCircle size={12} className="text-white shrink-0" /> 3 Years Analytics History
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-neutral-200 font-medium">
                                            <CheckCircle size={12} className="text-white shrink-0" /> Top Match Access (Limited)
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-neutral-800">
                                    {subscription?.status === 'active' && derivedPlan === 'basic' ? (
                                        <div className="text-center">
                                            <div className="w-full py-2 bg-white/10 text-white font-bold rounded-xl text-[9px] uppercase tracking-widest mb-1 border border-white/20">
                                                Active
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
                                            className="w-full py-2 bg-white hover:bg-neutral-200 text-black font-black rounded-xl text-center text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-white/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" size={12} /> : subscription?.status === 'active' ? 'Switch to Basic' : 'Get Basic'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Pro Tier ($99) - BEST OFFER */}
                            <div className="bg-neutral-900 border border-neutral-600 p-5 rounded-[24px] flex flex-col relative overflow-hidden shadow-xl scale-105 z-10">
                                <div className="absolute top-0 inset-x-0 h-1 bg-white"></div>
                                {subscription?.plan_type === 'pro' && (
                                    <div className="absolute top-1 right-0 bg-white text-black text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-xl shadow-lg">
                                        Current
                                    </div>
                                )}
                                <div className="space-y-3 flex-1">
                                    <h4 className="font-black text-lg text-white flex items-center gap-2">
                                        Pro <span className="px-1.5 py-0.5 rounded bg-white text-black text-[8px] font-bold tracking-wide">BEST VALUE</span>
                                        {pricing.proOffer > 0 && (
                                            <span className="bg-white text-black text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider">
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
                                                <div className="text-2xl font-black text-white">
                                                    <span className="text-xs text-neutral-400 font-bold mr-0.5">{currencyCode}</span>
                                                    {formatCurrency(pricing.proOffer).replace(currencyCode, '').replace(currencySymbol, '')}
                                                    <span className="text-[10px] text-neutral-500 font-bold ml-1">/mo</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-2xl font-black text-white">
                                                <span className="text-xs text-neutral-400 font-bold mr-0.5">{currencyCode}</span>
                                                {formatCurrency(pricing.pro).replace(currencyCode, '').replace(currencySymbol, '')}
                                                <span className="text-[10px] text-neutral-500 font-bold ml-1">/mo</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] text-neutral-200 font-medium">
                                            <CheckCircle size={12} className="text-white shrink-0" /> <span className="text-white font-bold">30 Job Postings/mo</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-neutral-200 font-medium">
                                            <CheckCircle size={12} className="text-white shrink-0" /> Unlimited Analytics History
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-neutral-200 font-medium">
                                            <CheckCircle size={12} className="text-white shrink-0" /> Top Matches (Increased Limit)
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-neutral-200 font-medium">
                                            <CheckCircle size={12} className="text-white shrink-0" /> Access to Restricted Location Feature
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-neutral-700">
                                    {subscription?.status === 'active' && derivedPlan === 'pro' ? (
                                        <div className="text-center">
                                            <div className="w-full py-2 bg-white/10 text-white font-bold rounded-xl text-[9px] uppercase tracking-widest mb-1 border border-white/20">
                                                Active
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
                                            className="w-full py-2.5 bg-white hover:bg-neutral-200 text-black font-black rounded-xl text-center text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" size={14} /> : subscription?.status === 'active' ? 'Switch to Pro' : 'Get Pro'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Enterprise Tier ($250) */}
                            <div className={`bg-neutral-900/30 border p-5 rounded-[24px] flex flex-col relative overflow-hidden transition-colors ${derivedPlan === 'enterprise' ? 'border-white shadow-2xl shadow-white/10' : 'border-neutral-700/50 hover:border-neutral-500'}`}>
                                {derivedPlan === 'enterprise' && (
                                    <div className="absolute top-0 right-0 bg-white text-black text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-xl shadow-lg">
                                        Current
                                    </div>
                                )}
                                <div className="space-y-3 flex-1">
                                    <h4 className="font-black text-lg text-white flex items-center gap-2">
                                        Enterprise
                                        {pricing.enterpriseOffer > 0 && (
                                            <span className="bg-white/20 text-white text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider">
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
                                                <div className="text-2xl font-black text-white">
                                                    <span className="text-xs text-neutral-400 font-bold mr-0.5">{currencyCode}</span>
                                                    {formatCurrency(pricing.enterpriseOffer).replace(currencyCode, '').replace(currencySymbol, '')}
                                                    <span className="text-[10px] text-neutral-500 font-bold ml-1">/mo</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-2xl font-black text-white">
                                                <span className="text-xs text-neutral-400 font-bold mr-0.5">{currencyCode}</span>
                                                {formatCurrency(pricing.enterprise).replace(currencyCode, '').replace(currencySymbol, '')}
                                                <span className="text-[10px] text-neutral-500 font-bold ml-1">/mo</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] text-neutral-200 font-medium">
                                            <CheckCircle size={12} className="text-white shrink-0" /> Unlimited Job Postings
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-neutral-200 font-medium">
                                            <CheckCircle size={12} className="text-white shrink-0" /> Unlimited Analytics History
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-neutral-200 font-medium">
                                            <CheckCircle size={12} className="text-white shrink-0" /> Unlimited Top Matches (capped at 100/job)
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-neutral-200 font-medium">
                                            <CheckCircle size={12} className="text-white shrink-0" /> Access to Restricted Location Feature
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-neutral-700/50">
                                    {subscription?.status === 'active' && derivedPlan === 'enterprise' ? (
                                        <div className="text-center">
                                            <div className="w-full py-2 bg-white/10 text-white font-bold rounded-xl text-[9px] uppercase tracking-widest mb-1 border border-white/20">
                                                Active
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
                                            className="w-full py-2 bg-white hover:bg-neutral-200 text-black font-black rounded-xl text-center text-[9px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" size={12} /> : subscription?.status === 'active' ? 'Switch to Enterprise' : 'Get Enterprise'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method / Status */}
                    <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-[24px] space-y-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
                            <div className="space-y-4 max-w-2xl">
                                <h3 className="font-bold text-white flex items-center gap-3 text-lg">
                                    <Activity className={isAutoRenew ? "text-white" : "text-neutral-400"} size={24} />
                                    Subscription Status: <span className={isAutoRenew ? "text-white" : "text-neutral-400"}>{isAutoRenew ? 'Automatic Detection' : 'Manual / Expiring'}</span>
                                </h3>

                                <div className="space-y-3 text-neutral-400 text-sm leading-relaxed">
                                    <p>
                                        <strong className="text-neutral-300">Automatic:</strong> Your subscription renews automatically every month. This ensures uninterrupted access to all features.
                                    </p>
                                    <p>
                                        <strong className="text-neutral-300">Manual:</strong> Recurring charges are disabled. Your plan will arguably expire at the end of the current period.
                                    </p>
                                    <div className="p-4 bg-neutral-900/50 rounded-xl border border-neutral-800/50 mt-2">
                                        <p className="text-xs text-neutral-500">
                                            <span className="text-white font-bold uppercase tracking-wide mr-2">Important Policy:</span>
                                            If your subscription expires (Manual Mode) and is not renewed within <span className="text-white font-bold">60 days</span>, your billing account will be automatically reset to the <span className="text-white font-bold">Free Plan</span>. You will effectively start fresh and need to choose a new plan to regain paid features.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {subscription?.status === 'active' && (
                                <div className="flex flex-col gap-3 w-full md:w-auto min-w-[200px]">
                                    <button
                                        onClick={handleToggleAutoRenew}
                                        disabled={isLoading}
                                        className={`w-full py-4 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${isAutoRenew
                                            ? 'bg-neutral-800 hover:bg-neutral-700 text-white shadow-lg'
                                            : 'bg-white hover:bg-neutral-200 text-black shadow-lg'}`}
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={16} /> : isAutoRenew ? 'Switch to Manual' : 'Enable Auto-Renew'}
                                    </button>

                                    {isAutoRenew && (
                                        <button
                                            onClick={handleToggleAutoRenew}
                                            disabled={isLoading}
                                            className="w-full py-3 px-6 bg-transparent hover:bg-white/5 border border-neutral-700 hover:border-neutral-500 text-neutral-500 hover:text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all"
                                        >
                                            Cancel Subscription
                                        </button>
                                    )}
                                </div>
                            )}
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
