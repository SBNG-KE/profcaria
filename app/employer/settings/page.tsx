"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Save, Shield, MapPin, Globe, Activity, Lock, CheckCircle, CreditCard, LayoutDashboard, Loader2 } from 'lucide-react';

function SettingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

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

    // MFA State
    const [hasTotp, setHasTotp] = useState(false);
    const [hasPasskey, setHasPasskey] = useState(false);

    const [activityLogs, setActivityLogs] = useState<any[]>([]);

    // Billing State
    const [subscription, setSubscription] = useState<any | null>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [exchangeRate, setExchangeRate] = useState<number>(1);

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

                if (data.security) {
                    setHasTotp(data.security.hasTotp || false);
                    setHasPasskey(data.security.hasPasskey || false);
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
                setPayments(data.payments);
                if (data.exchangeRate) setExchangeRate(data.exchangeRate);
            }
        } catch (error) {
            console.error('Error fetching billing:', error);
        }
    };

    const handleSubscribe = async (plan: 'pro' | 'enterprise') => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/payments/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan })
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

    const handleDisableMFA = async (method: 'totp' | 'passkey') => {
        try {
            const res = await fetch('/api/employer/security/mfa', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'disable', method })
            });
            if (res.ok) {
                if (method === 'totp') setHasTotp(false);
                if (method === 'passkey') setHasPasskey(false);
                setMessage({ type: 'success', text: `MFA Method (${method}) Disabled.` });
                fetchActivityLogs();
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Currency Formatter
    const formatCurrency = (usdAmount: number) => {
        if (exchangeRate === 1) return `$${usdAmount}`;
        // Approx conversion logic for display
        const converted = Math.round(usdAmount * exchangeRate);
        // We can just show generic symbol or assume KES/ZAR etc based on deployment context, 
        // but for now let's just show the number with a note.
        // Or better: "KES 3,225"
        return `${new Intl.NumberFormat().format(converted)}`;
    };

    const currencyCode = exchangeRate === 1 ? 'USD' : (exchangeRate > 100 ? 'KES' : 'ZAR'); // Simple heuristic for now or generic

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
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Globe size={12} /> Country</label>
                                    <input
                                        type="text"
                                        value={country}
                                        onChange={(e) => setCountry(e.target.value)}
                                        placeholder="e.g. USA"
                                        className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">City</label>
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
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Office Address</label>
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
                    {/* MFA Settings */}
                    <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[32px] space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Shield className="text-blue-500" size={24} /> Multi-Factor Authentication
                        </h3>
                        <div className="space-y-4">
                            {/* Email */}
                            <div className="flex items-center justify-between p-4 bg-slate-900/30 rounded-xl border border-slate-800">
                                <div>
                                    <h4 className="font-bold text-white">Email Authentication</h4>
                                    <p className="text-xs text-slate-400">Security code sent to your work email.</p>
                                </div>
                                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold border border-green-500/20">Active</span>
                            </div>

                            {/* Passkey */}
                            <div className="flex items-center justify-between p-4 bg-slate-900/30 rounded-xl border border-slate-800">
                                <div>
                                    <h4 className="font-bold text-white">Passkeys (Biometrics)</h4>
                                    <p className="text-xs text-slate-400">TouchID, FaceID, or Windows Hello.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {hasPasskey ? (
                                        <>
                                            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1"><CheckCircle size={12} /> Enabled</span>
                                            <button onClick={() => handleDisableMFA('passkey')} className="text-xs text-red-400 underline hover:text-red-300">Turn Off</button>
                                        </>
                                    ) : (
                                        <span className="text-xs font-bold text-slate-500">Disabled</span>
                                    )}
                                </div>
                            </div>

                            {/* TOTP */}
                            <div className="flex items-center justify-between p-4 bg-slate-900/30 rounded-xl border border-slate-800">
                                <div>
                                    <h4 className="font-bold text-white">Authenticator App (TOTP)</h4>
                                    <p className="text-xs text-slate-400">Google Authenticator or Authy.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {hasTotp ? (
                                        <>
                                            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1"><CheckCircle size={12} /> Enabled</span>
                                            <button onClick={() => handleDisableMFA('totp')} className="text-xs text-red-400 underline hover:text-red-300">Turn Off</button>
                                        </>
                                    ) : (
                                        <span className="text-xs font-bold text-slate-500">Disabled</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

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
                    <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[32px] space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <CreditCard className="text-purple-500" size={24} /> Billing & Subscription
                        </h3>

                        {exchangeRate > 1 && (
                            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex items-center gap-3 text-xs text-slate-400">
                                <Activity size={16} />
                                <span>Prices are converted from USD and may vary slightly depending on current economic exchange rates.</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Free Tier Card */}
                            <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[32px] flex flex-col relative overflow-hidden group hover:border-slate-700 transition-colors">
                                <div className="space-y-4 flex-1">
                                    <h4 className="font-black text-2xl text-white">Free</h4>
                                    <div className="text-4xl font-black text-slate-500">{currencyCode} 0<span className="text-sm text-slate-600 font-bold ml-1">/mo</span></div>
                                    <div className="pt-4 space-y-3">
                                        <div className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                                            <CheckCircle size={16} className="text-slate-500" /> 1 Active Job Post
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                                            <CheckCircle size={16} className="text-slate-500" /> Basic Search
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                                            <CheckCircle size={16} className="text-slate-500" /> Standard Support
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 pt-8 border-t border-slate-800">
                                    {!subscription ? (
                                        <div className="w-full py-3 bg-slate-800 text-slate-400 font-bold rounded-xl text-center text-xs uppercase tracking-widest cursor-default">
                                            Current Plan
                                        </div>
                                    ) : (
                                        <div className="w-full py-3 bg-transparent text-slate-600 font-bold rounded-xl text-center text-xs uppercase tracking-widest cursor-default">
                                            Included
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pro Tier Card */}
                            <div className="bg-slate-900/20 border border-emerald-500/20 p-8 rounded-[32px] flex flex-col relative overflow-hidden shadow-lg shadow-emerald-900/5">
                                {subscription?.plan === 'pro' && (
                                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-lg">
                                        Current
                                    </div>
                                )}
                                <div className="space-y-4 flex-1">
                                    <h4 className="font-black text-2xl text-white">Pro</h4>
                                    <div className="text-4xl font-black text-emerald-400">
                                        <span className="text-lg text-emerald-600 font-bold mr-1">{currencyCode}</span>
                                        {formatCurrency(25)}
                                        <span className="text-sm text-emerald-600/70 font-bold ml-1">/mo</span>
                                    </div>
                                    <div className="pt-4 space-y-3">
                                        <div className="flex items-center gap-3 text-sm text-slate-200 font-medium">
                                            <CheckCircle size={16} className="text-emerald-500 shrink-0" /> 5 Job Posts / Mo
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-200 font-medium">
                                            <CheckCircle size={16} className="text-emerald-500 shrink-0" /> Featured Listings
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-200 font-medium">
                                            <CheckCircle size={16} className="text-emerald-500 shrink-0" /> Partial Analytics
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 pt-8 border-t border-emerald-500/20">
                                    {subscription?.status === 'active' && subscription.plan === 'pro' ? (
                                        <button onClick={handlePortal} className="w-full py-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest">
                                            Manage Subscription
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleSubscribe('pro')}
                                            disabled={isLoading}
                                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-xl text-center text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Upgrade to Pro'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Enterprise Tier Card */}
                            <div className="bg-gradient-to-br from-purple-950/20 to-[#0f172a] border border-purple-500/20 p-8 rounded-[32px] flex flex-col relative overflow-hidden shadow-2xl shadow-purple-900/10">
                                {subscription?.plan === 'enterprise' && (
                                    <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-lg">
                                        Current
                                    </div>
                                )}
                                <div className="space-y-4 flex-1">
                                    <h4 className="font-black text-2xl text-white flex items-center gap-2">
                                        Enterprise <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px] border border-purple-500/20">BEST VALUE</span>
                                    </h4>
                                    <div className="text-4xl font-black text-purple-400">
                                        <span className="text-lg text-purple-600 font-bold mr-1">{currencyCode}</span>
                                        {formatCurrency(145)}
                                        <span className="text-sm text-purple-600/70 font-bold ml-1">/mo</span>
                                    </div>
                                    <div className="pt-4 space-y-3">
                                        <div className="flex items-center gap-3 text-sm text-slate-200 font-medium">
                                            <CheckCircle size={16} className="text-purple-500 shrink-0" /> Unlimited Job Posts
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-200 font-medium">
                                            <CheckCircle size={16} className="text-purple-500 shrink-0" /> Full AI & Analytics
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-200 font-medium">
                                            <CheckCircle size={16} className="text-purple-500 shrink-0" /> Pause Subscription
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-200 font-medium">
                                            <CheckCircle size={16} className="text-purple-500 shrink-0" /> Voting Rights
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-slate-200 font-medium">
                                            <CheckCircle size={16} className="text-purple-500 shrink-0" /> 24/7 Priority Support
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 pt-8 border-t border-purple-500/20">
                                    {subscription?.status === 'active' && subscription.plan === 'enterprise' ? (
                                        <button onClick={handlePortal} className="w-full py-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest">
                                            Manage Subscription
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleSubscribe('enterprise')}
                                            disabled={isLoading}
                                            className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-center text-xs uppercase tracking-widest transition-all shadow-lg shadow-purple-600/20 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Get Enterprise'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invoices */}
                    <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[32px] space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            Recent Payments
                        </h3>
                        {payments.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 text-sm">No payment history found.</div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-slate-800">
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="bg-slate-900 text-slate-200 font-bold uppercase text-xs tracking-wider">
                                        <tr>
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Amount</th>
                                            <th className="p-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {payments.map((payment, i) => (
                                            <tr key={payment.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="p-4">{new Date(payment.created_at).toLocaleDateString()}</td>
                                                <td className="p-4 font-mono font-bold text-white">${(payment.amount / 100).toFixed(2)}</td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase rounded-md border border-emerald-500/20">
                                                        {payment.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
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
