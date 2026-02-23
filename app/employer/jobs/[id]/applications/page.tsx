"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Users, Calendar, Clock, Link as LinkIcon, FileText,
    Send, ChevronRight, UserCircle, CheckCircle2, X, Eye, Lock, Unlock, Star
} from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize';
import EmployerProfileViewModal from '../../../components/EmployerProfileViewModal';

interface Application {
    id: string;
    status: string;
    formData: Record<string, any>;
    createdAt: string;
    is_starred?: boolean;
    user_id?: string;
    applicant: {
        firstName: string;
        lastName: string;
        profileImageUrl?: string;
    };
    wasInvited?: boolean;
    progression?: any[];
}

export default function ViewApplicationsPage() {
    const { id: jobId } = useParams();
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

    // Filter state
    const [filterType, setFilterType] = useState<'all' | 'starred' | 'employed'>('all');
    const [togglingStarId, setTogglingStarId] = useState<string | null>(null);

    // Toggle star handler
    const handleToggleStar = async (e: React.MouseEvent, app: Application) => {
        e.stopPropagation();
        if (togglingStarId) return;
        setTogglingStarId(app.id);
        try {
            const res = await fetch(`/api/employer/jobs/${jobId}/applications`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: app.id, isStarred: !app.is_starred })
            });
            if (res.ok) {
                const data = await res.json();
                setApplications(prev => prev.map(a =>
                    a.id === app.id ? { ...a, is_starred: data.isStarred } : a
                ));
                if (selectedApp?.id === app.id) {
                    setSelectedApp(prev => prev ? { ...prev, is_starred: data.isStarred } : prev);
                }
            }
        } catch (error) {
            console.error('Error toggling star:', error);
        } finally {
            setTogglingStarId(null);
        }
    };

    // Filter applications
    const filteredApplications = applications.filter(app => {
        if (filterType === 'starred') return app.is_starred;
        if (filterType === 'employed') return app.status === 'employed';
        return true;
    });

    // Interview State
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [schedulingAt, setSchedulingAt] = useState('');
    const [meetingLink, setMeetingLink] = useState('');
    const [notes, setNotes] = useState('');
    const [isScheduling, setIsScheduling] = useState(false);

    // Messaging State
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatEndRef = React.useRef<HTMLDivElement>(null);

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

    const fetchMessages = async (appId: string) => {
        try {
            const res = await fetch(`/api/shared/messages?applicationId=${appId}`);
            if (res.ok) {
                const data = await res.json();
                setChatMessages(data.messages || []);
            }
        } catch (error) {
            console.error("Error fetching messages", error);
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

    const handleInvite = (app: Application) => {
        setSelectedApp(app);
        setShowInterviewModal(true);
    };

    const openChat = (app: Application) => {
        setSelectedApp(app);
        fetchMessages(app.id);
        setShowChat(true);
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, showChat]);

    const scheduleInterview = async () => {
        // ... (existing code remains same)
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
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
                <div className="text-left">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                        <Users size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Talent Pool</span>
                    </div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Applicants</h1>
                    <p className="text-slate-400 mt-2 text-sm">Review encrypted applications and invite candidates to interviews.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex p-1 bg-slate-800/50 rounded-xl border border-slate-700">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'all'
                                ? 'bg-white text-black'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            All ({applications.length})
                        </button>
                        <button
                            onClick={() => setFilterType('starred')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${filterType === 'starred'
                                ? 'bg-amber-500 text-black'
                                : 'text-slate-400 hover:text-amber-400'
                                }`}
                        >
                            <Star size={12} className={filterType === 'starred' ? 'fill-black' : ''} />
                            Starred ({applications.filter(a => a.is_starred).length})
                        </button>
                        <button
                            onClick={() => setFilterType('employed')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${filterType === 'employed'
                                ? 'bg-emerald-500 text-black'
                                : 'text-slate-400 hover:text-emerald-400'
                                }`}
                        >
                            <CheckCircle2 size={12} className={filterType === 'employed' ? 'text-black' : ''} />
                            Employed ({applications.filter(a => a.status === 'employed').length})
                        </button>
                    </div>
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
                        {filteredApplications.length === 0 && filterType === 'starred' ? (
                            <div className="py-16 flex flex-col items-center justify-center text-slate-600 space-y-4">
                                <Star size={48} className="opacity-10" />
                                <p className="font-bold text-sm uppercase tracking-widest text-center">No starred applicants yet</p>
                                <p className="text-xs text-slate-500 text-center">Star applicants who pass your external interviews to track them here.</p>
                            </div>
                        ) : filteredApplications.length === 0 && filterType === 'employed' ? (
                            <div className="py-16 flex flex-col items-center justify-center text-slate-600 space-y-4">
                                <Users size={48} className="opacity-10" />
                                <p className="font-bold text-sm uppercase tracking-widest text-center">No hired applicants yet</p>
                                <p className="text-xs text-slate-500 text-center">Applicants marked as Employed will appear here.</p>
                            </div>
                        ) : (
                            filteredApplications.map((app) => (
                                <div
                                    key={app.id}
                                    onClick={() => setSelectedApp(app)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedApp(app); }}
                                    className={`w-full text-left p-6 rounded-[32px] border transition-all duration-300 flex items-center justify-between group cursor-pointer ${selectedApp?.id === app.id ? 'bg-blue-600/10 border-blue-500/50 shadow-2xl' : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'}`}
                                >
                                    <div className="flex items-center gap-5">
                                        {/* Star Button */}
                                        <button
                                            onClick={(e) => handleToggleStar(e, app)}
                                            disabled={togglingStarId === app.id}
                                            className={`p-2 rounded-xl transition-all active:scale-90 ${app.is_starred
                                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                : 'bg-slate-800 text-slate-600 border border-slate-700 hover:text-amber-400 hover:border-amber-500/30'
                                                } ${togglingStarId === app.id ? 'opacity-50 animate-pulse' : ''}`}
                                        >
                                            <Star size={16} className={app.is_starred ? 'fill-amber-400' : ''} />
                                        </button>
                                        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden">
                                            {app.applicant.profileImageUrl ? (
                                                <img src={app.applicant.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-600"><UserCircle size={32} /></div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-bold text-white uppercase tracking-tighter">{app.applicant.firstName} {app.applicant.lastName}</h3>
                                                {app.wasInvited && (
                                                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                                        <CheckCircle2 size={10} /> Was Invited
                                                    </span>
                                                )}
                                                {app.is_starred && (
                                                    <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[8px] font-black text-amber-400 uppercase tracking-widest">
                                                        Starred
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${app.status === 'interview_scheduled' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                    {app.status.replace('_', ' ')}
                                                </span>
                                                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                                                    {app.createdAt && !isNaN(Date.parse(app.createdAt))
                                                        ? new Date(app.createdAt).toLocaleDateString()
                                                        : 'Date N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openChat(app); }}
                                            className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all active:scale-90"
                                        >
                                            <Send size={16} />
                                        </button>
                                        <ChevronRight size={20} className={`text-slate-700 group-hover:text-blue-500 transition-all ${selectedApp?.id === app.id ? 'translate-x-1 text-blue-500' : ''}`} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* DETAIL AREA */}
                    <div className="sticky top-8 bg-[#0f172a] border border-slate-800 rounded-[40px] p-8 min-h-[600px] flex flex-col overflow-hidden">
                        {selectedApp ? (
                            <div className="space-y-8 animate-in fade-in duration-300 flex-1 overflow-y-auto">
                                <div className="flex flex-col gap-4">
                                    <div className="space-y-2 text-left">
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Application Data</h2>
                                        <p className="text-xs text-slate-500 font-bold uppercase">Submitted by <span className="text-blue-400">{selectedApp.applicant.firstName} {selectedApp.applicant.lastName}</span></p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            onClick={() => openChat(selectedApp)}
                                            className="px-4 py-2.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600/20 transition-all whitespace-nowrap"
                                        >
                                            <Send size={12} className="inline mr-1.5" />
                                            Message
                                        </button>
                                        <button
                                            onClick={() => setViewingProfileId(selectedApp.id)}
                                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-slate-700 whitespace-nowrap"
                                        >
                                            <Eye size={12} className="inline mr-1.5" />
                                            Profile
                                        </button>
                                        {selectedApp.status !== 'interview_scheduled' && (
                                            <button
                                                onClick={() => handleInvite(selectedApp)}
                                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/20 whitespace-nowrap"
                                            >
                                                <Calendar size={12} className="inline mr-1.5" />
                                                Invite
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6 text-left">
                                    {selectedApp.status === 'employed' && selectedApp.progression && selectedApp.progression.length > 0 && (
                                        <div className="mb-8 space-y-4">
                                            <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest border-b border-emerald-500/20 pb-2 flex items-center gap-2">
                                                <CheckCircle2 size={16} />
                                                Career Progression
                                            </h3>
                                            <div className="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-slate-800">
                                                {selectedApp.progression.map((role: any, idx: number) => (
                                                    <div key={role.id || idx} className="relative">
                                                        <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-[#0f172a]"></div>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-lg font-bold text-white leading-none">{role.title}</h4>
                                                                {role.isCurrent && (
                                                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded">Current</span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs font-bold text-slate-400 tracking-wider">
                                                                {role.startDate ? new Date(role.startDate).toLocaleDateString([], { month: 'short', year: 'numeric' }) : 'N/A'} - {role.endDate ? new Date(role.endDate).toLocaleDateString([], { month: 'short', year: 'numeric' }) : (role.isCurrent ? 'Present' : 'N/A')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {Object.entries(selectedApp.formData).map(([key, value]) => (
                                        <div key={key} className="space-y-2">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                <FileText size={12} />
                                                Response: {key}
                                            </p>
                                            <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-auto">
                                                {typeof value === 'string' && value.includes('<') ? (
                                                    <div
                                                        className="prose prose-invert max-w-none text-slate-200
                                                            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-4
                                                            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mb-3
                                                            [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white [&_h3]:mb-2
                                                            [&_p]:mb-4 [&_p]:leading-relaxed
                                                            [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4
                                                            [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4
                                                            [&_li]:mb-2
                                                            [&_strong]:font-bold [&_strong]:text-white
                                                            [&_em]:italic
                                                            [&_u]:underline
                                                            [&_br]:block [&_br]:mb-2
                                                        "
                                                        style={{ whiteSpace: 'pre-wrap' }}
                                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
                                                    />
                                                ) : (
                                                    <p className="text-slate-200 font-medium leading-relaxed whitespace-pre-wrap">
                                                        {Array.isArray(value) ? value.join(', ') : String(value)}
                                                    </p>
                                                )}
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

            {/* CHAT MODAL */}
            {showChat && selectedApp && (
                <div className="fixed inset-0 z-[120] flex items-center justify-end p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowChat(false)}></div>
                    <div className="relative w-full max-w-lg h-[90vh] bg-[#0f172a] border border-slate-700 rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right-10 duration-500">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/80 backdrop-blur-md">
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                                    <UserCircle size={28} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">{selectedApp.applicant.firstName} {selectedApp.applicant.lastName}</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Application Chat</p>
                                </div>
                            </div>
                            <button onClick={() => setShowChat(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {chatMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-700 space-y-4">
                                    <Send size={48} className="opacity-10" />
                                    <p className="text-xs font-bold uppercase tracking-widest">No previous messages. Start the conversation.</p>
                                </div>
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

                        <div className="p-8 bg-slate-900/80 border-t border-white/5">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Enter encrypted message..."
                                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim() || isSending}
                                    className={`absolute right-2 top-2 bottom-2 w-12 flex items-center justify-center rounded-xl transition-all ${newMessage.trim() ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-600'}`}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
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

            {/* PROFILE VIEW MODAL */}
            {viewingProfileId && (
                <EmployerProfileViewModal
                    applicationId={viewingProfileId}
                    onClose={() => setViewingProfileId(null)}
                />
            )}
        </div>
    );
}
