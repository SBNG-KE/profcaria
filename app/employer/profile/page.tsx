"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Building2, Globe, MapPin, Users, Mail, Camera, Trash2, Save, Loader2, PenLine, Check, Copy, ArrowRight, Shield, Move, Link2, Plus, X } from 'lucide-react';
import LinkPreview from '@/app/components/LinkPreview';
import ProfileAnalytics from '@/app/components/professional/ProfileAnalytics'; // Reuse analytics
import EmployerAnalytics from '@/app/components/employer/EmployerAnalytics';
import CompanyPostsSection from '@/app/components/company/CompanyPostsSection';
import PostsPreview from '@/app/components/professional/PostsPreview';
import PostCard from '@/app/components/professional/PostCard';
import SlideOverPanel from '@/app/components/ui/SlideOverPanel';
import SubscribersModal from './SubscribersModal';
import { useTheme } from '@/app/context/ThemeContext';

export default function EmployerProfilePage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profile, setProfile] = useState<any>(null);
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
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [isEditingWebsite, setIsEditingWebsite] = useState(false);

    // Image Positioning State
    const [imagePosition, setImagePosition] = useState<string>('50% 50%');
    const [isRepositioning, setIsRepositioning] = useState(false);
    const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    // Initialize position from profile data if legacy keywords are used
    useEffect(() => {
        if (profile?.imagePosition) {
            const pos = profile.imagePosition;
            if (pos === 'center') setImagePosition('50% 50%');
            else if (pos === 'top') setImagePosition('50% 0%');
            else if (pos === 'bottom') setImagePosition('50% 100%');
            else setImagePosition(pos);
        }
    }, [profile]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isRepositioning) return;
        e.preventDefault();
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    // Global Drag Logic
    useEffect(() => {
        if (!isRepositioning || !dragStart) return;

        const handleWindowMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - dragStart.x;
            const deltaY = e.clientY - dragStart.y;

            const sensitivity = 0.2;

            // Get current with fallback
            let [currentX, currentY] = [50, 50];
            try {
                const parts = imagePosition.split(' ');
                if (parts.length === 2 && parts[0].endsWith('%')) {
                    currentX = parseFloat(parts[0]);
                    currentY = parseFloat(parts[1]);
                }
            } catch (error) { }

            let newX = currentX - (deltaX * sensitivity);
            let newY = currentY - (deltaY * sensitivity);

            // Clamp
            newX = Math.max(0, Math.min(100, newX));
            newY = Math.max(0, Math.min(100, newY));

            setImagePosition(`${newX.toFixed(1)}% ${newY.toFixed(1)}%`);
            setDragStart({ x: e.clientX, y: e.clientY });
        };

        const handleWindowMouseUp = () => {
            setDragStart(null);
        };

        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [isRepositioning, dragStart, imagePosition]);

    // Other Profiles State
    const [otherProfiles, setOtherProfiles] = useState<any[]>([]);
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
    const [sectionLoading, setSectionLoading] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [isSubscribersModalOpen, setIsSubscribersModalOpen] = useState(false);
    const [postCount, setPostCount] = useState(0);

    const [industry, setIndustry] = useState('');
    const [isEditingIndustry, setIsEditingIndustry] = useState(false);

    // List of Industries
    const INDUSTRIES = [
        "Technology", "Software", "Hardware", "Telecommunications", "Financial Services", "Banking", "Insurance", "FinTech",
        "Healthcare", "Biotech", "Pharmaceuticals", "Medical Devices", "Education", "EdTech", "Higher Education",
        "Retail", "E-commerce", "Consumer Goods", "Manufacturing", "Automotive", "Aerospace", "Energy", "Oil & Gas",
        "Renewables", "Construction", "Real Estate", "Media", "Entertainment", "Gaming", "Advertising", "Marketing",
        "Hospitality", "Travel", "Food & Beverage", "Agriculture", "Logistics", "Supply Chain", "Transportation",
        "Consulting", "Professional Services", "Legal", "Non-Profit", "Government", "Other"
    ];

    const openEditIndustry = () => setIsEditingIndustry(true);

    const handleCopyLink = () => {
        const link = `https://profcaria.com/c/${companyName.toLowerCase().replace(/ /g, '-')}`;
        navigator.clipboard.writeText(link);
        setMessage({ type: 'success', text: 'Profile link copied!' });
        setTimeout(() => setMessage(null), 3000);
    };

    const fetchPostCount = async () => {
        try {
            const res = await fetch('/api/employer/posts');
            if (res.ok) {
                const data = await res.json();
                setPostCount(data.posts?.length || 0); // Simple count for now
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchProfile();
        fetchPostCount();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                const p = { ...data.profile, id: data.id };
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
                setIndustry(p?.industry || '');
                // Load persisted position
                setImagePosition(p?.imagePosition || 'center');



                // Fetch Other Profiles
                const otherRes = await fetch('/api/employer/profile/other-profiles');
                if (otherRes.ok) {
                    const { data: others } = await otherRes.json();
                    setOtherProfiles(others || []);
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    };
    // ... saving logic ...


    const handleSaveProfile = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/employer/profile/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyName, website, email, country, city, address, about, foundedYear, imagePosition, industry })
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

    // Auto-save image position when it changes
    useEffect(() => {
        if (profile) { // Only if profile loaded
            // Debounce or just relying on user to click save?
            // User said "not working", maybe they want it to save immediately?
            // I'll leave it to manual save for now but make sure it loads correctly.
        }
    }, [imagePosition]);

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
        if (!confirm("Are you sure you want to remove your company logo?")) return;

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

    // --- SECTION HANDLERS ---
    const openAddSection = (section: string) => {
        setActiveSection(section);
        setEditingItem(null);
        setFormData({});
        setIsSlideOverOpen(true);
    };

    const openEditSection = (section: string, item: any) => {
        setActiveSection(section);
        setEditingItem(item);
        setFormData(item);
        setIsSlideOverOpen(true);
    };

    const handleSaveSection = async (data: any) => {
        setSectionLoading(true);
        try {
            const method = editingItem ? 'PUT' : 'POST';
            const body = editingItem ? { ...data, id: editingItem.id } : data;

            const res = await fetch('/api/employer/profile/other-profiles', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Saved successfully!' });
                setIsSlideOverOpen(false);
                // Refresh
                const otherRes = await fetch('/api/employer/profile/other-profiles');
                if (otherRes.ok) {
                    const { data: others } = await otherRes.json();
                    setOtherProfiles(others || []);
                }
            } else {
                const err = await res.json();
                setMessage({ type: 'error', text: err.error || 'Failed to save' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Error saving data' });
        } finally {
            setSectionLoading(false);
        }
    };

    const handleDeleteSection = async (id: string) => {
        if (!confirm('Are you sure you want to remove this profile link?')) return;
        setSectionLoading(true);
        try {
            const res = await fetch(`/api/employer/profile/other-profiles?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Deleted successfully!' });
                // Refresh
                const otherRes = await fetch('/api/employer/profile/other-profiles');
                if (otherRes.ok) {
                    const { data: others } = await otherRes.json();
                    setOtherProfiles(others || []);
                }
            } else {
                setMessage({ type: 'error', text: 'Failed to delete' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Error deleting data' });
        } finally {
            setSectionLoading(false);
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
                            {/* Space for future badges or empty */}
                        </div>
                    </div>
                </div>
            </div>

            {/* 1. Identity Card */}
            <div className={`p-8 rounded-[40px] ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Left: Company Logo (Interactive) */}
                    <div className="flex-shrink-0 relative group">
                        <div className={`w-40 h-40 md:w-48 md:h-48 rounded-[2rem] overflow-hidden border-4 flex items-center justify-center bg-white border-white shadow-lg ${isRepositioning ? 'cursor-move ring-4 ring-blue-500 ring-offset-2' : ''}`}>
                            {isUploadingLogo ? (
                                <Loader2 size={32} className="text-neutral-400 animate-spin" />
                            ) : logoUrl ? (
                                <img
                                    ref={imageRef}
                                    src={logoUrl}
                                    alt="Company Logo"
                                    className={`w-full h-full object-cover transition-none select-none ${isRepositioning ? '' : 'transition-all duration-300'}`}
                                    style={{ objectPosition: imagePosition }}
                                    onMouseDown={handleMouseDown}
                                    draggable={false}
                                />
                            ) : (
                                <Building2 size={48} className="text-neutral-300" />
                            )}
                        </div>
                        {/* Upload/Delete/Align overlay */}
                        <div className={`absolute inset-0 rounded-[2rem] flex flex-col items-center justify-center gap-2 transition-opacity ${isRepositioning ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'} ${isDark ? 'bg-black/80' : 'bg-black/60'}`}>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingLogo}
                                    className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-md"
                                    title="Upload Logo"
                                >
                                    <Camera size={20} className="text-white" />
                                </button>
                                {logoUrl && (
                                    <>
                                        <button
                                            onClick={() => setIsRepositioning(true)}
                                            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-md"
                                            title="Reposition Image"
                                        >
                                            <Move size={20} className="text-white" />
                                        </button>
                                        <button
                                            onClick={handleLogoDelete}
                                            disabled={isUploadingLogo}
                                            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors backdrop-blur-md"
                                            title="Remove Logo"
                                        >
                                            <Trash2 size={20} className="text-white" />
                                        </button>
                                    </>
                                )}
                            </div>
                            <span className="text-white text-xs font-medium">Change Logo</span>
                        </div>
                        {isRepositioning && (
                            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-2 z-50">
                                <button
                                    onClick={() => { setIsRepositioning(false); handleSaveProfile(); }}
                                    className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                                    title="Save Position"
                                >
                                    <Check size={20} />
                                </button>
                                <button
                                    onClick={() => { setIsRepositioning(false); fetchProfile(); }}
                                    className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all active:scale-95"
                                    title="Cancel"
                                >
                                    <X size={20} />
                                </button>
                            </div>
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
                                            Founded {foundedYear || '[Year]'}
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
                            {/* Email */}
                            <div className="space-y-1 group">
                                <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Work Email</label>
                                {isEditingEmail ? (
                                    <div className="flex gap-2">
                                        <input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="shared@company.com"
                                            className={`flex-1 px-3 py-1.5 rounded-lg font-medium outline-none border focus:border-blue-500 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-black'}`}
                                            autoFocus
                                        />
                                        <button onClick={() => { handleSaveProfile(); setIsEditingEmail(false); }} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Check size={16} /></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className={`flex items-center gap-2 font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                            <Mail size={16} /> {email || 'No email provided'}
                                        </div>
                                        <button onClick={() => setIsEditingEmail(true)} className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}>
                                            <PenLine size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Website */}
                            <div className="space-y-1 group">
                                <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Website</label>
                                {isEditingWebsite ? (
                                    <div className="flex gap-2">
                                        <input
                                            value={website}
                                            onChange={(e) => setWebsite(e.target.value)}
                                            placeholder="https://company.com"
                                            className={`flex-1 px-3 py-1.5 rounded-lg font-medium outline-none border focus:border-blue-500 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-black'}`}
                                            autoFocus
                                        />
                                        <button onClick={() => { handleSaveProfile(); setIsEditingWebsite(false); }} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Check size={16} /></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className={`flex items-center gap-2 font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                            <Globe size={16} /> {website || 'No website provided'}
                                        </div>
                                        <button onClick={() => setIsEditingWebsite(true)} className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}>
                                            <PenLine size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile Link */}
                        <div className="space-y-2">
                            <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Profile Link</label>
                            <div className={`flex items-center p-1.5 rounded-xl border ${isDark ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                                <div className={`px-3 text-sm truncate flex-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                    https://profcaria.com/c/{companyName.toLowerCase().replace(/ /g, '-')}
                                </div>
                                <button
                                    onClick={handleCopyLink}
                                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-neutral-800 text-white' : 'hover:bg-white text-black shadow-sm'}`}
                                >
                                    <Copy size={16} />
                                </button>
                            </div>
                        </div>


                    </div>
                </div>
            </div>



            {/* 2. Analytics System */}
            <EmployerAnalytics isDark={isDark} />


            {/* 3. Posts Section */}
            <div className="pt-4">
                <CompanyPostsSection
                    companyId={profile?.id}
                    latestPost={null} // Will fetch automatically
                />
            </div>



            <SubscribersModal
                isOpen={isSubscribersModalOpen}
                onClose={() => setIsSubscribersModalOpen(false)}
            />

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

            {/* 4. Other Profiles */}
            <div className={`p-8 rounded-[40px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                        <Link2 size={20} /> Other Profiles
                    </h3>
                    <button onClick={() => openAddSection('other_profiles')} className={`p-2 rounded-full ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}>
                        <Plus size={20} />
                    </button>
                </div>
                <div className="space-y-4">
                    {otherProfiles.length === 0 && <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>No other profiles linked. Add your LinkedIn, GitHub, or other social links.</p>}
                    {otherProfiles.map((prof) => (
                        <div key={prof.id} className={`group flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200'}`}>
                            <div className="flex items-center gap-4">
                                <Link2 size={20} className={isDark ? 'text-neutral-400' : 'text-neutral-500'} />
                                <div>
                                    <h4 className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{prof.network}</h4>
                                    <a href={prof.url} target="_blank" rel="noopener noreferrer" className={`text-sm hover:underline ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{prof.url}</a>
                                </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button onClick={() => openEditSection('other_profiles', prof)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}><PenLine size={16} /></button>
                                <button onClick={() => handleDeleteSection(prof.id)} className={`p-2 rounded-lg text-red-500 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Slide Over Panel */}
            <SlideOverPanel
                isOpen={isSlideOverOpen}
                onClose={() => setIsSlideOverOpen(false)}
                title={editingItem ? `Edit Profile Link` : `Add Profile Link`}
                isDark={isDark}
            >
                <div className="space-y-4">
                    <div>
                        <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Network / Platform</label>
                        <input
                            className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-black'}`}
                            value={formData.network || ''}
                            onChange={e => setFormData({ ...formData, network: e.target.value })}
                            placeholder="LinkedIn, X, GitHub..."
                        />
                    </div>
                    <div>
                        <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>URL</label>
                        <input
                            className={`w-full p-3 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-black'}`}
                            value={formData.url || ''}
                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>
                    <div>
                        <label className={`text-xs font-bold uppercase ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Description (Optional)</label>
                        <textarea
                            className={`w-full p-3 h-24 rounded-xl border mt-1 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-black'}`}
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description..."
                        />
                    </div>
                    <div className="pt-4">
                        <button
                            onClick={() => handleSaveSection(formData)}
                            disabled={sectionLoading}
                            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50"
                        >
                            {sectionLoading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </SlideOverPanel>
        </div >
    );
}
