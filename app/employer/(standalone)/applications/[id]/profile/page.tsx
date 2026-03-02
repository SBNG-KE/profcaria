"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft, UserCircle, Briefcase, Mail, FileText,
    Shield, Lock, ExternalLink, Download, User, Building2,
    GraduationCap, BadgeCheck, Award, Link2, MapPin, Phone,
    Users, Activity, Copy, Check, X, ShieldCheck, CheckCircle2,
    Circle, Clock, Trophy, Sparkles, Target, Rocket, Handshake
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
        badgeType?: string;
        intentMode?: string;
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
    };
    verification?: {
        checks: { label: string; status: string; detail: string }[];
        score: number;
        verified: number;
        total: number;
    };
    careerScore?: {
        overall: number;
        tier: string;
    };
}

export default function EmployerProfileViewPage() {
    const { id } = useParams();
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [data, setData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'proof' | 'profile' | 'documents'>('proof');
    const [activeDocumentType, setActiveDocumentType] = useState<string | null>(null);
    const [copyMessage, setCopyMessage] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`/api/employer/applications/${id}/profile`);
                if (res.ok) {
                    const profileData = await res.json();
                    setData(profileData);
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

    if (loading) return (
        <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black' : 'bg-[#fafbfd]'}`}>
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    );

    if (!data) return (
        <div className={`min-h-screen flex flex-col items-center justify-center space-y-4 ${isDark ? 'bg-black' : 'bg-[#fafbfd]'}`}>
            <Lock size={48} className="text-red-500 opacity-20" />
            <p className={`font-bold uppercase tracking-widest text-center ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Unauthorized or Profile Missing</p>
            <button onClick={() => router.back()} className="text-blue-500 font-bold hover:underline uppercase text-xs">Go Back</button>
        </div>
    );

    const activeDocContent = data.sharedDocuments.find(d => d.type === activeDocumentType);
    const sections = data.sections || { employmentHistory: [], education: [], skills: [], certifications: [], awards: [], otherProfiles: [] };
    const verification = data.verification;
    const score = data.careerScore;

    const tierConfig: Record<string, { emoji: string; gradient: string }> = {
        legendary: { emoji: '👑', gradient: 'from-amber-500 to-orange-500' },
        elite: { emoji: '💎', gradient: 'from-indigo-500 to-purple-500' },
        rising: { emoji: '🚀', gradient: 'from-emerald-500 to-teal-500' },
        emerging: { emoji: '🌱', gradient: 'from-lime-500 to-green-500' },
        newcomer: { emoji: '✨', gradient: 'from-neutral-400 to-neutral-500' },
    };
    const tier = tierConfig[score?.tier || 'newcomer'] || tierConfig.newcomer;

    return (
        <div className={`min-h-screen ${isDark ? 'bg-black text-white' : 'bg-[#fafbfd] text-black'} overflow-hidden flex`}>

            {/* ── SIDEBAR ── */}
            <aside className={`w-80 flex-shrink-0 h-screen overflow-y-auto border-r p-6 flex flex-col ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200 shadow-xl z-20'}`}>

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-black text-xs">P</span>
                        </div>
                        <span className={`font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-black'}`}>ProfCaria</span>
                    </div>
                    <button onClick={() => router.back()} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-neutral-500 hover:bg-neutral-800 hover:text-white' : 'text-neutral-400 hover:bg-neutral-100 hover:text-black'}`} title="Close View">
                        <X size={18} />
                    </button>
                </div>

                {/* Identity Summary */}
                <div className="text-center space-y-4 mb-4">
                    <div className="relative mx-auto w-28 h-28 rounded-[1.5rem] overflow-hidden border-4 border-blue-500/20 shadow-2xl">
                        {data.profile.profileImageUrl ? (
                            <img src={data.profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-neutral-100 text-neutral-400'}`}><UserCircle size={40} /></div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tight leading-tight break-words">{data.profile.firstName}<br />{data.profile.lastName}</h1>
                        <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mt-2">{data.profile.role}</p>
                    </div>
                </div>

                {/* Career Score Badge */}
                {score && (
                    <div className={`p-3 rounded-2xl border mb-4 ${isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`}>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Career Score</span>
                            <div className="flex items-center gap-1.5">
                                <span className={`text-xl font-black bg-gradient-to-r ${tier.gradient} bg-clip-text text-transparent`}>{score.overall}</span>
                                <span className="text-xs">{tier.emoji}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Intent Mode */}
                {data.profile.intentMode && data.profile.intentMode !== 'not_looking' && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-4 ${data.profile.intentMode === 'actively_looking' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                            'bg-blue-500/10 border border-blue-500/20'
                        }`}>
                        <div className="relative flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${data.profile.intentMode === 'actively_looking' ? 'bg-emerald-400' : 'bg-blue-400'
                                }`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${data.profile.intentMode === 'actively_looking' ? 'bg-emerald-500' : 'bg-blue-500'
                                }`}></span>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${data.profile.intentMode === 'actively_looking' ? 'text-emerald-500' : 'text-blue-500'
                            }`}>
                            {data.profile.intentMode === 'actively_looking' ? 'Actively Looking' :
                                data.profile.intentMode === 'open_to_freelance' ? 'Open to Freelance' :
                                    data.profile.intentMode === 'open_to_cofounder' ? 'Co-founder' : 'Open to Offers'}
                        </span>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 space-y-2">
                    <button
                        onClick={() => setActiveTab('proof')}
                        className={`w-full flex items-center gap-4 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'proof' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20' : isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-500 hover:bg-neutral-100 hover:text-black'}`}
                    >
                        <ShieldCheck size={18} /> Verified Proof
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-4 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'profile' ? (isDark ? 'bg-neutral-800 text-white shadow-lg' : 'bg-black text-white shadow-xl') : isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-500 hover:bg-neutral-100 hover:text-black'}`}
                    >
                        <User size={18} /> Profile Info
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`w-full flex items-center gap-4 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'documents' ? (isDark ? 'bg-neutral-800 text-white shadow-lg' : 'bg-black text-white shadow-xl') : isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-500 hover:bg-neutral-100 hover:text-black'}`}
                    >
                        <FileText size={18} /> Documents
                    </button>
                </nav>

                <div className={`mt-auto pt-6 text-center border-t ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                    <p className={`text-[10px] font-medium uppercase tracking-widest ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Read Only Access</p>
                </div>

            </aside>

            {/* ── MAIN CONTENT ── */}
            <main className="flex-1 h-screen overflow-y-auto p-8 md:p-12">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* ── VIEW: VERIFIED PROOF ── */}
                    {activeTab === 'proof' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                            <div className={`p-8 rounded-[32px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                <div className="flex items-center gap-3 mb-6">
                                    <ShieldCheck size={24} className="text-blue-500" />
                                    <div>
                                        <h2 className="text-2xl font-black tracking-tight">Verified Career Proof</h2>
                                        <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Every claim is verifiable. No traditional CV needed.</p>
                                    </div>
                                </div>

                                {verification ? (
                                    <div className="space-y-4">
                                        {verification.checks.map((check, i) => (
                                            <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${check.status === 'verified' ? 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10' :
                                                    check.status === 'partial' ? 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10' :
                                                        isDark ? 'border-neutral-800 bg-neutral-800/50' : 'border-neutral-200 bg-neutral-50'
                                                }`}>
                                                {check.status === 'verified' ? (
                                                    <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                                                ) : check.status === 'partial' ? (
                                                    <Clock size={20} className="text-amber-500 shrink-0" />
                                                ) : (
                                                    <Circle size={20} className="text-neutral-400 dark:text-neutral-600 shrink-0" />
                                                )}
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-bold">{check.label}</h4>
                                                    <p className={`text-xs ${check.status === 'verified' ? 'text-emerald-600 dark:text-emerald-400' :
                                                            check.status === 'partial' ? 'text-amber-600 dark:text-amber-400' :
                                                                'text-neutral-400 dark:text-neutral-500'
                                                        }`}>{check.detail}</p>
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${check.status === 'verified' ? 'bg-emerald-500/10 text-emerald-500' :
                                                        check.status === 'partial' ? 'bg-amber-500/10 text-amber-500' :
                                                            isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-neutral-100 text-neutral-400'
                                                    }`}>{check.status}</span>
                                            </div>
                                        ))}

                                        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Overall Proof Score</span>
                                                <span className="text-lg font-black">{verification.score}/100</span>
                                            </div>
                                            <div className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800">
                                                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500 transition-all duration-1000" style={{ width: `${verification.score}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Verification data unavailable for this applicant. The candidate page shows more detail.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── VIEW: PROFILE INFO ── */}
                    {activeTab === 'profile' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
                            <div className={`p-8 rounded-[40px] ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-neutral-200 shadow-sm'}`}>
                                <h3 className={`text-xl font-bold mb-6 flex items-center gap-2`}><UserCircle size={24} /> Personal Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Email</label>
                                            <div className={`flex items-center gap-2 font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                <Mail size={16} className="text-blue-500" /> {data.profile.email}
                                            </div>
                                        </div>
                                        {data.profile.phone && (
                                            <div className="space-y-1">
                                                <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Phone</label>
                                                <div className={`flex items-center gap-2 font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                    <Phone size={16} className="text-blue-500" /> {data.profile.phone}
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-1">
                                            <label className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Location</label>
                                            <div className={`flex items-center gap-2 font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                <MapPin size={16} className="text-blue-500" /> {data.profile.city || 'Remote'}, {data.profile.country || 'Global'}
                                            </div>
                                        </div>
                                    </div>
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
                                    <h3 className={`text-xl font-bold flex items-center gap-2 mb-6`}><Briefcase size={20} /> Employment History</h3>
                                    <div className="space-y-8">
                                        {sections.employmentHistory.map((job: any, i: number) => (
                                            <div key={i} className="flex gap-4 group">
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border z-10 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                                        {job.source === 'employer_verified' || job.source === 'application' ? (
                                                            <CheckCircle2 size={24} className="text-emerald-500" />
                                                        ) : (
                                                            <Building2 size={24} className={isDark ? 'text-neutral-500' : 'text-neutral-400'} />
                                                        )}
                                                    </div>
                                                    {i !== sections.employmentHistory.length - 1 && <div className={`w-px h-full my-2 ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}></div>}
                                                </div>
                                                <div className="pb-8">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-lg font-bold">{job.title}</h4>
                                                        {(job.source === 'employer_verified' || job.source === 'application') && (
                                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500">Verified</span>
                                                        )}
                                                    </div>
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
                                        <h3 className={`text-xl font-bold flex items-center gap-2 mb-6`}><GraduationCap size={20} /> Education</h3>
                                        <div className="space-y-6">
                                            {sections.education.map((edu: any, i: number) => (
                                                <div key={i} className="flex gap-4">
                                                    <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                                        <GraduationCap size={20} className={isDark ? 'text-neutral-500' : 'text-neutral-400'} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold">{edu.school}</h4>
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
                                        <h3 className={`text-xl font-bold flex items-center gap-2 mb-6`}><BadgeCheck size={20} /> Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {sections.skills.map((skill: any, i: number) => (
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

                    {/* ── VIEW: DOCUMENTS ── */}
                    {activeTab === 'documents' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {data.sharedDocuments.map((doc) => (
                                    <button
                                        key={doc.type}
                                        onClick={() => setActiveDocumentType(doc.type)}
                                        className={`group relative aspect-[4/3] rounded-[32px] border overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 text-left p-8 flex flex-col justify-between ${activeDocumentType === doc.type ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white border-blue-500 shadow-xl shadow-blue-500/30' : (isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-white border-neutral-200 hover:border-blue-200 shadow-lg shadow-slate-200/50')}`}
                                    >
                                        <FileText size={40} className={`${activeDocumentType === doc.type ? 'text-white' : 'text-blue-500'} transition-colors`} />
                                        <div>
                                            <h3 className={`text-2xl font-black uppercase tracking-tighter ${activeDocumentType === doc.type ? 'text-white' : ''}`}>{doc.type}</h3>
                                            <p className={`text-xs font-bold uppercase tracking-widest mt-2 opacity-60 ${activeDocumentType === doc.type ? 'text-white' : ''}`}>Last Updated {new Date(doc.lastUpdated).toLocaleDateString()}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {data.sharedDocuments.length === 0 && (
                                <div className={`p-12 rounded-[32px] border text-center ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                    <Lock size={48} className={`mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-neutral-300'}`} />
                                    <p className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>No accessible documents</p>
                                    <p className={`text-xs mt-2 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Verified Career Proof makes traditional documents optional</p>
                                </div>
                            )}

                            {activeDocContent && (
                                <div className={`mt-8 p-12 rounded-[32px] border min-h-[500px] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-2xl'}`}>
                                    <div className={`flex items-center justify-between border-b pb-6 mb-8 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                                        <h2 className="text-4xl font-black uppercase tracking-tighter">{activeDocContent.type}</h2>
                                        <button className={`p-3 rounded-xl transition-colors ${isDark ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-black text-white hover:bg-neutral-800'}`}>
                                            <Download size={20} />
                                        </button>
                                    </div>
                                    <div
                                        className={`prose prose-lg max-w-none ${isDark ? 'prose-invert prose-p:text-neutral-300 prose-headings:text-white' : 'prose-headings:text-black prose-p:text-neutral-600'}`}
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeDocContent.content) }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
