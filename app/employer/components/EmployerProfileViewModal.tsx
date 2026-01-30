"use client"

import React, { useState, useEffect } from 'react';
import {
    X, UserCircle, Briefcase, Mail, FileText,
    Download, User, Building2, GraduationCap,
    BadgeCheck, Phone, MapPin, Award, Globe,
    BookOpen, Linkedin, Github, Copy, Check, Twitter
} from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize';
import { useTheme } from '@/app/context/ThemeContext';

interface ProfileData {
    profile: {
        id: string;
        firstName: string;
        lastName: string;
        role: string;
        profileImageUrl?: string;
        email: string;
        phone?: string;
        about?: string;
        country?: string;
        city?: string;
    };
    sharedDocuments: {
        type: string;
        content: string;
        lastUpdated: string;
    }[];
    sections?: {
        employmentHistory: any[];
        education: any[];
        skills: any[];
        certifications: any[];
        awards: any[];
        otherProfiles: any[];
    }
}

export default function EmployerProfileViewModal({
    applicationId,
    onClose
}: {
    applicationId: string,
    onClose: () => void
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [data, setData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'documents'>('profile');
    const [activeDocumentType, setActiveDocumentType] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const getProfileIcon = (platform: string) => {
        const p = platform?.toLowerCase() || '';
        if (p.includes('linkedin')) return <Linkedin size={18} />;
        if (p.includes('github')) return <Github size={18} />;
        if (p.includes('twitter') || p.includes('x')) return <Twitter size={18} />;
        return <Globe size={18} />;
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`/api/employer/applications/${applicationId}/profile`);
                if (res.ok) {
                    const profileData = await res.json();
                    setData(profileData);
                    if (profileData.sharedDocuments.length > 0) {
                        setActiveDocumentType(profileData.sharedDocuments[0].type);
                    }
                } else {
                    const err = await res.json();
                    setError(err.error || 'Failed to load profile');
                }
            } catch (error) {
                console.error("Error fetching profile", error);
                setError('Network error');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [applicationId]);

    // Prevent scrolling on body when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (loading) return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-3xl text-center space-y-4">
                <p className="text-red-400 font-bold uppercase tracking-widest">{error}</p>
                <button onClick={onClose} className="px-6 py-2 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-xs">Close</button>
            </div>
        </div>
    );

    if (!data) return null;

    const activeDocContent = data.sharedDocuments.find(d => d.type === activeDocumentType);
    const sections = data.sections || { employmentHistory: [], education: [], skills: [], certifications: [], awards: [], otherProfiles: [] };

    return (
        <div className="fixed inset-0 z-[150] flex h-screen w-screen bg-black/80 backdrop-blur-sm overflow-hidden animate-in fade-in duration-300">

            {/* Modal Container - Full Screen Overlay Matches Professional Layout */}
            <div className={`relative w-full h-full flex ${isDark ? 'bg-black text-white' : 'bg-[#f8fafe] text-black'}`}>

                {/* --- SIDEBAR (Fixed Left) --- */}
                <aside className={`w-80 flex-shrink-0 h-full overflow-y-auto border-r p-6 flex flex-col ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-neutral-200 shadow-xl z-20'}`}>

                    {/* Back Button (Close) */}
                    <div className="mb-8 pl-2">
                        <button
                            onClick={onClose}
                            className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-500 hover:text-black'}`}
                        >
                            <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                                <X size={14} />
                            </div>
                            Close View
                        </button>
                    </div>

                    {/* Identity Summary */}
                    <div className="text-center space-y-4 mb-2">
                        <div className="relative mx-auto w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-neutral-800 shadow-2xl group cursor-default">
                            {data.profile.profileImageUrl ? (
                                <img src={data.profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500"><UserCircle size={48} /></div>
                            )}
                        </div>
                        <div>
                            {/* FIXED: Name on one line (or auto-wrap), no <br> */}
                            <h1 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter leading-tight break-words">{data.profile.firstName} {data.profile.lastName}</h1>
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mt-2">{data.profile.role}</p>
                        </div>
                    </div>

                    {/* Navigation - Only Profile Button */}
                    <nav className="flex-1 mt-12 space-y-2">
                        <button
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${isDark ? 'bg-neutral-900 text-white' : 'bg-black text-white'}`}
                        >
                            <User size={20} />
                            Profile
                        </button>
                    </nav>

                    <div className={`mt-auto pt-6 text-center border-t ${isDark ? 'border-neutral-900' : 'border-neutral-100'}`}>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-4 ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Live View</span>
                        </div>
                        <p className={`text-[10px] font-medium uppercase tracking-widest ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Read Only Access</p>
                    </div>

                </aside>

                {/* --- MAIN CONTENT (Scrollable Right) --- */}
                <main className="flex-1 h-full overflow-y-auto p-8 md:p-12">
                    <div className="max-w-5xl mx-auto space-y-8 pb-32">

                        {/* Content Tabs - Visible at top of content area */}
                        <div className="flex items-center gap-4 mb-8">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : (isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-500 hover:text-black')}`}
                            >
                                <User size={14} className="inline mr-2 -mt-0.5" /> Profile Info
                            </button>
                            <button
                                onClick={() => setActiveTab('documents')}
                                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'documents' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : (isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-500 hover:text-black')}`}
                            >
                                <FileText size={14} className="inline mr-2 -mt-0.5" /> Documents
                            </button>
                            {/* Job Preferences Tab is REMOVED completely */}
                        </div>

                        {/* VIEW: PROFILE INFO */}
                        {activeTab === 'profile' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">

                                {/* Top Hero Card (Photo + Details) */}
                                <div className={`p-10 rounded-[40px] flex flex-col md:flex-row items-start gap-10 ${isDark ? 'bg-neutral-900' : 'bg-white shadow-sm border border-neutral-100'}`}>
                                    <div className="w-40 h-40 shrink-0 rounded-[32px] overflow-hidden bg-white">
                                        {data.profile.profileImageUrl ? (
                                            <img src={data.profile.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : <UserCircle className="w-full h-full text-slate-200 p-8" />}
                                    </div>
                                    <div className="flex-1 space-y-8 w-full">
                                        <div>
                                            <h2 className={`text-4xl font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>{data.profile.firstName} {data.profile.lastName}</h2>
                                            <p className={`text-sm font-bold uppercase tracking-widest mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{data.profile.role}</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full border-t border-b border-neutral-800 py-8">
                                            <div>
                                                <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Email</label>
                                                <div className="flex items-center gap-2">
                                                    <a href={`mailto:${data.profile.email}`} className={`flex items-center gap-2 font-bold ${isDark ? 'text-white hover:text-neutral-300' : 'text-black hover:text-neutral-700'} break-all transition-colors`}>
                                                        <Mail size={16} className="text-neutral-500 shrink-0" /> {data.profile.email}
                                                    </a>
                                                    <button
                                                        onClick={() => handleCopy(data.profile.email, 'email')}
                                                        className={`p-1.5 rounded-lg transition-all ${copiedField === 'email' ? 'bg-emerald-500/10 text-emerald-500' : 'hover:bg-neutral-800 text-neutral-500 hover:text-white'}`}
                                                        title="Copy Email"
                                                    >
                                                        {copiedField === 'email' ? <Check size={14} /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Phone</label>
                                                <div className="flex items-center gap-2">
                                                    <div className={`flex items-center gap-2 font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                                        <Phone size={16} className="text-neutral-500 shrink-0" /> {data.profile.phone || 'No phone provided'}
                                                    </div>
                                                    {data.profile.phone && (
                                                        <button
                                                            onClick={() => handleCopy(data.profile.phone!, 'phone')}
                                                            className={`p-1.5 rounded-lg transition-all ${copiedField === 'phone' ? 'bg-emerald-500/10 text-emerald-500' : 'hover:bg-neutral-800 text-neutral-500 hover:text-white'}`}
                                                            title="Copy Phone"
                                                        >
                                                            {copiedField === 'phone' ? <Check size={14} /> : <Copy size={14} />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* About Section */}
                                <div className={`p-10 rounded-[40px] ${isDark ? 'bg-neutral-900' : 'bg-white shadow-sm border border-neutral-100'}`}>
                                    <h3 className={`text-xs font-black uppercase tracking-widest mb-6 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>About</h3>
                                    <p className={`text-base leading-relaxed whitespace-pre-wrap ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                        {data.profile.about || 'No about section provided.'}
                                    </p>
                                </div>

                                {/* Employment */}
                                <div className={`p-10 rounded-[40px] ${isDark ? 'bg-neutral-900' : 'bg-white shadow-sm border border-neutral-100'}`}>
                                    <h3 className={`text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                        <Briefcase size={14} /> Employment History
                                    </h3>
                                    {sections.employmentHistory?.length > 0 ? (
                                        <div className="space-y-10">
                                            {sections.employmentHistory.map((job: any, i: number) => (
                                                <div key={i} className="flex gap-6 group">
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center overflow-hidden border ${isDark ? 'bg-neutral-800 text-white border-neutral-700' : 'bg-neutral-100 text-black border-neutral-200'}`}>
                                                            {job.companyLogo ? (
                                                                <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Building2 size={20} />
                                                            )}
                                                        </div>
                                                        {i !== sections.employmentHistory.length - 1 && <div className={`w-px h-full my-4 ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}></div>}
                                                    </div>
                                                    <div className="pb-4 flex-1">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{job.title}</h4>
                                                                <p className={`font-medium text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{job.company}</p>
                                                            </div>

                                                            {job.source === 'automatic' && (
                                                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`} title="Verified via Profcaria Connection">
                                                                    <BadgeCheck size={14} className="fill-current" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mt-2 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                                            <span>{job.startDate}</span>
                                                            <span>—</span>
                                                            <span className={job.isCurrent ? 'text-emerald-500' : ''}>{job.isCurrent ? 'Present' : job.endDate}</span>
                                                        </div>
                                                        {job.description && <p className={`text-sm mt-4 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{job.description}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className={`text-sm italic ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No employment history added.</p>
                                    )}
                                </div>

                                {/* Education + Skills Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className={`p-10 rounded-[40px] ${isDark ? 'bg-neutral-900' : 'bg-white shadow-sm border border-neutral-100'}`}>
                                        <h3 className={`text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            <GraduationCap size={14} /> Education
                                        </h3>
                                        {sections.education?.length > 0 ? (
                                            <div className="space-y-8">
                                                {sections.education.map((edu: any, i: number) => (
                                                    <div key={i} className="flex gap-4">
                                                        <div>
                                                            <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>{edu.school}</h4>
                                                            <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{edu.degree}, {edu.fieldOfStudy}</p>
                                                            <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                                                {edu.startDate} - {edu.isCurrent ? 'Present' : edu.endDate}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className={`text-sm italic ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No education added.</p>
                                        )}
                                    </div>

                                    <div className={`p-10 rounded-[40px] ${isDark ? 'bg-neutral-900' : 'bg-white shadow-sm border border-neutral-100'}`}>
                                        <h3 className={`text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            <BadgeCheck size={14} /> Skills
                                        </h3>
                                        {sections.skills?.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {sections.skills.map((skill: any, i: number) => (
                                                    <div key={i} className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-neutral-200 text-black shadow-sm'}`}>
                                                        {skill.name}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className={`text-sm italic ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No skills added.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Certifications, Awards, Other Profiles */}
                                <div className={`p-10 rounded-[40px] ${isDark ? 'bg-neutral-900' : 'bg-white shadow-sm border border-neutral-100'}`}>
                                    <h3 className={`text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                        <Award size={14} /> Additional Information
                                    </h3>

                                    <div className="space-y-8">
                                        {/* Certifications */}
                                        <div>
                                            <h4 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>Licenses & Certifications</h4>
                                            {sections.certifications?.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {sections.certifications.map((cert: any, i: number) => (
                                                        <div key={i} className={`p-4 rounded-xl border ${isDark ? 'bg-neutral-800/50 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                                            <h5 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-black'}`}>{cert.name}</h5>
                                                            <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{cert.issuer}</p>
                                                            {cert.date && <p className={`text-[10px] uppercase font-bold mt-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{cert.date}</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <p className={`text-sm italic ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No certifications added.</p>}
                                        </div>

                                        <div className={`w-full h-px ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}></div>

                                        {/* Awards */}
                                        <div>
                                            <h4 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>Honors & Awards</h4>
                                            {sections.awards?.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {sections.awards.map((award: any, i: number) => (
                                                        <div key={i} className={`p-4 rounded-xl border ${isDark ? 'bg-neutral-800/50 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                                            <h5 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-black'}`}>{award.title}</h5>
                                                            <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{award.issuer}</p>
                                                            {award.date && <p className={`text-[10px] uppercase font-bold mt-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{award.date}</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <p className={`text-sm italic ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No awards added.</p>}
                                        </div>

                                        <div className={`w-full h-px ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}></div>

                                        {/* Other Profiles */}
                                        <div>
                                            <h4 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>Other Profiles</h4>
                                            {sections.otherProfiles?.length > 0 ? (
                                                <div className="flex flex-wrap gap-3">
                                                    {sections.otherProfiles.map((prof: any, i: number) => (
                                                        <a
                                                            key={i}
                                                            href={prof.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${isDark ? 'bg-neutral-800/50 border-neutral-800 hover:bg-neutral-800 text-white' : 'bg-white border-neutral-200 hover:bg-neutral-50 text-black shadow-sm group'}`}
                                                        >
                                                            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-neutral-700/50 text-neutral-300' : 'bg-neutral-100 text-neutral-600'}`}>
                                                                {getProfileIcon(prof.platform || prof.url)}
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="text-xs font-bold uppercase tracking-wider">{prof.platform || 'Website'}</p>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : <p className={`text-sm italic ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No other profiles added.</p>}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        )}

                        {/* VIEW: DOCUMENTS */}
                        {activeTab === 'documents' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">

                                <div className={`p-8 rounded-[32px] border mb-8 flex items-center justify-between ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                    <div>
                                        <h3 className={`text-lg font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Application Access</h3>
                                        <p className={`text-xs font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>These are the documents the candidate has shared specifically with you.</p>
                                    </div>
                                    <div className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${isDark ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                        Verified Access
                                    </div>
                                </div>

                                {/* Accessible Documents Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {data.sharedDocuments.map((doc) => (
                                        <button
                                            key={doc.type}
                                            onClick={() => setActiveDocumentType(doc.type)}
                                            className={`group relative aspect-[4/3] rounded-[32px] border overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 text-left p-8 flex flex-col justify-between ${activeDocumentType === doc.type ? (isDark ? 'bg-white text-black border-white' : 'bg-neutral-100 text-black border-neutral-300 shadow-xl') : (isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-white border-neutral-200 hover:border-black shadow-lg shadow-slate-200/50')}`}
                                        >
                                            <FileText size={40} className={`transition-colors ${activeDocumentType === doc.type ? 'text-black' : 'text-neutral-500 group-hover:text-black dark:group-hover:text-white'}`} />
                                            <div>
                                                <h3 className={`text-xl font-black uppercase tracking-tighter ${activeDocumentType === doc.type ? 'text-black' : (isDark ? 'text-white' : 'text-black')}`}>{doc.type}</h3>
                                                <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 opacity-60 ${activeDocumentType === doc.type ? 'text-black' : ''}`}>Last Updated {new Date(doc.lastUpdated).toLocaleDateString()}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {data.sharedDocuments.length === 0 && (
                                    <div className={`p-20 rounded-[40px] border text-center ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                        <div className="mx-auto w-20 h-20 rounded-[2rem] bg-neutral-800 flex items-center justify-center mb-6">
                                            <FileText size={40} className="text-neutral-600" />
                                        </div>
                                        <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2">No documents shared</h3>
                                        <p className={`text-sm font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>The candidate has not permitted access to any documents.</p>
                                    </div>
                                )}

                                {/* Document Preview Area */}
                                {activeDocContent && (
                                    <div className={`mt-8 p-12 rounded-[40px] border min-h-[500px] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-2xl'}`}>
                                        <div className="flex items-center justify-between border-b border-neutral-800 pb-8 mb-8">
                                            <div>
                                                <h2 className={`text-4xl font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>{activeDocContent.type}</h2>
                                            </div>
                                        </div>
                                        <div
                                            className={`prose prose-lg max-w-none 
                                            ${isDark ? 'prose-invert prose-p:text-neutral-300 prose-headings:text-white prose-strong:text-white' : 'prose-headings:text-black prose-p:text-neutral-600'}
                                            `}
                                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeDocContent.content) }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
}
