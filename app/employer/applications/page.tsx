"use client"

import React, { useState, useEffect, useRef, Suspense } from 'react';
export const dynamic = 'force-dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    FileText, Search, User, CheckCircle2, XCircle, Clock, ExternalLink, X, Briefcase, Filter, Send, UserCircle, Building2
} from 'lucide-react';

interface Application {
    id: string;
    status: string;
    createdAt: string; // Ensure backend sends this mapped from created_at or createdAt
    formData?: Record<string, any>;
    job: {
        id: string;
        title: string;
    };

    user: {
        id: string;
        name: string;
        profileImageUrl?: string;
    };
    artifacts?: { type: string, content: string }[];
}

function ApplicationsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const jobIdFilter = searchParams.get('jobId');

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'pre_qualified' | 'employed'>('all');
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [activeTab, setActiveTab] = useState<'profile' | 'chat'>('profile');
    const [viewingArtifact, setViewingArtifact] = useState<string | null>(null);

    // Chat State
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Initial load
    useEffect(() => {
        fetchApplications();
    }, []);

    // Scroll chat to bottom
    useEffect(() => {
        if (activeTab === 'chat' && chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages, activeTab]);

    const fetchApplications = async () => {
        try {
            const res = await fetch('/api/employer/applications');
            if (res.ok) {
                const data = await res.json();
                // Map created_at to createdAt if needed, though interface expects it.
                // The API usually returns snake_case from DB but specific routes might have mapped it.
                // Let's ensure we handle both just in case or trust the interface if API is aligned.
                // Based on previous reads, the LIST endpoint returns `applications` with joined data.
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
                    // Merge details into the selected app state
                    setSelectedApp(prev => prev ? { ...prev, ...data.application } : data.application);
                }
            }
            // Fetch messages too
            const msgRes = await fetch(`/api/shared/messages?applicationId=${appId}`);
            if (msgRes.ok) {
                const msgData = await msgRes.json();
                setChatMessages(msgData.messages || []);
            }
        } catch (error) {
            console.error('Error fetching details:', error);
        }
    };

    const handleSelectApp = (app: Application) => {
        setSelectedApp(app);
        setActiveTab('profile'); // Reset tab
        setViewingArtifact(null); // Reset artifact view
        // AUTO OPEN: Fetch details immediately
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

                // If currently selected, update local state too
                if (selectedApp?.id === appId) {
                    setSelectedApp(prev => prev ? { ...prev, status: newStatus } : null);
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedApp || isSending) return;
        setIsSending(true);
        try {
            const res = await fetch('/api/shared/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId: selectedApp.id,
                    content: newMessage
                })
            });
            if (res.ok) {
                const data = await res.json();
                setChatMessages([...chatMessages, { ...data.message, content: newMessage }]);
                setNewMessage('');
            }
        } catch (error) {
            console.error("Error sending message", error);
        } finally {
            setIsSending(false);
        }
    };

    const filteredApps = applications.filter(app => {
        const matchesSearch = app.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.job.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesJob = jobIdFilter ? app.job.id === jobIdFilter : true;

        // Hide rejected/declined unless we specifically want a 'history' tab (not requested yet)
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
        <div className="p-8 h-screen flex flex-col overflow-hidden">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0 mb-8">
                <div className="text-left">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                        <FileText size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Applicant Tracking</span>
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                        {jobIdFilter ? 'Job Applicants' : 'All Applications'}
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm font-medium">Review and manage your recruitment pipeline.</p>
                </div>
                {jobIdFilter && (
                    <button
                        onClick={() => router.push('/employer/applications')}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                    >
                        <X size={14} /> Clear Filter
                    </button>
                )}
            </header>

            <div className="flex gap-6 flex-1 min-h-0">
                {/* LEFT LIST PANEL */}
                <div className="w-full lg:w-1/3 flex flex-col bg-[#0f172a]/50 border border-slate-800 rounded-[32px] overflow-hidden">
                    <div className="p-4 border-b border-slate-800 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {(['all', 'pending', 'pre_qualified', 'employed'] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${statusFilter === s
                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                        : 'bg-slate-800 text-slate-500 border-transparent hover:border-slate-700'
                                        }`}
                                >
                                    {s.replace('_', '-')} ({getCount(s)})
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {loading ? (
                            <div className="text-center py-10 text-slate-500 text-xs uppercase tracking-widest">Loading...</div>
                        ) : filteredApps.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-xs uppercase tracking-widest">No applications found</div>
                        ) : (
                            filteredApps.map(app => (
                                <button
                                    key={app.id}
                                    onClick={() => handleSelectApp(app)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all group relative ${selectedApp?.id === app.id
                                        ? 'bg-emerald-600/10 border-emerald-500/50'
                                        : 'bg-slate-900/50 border-slate-800 hover:border-emerald-500/20'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 overflow-hidden">
                                            {app.user.profileImageUrl ? (
                                                <img src={app.user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={20} />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className={`text-sm font-bold truncate ${selectedApp?.id === app.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                                {app.user.name}
                                            </h4>
                                            <p className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                                                <Briefcase size={10} /> {app.job.title}
                                            </p>
                                        </div>
                                        <div className="shrink-0 flex flex-col items-end gap-1">
                                            <span className={`w-2 h-2 rounded-full ${app.status === 'pending' ? 'bg-amber-500' :
                                                app.status === 'pre_qualified' ? 'bg-blue-500' :
                                                    app.status === 'employed' ? 'bg-emerald-500' : 'bg-slate-500'
                                                }`} />
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT DETAIL PANEL */}
                <div className="flex-1 bg-[#0f172a] border border-slate-800 rounded-[32px] overflow-hidden flex flex-col relative w-full h-full">
                    {selectedApp ? (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                            {/* Header */}
                            <div className="p-8 border-b border-slate-800 shrink-0 flex items-start justify-between bg-slate-900/30">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 overflow-hidden">
                                        {selectedApp.user.profileImageUrl ? (
                                            <img src={selectedApp.user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : <UserCircle size={40} />}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{selectedApp.user.name}</h2>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Briefcase size={12} /> {selectedApp.job.title}
                                            </span>
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${selectedApp.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                selectedApp.status === 'pre_qualified' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    selectedApp.status === 'employed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                        'bg-slate-800 text-slate-500 border-slate-700'
                                                }`}>
                                                {selectedApp.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-slate-800">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-slate-800 text-white border-b-2 border-emerald-500' : 'text-slate-500 hover:text-white'}`}
                                >
                                    Details & Actions
                                </button>
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-slate-800 text-white border-b-2 border-blue-500' : 'text-slate-500 hover:text-white'}`}
                                >
                                    Messages
                                </button>
                            </div>

                            {/* Content */}
                            {activeTab === 'profile' ? (
                                <div className="flex-1 overflow-y-auto bg-[#0f172a]">
                                    <div className="p-8 space-y-8">
                                        {/* Actions */}
                                        <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Workflow Actions</h3>
                                            <div className="flex flex-wrap gap-4">
                                                {selectedApp.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateStatus(selectedApp.id, 'pre_qualified')}
                                                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"
                                                        >
                                                            <CheckCircle2 size={16} /> Accept (Pre-qualify)
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(selectedApp.id, 'rejected')}
                                                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                                                        >
                                                            <XCircle size={16} /> Reject
                                                        </button>
                                                    </>
                                                )}
                                                {selectedApp.status === 'pre_qualified' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateStatus(selectedApp.id, 'employed')}
                                                            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center gap-2"
                                                        >
                                                            <Briefcase size={16} /> Employ Candidate
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(selectedApp.id, 'declined')}
                                                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                                                        >
                                                            <XCircle size={16} /> Decline
                                                        </button>
                                                    </>
                                                )}
                                                {selectedApp.status === 'employed' && (
                                                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                                                        <CheckCircle2 size={16} />
                                                        Candidate is employed. Use Contracts section for next steps.
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Form Data */}
                                        <div className="space-y-6">
                                            {selectedApp.formData && Object.keys(selectedApp.formData).length > 0 && (
                                                <div className="space-y-4">
                                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Application Questions</h3>
                                                    {Object.entries(selectedApp.formData).map(([key, value]) => (
                                                        <div key={key} className="space-y-2">
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                                <FileText size={12} /> {key}
                                                            </p>
                                                            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl overflow-auto text-slate-300 text-sm">
                                                                {typeof value === 'string' && value.includes('<') ? (
                                                                    <div dangerouslySetInnerHTML={{ __html: value }} />
                                                                ) : (
                                                                    <p className="whitespace-pre-wrap leading-relaxed font-sans">{Array.isArray(value) ? value.join(', ') : String(value)}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Contact Information */}
                                            {(selectedApp.user as any).email || (selectedApp.user as any).phone ? (
                                                <div className="space-y-4 pt-6">
                                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Contact Information</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {(selectedApp.user as any).email && (
                                                            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Email</p>
                                                                <p className="text-sm text-slate-300 font-medium">{(selectedApp.user as any).email}</p>
                                                            </div>
                                                        )}
                                                        {(selectedApp.user as any).phone && (
                                                            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Phone</p>
                                                                <p className="text-sm text-slate-300 font-medium">{(selectedApp.user as any).phone}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : null}

                                            {/* Artifacts (Profile Data) */}
                                            {selectedApp.artifacts && selectedApp.artifacts.length > 0 && (
                                                <div className="space-y-6 pt-6 animate-in slide-in-from-bottom-4 duration-500">
                                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Candidate Profile</h3>

                                                    {/* Artifact Selection Buttons */}
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedApp.artifacts.map((art) => (
                                                            <button
                                                                key={art.type}
                                                                onClick={() => setViewingArtifact(viewingArtifact === art.type ? null : art.type)}
                                                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${viewingArtifact === art.type
                                                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                                                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:border-slate-600'
                                                                    }`}
                                                            >
                                                                {art.type}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Viewer */}
                                                    {viewingArtifact && (
                                                        <div className="animate-in fade-in zoom-in-95 duration-300">
                                                            <div className="bg-slate-900/30 rounded-2xl p-6 border border-slate-800/50 text-slate-300 text-sm overflow-hidden">
                                                                <div className="flex items-center justify-between mb-4 border-b border-slate-800/50 pb-4">
                                                                    <h4 className="text-sm font-black text-white uppercase tracking-tighter">{viewingArtifact}</h4>
                                                                    <button onClick={() => setViewingArtifact(null)} className="text-slate-500 hover:text-white"><XCircle size={14} /></button>
                                                                </div>
                                                                <div
                                                                    className="prose prose-invert prose-sm max-w-none text-slate-300
                                                                    [&_h1]:text-white [&_h1]:font-black [&_h1]:uppercase
                                                                    [&_h2]:text-slate-200 [&_h2]:font-bold
                                                                    [&_a]:text-blue-400 [&_a]:underline
                                                                    "
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: selectedApp.artifacts.find(a => a.type === viewingArtifact)?.content || ''
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="pt-4 border-t border-slate-800">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                                                <Clock size={12} /> Applied On
                                            </p>
                                            <p className="text-sm text-slate-300">
                                                {/* Use createdAt or created_at, handling potential undefined */}
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
                                </div>

                            ) : (
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                                        {chatMessages.length === 0 ? (
                                            <div className="text-center text-slate-500 py-10 text-sm">No messages yet.</div>
                                        ) : (
                                            chatMessages.map((msg, i) => {
                                                const isMe = msg.sender_type === 'employer';
                                                return (
                                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[80%] space-y-1 ${isMe ? 'text-right' : 'text-left'}`}>
                                                            <div className={`p-4 rounded-[24px] text-sm font-medium ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'}`}>
                                                                {msg.content}
                                                            </div>
                                                            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest px-2">
                                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <div className="p-4 bg-slate-900 border-t border-slate-800 mt-auto">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                                placeholder="Type a message..."
                                                className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                            />
                                            <button
                                                onClick={handleSendMessage}
                                                disabled={!newMessage.trim() || isSending}
                                                className="absolute right-2 top-2 bottom-2 w-10 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-500 disabled:opacity-50"
                                            >
                                                <Send size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-4">
                            <Filter size={64} className="opacity-20" />
                            <p className="font-bold text-sm uppercase tracking-widest">Select an applicant to view details</p>
                        </div>
                    )}
                </div>
            </div >
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
