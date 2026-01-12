"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Save, Shield, MapPin, Globe, Activity, Lock, AlertCircle, CheckCircle, Briefcase, Plus, X } from 'lucide-react';

export default function ProfessionalSettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [role, setRole] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState(''); // Read-only

    // Location State (Loaded from latest activity log)
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');

    // Security State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');



    // Preferences State
    const [targetRoleInput, setTargetRoleInput] = useState('');
    const [targetRoles, setTargetRoles] = useState<string[]>([]);
    const [workModes, setWorkModes] = useState<string[]>([]);
    const [employmentTypes, setEmploymentTypes] = useState<string[]>([]);
    const [preferredCountries, setPreferredCountries] = useState<string[]>([]); // Stored in preferred_locations.countries
    const [locationInput, setLocationInput] = useState('');
    const [isOpenToRelocation, setIsOpenToRelocation] = useState(false);

    const [activityLogs, setActivityLogs] = useState<any[]>([]);

    useEffect(() => {
        fetchProfile();
        if (activeTab === 'security') fetchActivityLogs();
        if (activeTab === 'preferences') fetchPreferences();
    }, [activeTab]);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();

                // Profile Data
                if (data.profile) {
                    setFirstName(data.profile.firstName || '');
                    setLastName(data.profile.lastName || '');
                    setRole(data.profile.role || '');
                    setPhone(data.profile.phone || '');

                    // Email - Read from profile
                    setEmail(data.profile.email || '');

                    // Location Data (from latest log)
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
            const res = await fetch('/api/professional/security/activity');
            if (res.ok) {
                const data = await res.json();
                setActivityLogs(data.logs || []);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    };

    const fetchPreferences = async () => {
        try {
            const res = await fetch('/api/professional/preferences');
            if (res.ok) {
                const data = await res.json();
                const p = data.preferences;
                setTargetRoles(p.target_roles || []);
                setWorkModes(p.work_modes || []);
                setEmploymentTypes(p.employment_types || []);
                setIsOpenToRelocation(p.is_open_to_relocation || false);
                // Handle JSONB structure
                if (p.preferred_locations && p.preferred_locations.countries) {
                    setPreferredCountries(p.preferred_locations.countries);
                }
            }
        } catch (error) {
            console.error('Error fetching preferences:', error);
        }
    };

    const handleProfileSave = async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            const res = await fetch('/api/professional/profile/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    role,
                    email,
                    phone,
                    country,
                    city,
                    address
                })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                // If location updated, refresh logs silently if active
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

    const handlePreferencesSave = async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            const res = await fetch('/api/professional/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_roles: targetRoles,
                    work_modes: workModes,
                    employment_types: employmentTypes,
                    is_open_to_relocation: isOpenToRelocation,
                    preferred_locations: {
                        countries: preferredCountries,
                        continents: [] // Could add later
                    }
                })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Preferences saved successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to save preferences.' });
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
            <header className="flex items-center justify-between border-b border-slate-800 pb-8">
                <div className="text-left">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Settings</h1>
                    <p className="text-slate-400 mt-2">Manage your profile, security, and preferences.</p>
                </div>
                {activeTab === 'profile' && (
                    <button
                        onClick={handleProfileSave}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                    >
                        <Save size={18} />
                        <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                )}
                {activeTab === 'preferences' && (
                    <button
                        onClick={handlePreferencesSave}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-purple-600/20 active:scale-95 disabled:opacity-50"
                    >
                        <Save size={18} />
                        <span>{isLoading ? 'Saving...' : 'Save Preferences'}</span>
                    </button>
                )}
            </header>

            {/* Tabs */}
            <div className="flex space-x-2 bg-slate-900/50 p-1 rounded-xl w-fit border border-slate-800">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <User size={16} /> Profile
                </button>
                <button
                    onClick={() => setActiveTab('preferences')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'preferences' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Briefcase size={16} /> Job Preferences
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'security' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Shield size={16} /> Security
                </button>
            </div>

            {/* Save Button for Preferences Tab moved here if strictly per tab, 
                or we can change the header button to be dynamic based on activeTab.
                Currently header button only shows for 'profile'. Let's add for preferences.
            */}


            {message && (
                <div className={`p-4 rounded-2xl text-center font-bold text-sm animate-in fade-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {message.text}
                </div>
            )}


            {activeTab === 'preferences' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Target Roles */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Briefcase className="text-purple-500" size={24} /> Target Roles
                            </h3>
                            <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[32px] space-y-4">
                                <p className="text-xs text-slate-400">Add titles you are interested in (e.g. "Frontend Developer", "Product Manager").</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={targetRoleInput}
                                        onChange={(e) => setTargetRoleInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && targetRoleInput) {
                                                setTargetRoles([...targetRoles, targetRoleInput]);
                                                setTargetRoleInput('');
                                            }
                                        }}
                                        placeholder="Type role and hit Enter..."
                                        className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-bold"
                                    />
                                    <button
                                        onClick={() => {
                                            if (targetRoleInput) {
                                                setTargetRoles([...targetRoles, targetRoleInput]);
                                                setTargetRoleInput('');
                                            }
                                        }}
                                        className="px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {targetRoles.map((role, i) => (
                                        <div key={i} className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-bold border border-purple-500/20">
                                            {role}
                                            <button onClick={() => setTargetRoles(targetRoles.filter((_, idx) => idx !== i))} className="hover:text-white"><X size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Locations */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Globe className="text-purple-500" size={24} /> Preferred Locations
                            </h3>
                            <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[32px] space-y-4">
                                <p className="text-xs text-slate-400">Where would you like to work? (Countries)</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={locationInput}
                                        onChange={(e) => setLocationInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && locationInput) {
                                                setPreferredCountries([...preferredCountries, locationInput]);
                                                setLocationInput('');
                                            }
                                        }}
                                        placeholder="Type country and hit Enter... (e.g. USA, UK)"
                                        className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-bold"
                                    />
                                    <button
                                        onClick={() => {
                                            if (locationInput) {
                                                setPreferredCountries([...preferredCountries, locationInput]);
                                                setLocationInput('');
                                            }
                                        }}
                                        className="px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {preferredCountries.map((c, i) => (
                                        <div key={i} className="flex items-center gap-2 px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-bold border border-slate-700">
                                            {c}
                                            <button onClick={() => setPreferredCountries(preferredCountries.filter((_, idx) => idx !== i))} className="hover:text-white"><X size={12} /></button>
                                        </div>
                                    ))}
                                </div>

                                <label className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl cursor-pointer hover:bg-slate-900 transition-all">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isOpenToRelocation ? 'bg-purple-600 border-purple-600' : 'border-slate-600'}`}>
                                        {isOpenToRelocation && <CheckCircle size={14} className="text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={isOpenToRelocation}
                                        onChange={(e) => setIsOpenToRelocation(e.target.checked)}
                                        className="hidden"
                                    />
                                    <span className="text-sm font-bold text-slate-300">I am open to relocation</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Work Mode */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Activity className="text-purple-500" size={24} /> Work Mode
                            </h3>
                            <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[32px] space-y-2">
                                {['remote', 'onsite', 'hybrid'].map((mode) => (
                                    <label key={mode} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl cursor-pointer hover:bg-slate-900 transition-all group">
                                        <span className="font-bold text-slate-300 capitalize group-hover:text-white transition-colors">{mode}</span>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${workModes.includes(mode) ? 'bg-purple-600 border-purple-600' : 'border-slate-600'}`}>
                                            {workModes.includes(mode) && <CheckCircle size={14} className="text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={workModes.includes(mode)}
                                            onChange={(e) => {
                                                if (e.target.checked) setWorkModes([...workModes, mode]);
                                                else setWorkModes(workModes.filter(m => m !== mode));
                                            }}
                                            className="hidden"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Employment Type */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Briefcase className="text-purple-500" size={24} /> Employment Type
                            </h3>
                            <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[32px] space-y-2">
                                {['full-time', 'part-time', 'contract', 'internship'].map((type) => (
                                    <label key={type} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl cursor-pointer hover:bg-slate-900 transition-all group">
                                        <span className="font-bold text-slate-300 capitalize group-hover:text-white transition-colors">{type}</span>
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${employmentTypes.includes(type) ? 'bg-purple-600 border-purple-600' : 'border-slate-600'}`}>
                                            {employmentTypes.includes(type) && <CheckCircle size={14} className="text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={employmentTypes.includes(type)}
                                            onChange={(e) => {
                                                if (e.target.checked) setEmploymentTypes([...employmentTypes, type]);
                                                else setEmploymentTypes(employmentTypes.filter(t => t !== type));
                                            }}
                                            className="hidden"
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'profile' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    {/* Personal Info */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <User className="text-blue-500" size={24} /> Personal Info
                        </h3>
                        <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[32px] space-y-4">
                            <div className="grid grid-cols-2 gap-4">
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
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone Number</label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Professional Info */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <MapPin className="text-blue-500" size={24} /> Location & Role
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Globe size={12} /> Country <span className="text-emerald-500 text-[8px] bg-emerald-500/10 px-1 rounded ml-auto">AUTO-DETECTED</span></label>
                                    <input
                                        type="text"
                                        value={country}
                                        readOnly
                                        className="w-full bg-slate-900/20 border border-slate-800/50 rounded-xl px-4 py-3 text-slate-400 cursor-not-allowed font-bold focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">City <span className="text-emerald-500 text-[8px] bg-emerald-500/10 px-1 rounded ml-auto">AUTO-DETECTED</span></label>
                                    <input
                                        type="text"
                                        value={city}
                                        readOnly
                                        className="w-full bg-slate-900/20 border border-slate-800/50 rounded-xl px-4 py-3 text-slate-400 cursor-not-allowed font-bold focus:outline-none"
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-600 italic mt-2 flex items-center gap-1.5"><Shield size={10} /> Location is securely verified via your connection info.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">


                    {/* Password Change */}
                    <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[32px] space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Lock className="text-emerald-500" size={24} /> Change Password
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Password</label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handlePasswordChange}
                                disabled={isLoading || !currentPassword || !newPassword}
                                className="px-6 py-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-xl font-bold text-sm border border-emerald-500/20 transition-all"
                            >
                                Update Password
                            </button>
                        </div>
                    </div>

                    {/* Activity Logs */}
                    <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[32px] space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Activity className="text-emerald-500" size={24} /> Activity Log
                        </h3>
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
                                    {activityLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center italic text-slate-600">No activity logs found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
