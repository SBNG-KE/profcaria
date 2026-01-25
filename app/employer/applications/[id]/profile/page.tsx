"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft, UserCircle, Briefcase, Mail, FileText,
    Shield, Lock, ExternalLink, Download, User, Building2,
    GraduationCap, BadgeCheck, Award, Link2, MapPin, Phone,
    Users, Activity, Copy, Check
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
    accessList: string[];
    sections?: {
        employmentHistory: any[];
        education: any[];
        skills: any[];
        certifications: any[];
        awards: any[];
        otherProfiles: any[];
    }
}

// --- Components (Read-Only) ---
const ReadOnlyDocumentCard = ({ title, isActive, onClick, isDark }: { title: string, isActive: boolean, onClick: () => void, isDark: boolean }) => {
    return (
        <button
            onClick={onClick}
            className={`group relative flex-shrink-0 w-full md:w-56 h-44 rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.02] ${isActive ? (isDark ? 'border-emerald-500 ring-2 ring-emerald-500/50' : 'border-emerald-500 ring-2 ring-emerald-200') : (isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm')}`}
        >
            <div className="relative z-10 h-full w-full flex flex-col items-center justify-center gap-2">
                <FileText size={32} className={isActive ? 'text-emerald-500' : (isDark ? 'text-neutral-500' : 'text-neutral-400')} />
                <h2 className={`text-lg font-black tracking-tight uppercase text-center px-4 ${isDark ? 'text-white' : 'text-black'}`}>
                    {title}
                </h2>
                {isActive && (
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-2">Viewing</span>
                )}
            </div>
        </button>
    );
};

export default function EmployerProfileViewPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [data, setData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'documents'>('profile');
    const [activeDocumentType, setActiveDocumentType] = useState<string | null>(null);
    const [copyMessage, setCopyMessage] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`/api/employer/applications/${id}/profile`);
                if (res.ok) {
                    const profileData = await res.json();
                    setData(profileData);
                    // Default to first document if available, but start on 'profile' tab
                    if (profileData.sharedDocuments.length > 0) {
                        setActiveDocumentType(profileData.sharedDocuments[0].type);
                    }
                }
            } catch (error) {
                console.error("Error fetching profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    const handleCopyLink = () => {
        if (!data) return;
        const link = `https://profcaria.com/p/${data.profile.firstName.toLowerCase()}-${data.profile.lastName.toLowerCase()}`;
        navigator.clipboard.writeText(link);
        setCopyMessage('Copied!');
        setTimeout(() => setCopyMessage(''), 2000);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#050b14]">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
    );

    if (!data) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#050b14] space-y-4">
            <Lock size={48} className="text-red-500 opacity-20" />
            <p className="font-bold text-slate-500 uppercase tracking-widest text-center">Unauthorized or Profile Missing</p>
            <button onClick={() => router.back()} className="text-emerald-500 font-bold hover:underline uppercase text-xs">Go Back</button>
        </div>
    );

    const activeDocContent = data.sharedDocuments.find(d => d.type === activeDocumentType);
    const sections = data.sections || { employmentHistory: [], education: [], skills: [], certifications: [], awards: [], otherProfiles: [] };

    return (
        <div className={`min-h-screen p-6 ${isDark ? 'bg-black text-white' : 'bg-[#f8fafe] text-black'}`}>

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Top Navigation Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Horizontal Tabs (Matching Professional Profile) */}
                    <div className={`flex space-x-2 p-1 rounded-xl w-fit border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'profile' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' shadow-lg' : isDark ? 'text-neutral-400 hover:text-white hover:bg-white/5' : 'text-neutral-500 hover:text-black hover:bg-black/5'}`}
                        >
                            <User size={16} /> Profile Info
                        </button>
                        <button
                            onClick={() => setActiveTab('documents')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'documents' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' shadow-lg' : isDark ? 'text-neutral-400 hover:text-white hover:bg-white/5' : 'text-neutral-500 hover:text-black hover:bg-black/5'}`}
                        >
                            <FileText size={16} /> Documents
                        </button>
                    </div>

                    {/* VIEW: PROFILE INFO */}
                    {activeTab === 'profile' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">

                            {/* Identity Card Details (No Image/Name here since they are in sidebar) */}
                            <div className={`p-8 rounded-[40px] ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-neutral-200 shadow-sm'}`}>
                                <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                                    <UserCircle size={24} /> Personal Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        {/* Contact - No Profile Link */}
                                        <div className="space-y-1">
                                            <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Email</label>
                                            <div className={`flex items-center gap-2 font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                <Mail size={16} className="text-emerald-500" /> {data.profile.email}
                                            </div>
                                        </div>
                                        {data.profile.phone && (
                                            <div className="space-y-1">
                                                <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Phone</label>
                                                <div className={`flex items-center gap-2 font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                    <Phone size={16} className="text-emerald-500" /> {data.profile.phone}
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Location</label>
                                            <div className={`flex items-center gap-2 font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                <MapPin size={16} className="text-emerald-500" /> {data.profile.city || 'Remote'}, {data.profile.country || 'Global'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* About Section */}
                                    <div>
                                        <label className={`block mb-4 text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>About</label>
                                        <div className={`p-6 rounded-2xl ${isDark ? 'bg-neutral-800/50' : 'bg-neutral-50'}`}>
                                            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                                {data.profile.about || 'No about section provided.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Employment */}
                            {sections.employmentHistory.length > 0 && (
                                <div className={`p-8 rounded-[40px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                    <h3 className={`text-xl font-bold flex items-center gap-2 mb-6 ${isDark ? 'text-white' : 'text-black'}`}>
                                        <Briefcase size={20} /> Employment History
                                    </h3>
                                    <div className="space-y-8">
                                        {sections.employmentHistory.map((job, i) => (
                                            <div key={i} className="flex gap-4 group">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border z-10 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                                        <Building2 size={24} className={isDark ? 'text-neutral-500' : 'text-neutral-400'} />
                                                    </div>
                                                    {i !== sections.employmentHistory.length - 1 && <div className={`w-px h-full my-2 ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}></div>}
                                                </div>
                                                <div className="pb-8">
                                                    <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>{job.title}</h4>
                                                    <p className={`font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{job.company}</p>
                                                    <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest mt-1 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                                        <span>{job.startDate}</span>
                                                        <span>—</span>
                                                        <span className={job.isCurrent ? 'text-emerald-500' : ''}>{job.isCurrent ? 'Present' : job.endDate}</span>
                                                    </div>
                                                    {job.description && <p className={`text-sm mt-3 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{job.description}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Education + Skills Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {sections.education.length > 0 && (
                                    <div className={`p-8 rounded-[40px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                        <h3 className={`text-xl font-bold flex items-center gap-2 mb-6 ${isDark ? 'text-white' : 'text-black'}`}>
                                            <GraduationCap size={20} /> Education
                                        </h3>
                                        <div className="space-y-6">
                                            {sections.education.map((edu, i) => (
                                                <div key={i} className="flex gap-4">
                                                    <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                                        <GraduationCap size={20} className={isDark ? 'text-neutral-500' : 'text-neutral-400'} />
                                                    </div>
                                                    <div>
                                                        <h4 className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>{edu.school}</h4>
                                                        <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{edu.degree}, {edu.fieldOfStudy}</p>
                                                        <p className={`text-xs mt-1 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                                            {edu.startDate} - {edu.isCurrent ? 'Present' : edu.endDate}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {sections.skills.length > 0 && (
                                    <div className={`p-8 rounded-[40px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                        <h3 className={`text-xl font-bold flex items-center gap-2 mb-6 ${isDark ? 'text-white' : 'text-black'}`}>
                                            <BadgeCheck size={20} /> Skills
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {sections.skills.map((skill, i) => (
                                                <div key={i} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-neutral-200 text-black shadow-sm'}`}>
                                                    {skill.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                    {/* VIEW: DOCUMENTS */}
                    {activeTab === 'documents' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">

                            {/* Accessible Documents Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {data.sharedDocuments.map((doc) => (
                                    <button
                                        key={doc.type}
                                        onClick={() => setActiveDocumentType(doc.type)}
                                        className={`group relative aspect-[4/3] rounded-[32px] border overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 text-left p-8 flex flex-col justify-between ${activeDocumentType === doc.type ? (isDark ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-500/30') : (isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-white border-neutral-200 hover:border-emerald-200 shadow-lg shadow-slate-200/50')}`}
                                    >
                                        <FileText size={40} className={`text-emerald-500 group-hover:text-white transition-colors ${activeDocumentType === doc.type ? 'text-white' : ''}`} />
                                        <div>
                                            <h3 className={`text-2xl font-black uppercase tracking-tighter ${activeDocumentType === doc.type ? 'text-white' : (isDark ? 'text-white' : 'text-black')}`}>{doc.type}</h3>
                                            <p className={`text-xs font-bold uppercase tracking-widest mt-2 opacity-60 ${activeDocumentType === doc.type ? 'text-white' : ''}`}>Last Updated {new Date(doc.lastUpdated).toLocaleDateString()}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {data.sharedDocuments.length === 0 && (
                                <div className={`p-12 rounded-[32px] border text-center ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                    <Lock size={48} className={`mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-neutral-300'}`} />
                                    <p className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>No accessible documents</p>
                                </div>
                            )}

                            {/* Document Preview Area */}
                            {activeDocContent && (
                                <div className={`mt-8 p-12 rounded-[32px] border min-h-[500px] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-2xl'}`}>
                                    <div className="flex items-center justify-between border-b border-neutral-800/50 pb-6 mb-8">
                                        <div>
                                            <h2 className={`text-4xl font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>{activeDocContent.type}</h2>
                                        </div>
                                        <button className={`p-3 rounded-xl transition-colors ${isDark ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-black text-white hover:bg-neutral-800'}`}>
                                            <Download size={20} />
                                        </button>
                                    </div>
                                    <div
                                        className={`prose prose-lg max-w-none 
                                        ${isDark ? 'prose-invert prose-p:text-neutral-300 prose-headings:text-white' : 'prose-headings:text-black prose-p:text-neutral-600'}
                                        `}
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeDocContent.content) }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

