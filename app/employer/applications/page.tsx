"use client"

import React, { useState, useEffect, Suspense } from 'react';
export const dynamic = 'force-dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    FileText, Search, User, CheckCircle2, XCircle, Clock, ExternalLink, X, Briefcase, Filter, UserCircle, Building2, ChevronLeft, MessageSquare
} from 'lucide-react';
import VerificationBadge from '@/app/components/VerificationBadge';
import ScrollableContainer from '@/app/components/ScrollableContainer';
import { sanitizeHtml } from '@/lib/sanitize';
import EmployerProfileViewModal from '../components/EmployerProfileViewModal';
import { useTheme } from '@/app/context/ThemeContext';

interface Application {
    id: string;
    status: string;
    createdAt: string;
    formData?: Record<string, any>;
    job: {
        id: string;
        title: string;
    };

    user: {
        id: string;
        name: string;
        profileImageUrl?: string;
        badgeType?: string;
    };
    artifacts?: { type: string, content: string }[];
}

function ApplicationsPageContent() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobIdFilter = searchParams.get('jobId');

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'shortlisted' | 'employed'>('all');
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'profile' | 'chat'>('profile');
    const [viewingArtifact, setViewingArtifact] = useState<string | null>(null);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'reject' | 'decline' | null;
        appId: string | null;
    }>({ isOpen: false, type: null, appId: null });

    // Initial load
    useEffect(() => {
        fetchApplications();
    }, []);



    const fetchApplications = async () => {
        try {
            const res = await fetch('/api/employer/applications');
            if (res.ok) {
                const data = await res.json();
                setApplications(data.applications || []);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchApplicationDetails = async (appId: string) => {
        try {
            const res = await fetch(`/api/employer/applications/${appId}`);
            if (res.ok) {
                const data = await res.json();
                if (data.application) {
                    setSelectedApp(prev => prev ? { ...prev, ...data.application } : data.application);
                }
            }

        } catch (error) {
            console.error('Error fetching details:', error);
        }
    };

    const handleSelectApp = (app: Application) => {
        setSelectedApp(app);
        setActiveTab('profile');
        setViewingArtifact(null);
        fetchApplicationDetails(app.id);
    };

    const updateStatus = async (appId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/employer/applications/${appId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setApplications(prev => prev.map(a =>
                    a.id === appId ? { ...a, status: newStatus } : a
                ));
                if (selectedApp?.id === appId) {
                    setSelectedApp(prev => prev ? { ...prev, status: newStatus } : null);
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleRejectOrDecline = (appId: string, type: 'reject' | 'decline') => {
        setConfirmModal({ isOpen: true, type, appId });
    };

    const confirmRejectOrDecline = () => {
        if (confirmModal.appId && confirmModal.type) {
            const status = confirmModal.type === 'reject' ? 'rejected' : 'declined';
            updateStatus(confirmModal.appId, status);
        }
        setConfirmModal({ isOpen: false, type: null, appId: null });
    };

    const handleOpenMessages = () => {
        if (selectedApp) {
            router.push(`/employer/notifications`);
        }
    };

    const filteredApps = applications.filter(app => {
        const matchesSearch = app.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.job.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesJob = jobIdFilter ? app.job.id === jobIdFilter : true;
        const isHidden = app.status === 'rejected' || app.status === 'declined';
        if (isHidden) return false;
        const matchesStatus = statusFilter === 'all' ? true : app.status === statusFilter;
        return matchesSearch && matchesJob && matchesStatus;
    });

    const getCount = (status: string) => {
        return applications.filter(a => {
            if (a.status === 'rejected' || a.status === 'declined') return false;
            if (jobIdFilter && a.job.id !== jobIdFilter) return false;
            return status === 'all' ? true : a.status === status;
        }).length;
    };

    return (
        <div className={`p-4 md:p-8 h-screen flex flex-col overflow-hidden ${isDark ? 'bg-black text-white' : 'bg-neutral-50 text-black'}`}>
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0 mb-8">
                <div className="text-left">
                    <div className={`flex items-center gap-2 mb-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        <FileText size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Applicant Tracking</span>
                    </div>
                    <h1 className={`text-4xl font-black uppercase tracking-tighter leading-none ${isDark ? 'text-white' : 'text-black'}`}>
                        {jobIdFilter ? 'Job Applicants' : 'All Applications'}
                    </h1>
                    <p className={`mt-2 text-sm font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Review and manage your recruitment pipeline.</p>
                </div>
                {jobIdFilter && (
                    <button
                        onClick={() => router.push('/employer/applications')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300' : 'bg-white hover:bg-neutral-100 text-neutral-700 shadow-sm border border-neutral-200'}`}
                    >
                        <X size={14} /> Clear Filter
                    </button>
                )}
            </header>

            <div className="flex gap-6 flex-1 min-h-0">
                {/* LEFT LIST PANEL */}
                <div className={`w-full lg:w-1/3 flex-col rounded-[32px] overflow-hidden border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'} ${selectedApp ? 'hidden lg:flex' : 'flex'}`}>
                    <div className={`p-4 border-b space-y-4 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                        <div className="relative">
                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`} size={16} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none border ${isDark ? 'bg-neutral-800 border-neutral-700 text-white focus:border-neutral-500' : 'bg-neutral-50 border-neutral-200 text-black focus:border-neutral-400'}`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {(['all', 'pending', 'shortlisted', 'employed'] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${statusFilter === s
                                        ? (isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black')
                                        : (isDark ? 'bg-neutral-800 text-neutral-500 border-transparent hover:border-neutral-700' : 'bg-neutral-100 text-neutral-500 border-transparent hover:border-neutral-300')
                                        }`}
                                >
                                    {s.replace('_', '-')} ({getCount(s)})
                                </button>
                            ))}
                        </div>
                    </div>

                    <ScrollableContainer className="p-4 space-y-2 scrollbar-hide">
                        {loading ? (
                            <div className={`text-center py-10 text-xs uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Loading...</div>
                        ) : filteredApps.length === 0 ? (
                            <div className={`text-center py-10 text-xs uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>No applications found</div>
                        ) : (
                            filteredApps.map(app => (
                                <button
                                    key={app.id}
                                    onClick={() => handleSelectApp(app)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all group relative ${selectedApp?.id === app.id
                                        ? (isDark ? 'bg-neutral-800 border-neutral-600' : 'bg-neutral-100 border-neutral-400')
                                        : (isDark ? 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-600' : 'bg-white border-neutral-100 hover:border-neutral-400 shadow-sm')
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-neutral-100 text-neutral-400'}`}>
                                            {app.user.profileImageUrl ? (
                                                <img src={app.user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={20} />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className={`text-sm font-bold truncate flex items-center gap-1 ${selectedApp?.id === app.id ? (isDark ? 'text-white' : 'text-black') : (isDark ? 'text-neutral-300 group-hover:text-white' : 'text-neutral-700 group-hover:text-black')}`}>
                                                {app.user.name}
                                                <VerificationBadge tier={app.user.badgeType} size={12} />
                                            </h4>
                                            <p className={`text-[10px] flex items-center gap-1 truncate ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                <Briefcase size={10} /> {app.job.title}
                                            </p>
                                        </div>
                                        <div className="shrink-0 flex flex-col items-end gap-1">
                                            <span className={`w-2 h-2 rounded-full ${app.status === 'pending' ? 'bg-amber-500' :
                                                app.status === 'shortlisted' ? 'bg-blue-500' :
                                                    app.status === 'employed' ? 'bg-emerald-500' : (isDark ? 'bg-neutral-500' : 'bg-neutral-300')
                                                }`} />
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </ScrollableContainer>
                </div>

                {/* RIGHT DETAIL PANEL */}
                <div className={`flex-1 rounded-[32px] overflow-hidden flex-col relative w-full h-full border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'} ${selectedApp ? 'flex' : 'hidden lg:flex'}`}>
                    {selectedApp ? (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            {/* Mobile Back Button */}
                            <div className={`lg:hidden p-4 border-b flex items-center gap-2 ${isDark ? 'border-neutral-800 bg-neutral-900/50' : 'border-neutral-200 bg-white'}`}>
                                <button onClick={() => setSelectedApp(null)} className={`p-2 -ml-2 ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'}`}>
                                    <ChevronLeft size={20} />
                                </button>
                                <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>Back to List</span>
                            </div>
                            {/* Header */}
                            <div className={`p-8 border-b shrink-0 flex items-start justify-between ${isDark ? 'border-neutral-800 bg-neutral-900/30' : 'border-neutral-200 bg-neutral-50/50'}`}>
                                <div className="flex items-center gap-6">
                                    <div className={`w-20 h-20 rounded-3xl border flex items-center justify-center overflow-hidden ${isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-500' : 'bg-white border-neutral-200 text-neutral-400 shadow-sm'}`}>
                                        {selectedApp.user.profileImageUrl ? (
                                            <img src={selectedApp.user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : <UserCircle size={40} />}
                                    </div>
                                    <div>
                                        <h2 className={`text-3xl font-black uppercase tracking-tighter flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                                            {selectedApp.user.name}
                                            <VerificationBadge tier={selectedApp.user.badgeType} size={24} />
                                        </h2>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-white text-neutral-600 border border-neutral-200'}`}>
                                                <Briefcase size={12} /> {selectedApp.job.title}
                                            </span>
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${selectedApp.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                selectedApp.status === 'shortlisted' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    selectedApp.status === 'employed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                        (isDark ? 'bg-neutral-800 text-neutral-500 border-neutral-700' : 'bg-neutral-100 text-neutral-500 border-neutral-200')
                                                }`}>
                                                {selectedApp.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className={`flex border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? (isDark ? 'bg-neutral-800 text-white border-b-2 border-white' : 'bg-neutral-50 text-black border-b-2 border-black') : (isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black')}`}
                                >
                                    Details & Actions
                                </button>
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'chat' ? (isDark ? 'bg-neutral-800 text-white border-b-2 border-white' : 'bg-neutral-50 text-black border-b-2 border-black') : (isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black')}`}
                                >
                                    Messages
                                </button>
                            </div>

                            {/* Content */}
                            {activeTab === 'profile' ? (
                                <ScrollableContainer className={`${isDark ? 'bg-neutral-950' : 'bg-white'} scrollbar-hide`}>
                                    <div className="p-8 space-y-8">
                                        {/* 1. Application Questions (Form Data) - FIRST */}
                                        {selectedApp.formData && Object.keys(selectedApp.formData).length > 0 && (
                                            <div className="space-y-4">
                                                <h3 className={`text-xs font-black uppercase tracking-widest border-b pb-2 flex items-center gap-2 ${isDark ? 'text-neutral-300 border-neutral-800' : 'text-neutral-700 border-neutral-200'}`}>
                                                    <FileText size={14} /> Application Answers
                                                </h3>
                                                {Object.entries(selectedApp.formData).map(([key, value]) => (
                                                    <div key={key} className="space-y-2">
                                                        <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                            <FileText size={12} /> {key}
                                                        </p>
                                                        <div className={`p-4 rounded-xl overflow-auto text-sm border ${isDark ? 'bg-neutral-900/50 border-neutral-800 text-neutral-300' : 'bg-neutral-50 border-neutral-200 text-neutral-700'}`}>
                                                            {typeof value === 'string' && value.includes('<') ? (
                                                                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }} />
                                                            ) : (
                                                                <p className="whitespace-pre-wrap leading-relaxed font-sans">{Array.isArray(value) ? value.join(', ') : String(value)}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* 2. Candidate Profile - SECOND */}
                                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                                            <h3 className={`text-xs font-black uppercase tracking-widest border-b pb-2 ${isDark ? 'text-neutral-300 border-neutral-800' : 'text-neutral-700 border-neutral-200'}`}>Candidate Profile</h3>

                                            {/* Contact Information */}
                                            {((selectedApp.user as any).email || (selectedApp.user as any).phone) && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {(selectedApp.user as any).email && (
                                                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                                                            <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Email</p>
                                                            <p className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>{(selectedApp.user as any).email}</p>
                                                        </div>
                                                    )}
                                                    {(selectedApp.user as any).phone && (
                                                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                                                            <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Phone</p>
                                                            <p className={`text-sm font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>{(selectedApp.user as any).phone}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className={`p-6 rounded-2xl border flex flex-col items-center text-center space-y-4 ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-white border border-neutral-200 text-neutral-400'}`}>
                                                    <FileText size={32} />
                                                </div>
                                                <div>
                                                    <h4 className={`font-bold uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Full Profile Snapshot</h4>
                                                    <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>View the professional's profile and shared documents.</p>
                                                </div>
                                                <button
                                                    onClick={() => setViewingProfileId(selectedApp.id)}
                                                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2 ${isDark ? 'bg-white text-black hover:bg-neutral-200 shadow-white/10' : 'bg-black text-white hover:bg-neutral-800 shadow-black/10'}`}
                                                >
                                                    <ExternalLink size={16} /> View Candidate Profile
                                                </button>
                                            </div>
                                        </div>

                                        {/* 3. Workflow Actions - LAST */}
                                        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                                            <h3 className={`text-xs font-black uppercase tracking-widest mb-4 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Workflow Actions</h3>
                                            <div className="flex flex-wrap gap-4">
                                                {selectedApp.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateStatus(selectedApp.id, 'shortlisted')}
                                                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center gap-2"
                                                        >
                                                            <CheckCircle2 size={16} /> Shortlist
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectOrDecline(selectedApp.id, 'reject')}
                                                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400' : 'bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200'}`}
                                                        >
                                                            <XCircle size={16} /> Reject
                                                        </button>
                                                    </>
                                                )}
                                                {selectedApp.status === 'shortlisted' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateStatus(selectedApp.id, 'employed')}
                                                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center gap-2"
                                                        >
                                                            <Briefcase size={16} /> Employ Candidate
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectOrDecline(selectedApp.id, 'decline')}
                                                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400' : 'bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200'}`}
                                                        >
                                                            <XCircle size={16} /> Decline
                                                        </button>
                                                    </>
                                                )}
                                                {selectedApp.status === 'employed' && (
                                                    <div className="w-full flex items-center justify-center gap-2 text-emerald-500 text-sm font-black uppercase tracking-widest py-2">
                                                        <CheckCircle2 size={18} />
                                                        Candidate Employed
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Applied On Date */}
                                        <div className={`pt-4 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                                            <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                <Clock size={12} /> Applied On
                                            </p>
                                            <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                {(selectedApp.createdAt || (selectedApp as any).created_at) ? new Date(selectedApp.createdAt || (selectedApp as any).created_at).toLocaleDateString(undefined, {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : 'Date not available'}
                                            </p>
                                        </div>
                                    </div>
                                </ScrollableContainer>

                            ) : (
                                <div className="flex flex-col h-full items-center justify-center p-8 space-y-4">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                        <MessageSquare size={28} className={isDark ? 'text-neutral-400' : 'text-neutral-500'} />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-black'}`}>Message {selectedApp.user.name.split(' ')[0]}</h3>
                                        <p className={`text-xs max-w-[200px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            Chat with this applicant in the messages hub for a better experience.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleOpenMessages}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                                    >
                                        <MessageSquare size={16} />
                                        Open Conversation
                                    </button>
                                </div>
                            )}
                        </div>

                    ) : (
                        <div className={`flex-1 flex flex-col items-center justify-center space-y-4 ${isDark ? 'text-neutral-600' : 'text-neutral-300'}`}>
                            <Filter size={64} className="opacity-20" />
                            <p className="font-bold text-sm uppercase tracking-widest">Select an applicant to view details</p>
                        </div>
                    )}
                </div>
            </div >

            {/* Confirmation Modal for Reject/Decline */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setConfirmModal({ isOpen: false, type: null, appId: null })} />
                    <div className={`relative border rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                <XCircle className="text-amber-500" size={32} />
                            </div>
                            <h3 className={`text-xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                                {confirmModal.type === 'reject' ? 'Reject Application?' : 'Decline Candidate?'}
                            </h3>
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                            <p className="text-amber-500 text-sm text-center font-medium">
                                ⚠️ <strong>Important:</strong> Please make sure you have written a message to the applicant explaining why you have {confirmModal.type === 'reject' ? 'rejected' : 'declined'} them.
                            </p>
                        </div>

                        <p className={`text-sm text-center mb-8 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            This helps candidates understand your decision and improves their future applications.
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setConfirmModal({ isOpen: false, type: null, appId: null })}
                                className={`flex-1 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'}`}
                            >
                                No, Cancel
                            </button>
                            <button
                                onClick={confirmRejectOrDecline}
                                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 active:scale-95"
                            >
                                Yes, {confirmModal.type === 'reject' ? 'Reject' : 'Decline'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PROFILE VIEW MODAL */}
            {viewingProfileId && (
                <EmployerProfileViewModal
                    applicationId={viewingProfileId}
                    onClose={() => setViewingProfileId(null)}
                />
            )}
        </div >
    );
}

export default function ApplicationsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-slate-500 uppercase tracking-widest text-xs">Loading Workspace...</div>}>
            <ApplicationsPageContent />
        </Suspense>
    );
}
