"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Users, Calendar, Clock, Link as LinkIcon, FileText,
    Send, ChevronRight, UserCircle, CheckCircle2, X, Eye, Lock, Unlock
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
                    <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                        {applications.length} Applicants
                    </span>
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
                            <div
                                key={app.id}
                                onClick={() => setSelectedApp(app)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedApp(app); }}
                                className={`w-full text-left p-6 rounded-[32px] border transition-all duration-300 flex items-center justify-between group cursor-pointer ${selectedApp?.id === app.id ? 'bg-blue-600/10 border-blue-500/50 shadow-2xl' : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'}`}
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
                        ))}
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
                                            onClick={() => router.push(`/employer/applications/${selectedApp.id}/profile`)}
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
                                                        dangerouslySetInnerHTML={{ __html: value }}
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
        </div>
    );
}
