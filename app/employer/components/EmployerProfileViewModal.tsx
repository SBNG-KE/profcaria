"use client"

import React, { useState, useEffect } from 'react';
import {
    X, UserCircle, Briefcase, Mail, FileText,
    Download, User, Building2, GraduationCap,
    BadgeCheck, Phone, MapPin, Award, Globe,
    BookOpen, Linkedin, Github, Copy, Check, Twitter,
    Users, ExternalLink, Send, AlertCircle, LogOut, UserX, Handshake, MessageSquare, ChevronLeft, ChevronRight,
    ShieldCheck, CheckCircle2, Circle, Clock, Link2
} from 'lucide-react';
import VerificationBadge from '@/app/components/VerificationBadge';
import { sanitizeHtml } from '@/lib/sanitize';
import { useTheme } from '@/app/context/ThemeContext';
import ReferenceRequestModal from './ReferenceRequestModal';
import ViewReferenceResponseModal from './ViewReferenceResponseModal';

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
        docMode?: 'writing' | 'upload';
        badgeType?: string;
        intentMode?: string;
    };
    sharedDocuments: {
        type: string;
        content: string;
        lastUpdated: string;
    }[];
    uploadedDocuments?: {
        id: string;
        name: string;
        blobUrl: string;
        fileType: string;
        fileSize: number;
        createdAt: string;
    }[];
    sections?: {
        employmentHistory: any[];
        education: any[];
        skills: any[];
        certifications: any[];
        awards: any[];
        otherProfiles: any[];
    };
    kycData?: {
        imageUrl: string | null;
        videoUrl: string | null;
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

interface VerifiedEmployment {
    id: string;
    companyId: string;
    companyName: string;
    companyLogo: string | null;
    companyEmail: string | null;
    companyPhone: string | null;
    jobTitle: string;
    startDate: string;
    endDate: string;
    terminationType: 'involuntary' | 'resignation' | 'mutual' | null;
    terminationReason: string | null;
    status: string;
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
    const [activeTab, setActiveTab] = useState<'proof' | 'profile' | 'documents' | 'references'>('proof');
    const [activeDocumentType, setActiveDocumentType] = useState<string | null>(null);
    const [activeUploadedDocId, setActiveUploadedDocId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [activeCompanyIndex, setActiveCompanyIndex] = useState(0);

    // References state
    const [verifiedEmployments, setVerifiedEmployments] = useState<VerifiedEmployment[]>([]);
    const [loadingReferences, setLoadingReferences] = useState(false);
    const [referencesLoaded, setReferencesLoaded] = useState(false);

    // Reference request modal state
    const [referenceModalOpen, setReferenceModalOpen] = useState(false);
    const [selectedEmploymentForRef, setSelectedEmploymentForRef] = useState<VerifiedEmployment | null>(null);

    // Sent requests and response viewing state
    const [sentRequests, setSentRequests] = useState<{ id: string; targetCompanyId: string; targetCompanyName: string; status: string; createdAt: string; respondedAt: string | null }[]>([]);
    const [viewResponseModalOpen, setViewResponseModalOpen] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

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
                    // Set initial active document based on docMode
                    const docMode = profileData.profile?.docMode || 'writing';
                    if (docMode === 'upload' && profileData.uploadedDocuments?.length > 0) {
                        setActiveUploadedDocId(profileData.uploadedDocuments[0].id);
                    } else if (profileData.sharedDocuments?.length > 0) {
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
            <div className="w-12 h-12 border-4 border-[#3B5998]/20 border-t-[#3B5998] rounded-full animate-spin"></div>
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
    const verification = data.verification;
    const careerScore = data.careerScore;
    const badgeType = data.profile?.badgeType;
    const intentMode = data.profile?.intentMode;

    const tierConfig: Record<string, { emoji: string; gradient: string }> = {
        legendary: { emoji: '', gradient: 'from-black to-black dark:from-white dark:to-white' },
        elite: { emoji: '', gradient: 'from-black to-black dark:from-white dark:to-white' },
        rising: { emoji: '', gradient: 'from-black to-black dark:from-white dark:to-white' },
        emerging: { emoji: '', gradient: 'from-black to-black dark:from-white dark:to-white' },
        newcomer: { emoji: '', gradient: 'from-black to-black dark:from-white dark:to-white' },
    };
    const tier = tierConfig[careerScore?.tier || 'newcomer'] || tierConfig.newcomer;

    const groupedExperience = sections.employmentHistory?.reduce((acc: any, job: any) => {
        const companyName = job.company?.trim() || 'Unknown Company';
        if (!acc[companyName]) acc[companyName] = [];
        acc[companyName].push(job);
        return acc;
    }, {}) || {};

    const sortedCompanies = Object.entries(groupedExperience).sort((a: any, b: any) => {
        const aMostRecent = Math.max(...a[1].map((j: any) => new Date(j.startDate || 0).getTime()));
        const bMostRecent = Math.max(...b[1].map((j: any) => new Date(j.startDate || 0).getTime()));
        return bMostRecent - aMostRecent;
    });

    return (
        <div className="fixed inset-0 z-[150] flex h-screen w-screen bg-black/80 backdrop-blur-sm overflow-hidden animate-in fade-in duration-300">

            {/* Modal Container - Full Screen Overlay Matches Professional Layout */}
            <div className={`relative w-full h-full flex flex-col md:flex-row ${isDark ? 'bg-black text-white' : 'bg-[#f8fafe] text-black'}`}>

                {/* --- MOBILE HEADER (Visible on small screens only) --- */}
                <div className={`md:hidden flex items-center gap-4 p-4 border-b ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-neutral-200'}`}>
                    <button
                        onClick={onClose}
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-neutral-100 border border-neutral-200'}`}
                    >
                        <X size={18} />
                    </button>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                            {data.profile.profileImageUrl ? (
                                <img src={data.profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}><UserCircle size={24} /></div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h1 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-black'}`}>{data.profile.firstName} {data.profile.lastName}</h1>
                            <p className="text-[10px] text-neutral-500 truncate">{data.profile.role}</p>
                        </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-[8px] font-bold uppercase ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>Live</div>
                </div>

                {/* --- SIDEBAR (Hidden on mobile, visible on md+) --- */}
                <aside className={`hidden md:flex w-80 flex-shrink-0 h-full overflow-y-auto border-r p-6 flex-col ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-neutral-200 shadow-xl z-20'}`}>

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
                            {badgeType && badgeType !== 'none' && (
                                <div className="absolute -bottom-1 -right-1">
                                    <VerificationBadge tier={badgeType} size={28} />
                                </div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-black dark:text-white uppercase tracking-tighter leading-tight break-words">{data.profile.firstName} {data.profile.lastName}</h1>
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mt-2">{data.profile.role}</p>
                        </div>
                    </div>

                    {/* Career Score Badge */}
                    {careerScore && (
                        <div className={`p-3 rounded-2xl border mb-2 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                            <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Career Score</span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`text-xl font-black bg-gradient-to-r ${tier.gradient} bg-clip-text text-transparent`}>{careerScore.overall}</span>
                                    <span className="text-xs">{tier.emoji}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Intent Mode */}
                    {intentMode && intentMode !== 'not_looking' && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-2 ${intentMode === 'actively_looking' ? 'bg-[#3B5998]/10 border border-[#3B5998]/20' :
                                'bg-blue-500/10 border border-blue-500/20'
                            }`}>
                            <div className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${intentMode === 'actively_looking' ? 'bg-[#6B8CD5]' : 'bg-blue-400'
                                    }`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${intentMode === 'actively_looking' ? 'bg-[#3B5998]' : 'bg-blue-500'
                                    }`}></span>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${intentMode === 'actively_looking' ? 'text-[#3B5998]' : 'text-blue-500'
                                }`}>
                                {intentMode === 'actively_looking' ? 'Actively Looking' :
                                    intentMode === 'open_to_freelance' ? 'Open to Freelance' :
                                        intentMode === 'open_to_cofounder' ? 'Co-founder' : 'Open to Offers'}
                            </span>
                        </div>
                    )}

                    {/* Navigation */}
                    <nav className="flex-1 mt-8 space-y-2">
                        <button
                            onClick={() => setActiveTab('proof')}
                            className={`w-full flex items-center gap-4 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'proof' ? (isDark ? 'bg-neutral-800 text-white shadow-lg' : 'bg-black text-white shadow-xl') : isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-500 hover:bg-neutral-100 hover:text-black'}`}
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
                        <button
                            onClick={() => {
                                setActiveTab('references');
                                if (!referencesLoaded) {
                                    setLoadingReferences(true);
                                    fetch(`/api/employer/applications/${applicationId}/references`)
                                        .then(res => res.json())
                                        .then(data => setVerifiedEmployments(data.verifiedEmployments || []))
                                        .catch(err => console.error('Failed to load references:', err));
                                    fetch(`/api/employer/applications/${applicationId}/references/sent`)
                                        .then(res => res.json())
                                        .then(data => { setSentRequests(data.sentRequests || []); setReferencesLoaded(true); })
                                        .catch(err => console.error('Failed to load sent requests:', err))
                                        .finally(() => setLoadingReferences(false));
                                }
                            }}
                            className={`w-full flex items-center gap-4 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'references' ? (isDark ? 'bg-neutral-800 text-white shadow-lg' : 'bg-black text-white shadow-xl') : isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-500 hover:bg-neutral-100 hover:text-black'}`}
                        >
                            <Users size={18} /> References
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
                <main className="flex-1 h-full overflow-y-auto p-4 sm:p-6 md:p-12">
                    <div className="max-w-5xl mx-auto space-y-8 pb-32">

                        {/* Content Tabs - Mobile only (desktop uses sidebar nav) */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6 sm:mb-8 md:hidden">
                            <button onClick={() => setActiveTab('proof')} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'proof' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : (isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-500 hover:text-black')}`}>
                                <ShieldCheck size={12} className="inline mr-1 -mt-0.5" /> Proof
                            </button>
                            <button onClick={() => setActiveTab('profile')} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : (isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-500 hover:text-black')}`}>
                                <User size={12} className="inline mr-1 -mt-0.5" /> Profile
                            </button>
                            <button onClick={() => setActiveTab('documents')} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'documents' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : (isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-500 hover:text-black')}`}>
                                <FileText size={12} className="inline mr-1 -mt-0.5" /> Docs
                            </button>
                            <button onClick={() => { setActiveTab('references'); if (!referencesLoaded) { setLoadingReferences(true); fetch(`/api/employer/applications/${applicationId}/references`).then(r => r.json()).then(d => setVerifiedEmployments(d.verifiedEmployments || [])).catch(console.error); fetch(`/api/employer/applications/${applicationId}/references/sent`).then(r => r.json()).then(d => { setSentRequests(d.sentRequests || []); setReferencesLoaded(true); }).catch(console.error).finally(() => setLoadingReferences(false)); } }} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'references' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : (isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-500 hover:text-black')}`}>
                                <Users size={12} className="inline mr-1 -mt-0.5" /> Refs
                            </button>
                        </div>

                        {/* VIEW: VERIFIED PROOF */}
                        {activeTab === 'proof' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                                <div className={`p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <ShieldCheck size={24} className="text-blue-500" />
                                        <div>
                                            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Verified Career Proof</h2>
                                            <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Every claim is verifiable. No traditional CV needed.</p>
                                        </div>
                                    </div>

                                    {verification ? (
                                        <div className="space-y-3">
                                            {verification.checks.map((check, i) => (
                                                <div key={i} className={`flex items-center gap-4 p-3 sm:p-4 rounded-2xl border transition-all ${check.status === 'verified' ? (isDark ? 'border-[#3B5998]/30 bg-[#3B5998]/10' : 'border-[#6B8CD5] bg-[#3B5998]/5') :
                                                        check.status === 'partial' ? (isDark ? 'border-[#3B5998]/30 bg-[#3B5998]/10' : 'border-[#6B8CD5] bg-[#3B5998]/5') :
                                                            isDark ? 'border-neutral-800 bg-neutral-800/50' : 'border-neutral-200 bg-neutral-50'
                                                    }`}>
                                                    {check.status === 'verified' ? (
                                                        <CheckCircle2 size={20} className="text-[#3B5998] shrink-0" />
                                                    ) : check.status === 'partial' ? (
                                                        <Clock size={20} className="text-[#3B5998] shrink-0" />
                                                    ) : (
                                                        <Circle size={20} className={`shrink-0 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`} />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{check.label}</h4>
                                                        <p className={`text-xs ${check.status === 'verified' ? (isDark ? 'text-[#6B8CD5]' : 'text-[#3B5998]') :
                                                                check.status === 'partial' ? (isDark ? 'text-[#6B8CD5]' : 'text-[#3B5998]') :
                                                                    isDark ? 'text-neutral-500' : 'text-neutral-400'
                                                            }`}>{check.detail}</p>
                                                    </div>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${check.status === 'verified' ? 'bg-[#3B5998]/10 text-[#3B5998]' :
                                                            check.status === 'partial' ? 'bg-[#3B5998]/10 text-[#3B5998]' :
                                                                isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-neutral-100 text-neutral-400'
                                                        }`}>{check.status}</span>
                                                </div>
                                            ))}

                                            <div className={`mt-4 pt-4 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Overall Proof Score</span>
                                                    <span className={`text-lg font-black ${isDark ? 'text-white' : 'text-black'}`}>{verification.score}/100</span>
                                                </div>
                                                <div className={`w-full h-2.5 rounded-full ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                                    <div className={`h-full rounded-full transition-all duration-1000 ${isDark ? 'bg-white' : 'bg-black'}`} style={{ width: `${verification.score}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`p-8 text-center ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            <ShieldCheck size={40} className="mx-auto mb-4 opacity-20" />
                                            <p className="text-sm font-medium">Verification data is being calculated...</p>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Career Score Card */}
                                {careerScore && (
                                    <div className={`p-6 rounded-[24px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Career Score</h3>
                                                <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Based on profile, skills, and verification</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-4xl font-black bg-gradient-to-r ${tier.gradient} bg-clip-text text-transparent`}>{careerScore.overall}</span>
                                                <p className="text-xs mt-1">{tier.emoji} {careerScore.tier.charAt(0).toUpperCase() + careerScore.tier.slice(1)}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* VIEW: PROFILE INFO */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">

                                {/* Top Hero Card (Photo + Details) */}
                                <div className={`p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-10 ${isDark ? 'bg-neutral-900' : 'bg-white shadow-sm border border-neutral-100'}`}>
                                    <div className="w-24 h-24 sm:w-40 sm:h-40 shrink-0 rounded-[20px] sm:rounded-[32px] overflow-hidden bg-white">
                                        {data.profile.profileImageUrl ? (
                                            <img src={data.profile.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : <UserCircle className="w-full h-full text-slate-200 p-4 sm:p-8" />}
                                    </div>
                                    <div className="flex-1 space-y-6 sm:space-y-8 w-full text-center md:text-left">
                                        <div>
                                            <h2 className={`text-2xl sm:text-4xl font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>{data.profile.firstName} {data.profile.lastName}</h2>
                                            <p className={`text-xs sm:text-sm font-bold uppercase tracking-widest mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{data.profile.role}</p>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4 sm:gap-8 w-full border-t border-b border-neutral-800 py-4 sm:py-8">
                                            <div>
                                                <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Email</label>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <a href={`mailto:${data.profile.email}`} className={`flex items-center gap-2 font-bold text-sm ${isDark ? 'text-white hover:text-neutral-300' : 'text-black hover:text-neutral-700'} break-all transition-colors`}>
                                                        <Mail size={16} className="text-neutral-500 shrink-0" /> {data.profile.email}
                                                    </a>
                                                    <button
                                                        onClick={() => handleCopy(data.profile.email, 'email')}
                                                        className={`p-1.5 rounded-lg transition-all ${copiedField === 'email' ? 'bg-[#3B5998]/10 text-[#3B5998]' : 'hover:bg-neutral-800 text-neutral-500 hover:text-white'}`}
                                                        title="Copy Email"
                                                    >
                                                        {copiedField === 'email' ? <Check size={14} /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Phone</label>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <div className={`flex items-center gap-2 font-bold text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                                                        <Phone size={16} className="text-neutral-500 shrink-0" /> {data.profile.phone || 'No phone provided'}
                                                    </div>
                                                    {data.profile.phone && (
                                                        <button
                                                            onClick={() => handleCopy(data.profile.phone!, 'phone')}
                                                            className={`p-1.5 rounded-lg transition-all ${copiedField === 'phone' ? 'bg-[#3B5998]/10 text-[#3B5998]' : 'hover:bg-neutral-800 text-neutral-500 hover:text-white'}`}
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

                                {/* KYC Verification Section */}
                                {data.kycData && (data.kycData.imageUrl || data.kycData.videoUrl) && (
                                    <div className={`p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] border-2 ${isDark ? 'bg-[#3B5998]/5 border-[#3B5998]/20' : 'bg-[#3B5998]/5 border-[#3B5998]/20 shadow-sm'}`}>
                                        <h3 className={`text-xs font-black uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2 ${isDark ? 'text-[#3B5998]' : 'text-[#3B5998]'}`}>
                                            <BadgeCheck size={14} /> Identity Successfully Verified
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {data.kycData.imageUrl && (
                                                <div className="space-y-2">
                                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>ID Snapshot</p>
                                                    <div className="rounded-2xl overflow-hidden border border-[#3B5998]/30 aspect-[4/3] bg-black">
                                                        <img src={data.kycData.imageUrl} alt="KYC Snapshot" className="w-full h-full object-contain" />
                                                    </div>
                                                </div>
                                            )}
                                            {data.kycData.videoUrl && (
                                                <div className="space-y-2">
                                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Liveness Video</p>
                                                    <div className="rounded-2xl overflow-hidden border border-[#3B5998]/30 aspect-[4/3] bg-black">
                                                        <video src={data.kycData.videoUrl} controls className="w-full h-full object-contain" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* About Section */}
                                <div className={`p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] ${isDark ? 'bg-neutral-900' : 'bg-white shadow-sm border border-neutral-100'}`}>
                                    <h3 className={`text-xs font-black uppercase tracking-widest mb-4 sm:mb-6 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>About</h3>
                                    <p className={`text-sm sm:text-base leading-relaxed whitespace-pre-wrap ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                        {data.profile.about || 'No about section provided.'}
                                    </p>
                                </div>

                                {/* Employment */}
                                <div className={`p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] ${isDark ? 'bg-neutral-900' : 'bg-white shadow-sm border border-neutral-100'}`}>
                                    <h3 className={`text-xs font-black uppercase tracking-widest mb-6 sm:mb-8 flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                        <Briefcase size={14} /> Employment History
                                    </h3>
                                    {sortedCompanies.length > 0 ? (
                                        <div className="space-y-6">
                                            {/* Carousel Header (Company Info & Nav) */}
                                            <div className={`flex items-center justify-between pb-4 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                                                <h4 className={`text-xl font-black truncate lg:text-2xl pr-4 ${isDark ? 'text-white' : 'text-black'}`}>
                                                    {sortedCompanies[activeCompanyIndex]?.[0] || ''}
                                                </h4>
                                                {sortedCompanies.length > 1 && (
                                                    <div className={`flex items-center gap-2 shrink-0 rounded-full p-1 border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-200'}`}>
                                                        <button
                                                            onClick={() => setActiveCompanyIndex(prev => Math.max(0, prev - 1))}
                                                            disabled={activeCompanyIndex === 0}
                                                            className={`p-1.5 rounded-full transition-colors disabled:opacity-30 disabled:shadow-none pointer-events-auto ${isDark ? 'hover:bg-neutral-700 text-white' : 'hover:bg-white text-black'}`}
                                                        >
                                                            <ChevronLeft size={16} />
                                                        </button>
                                                        <span className="text-xs font-bold text-neutral-500 min-w-[32px] text-center shrink-0">
                                                            {activeCompanyIndex + 1} / {sortedCompanies.length}
                                                        </span>
                                                        <button
                                                            onClick={() => setActiveCompanyIndex(prev => Math.min(sortedCompanies.length - 1, prev + 1))}
                                                            disabled={activeCompanyIndex === sortedCompanies.length - 1}
                                                            className={`p-1.5 rounded-full transition-colors disabled:opacity-30 disabled:shadow-none pointer-events-auto ${isDark ? 'hover:bg-neutral-700 text-white' : 'hover:bg-white text-black'}`}
                                                        >
                                                            <ChevronRight size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Roles List for Current Company */}
                                            <div className="space-y-8 relative">
                                                {((sortedCompanies[activeCompanyIndex]?.[1] as any[] || []).sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime())).map((job, index, arr) => {
                                                    const newerJob = index > 0 ? arr[index - 1] : null;
                                                    let displayIsCurrent = job.isCurrent;
                                                    let displayEndDate = job.endDate;

                                                    if (newerJob && !job.endDate) {
                                                        displayIsCurrent = false;
                                                        displayEndDate = newerJob.startDate;
                                                    }

                                                    // Format Date helper inside component since we don't have it imported
                                                    const formatDisplayDate = (dateStr: string) => {
                                                        if (!dateStr) return '';
                                                        try {
                                                            const d = new Date(dateStr);
                                                            if (isNaN(d.getTime())) return dateStr;
                                                            return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
                                                        } catch (e) { return dateStr; }
                                                    };

                                                    return (
                                                        <div key={job.id} className="group relative pl-8 border-l-2 border-neutral-200 dark:border-neutral-800 last:border-0 pb-8 last:pb-0">
                                                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"></div>
                                                            <div className="flex justify-between items-start gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between">
                                                                        <div>
                                                                            <h5 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>{job.title}</h5>
                                                                        </div>
                                                                        {job.source === 'automatic' && (
                                                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${isDark ? 'bg-[#3B5998]/10 border-[#3B5998]/20 text-[#3B5998]' : 'bg-[#3B5998]/5 border-[#3B5998]/20 text-[#3B5998]'}`} title="Verified via Profcaria Connection">
                                                                                <BadgeCheck size={14} className="fill-current" />
                                                                                <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <p className={`text-xs uppercase tracking-wider font-bold mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                                        {formatDisplayDate(job.startDate)} — {displayIsCurrent ? 'Present' : formatDisplayDate(displayEndDate)}
                                                                    </p>
                                                                    {job.description && (
                                                                        <p className={`mt-3 text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{job.description}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className={`text-sm italic ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No employment history added.</p>
                                    )}
                                </div>

                                {/* Education + Skills Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                                    <div className={`p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] ${isDark ? 'bg-neutral-900' : 'bg-white shadow-sm border border-neutral-100'}`}>
                                        <h3 className={`text-xs font-black uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            <GraduationCap size={14} /> Education
                                        </h3>
                                        {sections.education?.length > 0 ? (
                                            <div className="space-y-6 sm:space-y-8">
                                                {sections.education.map((edu: any, i: number) => (
                                                    <div key={i} className="flex gap-4">
                                                        <div>
                                                            <h4 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>{edu.school}</h4>
                                                            <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{edu.degree}, {edu.fieldOfStudy}</p>
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

                                    <div className={`p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] ${isDark ? 'bg-neutral-900' : 'bg-white shadow-sm border border-neutral-100'}`}>
                                        <h3 className={`text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            <BadgeCheck size={14} /> Verified Skills & Evidence
                                        </h3>
                                        <div className="space-y-6">
                                            <p className={`text-sm leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                                Verified proficiencies with linked evidence (portfolio, project, or certificate).
                                            </p>
                                            
                                            {sections.skills?.length > 0 ? (
                                                <div className="flex flex-wrap gap-3">
                                                    {sections.skills.map((skill: any, i: number) => (
                                                        <div key={i} className={`group flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border text-sm font-bold transition-all ${isDark ? 'bg-neutral-800/50 border-neutral-800 text-white hover:border-neutral-700' : 'bg-neutral-50 border-neutral-200 text-black hover:border-neutral-300'}`}>
                                                            {skill.documentUrl ? (
                                                                <a 
                                                                    href={skill.documentUrl} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                                    title="View Skill Evidence"
                                                                >
                                                                    <span>{skill.name}</span>
                                                                    <Link2 size={14} className="opacity-50" />
                                                                </a>
                                                            ) : (
                                                                <span>{skill.name}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className={`text-sm italic ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No skills added.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Certifications, Awards, Other Profiles */}
                                <div className={`p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] ${isDark ? 'bg-neutral-900' : 'bg-white shadow-sm border border-neutral-100'}`}>
                                    <h3 className={`text-xs font-black uppercase tracking-widest mb-6 sm:mb-8 flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                        <Award size={14} /> Additional Information
                                    </h3>

                                    <div className="space-y-6 sm:space-y-8">
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
                        {activeTab === 'documents' && (() => {
                            const docMode = data.profile?.docMode || 'writing';
                            const showUploaded = docMode === 'upload';
                            const uploadedDocs = data.uploadedDocuments || [];
                            const activeUploadedDoc = uploadedDocs.find(d => d.id === activeUploadedDocId);

                            return (
                                <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">

                                    <div className={`p-4 sm:p-8 rounded-[20px] sm:rounded-[32px] border mb-4 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                        <div>
                                            <h3 className={`text-base sm:text-lg font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Application Access</h3>
                                            <p className={`text-[10px] sm:text-xs font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                {showUploaded ? 'Uploaded files shared by the candidate.' : 'These are the documents the candidate has shared specifically with you.'}
                                            </p>
                                        </div>
                                        <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${showUploaded ? (isDark ? 'bg-[#3B5998]/10 text-[#3B5998]' : 'bg-[#3B5998]/5 text-[#3B5998]') : (isDark ? 'bg-[#3B5998]/10 text-[#3B5998]' : 'bg-[#3B5998]/5 text-[#3B5998]')}`}>
                                            {showUploaded ? 'Uploaded Files' : 'Verified Access'}
                                        </div>
                                    </div>

                                    {/* UPLOAD MODE: Show uploaded files */}
                                    {showUploaded && (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                                {uploadedDocs.map((doc) => (
                                                    <button
                                                        key={doc.id}
                                                        onClick={() => setActiveUploadedDocId(doc.id)}
                                                        className={`group relative aspect-[4/3] rounded-[20px] sm:rounded-[32px] border overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 text-left p-4 sm:p-8 flex flex-col justify-between ${activeUploadedDocId === doc.id ? (isDark ? 'bg-white text-black border-white' : 'bg-neutral-100 text-black border-neutral-300 shadow-xl') : (isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-white border-neutral-200 hover:border-black shadow-lg shadow-slate-200/50')}`}
                                                    >
                                                        <FileText size={32} className={`sm:w-10 sm:h-10 transition-colors ${activeUploadedDocId === doc.id ? 'text-black' : 'text-neutral-500 group-hover:text-black dark:group-hover:text-white'}`} />
                                                        <div>
                                                            <h3 className={`text-base sm:text-xl font-black uppercase tracking-tighter truncate ${activeUploadedDocId === doc.id ? 'text-black' : (isDark ? 'text-white' : 'text-black')}`}>{doc.name}</h3>
                                                            <p className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mt-1 sm:mt-2 opacity-60 ${activeUploadedDocId === doc.id ? 'text-black' : ''}`}>
                                                                {new Date(doc.createdAt).toLocaleDateString()} • {(doc.fileSize / 1024).toFixed(1)} KB
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>

                                            {uploadedDocs.length === 0 && (
                                                <div className={`p-10 sm:p-20 rounded-[24px] sm:rounded-[40px] border text-center ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                                    <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] bg-neutral-800 flex items-center justify-center mb-4 sm:mb-6">
                                                        <FileText size={32} className="sm:w-10 sm:h-10 text-neutral-600" />
                                                    </div>
                                                    <h3 className={`text-lg sm:text-xl font-bold uppercase tracking-tight mb-2 ${isDark ? 'text-white' : 'text-black'}`}>No files uploaded</h3>
                                                    <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>The candidate has not uploaded any files.</p>
                                                </div>
                                            )}

                                            {/* Uploaded File Preview */}
                                            {activeUploadedDoc && (
                                                <div className={`mt-4 sm:mt-8 p-6 sm:p-12 rounded-[24px] sm:rounded-[40px] border min-h-[200px] sm:min-h-[300px] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-2xl'}`}>
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4 sm:pb-8 mb-4 sm:mb-8">
                                                        <div>
                                                            <h2 className={`text-xl sm:text-4xl font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>{activeUploadedDoc.name}</h2>
                                                            <p className={`text-xs sm:text-sm mt-1 sm:mt-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{activeUploadedDoc.fileType} • {(activeUploadedDoc.fileSize / 1024).toFixed(1)} KB</p>
                                                        </div>
                                                        <a
                                                            href={activeUploadedDoc.blobUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                                                        >
                                                            <Download size={16} /> View / Download
                                                        </a>
                                                    </div>
                                                    {/* Preview for images */}
                                                    {activeUploadedDoc.fileType.includes('image') && (
                                                        <div className="flex justify-center">
                                                            <img src={activeUploadedDoc.blobUrl} alt={activeUploadedDoc.name} className="max-w-full max-h-[300px] sm:max-h-[400px] rounded-xl object-contain" />
                                                        </div>
                                                    )}
                                                    {/* Preview for PDFs */}
                                                    {activeUploadedDoc.fileType.includes('pdf') && (
                                                        <iframe src={activeUploadedDoc.blobUrl} className="w-full h-[300px] sm:h-[500px] rounded-xl border-0" title={activeUploadedDoc.name} />
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* WRITING MODE: Show written documents */}
                                    {!showUploaded && (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                                {data.sharedDocuments.map((doc) => (
                                                    <button
                                                        key={doc.type}
                                                        onClick={() => setActiveDocumentType(doc.type)}
                                                        className={`group relative aspect-[4/3] rounded-[20px] sm:rounded-[32px] border overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 text-left p-4 sm:p-8 flex flex-col justify-between ${activeDocumentType === doc.type ? (isDark ? 'bg-white text-black border-white' : 'bg-neutral-100 text-black border-neutral-300 shadow-xl') : (isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-white border-neutral-200 hover:border-black shadow-lg shadow-slate-200/50')}`}
                                                    >
                                                        <FileText size={32} className={`sm:w-10 sm:h-10 transition-colors ${activeDocumentType === doc.type ? 'text-black' : 'text-neutral-500 group-hover:text-black dark:group-hover:text-white'}`} />
                                                        <div>
                                                            <h3 className={`text-base sm:text-xl font-black uppercase tracking-tighter ${activeDocumentType === doc.type ? 'text-black' : (isDark ? 'text-white' : 'text-black')}`}>{doc.type}</h3>
                                                            <p className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-widest mt-1 sm:mt-2 opacity-60 ${activeDocumentType === doc.type ? 'text-black' : ''}`}>Last Updated {new Date(doc.lastUpdated).toLocaleDateString()}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>

                                            {data.sharedDocuments.length === 0 && (
                                                <div className={`p-10 sm:p-20 rounded-[24px] sm:rounded-[40px] border text-center ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                                    <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] bg-neutral-800 flex items-center justify-center mb-4 sm:mb-6">
                                                        <FileText size={32} className="sm:w-10 sm:h-10 text-neutral-600" />
                                                    </div>
                                                    <h3 className={`text-lg sm:text-xl font-bold uppercase tracking-tight mb-2 ${isDark ? 'text-white' : 'text-black'}`}>No documents shared</h3>
                                                    <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>The candidate has not permitted access to any documents.</p>
                                                </div>
                                            )}

                                            {/* Document Preview Area */}
                                            {activeDocContent && (
                                                <div className={`mt-4 sm:mt-8 p-6 sm:p-12 rounded-[24px] sm:rounded-[40px] border min-h-[300px] sm:min-h-[500px] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-2xl'}`}>
                                                    <div className="flex items-center justify-between border-b border-neutral-800 pb-4 sm:pb-8 mb-4 sm:mb-8">
                                                        <div>
                                                            <h2 className={`text-xl sm:text-4xl font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>{activeDocContent.type}</h2>
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={`prose prose-sm sm:prose-lg max-w-none 
                                                    ${isDark ? 'prose-invert prose-p:text-neutral-300 prose-headings:text-white prose-strong:text-white' : 'prose-headings:text-black prose-p:text-neutral-600'}
                                                    `}
                                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeDocContent.content) }}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })()}

                        {/* VIEW: REFERENCES */}
                        {activeTab === 'references' && (
                            <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">

                                {/* Info Banner */}
                                <div className={`p-4 sm:p-6 rounded-[20px] sm:rounded-[32px] border flex items-start gap-4 ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
                                    <AlertCircle size={24} className={isDark ? 'text-blue-400 shrink-0' : 'text-blue-600 shrink-0'} />
                                    <div>
                                        <h3 className={`font-bold text-sm sm:text-base ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>About References</h3>
                                        <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-blue-300/80' : 'text-blue-600'}`}>
                                            References are from companies registered in Profcaria that verified this professional's employment. Employment verification is recorded when employment ends (resignation, termination, or mutual separation).
                                        </p>
                                    </div>
                                </div>

                                {/* Loading State */}
                                {loadingReferences && (
                                    <div className="flex items-center justify-center py-20">
                                        <div className="w-8 h-8 border-4 border-neutral-700 border-t-white rounded-full animate-spin"></div>
                                    </div>
                                )}

                                {/* Empty State */}
                                {!loadingReferences && verifiedEmployments.length === 0 && (
                                    <div className={`p-10 sm:p-20 rounded-[24px] sm:rounded-[40px] border text-center ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                        <div className={`mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mb-4 sm:mb-6 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                            <Building2 size={32} className={`sm:w-10 sm:h-10 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`} />
                                        </div>
                                        <h3 className={`text-lg sm:text-xl font-bold uppercase tracking-tight mb-2 ${isDark ? 'text-white' : 'text-black'}`}>No Verified Employment</h3>
                                        <p className={`text-xs sm:text-sm font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            This professional has no verified employment history from other companies in the Profcaria network.
                                        </p>
                                    </div>
                                )}

                                {/* Sent Reference Requests Section */}
                                {!loadingReferences && sentRequests.length > 0 && (
                                    <div className={`p-6 rounded-[24px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                        <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                            Your Sent Reference Requests
                                        </h3>
                                        <div className="space-y-3">
                                            {sentRequests.map((req) => {
                                                const getStatusBadge = () => {
                                                    switch (req.status) {
                                                        case 'responded':
                                                            return { label: 'Responded', color: isDark ? 'text-[#6B8CD5] bg-[#3B5998]/20' : 'text-[#3B5998] bg-[#3B5998]/5' };
                                                        case 'viewed':
                                                            return { label: 'Viewed', color: isDark ? 'text-blue-400 bg-blue-500/20' : 'text-blue-600 bg-blue-50' };
                                                        case 'sent':
                                                            return { label: 'Sent', color: isDark ? 'text-yellow-400 bg-yellow-500/20' : 'text-yellow-600 bg-yellow-50' };
                                                        case 'declined':
                                                            return { label: 'Declined', color: isDark ? 'text-red-400 bg-red-500/20' : 'text-red-600 bg-red-50' };
                                                        default:
                                                            return { label: 'Pending', color: isDark ? 'text-neutral-400 bg-neutral-500/20' : 'text-neutral-600 bg-neutral-100' };
                                                    }
                                                };
                                                const statusBadge = getStatusBadge();
                                                return (
                                                    <div key={req.id} className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <Building2 size={16} className={isDark ? 'text-neutral-500' : 'text-neutral-400'} />
                                                            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>{req.targetCompanyName}</span>
                                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusBadge.color}`}>{statusBadge.label}</span>
                                                        </div>
                                                        {req.status === 'responded' && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedRequestId(req.id);
                                                                    setViewResponseModalOpen(true);
                                                                }}
                                                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                                                            >
                                                                View Response
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Verified Employment Cards */}
                                {!loadingReferences && verifiedEmployments.length > 0 && (
                                    <div className="space-y-4">
                                        {verifiedEmployments.map((emp) => {
                                            // Determine termination type display
                                            const getTerminationInfo = () => {
                                                switch (emp.terminationType) {
                                                    case 'resignation':
                                                        return { icon: <LogOut size={14} />, label: 'Resigned', color: isDark ? 'text-[#6B8CD5] bg-[#3B5998]/10 border-[#3B5998]/20' : 'text-[#3B5998] bg-[#3B5998]/5 border-[#3B5998]/20' };
                                                    case 'involuntary':
                                                        return { icon: <UserX size={14} />, label: 'Terminated', color: isDark ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-red-600 bg-red-50 border-red-200' };
                                                    case 'mutual':
                                                        return { icon: <Handshake size={14} />, label: 'Mutual Separation', color: isDark ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-blue-600 bg-blue-50 border-blue-200' };
                                                    default:
                                                        return { icon: <Briefcase size={14} />, label: 'Ended', color: isDark ? 'text-neutral-400 bg-neutral-800 border-neutral-700' : 'text-neutral-500 bg-neutral-100 border-neutral-200' };
                                                }
                                            };
                                            const termInfo = getTerminationInfo();

                                            return (
                                                <div key={emp.id} className={`p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                                    <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
                                                        {/* Company Logo */}
                                                        <div className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl flex items-center justify-center overflow-hidden border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-200'}`}>
                                                            {emp.companyLogo ? (
                                                                <img src={emp.companyLogo} alt={emp.companyName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Building2 size={24} className={isDark ? 'text-neutral-500' : 'text-neutral-400'} />
                                                            )}
                                                        </div>

                                                        {/* Details */}
                                                        <div className="flex-1 space-y-3">
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                                <div>
                                                                    <h4 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{emp.companyName}</h4>
                                                                    <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{emp.jobTitle}</p>
                                                                </div>
                                                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] sm:text-xs font-bold uppercase tracking-widest ${termInfo.color}`}>
                                                                    {termInfo.icon}
                                                                    <span>{termInfo.label}</span>
                                                                </div>
                                                            </div>

                                                            {/* Dates */}
                                                            <div className={`flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                                <span>{new Date(emp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                                                <span>—</span>
                                                                <span>{new Date(emp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                                            </div>

                                                            {/* Termination Reason */}
                                                            {emp.terminationReason && (
                                                                <div className={`mt-4 p-4 rounded-xl border ${isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`}>
                                                                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Reason for {emp.terminationType === 'resignation' ? 'Resignation' : emp.terminationType === 'involuntary' ? 'Termination' : 'Separation'}</p>
                                                                    <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>{emp.terminationReason}</p>
                                                                </div>
                                                            )}

                                                            {/* Contact Info */}
                                                            <div className={`mt-4 pt-4 border-t flex flex-wrap gap-4 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                                                                {emp.companyEmail && (
                                                                    <a href={`mailto:${emp.companyEmail}`} className={`flex items-center gap-2 text-xs font-medium transition-colors ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'}`}>
                                                                        <Mail size={14} />
                                                                        <span>{emp.companyEmail}</span>
                                                                    </a>
                                                                )}
                                                                {emp.companyPhone && (
                                                                    <a href={`tel:${emp.companyPhone}`} className={`flex items-center gap-2 text-xs font-medium transition-colors ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'}`}>
                                                                        <Phone size={14} />
                                                                        <span>{emp.companyPhone}</span>
                                                                    </a>
                                                                )}
                                                                {!emp.companyEmail && !emp.companyPhone && (
                                                                    <span className={`text-xs ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No contact information available</span>
                                                                )}
                                                            </div>

                                                            {/* Ask for Reference Button */}
                                                            {emp.companyEmail && (
                                                                <div className="mt-4 pt-4 border-t flex justify-end" style={{ borderColor: isDark ? '#262626' : '#e5e5e5' }}>
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedEmploymentForRef(emp);
                                                                            setReferenceModalOpen(true);
                                                                        }}
                                                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                                                                    >
                                                                        <MessageSquare size={14} />
                                                                        Ask for Reference
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </main>
            </div>

            {/* Reference Request Modal */}
            {selectedEmploymentForRef && (
                <ReferenceRequestModal
                    isOpen={referenceModalOpen}
                    onClose={() => {
                        setReferenceModalOpen(false);
                        setSelectedEmploymentForRef(null);
                    }}
                    applicationId={applicationId}
                    employment={selectedEmploymentForRef}
                />
            )}

            {/* View Reference Response Modal */}
            {selectedRequestId && (
                <ViewReferenceResponseModal
                    isOpen={viewResponseModalOpen}
                    onClose={() => {
                        setViewResponseModalOpen(false);
                        setSelectedRequestId(null);
                    }}
                    referenceId={selectedRequestId}
                />
            )}
        </div>
    );
}
