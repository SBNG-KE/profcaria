"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, ChevronRight, Zap, Send, Shield, Clock, X, Briefcase, UserCircle, Search, CheckCheck, User } from 'lucide-react';

export default function EmployerNotifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [channels, setChannels] = useState<any[]>([]);
    const [activeConversation, setActiveConversation] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const messageEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
            markMessagesAsRead(activeConversation.id);
        }
    }, [activeConversation]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [notifRes, appChannelsRes] = await Promise.all([
                fetch('/api/shared/notifications'),
                fetch('/api/employer/applications')
            ]);

            if (notifRes.ok) {
                const data = await notifRes.json();
                setNotifications(data.notifications || []);
            }

            if (appChannelsRes.ok) {
                const data = await appChannelsRes.json();
                setChannels(data.applications || []);
            }
        } catch (error) {
            console.error("Error fetching employer data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (appId: string) => {
        try {
            const res = await fetch(`/api/shared/messages?applicationId=${appId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error("Error fetching messages", error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !activeConversation || isSending) return;
        const msgContent = newMessage;
        setNewMessage('');
        setIsSending(true);
        try {
            const res = await fetch('/api/shared/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId: activeConversation.id,
                    content: msgContent
                })
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, { ...data.message, content: msgContent }]);
            }
        } catch (error) {
            console.error("Error sending message", error);
        } finally {
            setIsSending(false);
        }
    };

    const markNotificationAsRead = async (id: string) => {
        try {
            await fetch('/api/shared/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id })
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error("Error marking notif as read", error);
        }
    };

    const markMessagesAsRead = async (appId: string) => {
        try {
            await fetch('/api/shared/messages', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: appId })
            });
        } catch (error) {
            console.error("Error marking messages as read", error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'applied': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'shortlisted': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'rejected': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    const filteredChannels = channels.filter(app =>
        app.job?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-full bg-[#050b14] text-slate-200 overflow-hidden font-sans">
            {/* LEFT SIDEBAR - Fixed, doesn't scroll with content */}
            <aside className="w-[380px] border-r border-slate-800 flex flex-col bg-[#0b121e]/50 backdrop-blur-xl shrink-0">
                <header className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#1e293b]/20 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                            <Briefcase size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-wider">Messages</h2>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Online</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Search */}
                <div className="p-3 shrink-0">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                        />
                    </div>
                </div>

                {/* List Area - Scrollable */}
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                    {/* Unread notifications - compact */}
                    {notifications.filter(n => !n.is_read).length > 0 && (
                        <div className="px-3 py-3">
                            <h3 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2 px-2 flex items-center gap-1.5">
                                <Zap size={10} /> New
                            </h3>
                            {notifications.filter(n => !n.is_read).map((notif) => (
                                <button
                                    key={notif.id}
                                    onClick={() => {
                                        markNotificationAsRead(notif.id);
                                        if (notif.application_id) {
                                            const channel = channels.find(c => c.id === notif.application_id);
                                            if (channel) setActiveConversation(channel);
                                        }
                                    }}
                                    className="w-full p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer mb-2 text-left"
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] text-white font-medium leading-snug line-clamp-2">{notif.message}</p>
                                            <span className="text-[9px] text-slate-500 mt-1 block">{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Conversation list - WhatsApp style */}
                    <div className="pb-4">
                        <h3 className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">Candidates</h3>
                        {filteredChannels.map((app) => (
                            <button
                                key={app.id}
                                onClick={() => setActiveConversation(app)}
                                className={`w-full px-3 py-3 flex items-center gap-3 transition-all ${activeConversation?.id === app.id ? 'bg-emerald-600/10' : 'hover:bg-slate-800/30'}`}
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${activeConversation?.id === app.id ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                    <User size={20} />
                                </div>
                                <div className="flex-1 text-left min-w-0 border-b border-slate-800/50 pb-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <h4 className="text-sm font-bold text-white truncate">{app.user?.name || 'Applicant'}</h4>
                                        <span className="text-[9px] text-slate-500 shrink-0">Now</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-1">
                                        <p className="text-xs text-slate-500 truncate">{app.job?.title || 'Unknown Job'}</p>
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${getStatusColor(app.status)}`}>
                                            {app.status}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* MAIN CHAT AREA - Separate scroll context */}
            <main className="flex-1 flex flex-col relative bg-[#050b14] min-w-0">
                {!activeConversation ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-24 h-24 bg-[#0b121e] border border-slate-800 rounded-full flex items-center justify-center mb-6">
                            <MessageSquare size={36} className="text-slate-700" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">Select a Conversation</h2>
                        <p className="text-slate-500 max-w-sm text-sm">Choose a candidate from the left to start messaging.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat header - Fixed */}
                        <header className="px-6 py-4 border-b border-slate-800 bg-[#0b121e]/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                    <User size={20} />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-base font-bold text-white">{activeConversation.user?.name || 'Candidate'}</h2>
                                    <p className="text-xs text-emerald-400">{activeConversation.job?.title || 'Job Thread'}</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveConversation(null)} className="p-2 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </header>

                        {/* Chat messages - Scrollable independently */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ scrollbarWidth: 'none' }}>
                            <div className="flex justify-center mb-4">
                                <div className="px-4 py-1.5 bg-slate-900/80 border border-slate-800 rounded-full flex items-center gap-2">
                                    <Shield size={10} className="text-emerald-500" />
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Encrypted</span>
                                </div>
                            </div>

                            {messages.map((msg) => {
                                const isMe = msg.sender_type === 'employer';
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-4 py-2.5 rounded-2xl relative ${isMe
                                                ? 'bg-emerald-600 text-white rounded-br-sm'
                                                : 'bg-slate-800 text-slate-200 rounded-bl-sm'}`}>
                                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                                <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <span className={`text-[10px] ${isMe ? 'text-emerald-200' : 'text-slate-500'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {isMe && <CheckCheck size={12} className={msg.is_read ? "text-blue-300" : "text-emerald-200/50"} />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messageEndRef} />
                        </div>

                        {/* Message input - Fixed at bottom */}
                        <footer className="px-4 py-3 border-t border-slate-800 bg-[#0b121e]/80 shrink-0">
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all text-sm"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim() || isSending}
                                    className="w-11 h-11 flex items-center justify-center rounded-full transition-all bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 disabled:bg-slate-800 disabled:text-slate-600"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </footer>
                    </>
                )}
            </main>
        </div>
    );
}
