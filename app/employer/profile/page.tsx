"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Building2, Globe, MapPin, Users, Mail, Camera, Trash2, Save, Loader2, PenLine, Check, Copy, ArrowRight, Shield } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

export default function EmployerProfilePage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profile, setProfile] = useState<any>(null);
    const [followerCount, setFollowerCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form state
    const [companyName, setCompanyName] = useState('');
    const [website, setWebsite] = useState('');
    const [email, setEmail] = useState('');
    const [country, setCountry] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [about, setAbout] = useState('');
    const [foundedYear, setFoundedYear] = useState('');

    // Inline Editing State
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingFounded, setIsEditingFounded] = useState(false);
    const [isEditingAbout, setIsEditingAbout] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                const p = data.profile;
                setProfile(p);
                setCompanyName(p?.companyName || '');
                setWebsite(p?.website || '');
                setEmail(p?.email || '');
                setCountry(p?.country || '');
                setCity(p?.city || '');
                setAddress(p?.address || '');
                setLogoUrl(p?.logoUrl || '');
                setAbout(p?.about || '');
                setFoundedYear(p?.foundedYear || '');

                const followRes = await fetch('/api/professional/follow?type=followers');
                if (followRes.ok) {
                    const followData = await followRes.json();
                    setFollowerCount(followData.followers?.length || 0);
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/employer/profile/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyName, website, email, country, city, address, about, foundedYear })
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
            } else {
                const err = await res.json();
                setMessage({ type: 'error', text: err.error || 'Failed to update profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred while saving' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingLogo(true);
        setMessage(null);
        try {
            const res = await fetch(`/api/employer/profile/image?filename=${encodeURIComponent(file.name)}`, {
                method: 'POST',
                body: file
            });
            if (res.ok) {
                const data = await res.json();
                setLogoUrl(data.url);
                setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to upload logo' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred while uploading' });
        } finally {
            setIsUploadingLogo(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleLogoDelete = async () => {
        if (!logoUrl) return;
        setIsUploadingLogo(true);
        setMessage(null);
        try {
            const res = await fetch('/api/employer/profile/image', { method: 'DELETE' });
            if (res.ok) {
                setLogoUrl('');
                setMessage({ type: 'success', text: 'Logo removed successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to remove logo' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred while removing' });
        } finally {
            setIsUploadingLogo(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className={`animate-spin w-8 h-8 border-2 border-t-transparent rounded-full ${isDark ? 'border-white' : 'border-black'}`} />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            {/* Message Banner */}
            {message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? (isDark ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200') : (isDark ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-red-50 text-red-700 border border-red-200')}`}>
                    {message.text}
                </div>
            )}

            {/* Header Card with Logo (Static View) */}
            <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                {/* Cover/Banner */}
                <div className={`h-32 ${isDark ? 'bg-gradient-to-r from-neutral-800 to-neutral-900' : 'bg-gradient-to-r from-neutral-100 to-neutral-200'}`} />

                {/* Logo Section */}
                <div className="px-6 pb-6">
                    <div className="flex items-end gap-4 -mt-12">
                        <div className="relative">
                            <div className={`w-24 h-24 rounded-2xl border-4 overflow-hidden flex items-center justify-center ${isDark ? 'bg-neutral-800 border-neutral-900' : 'bg-white border-white shadow-lg'}`}>
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Building2 size={40} className={isDark ? 'text-neutral-600' : 'text-neutral-400'} />
                                )}
                            </div>
                        </div>
                        <div className="flex-1 pb-2">
                            <div className={`px-4 py-2 rounded-xl inline-block mt-4 font-bold text-lg ${isDark ? 'bg-neutral-800 text-white border border-neutral-700' : 'bg-white text-black border border-neutral-200 shadow-sm'}`}>
                                Pro Plan
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 1. Identity Card */}
            <div className={`p-8 rounded-[40px] ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-neutral-200 shadow-sm'}`}>
                <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Left: Company Logo (Interactive) */}
                    <div className="flex-shrink-0 relative group">
                        <div className={`w-40 h-40 md:w-48 md:h-48 rounded-[2rem] overflow-hidden border-4 flex items-center justify-center bg-white border-white shadow-lg`}>
                            {isUploadingLogo ? (
                                <Loader2 size={32} className="text-neutral-400 animate-spin" />
                            ) : logoUrl ? (
                                <img src={logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
                            ) : (
                                <Building2 size={48} className="text-neutral-300" />
                            )}
                        </div>
                        {/* Upload/Delete overlay */}
                        <div className={`absolute inset-0 rounded-[2rem] flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'bg-black/80' : 'bg-black/60'}`}>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingLogo}
                                className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-md"
                                title="Upload Logo"
                            >
                                <Camera size={20} className="text-white" />
                            </button>
                            {logoUrl && (
                                <button
                                    onClick={handleLogoDelete}
                                    disabled={isUploadingLogo}
                                    className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-md"
                                    title="Remove Logo"
                                >
                                    <Trash2 size={20} className="text-white" />
                                </button>
                            )}
                            <span className="text-white text-xs font-medium">Change Logo</span>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                        />
                    </div>

                    {/* Right: Details */}
                    <div className="flex-1 w-full space-y-6">

                        {/* Name & Founded Section */}
                        <div className="space-y-2">
                            {/* Company Name */}
                            <div className="flex items-center gap-3 group">
                                {isEditingName ? (
                                    <div className="flex gap-2 w-full max-w-md">
                                        <input
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            placeholder="Company Name"
                                            className={`flex-1 px-4 py-2 rounded-xl font-bold text-2xl outline-none border-2 focus:border-blue-500 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-black'}`}
                                            autoFocus
                                        />
                                        <button onClick={() => { handleSaveProfile(); setIsEditingName(false); }} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><Check size={20} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className={`text-4xl md:text-5xl font-black vide-tighter ${isDark ? 'text-white' : 'text-black'}`}>
                                            {companyName || <span className="text-neutral-500 italic text-3xl">Company Name</span>}
                                        </h1>
                                        <button onClick={() => setIsEditingName(true)} className={`opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}>
                                            <PenLine size={24} />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Founded Year */}
                            <div className="flex items-center gap-3 group">
                                {isEditingFounded ? (
                                    <div className="flex gap-2 w-full max-w-sm">
                                        <input
                                            value={foundedYear}
                                            onChange={(e) => setFoundedYear(e.target.value)}
                                            placeholder="Founded Year (e.g. 2023)"
                                            className={`flex-1 px-4 py-2 rounded-xl font-medium text-lg outline-none border-2 focus:border-blue-500 ${isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-300' : 'bg-neutral-50 border-neutral-200 text-neutral-700'}`}
                                            autoFocus
                                        />
                                        <button onClick={() => { handleSaveProfile(); setIsEditingFounded(false); }} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><Check size={18} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <p className={`text-xl font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                            Founded on {foundedYear || '[Year]'}
                                        </p>
                                        <button onClick={() => setIsEditingFounded(true)} className={`opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}>
                                            <PenLine size={18} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className={`h-px w-full ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}></div>

                        {/* Contact Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Work Email</label>
                                <div className={`flex items-center gap-2 font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                    <Mail size={16} /> {email || 'No email provided'}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Website</label>
                                <div className={`flex items-center gap-2 font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                    <Globe size={16} /> {website || 'No website provided'}
                                </div>
                            </div>
                        </div>

                        {/* Profile Link */}
                        <div className="space-y-2">
                            <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Profile Link</label>
                            <div className={`flex items-center p-1.5 rounded-xl border ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                                <div className={`px-3 text-sm truncate flex-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                    https://profcaria.com/c/{companyName.toLowerCase().replace(/ /g, '-')}
                                </div>
                                <button className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-neutral-800 text-white' : 'hover:bg-white text-black shadow-sm'}`}>
                                    <Copy size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Company Stats Button */}
                        <div className="pt-2">
                            <button className={`group flex items-center gap-3 px-6 py-4 rounded-2xl w-full md:w-auto transition-all border ${isDark ? 'bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800 text-white' : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm text-black'}`}>
                                <div className="flex flex-col items-start">
                                    <span className="font-black text-2xl">0</span>
                                    <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Active Jobs</span>
                                </div>
                                <div className={`ml-auto p-2 rounded-full ${isDark ? 'bg-neutral-700 group-hover:bg-neutral-600' : 'bg-neutral-100 group-hover:bg-neutral-200'}`}>
                                    <ArrowRight size={20} />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Analytics Card */}
            <div className={`p-8 rounded-[40px] grid grid-cols-3 gap-4 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <div className="text-center space-y-1">
                    <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{followerCount}</div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Followers</div>
                </div>
                <div className="text-center space-y-1 border-l border-r border-neutral-200/10">
                    <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>0</div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Profile Visits</div>
                </div>
                <div className="text-center space-y-1">
                    <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>0</div>
                    <div className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Job Views</div>
                </div>
            </div>

            {/* 3. About Section */}
            <div className={`p-8 rounded-[40px] space-y-4 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>About</h3>
                    {!isEditingAbout && (
                        <button onClick={() => setIsEditingAbout(true)} className={`p-2 rounded-full ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}><PenLine size={18} /></button>
                    )}
                </div>

                {isEditingAbout ? (
                    <div className="space-y-4">
                        <div className="relative">
                            <textarea
                                value={about}
                                onChange={(e) => {
                                    if (e.target.value.length <= 700) {
                                        setAbout(e.target.value);
                                    }
                                }}
                                className={`w-full h-32 p-4 rounded-2xl outline-none resize-none border-2 focus:border-blue-500 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-black'}`}
                                placeholder="Tell us about your company and culture..."
                                autoFocus
                            />
                            <div className={`absolute bottom-4 right-4 text-xs font-bold ${about.length >= 700 ? 'text-red-500' : isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                {about.length}/700
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsEditingAbout(false)} className={`px-4 py-2 rounded-xl font-bold text-sm ${isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-neutral-500 hover:bg-neutral-100'}`}>Cancel</button>
                            <button onClick={() => { handleSaveProfile(); setIsEditingAbout(false); }} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700">Save About</button>
                        </div>
                    </div>
                ) : (
                    <p className={`leading-relaxed whitespace-pre-wrap ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        {about || 'Share your company background, culture, and key achievements. (Max 700 characters)'}
                    </p>
                )}
            </div>
        </div>
    );
}
