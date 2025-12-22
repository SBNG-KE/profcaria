"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FileText, Search, User, CheckCircle2, XCircle, Clock, ExternalLink, Shield, X, Building2, Eye, Briefcase, ChevronRight
} from 'lucide-react';

interface Application {
    id: string;
    status: string;
    createdAt: string;
    job: {
        id: string;
        title: string;
    };
    user: {
        id: string;
        name: string;
    };
}

interface ProfileData {
    profile: {
        id: string;
        firstName: string;
        lastName: string;
        role: string;
        profileImageUrl: string | null;
        email: string;
    };
    sharedDocuments: {
        type: string;
        content: string;
        lastUpdated: string;
    }[];
    accessList: string[];
}

const ApplicationRow = ({ app, onAccept, onReject, onView, onViewJob }: {
    app: Application,
    onAccept: () => void,
    onReject: () => void,
    onView: () => void,
    onViewJob: () => void
}) => (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
        <td className="py-5 px-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-slate-500 overflow-hidden relative">
                    <User size={20} />
                    <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div>
                    <span className="text-sm font-bold text-white block">{app.user.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Applicant</span>
                </div>
            </div>
        </td>
        <td className="py-5 px-6">
            <button
                onClick={onViewJob}
                className="flex items-center gap-2 text-xs text-slate-300 font-medium hover:text-emerald-400 transition-colors group/job"
            >
                <Briefcase size={12} />
                <span>{app.job.title}</span>
                <ChevronRight size={12} className="opacity-0 group-hover/job:opacity-100 transition-opacity" />
            </button>
        </td>
        <td className="py-5 px-6">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${app.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    app.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        app.status === 'interview_scheduled' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                            app.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-slate-800 text-slate-400 border border-white/5'
                }`}>
                {app.status === 'interview_scheduled' ? 'Interview' : app.status}
            </span>
        </td>
        <td className="py-5 px-6">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <Clock size={12} />
                {new Date(app.createdAt).toLocaleDateString()}
            </div>
        </td>
        <td className="py-5 px-6 text-right">
            <div className="flex items-center justify-end gap-2">
                <button
                    onClick={onView}
                    className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
                    title="View Profile"
                >
                    <Eye size={16} />
                </button>
                {(app.status === 'pending' || app.status === 'applied') && (
                    <>
                        <button
                            onClick={onAccept}
                            className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all"
                            title="Accept"
                        >
                            <CheckCircle2 size={16} />
                        </button>
                        <button
                            onClick={onReject}
                            className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                            title="Reject"
                        >
                            <XCircle size={16} />
                        </button>
                    </>
                )}
            </div>
        </td>
    </tr>
);

export default function ApplicationsPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedApplicant, setSelectedApplicant] = useState<Application | null>(null);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [activeDocument, setActiveDocument] = useState<string | null>(null);

    const pendingCount = applications.filter(a => a.status === 'pending' || a.status === 'applied').length;

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
            setIsLoading(false);
        }
    };

    const handleViewProfile = (app: Application) => {
        router.push(`/employer/applications/${app.id}/profile`);
    };

    const handleAccept = async (appId: string) => {
        try {
            const res = await fetch(`/api/employer/applications/${appId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'accepted' })
            });
            if (res.ok) {
                setApplications(prev => prev.map(a =>
                    a.id === appId ? { ...a, status: 'accepted' } : a
                ));
            }
        } catch (error) {
            console.error('Error accepting application:', error);
        }
    };

    const handleReject = async (appId: string) => {
        try {
            const res = await fetch(`/api/employer/applications/${appId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'rejected' })
            });
            if (res.ok) {
                setApplications(prev => prev.map(a =>
                    a.id === appId ? { ...a, status: 'rejected' } : a
                ));
            }
        } catch (error) {
            console.error('Error rejecting application:', error);
        }
    };

    const filteredApps = applications.filter(app =>
        app.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="text-left">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <FileText size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Applicant Tracking</span>
                        </div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Job Applications</h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">Review talent submissions and manage secure profile access.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {pendingCount > 0 && (
                            <span className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                                {pendingCount} Pending
                            </span>
                        )}
                        <span className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {applications.length} Total
                        </span>
                    </div>
                </header>

                {/* Toolbar */}
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search applicants or roles..."
                            className="w-full bg-[#0f172a]/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Applications Table */}
                <div className="bg-[#0f172a]/30 border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-slate-500">Loading applications...</p>
                        </div>
                    ) : filteredApps.length === 0 ? (
                        <div className="p-12 text-center space-y-4">
                            <FileText size={48} className="text-slate-700 mx-auto" />
                            <h4 className="text-lg font-bold text-slate-400">No Applications Yet</h4>
                            <p className="text-slate-500 text-sm">Applications will appear here when professionals apply to your jobs.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Candidate</th>
                                        <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Position</th>
                                        <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                                        <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Applied</th>
                                        <th className="py-5 px-6 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredApps.map(app => (
                                        <ApplicationRow
                                            key={app.id}
                                            app={app}
                                            onAccept={() => handleAccept(app.id)}
                                            onReject={() => handleReject(app.id)}
                                            onView={() => handleViewProfile(app)}
                                            onViewJob={() => router.push(`/employer/jobs/${app.job.id}/applications`)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
