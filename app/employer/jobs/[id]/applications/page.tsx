"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Users, Calendar, Clock, Link as LinkIcon, FileText,
    Send, ChevronRight, UserCircle, CheckCircle2, X
} from 'lucide-react';

interface Application {
    id: string;
    status: string;
    formData: Record<string, any>;
    createdAt: string;
    applicant: {
        firstName: string;
        lastName: string;
        profileImageUrl?: string;
    };
}

export default function ViewApplicationsPage() {
    const { id: jobId } = useParams();
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);

    // Interview State
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [schedulingAt, setSchedulingAt] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [notes, setNotes] = useState('');
    const [isScheduling, setIsScheduling] = useState(false);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const res = await fetch(`/api/employer/jobs/${jobId}/applications`);
                if (res.ok) {
                    const data = await res.json();
                    setApplications(data.applications);
                }
            } catch (error) {
                console.error("Error fetching apps", error);
            } finally {
                setLoading(false);
            }
        };
        fetchApps();
    }, [jobId]);

    const handleInvite = (app: Application) => {
        setSelectedApp(app);
        setShowInterviewModal(true);
    };

    const scheduleInterview = async () => {
        if (!schedulingAt || !selectedApp) return;

        setIsScheduling(true);
        try {
            const res = await fetch('/api/employer/interviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId: selectedApp.id,
                    scheduledAt: schedulingAt,
                    meetingLink,
                    notes
                })
            });

            if (res.ok) {
                setApplications(applications.map(a =>
                    a.id === selectedApp.id ? { ...a, status: 'interview_scheduled' } : a
                ));
                setShowInterviewModal(false);
                alert("Interview scheduled successfully!");
            }
        } catch (error) {
            console.error("Invite error", error);
        } finally {
            setIsScheduling(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-32">
            <header className="flex items-center justify-between border-b border-slate-800 pb-8">
                <div className="text-left">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Applicants</h1>
                    <p className="text-slate-400 mt-2">Review encrypted applications and invite to interviews.</p>
                </div>
            </header>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="font-bold text-xs text-slate-500 uppercase tracking-widest text-center">Decrypting candidate pool...</p>
                </div>
            ) : applications.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-slate-600 space-y-4">
                    <Users size={64} className="opacity-10" />
                    <p className="font-bold text-sm uppercase tracking-widest text-center">No applications received yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                    {/* LIST AREA */}
                    <div className="space-y-4">
                        {applications.map((app) => (
                            <button
                                key={app.id}
                                onClick={() => setSelectedApp(app)}
                                className={`w-full text-left p-6 rounded-[32px] border transition-all duration-300 flex items-center justify-between group ${selectedApp?.id === app.id ? 'bg-blue-600/10 border-blue-500/50 shadow-2xl' : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'}`}
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden">
                                        {app.applicant.profileImageUrl ? (
                                            <img src={app.applicant.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-600"><UserCircle size={32} /></div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-white uppercase tracking-tighter">{app.applicant.firstName} {app.applicant.lastName}</h3>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${app.status === 'interview_scheduled' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                {app.status.replace('_', ' ')}
                                            </span>
                                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{new Date(app.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={20} className={`text-slate-700 group-hover:text-blue-500 transition-all ${selectedApp?.id === app.id ? 'translate-x-1 text-blue-500' : ''}`} />
                            </button>
                        ))}
                    </div>

                    {/* DETAIL AREA */}
                    <div className="sticky top-8 bg-[#0f172a] border border-slate-800 rounded-[40px] p-10 min-h-[600px] flex flex-col">
                        {selectedApp ? (
                            <div className="space-y-10 animate-in fade-in duration-300 flex-1">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-4">
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tight">Application Data</h2>
                                        <p className="text-xs text-slate-500 font-bold uppercase">Submitted by <span className="text-blue-400">{selectedApp.applicant.firstName}</span></p>
                                    </div>
                                    {selectedApp.status !== 'interview_scheduled' && (
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => router.push(`/employer/applications/${selectedApp.id}/profile`)}
                                                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-700"
                                            >
                                                View Full Profile
                                            </button>
                                            <button
                                                onClick={() => handleInvite(selectedApp)}
                                                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-blue-600/20"
                                            >
                                                Schedule Interview
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-8 text-left">
                                    {Object.entries(selectedApp.formData).map(([key, value]) => (
                                        <div key={key} className="space-y-2">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Question ID: {key}</p>
                                            <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
                                                <p className="text-slate-200 font-bold leading-relaxed">
                                                    {Array.isArray(value) ? value.join(', ') : value}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-700 space-y-4">
                                <FileText size={48} className="opacity-20" />
                                <p className="font-bold text-xs uppercase tracking-widest">Select an applicant to view data</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* INTERVIEW MODAL */}
            {showInterviewModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowInterviewModal(false)}></div>
                    <div className="relative w-full max-w-lg bg-[#0f172a] border border-slate-700 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">Schedule Interview</h3>
                            <button onClick={() => setShowInterviewModal(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Calendar size={14} /> Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={schedulingAt}
                                    onChange={(e) => setSchedulingAt(e.target.value)}
                                    className="w-full bg-slate-910 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><LinkIcon size={14} /> Meeting Link</label>
                                <input
                                    type="text"
                                    value={meetingLink}
                                    onChange={(e) => setMeetingLink(e.target.value)}
                                    placeholder="https://meet.google.com/..."
                                    className="w-full bg-slate-910 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>
                            <div className="space-y-2 text-left">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><FileText size={14} /> Brief Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any instructions for the candidate..."
                                    className="w-full bg-slate-910 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[100px]"
                                />
                            </div>
                        </div>
                        <div className="p-8 bg-slate-900/50 flex gap-4">
                            <button
                                onClick={scheduleInterview}
                                disabled={isScheduling || !schedulingAt}
                                className="flex-1 py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                            >
                                {isScheduling ? 'Sending Invite...' : 'Send Invitation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
