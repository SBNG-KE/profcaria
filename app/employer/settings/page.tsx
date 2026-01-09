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

    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'billing'>('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile State
    const [companyName, setCompanyName] = useState('');
    const [website, setWebsite] = useState('');
    const [email, setEmail] = useState(''); // Read-only

    // Location State
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');

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
        basic: 25,
        pro: 99,
        enterprise: 250,
        yearlyDiscountPercent: 0
    });

    useEffect(() => {
        fetchProfile();
        if (activeTab === 'security') fetchActivityLogs();
        if (activeTab === 'billing') fetchBilling();
    }, [activeTab]);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();

                if (data.profile) {
                    setCompanyName(data.profile.companyName || '');
                    setWebsite(data.profile.website || '');
                    setEmail(data.profile.email || '');

                    setCountry(data.profile.country || '');
                    setCity(data.profile.city || '');
                    setAddress(data.profile.address || '');
                }


            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
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
                    setIsAutoRenew(!data.subscription.cancel_at_period_end);
                }

                // Infer Plan from latest payment because DB might lack 'plan' column
                if (data.subscription?.plan) {
                    setDerivedPlan(data.subscription.plan);
                } else if (data.payments && data.payments.length > 0 && data.subscription?.status === 'active') {
                    // Heuristic: Check latest payment amount vs USD pricing (approx)
                    const latest = data.payments[0];
                    // Convert back to USD roughly to guess
                    const exRate = parseFloat(process.env.NEXT_PUBLIC_USD_EXCHANGE_RATE || '130');
                    // Or just compare relative magnitudes since we don't know rate at time of purchase
                    // Pro is ~4x Basic. Enterprise is ~2.5x Pro.
                    // Basic ~$25, Pro ~$99, Ent ~$250

                    // We can't know for sure without the rate, but usually:
                    // < $60 value -> Basic
                    // < $180 value -> Pro
                    // > $180 value -> Enterprise

                    // Use current rate for estimation (not perfect but better than nothing)
                    // Amount is in cents/subunits? Wait, payment.amount from Paystack is usually base unit if using USD? 
                    // No, verification route saved `data.amount`. Paystack is usually subunits (kobo/cents).
                    // But let's check recent payment table: `payment.amount / 100`. So it is subunits.

                    // Rough check:
                    // 25 * 100 * 100 = 250,000 (roughly KES 3,250 * 100) -> 325,000
                    // 99 * 100 * 100 = 990,000 (roughly KES 12,800 * 100) -> 1,280,000

                    // Simply:
                    const amount = latest.amount;
                    if (amount > 2000000) setDerivedPlan('enterprise'); // > 20k KES 
                    else if (amount > 800000) setDerivedPlan('pro');   // > 8k KES
                    else setDerivedPlan('basic');
                }

                // Exchange rate is now handled by client-side hook

                setPricing({
                    basic: data.basic || 25,
                    pro: data.pro || 99,
                    enterprise: data.enterprise || 250,
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

    const handleProfileSave = async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            const res = await fetch('/api/employer/profile/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName,
                    website,
                    email,
                    country,
                    city,
                    address
                })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Company profile updated successfully!' });
                if (activeTab === 'security') fetchActivityLogs();
            } else {
                setMessage({ type: 'error', text: 'Failed to update profile.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred.' });
        } finally {
            setIsLoading(false);
        }
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
            <header className="flex items-center justify-between border-b border-slate-800 pb-8">
                <div className="text-left">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Company Settings</h1>
                    <p className="text-slate-400 mt-2">Manage company profile, security, and billing.</p>
                </div>
                {activeTab === 'profile' && (
                    <button
                        onClick={handleProfileSave}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                    >
                        <Save size={18} />
                        <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                )}
            </header>

            {/* Tabs */}
            <div className="flex space-x-2 bg-slate-900/50 p-1 rounded-xl w-fit border border-slate-800">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <User size={16} /> Profile
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'security' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Shield size={16} /> Security
                </button>
                <button
                    onClick={() => setActiveTab('billing')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'billing' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <CreditCard size={16} /> Billing
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl text-center font-bold text-sm animate-in fade-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {message.text}
                </div>
            )}

            {activeTab === 'profile' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    {/* Company Info */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <LayoutDashboard className="text-emerald-500" size={24} /> Company Details
                        </h3>
                        <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[32px] space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Company Name</label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Website</label>
                                <input
                                    type="text"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Work Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <MapPin className="text-emerald-500" size={24} /> Headquarters Location
                        </h3>
                        <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[32px] space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Globe size={12} /> Country <span className="text-emerald-500 text-[8px] bg-emerald-500/10 px-1 rounded ml-auto">AUTO-DETECTED</span></label>
                                    <input
                                        type="text"
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        placeholder="e.g. USA"
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">City <span className="text-emerald-500 text-[8px] bg-emerald-500/10 px-1 rounded ml-auto">AUTO-DETECTED</span></label>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="e.g. San Francisco"
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">Office Address <span className="text-emerald-500 text-[8px] bg-emerald-500/10 px-1 rounded ml-auto">AUTO-DETECTED</span></label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="e.g. 500 Market St"
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'security' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">


                    {/* Password */}
                    <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[32px] space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Lock className="text-blue-500" size={24} /> Change Password
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* ...fields... */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handlePasswordChange}
                                disabled={isLoading || !currentPassword || !newPassword}
                                className="px-6 py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl font-bold text-sm border border-blue-500/20 transition-all"
                            >
                                Update Password
                            </button>
                        </div>
                    </div>

                    {/* Logs */}
                    <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[32px] space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Activity className="text-blue-500" size={24} /> Activity Log
                        </h3>
                        {/* Table... */}
                        <div className="overflow-hidden rounded-xl border border-slate-800">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-xs tracking-wider">
                                    <tr>
                                        <th className="p-4">Action</th>
                                        <th className="p-4">Location Details</th>
                                        <th className="p-4">IP Address</th>
                                        <th className="p-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {activityLogs.map((log, i) => (
                                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
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
                    <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[32px] space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <CreditCard className="text-purple-500" size={24} /> Billing & Subscription
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">Choose the plan that fits your hiring needs.</p>
                            </div>

                            {/* Billing Cycle Toggle */}
                            <div className="flex items-center gap-4 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${billingCycle === 'monthly' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setBillingCycle('yearly')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Yearly
                                    {pricing.yearlyDiscountPercent > 0 && (
                                        <span className="bg-white/20 text-white px-1.5 py-0.5 rounded text-[9px] font-black">
                                            -{pricing.yearlyDiscountPercent}%
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {exchangeRate > 1 && (
                            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center gap-3 text-xs text-slate-400">
                                <Activity size={16} />
                                <span>Prices are converted from USD and may vary slightly depending on current economic exchange rates.</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {/* Free Tier */}
                            <div className="bg-[#0f172a] border border-slate-800 p-5 rounded-[24px] flex flex-col relative overflow-hidden group hover:border-slate-700 transition-colors">
                                <div className="space-y-3 flex-1">
                                    <h4 className="font-black text-lg text-white">Free</h4>
                                    <div className="text-2xl font-black text-slate-500">
                                        {formatCurrency(0)}
                                        <span className="text-[10px] text-slate-600 font-bold ml-1">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                    </div>
                                    <div className="pt-2 space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] text-slate-300 font-medium">
                                            <CheckCircle size={12} className="text-slate-500" /> 1 Active Job Post
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-300 font-medium">
                                            <CheckCircle size={12} className="text-slate-500" /> Basic Search
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-300 font-medium">
                                            <CheckCircle size={12} className="text-slate-500" /> Standard Support
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-800">
                                    {!subscription ? (
                                        <div className="w-full py-2 bg-slate-800 text-slate-400 font-bold rounded-xl text-center text-[9px] uppercase tracking-widest cursor-default">
                                            Current Plan
                                        </div>
                                    ) : (
                                        <div className="w-full py-2 bg-transparent text-slate-600 font-bold rounded-xl text-center text-[9px] uppercase tracking-widest cursor-default">
                                            Included
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Basic Tier ($25) */}
                            <div className="bg-slate-900/30 border border-blue-500/20 p-5 rounded-[24px] flex flex-col relative overflow-hidden hover:border-blue-500/40 transition-colors">
                                {derivedPlan === 'basic' && (
                                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-xl shadow-lg">
                                        Current
                                    </div>
                                )}
                                <div className="space-y-3 flex-1">
                                    <h4 className="font-black text-lg text-white">Basic</h4>
                                    <div className="text-2xl font-black text-blue-400">
                                        <span className="text-xs text-blue-600 font-bold mr-0.5">{currencyCode}</span>
                                        {(() => {
                                            let price = pricing.basic;
                                            if (billingCycle === 'yearly') {
                                                price = price * 12 * (1 - pricing.yearlyDiscountPercent / 100);
                                            }
                                            return formatCurrency(price).replace(currencySymbol, '');
                                        })()}
                                        <span className="text-[10px] text-blue-600/70 font-bold ml-1">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                    </div>
                                    <div className="pt-2 space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] text-slate-200 font-medium">
                                            <CheckCircle size={12} className="text-blue-500 shrink-0" /> 5 Job Posts / Mo
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-200 font-medium">
                                            <CheckCircle size={12} className="text-blue-500 shrink-0" /> Basic Analytics
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-200 font-medium">
                                            <CheckCircle size={12} className="text-blue-500 shrink-0" /> Email Support
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-blue-500/20">
                                    {subscription?.status === 'active' && derivedPlan === 'basic' ? (
                                        <div className="text-center">
                                            <div className="w-full py-2 bg-blue-500/10 text-blue-500 font-bold rounded-xl text-[9px] uppercase tracking-widest mb-1 border border-blue-500/20">
                                                Active
                                            </div>
                                            {isAutoRenew ? (
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                                    Renews: {new Date(subscription.current_period_end).toLocaleDateString()}
                                                </p>
                                            ) : (
                                                <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider">
                                                    Expires: {new Date(subscription.current_period_end).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleSubscribe('basic')}
                                            disabled={isLoading || (subscription?.status === 'active' && !isAutoRenew)}
                                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-center text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" size={12} /> : subscription?.status === 'active' ? 'Switch to Basic' : 'Get Basic'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Pro Tier ($99) - BEST OFFER */}
                            <div className="bg-gradient-to-b from-emerald-900/20 to-[#0f172a] border border-emerald-500/40 p-5 rounded-[24px] flex flex-col relative overflow-hidden shadow-xl shadow-emerald-900/10 scale-105 z-10">
                                <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500"></div>
                                {subscription?.plan === 'pro' && (
                                    <div className="absolute top-1 right-0 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-xl shadow-lg">
                                        Current
                                    </div>
                                )}
                                <div className="space-y-3 flex-1">
                                    <h4 className="font-black text-lg text-white flex items-center gap-2">
                                        Pro <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[8px] font-bold tracking-wide">BEST OFFER</span>
                                    </h4>
                                    <div className="text-2xl font-black text-emerald-400">
                                        <span className="text-xs text-emerald-600 font-bold mr-0.5">{currencyCode}</span>
                                        {(() => {
                                            let price = pricing.pro;
                                            if (billingCycle === 'yearly') {
                                                price = price * 12 * (1 - pricing.yearlyDiscountPercent / 100);
                                            }
                                            return formatCurrency(price).replace(currencySymbol, '');
                                        })()}
                                        <span className="text-[10px] text-emerald-600/70 font-bold ml-1">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                    </div>
                                    <div className="pt-2 space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] text-slate-200 font-medium">
                                            <CheckCircle size={12} className="text-emerald-500 shrink-0" /> <span className="text-white font-bold">50 Job Posts / Mo</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-200 font-medium">
                                            <CheckCircle size={12} className="text-emerald-500 shrink-0" /> Featured Listings
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-200 font-medium">
                                            <CheckCircle size={12} className="text-emerald-500 shrink-0" /> Advanced Analytics
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-200 font-medium">
                                            <CheckCircle size={12} className="text-emerald-500 shrink-0" /> Priority Support
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-emerald-500/20">
                                    {subscription?.status === 'active' && derivedPlan === 'pro' ? (
                                        <div className="text-center">
                                            <div className="w-full py-2 bg-emerald-500/10 text-emerald-500 font-bold rounded-xl text-[9px] uppercase tracking-widest mb-1 border border-emerald-500/20">
                                                Active
                                            </div>
                                            {isAutoRenew ? (
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                                    Renews: {new Date(subscription.current_period_end).toLocaleDateString()}
                                                </p>
                                            ) : (
                                                <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider">
                                                    Expires: {new Date(subscription.current_period_end).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleSubscribe('pro')}
                                            disabled={isLoading || (subscription?.status === 'active' && !isAutoRenew)}
                                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-xl text-center text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" size={14} /> : subscription?.status === 'active' ? 'Switch to Pro' : 'Get Pro'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Enterprise Tier ($250) */}
                            <div className={`bg-gradient-to-br from-purple-950/20 to-[#0f172a] border p-5 rounded-[24px] flex flex-col relative overflow-hidden transition-colors ${derivedPlan === 'enterprise' ? 'border-purple-500 shadow-2xl shadow-purple-900/10' : 'border-purple-500/20 hover:border-purple-500/40'}`}>
                                {derivedPlan === 'enterprise' && (
                                    <div className="absolute top-0 right-0 bg-purple-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-xl shadow-lg">
                                        Current
                                    </div>
                                )}
                                <div className="space-y-3 flex-1">
                                    <h4 className="font-black text-lg text-white">Enterprise</h4>
                                    <div className="text-2xl font-black text-purple-400">
                                        {(() => {
                                            let price = pricing.enterprise;
                                            if (billingCycle === 'yearly') {
                                                price = price * 12 * (1 - pricing.yearlyDiscountPercent / 100);
                                            }
                                            return formatCurrency(price);
                                        })()}
                                        <span className="text-[10px] text-purple-600/70 font-bold ml-1">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                                    </div>
                                    <div className="pt-2 space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] text-slate-200 font-medium">
                                            <CheckCircle size={12} className="text-purple-500 shrink-0" /> Unlimited Job Posts
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-200 font-medium">
                                            <CheckCircle size={12} className="text-purple-500 shrink-0" /> Full AI & Analytics
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-200 font-medium">
                                            <CheckCircle size={12} className="text-purple-500 shrink-0" /> Voting Rights
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-200 font-medium">
                                            <CheckCircle size={12} className="text-purple-500 shrink-0" /> 24/7 Priority Support
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-purple-500/20">
                                    {subscription?.status === 'active' && derivedPlan === 'enterprise' ? (
                                        <div className="text-center">
                                            <div className="w-full py-2 bg-purple-500/10 text-purple-500 font-bold rounded-xl text-[9px] uppercase tracking-widest mb-1 border border-purple-500/20">
                                                Active
                                            </div>
                                            {isAutoRenew ? (
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                                    Renews: {new Date(subscription.current_period_end).toLocaleDateString()}
                                                </p>
                                            ) : (
                                                <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider">
                                                    Expires: {new Date(subscription.current_period_end).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleSubscribe('enterprise')}
                                            disabled={isLoading || (subscription?.status === 'active' && !isAutoRenew)}
                                            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-center text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-purple-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" size={14} /> : subscription?.status === 'active' ? 'Switch to Enterprise' : 'Get Enterprise'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Payments Removed - Replaced with Auto Renew & Status */}
                        <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[24px] flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <Activity className={isAutoRenew ? "text-emerald-500" : "text-slate-500"} size={20} />
                                    Payment Method: <span className={isAutoRenew ? "text-emerald-400" : "text-amber-400"}>{isAutoRenew ? 'Automatic Payments' : 'Manual Payments'}</span>
                                </h3>
                                <p className="text-slate-400 text-xs mt-1 max-w-lg">
                                    {isAutoRenew
                                        ? "Your subscription renews automatically. Switch to manual to stop future charges."
                                        : "You are on manual payments. Your plan will expire at the end of the term, and you'll need to subscribe again."}
                                </p>
                            </div>

                            {subscription?.status === 'active' && (
                                <button
                                    onClick={handleToggleAutoRenew}
                                    className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 ${isAutoRenew
                                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'}`}
                                >
                                    {isAutoRenew ? 'Switch to Manual' : 'Enable Auto-Renew'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EmployerSettingsPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#020617]"><Loader2 className="text-emerald-500 animate-spin" size={48} /></div>}>
            <SettingsContent />
        </Suspense>
    );
}
