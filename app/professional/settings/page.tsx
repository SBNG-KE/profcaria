"use client"

import React, { useState, useEffect } from 'react';
import { Shield, Activity, Lock, AlertCircle, CheckCircle, CreditCard, Clock } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

export default function ProfessionalSettingsPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState<'security' | 'billing'>('security');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Security State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [activityLogs, setActivityLogs] = useState<any[]>([]);

    useEffect(() => {
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
            console.error('Error fetching logs:', error);
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
            const res = await fetch('/api/professional/security/password', {
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
                    {/* Password Change */}
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

                    {/* Activity Logs */}
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
                    {/* Billing Placeholder */}
                    <div className={`border p-8 rounded-[32px] space-y-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                            <CreditCard className="text-emerald-500" size={24} /> Billing & Subscription
                        </h3>
                        <div className={`p-12 rounded-2xl border-2 border-dashed text-center ${isDark ? 'border-neutral-700 bg-neutral-900/30' : 'border-neutral-300 bg-neutral-50'}`}>
                            <CreditCard size={48} className={`mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-neutral-300'}`} />
                            <p className={`font-bold text-lg ${isDark ? 'text-slate-400' : 'text-neutral-500'}`}>Billing Coming Soon</p>
                            <p className={`text-sm mt-2 ${isDark ? 'text-slate-600' : 'text-neutral-400'}`}>Manage your subscription and payment methods here.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
