"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Save, DollarSign, Briefcase } from 'lucide-react';

export default function ProfessionalSettingsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [role, setRole] = useState('');
    const [salaryExpectation, setSalaryExpectation] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.profile) {
                    setFirstName(data.profile.firstName || '');
                    setLastName(data.profile.lastName || '');
                    setRole(data.profile.role || '');
                    setSalaryExpectation(data.profile.salaryExpectation || '');
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        setMessage('');
        try {
            const res = await fetch('/api/professional/profile/update', { // Assuming this endpoint exists or needs to be created/updated
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    role,
                    salaryExpectation
                })
            });

            if (res.ok) {
                setMessage('Profile updated successfully!');
            } else {
                setMessage('Failed to update profile.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage('An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 pb-32">
            <header className="flex items-center justify-between border-b border-slate-800 pb-8">
                <div className="text-left">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Settings</h1>
                    <p className="text-slate-400 mt-2">Manage your profile details and preferences.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                >
                    <Save size={18} />
                    <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                </button>
            </header>

            {message && (
                <div className={`p-4 rounded-2xl text-center font-bold text-sm ${message.includes('success') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Info */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="text-blue-500" size={24} /> Personal Info
                    </h3>
                    <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[32px] space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">First Name</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Last Name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                            />
                        </div>
                    </div>
                </div>

                {/* Professional Info */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Briefcase className="text-blue-500" size={24} /> Professional Info
                    </h3>
                    <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[32px] space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Primary Role Title</label>
                            <input
                                type="text"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                placeholder="e.g. Senior Frontend Engineer"
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <DollarSign size={12} /> Salary Expectation
                            </label>
                            <input
                                type="text"
                                value={salaryExpectation}
                                onChange={(e) => setSalaryExpectation(e.target.value)}
                                placeholder="e.g. $120,000/year or $60/hr"
                                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                            />
                            <p className="text-[10px] text-slate-500 font-medium">This will be visible to employers viewing your profile.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
