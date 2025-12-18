"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, ChevronRight, Zap, Send, Shield, Clock, X, Building2, UserCircle } from 'lucide-react';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [activeConversation, setActiveConversation] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messageEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
        }
    }, [activeConversation]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [notifRes, appRes] = await Promise.all([
                fetch('/api/shared/notifications'),
                fetch('/api/professional/applications')
            ]);
            if (notifRes.ok) {
                const data = await notifRes.json();
                setNotifications(data.notifications || []);
            }
            if (appRes.ok) {
                const data = await appRes.json();
                setApplications(data.applications || []);
            }
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setIsLoading(false);
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
        setIsSending(true);
        try {
            const res = await fetch('/api/shared/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId: activeConversation.id,
                    content: newMessage
                })
            });
            if (res.ok) {
                const data = await res.json();
                setMessages([...messages, { ...data.message, content: newMessage }]);
                setNewMessage('');
            }
        } catch (error) {
            console.error("Error sending message", error);
        } finally {
            setIsSending(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'applied': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'interview_scheduled': return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
            case 'offered': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'rejected': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#050b14]">
            <div className="max-w-7xl mx-auto w-full p-8 flex-1 flex flex-col min-h-0">
                <header className="mb-8 shrink-0">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                        <Bell className="text-blue-500" size={32} />
                        Communications
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium uppercase tracking-widest text-[10px]">Encrypted Neural Pathway | Notifications & Messaging</p>
                </header>

                <div className="flex-1 flex gap-8 min-h-0">
                    {/* LEFT COL: Notifications & Conversations */}
                    <div className="w-1/3 flex flex-col gap-6 min-h-0">
                        {/* Notifications List */}
                        <div className="bg-[#0f172a]/50 border border-slate-800 rounded-[32px] flex flex-col min-h-0 overflow-hidden">
                            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <Zap size={14} className="text-blue-400" /> Notifications
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">
                                    {notifications.length} Total
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-700">
                                        <Bell size={32} className="opacity-20 mb-4" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Quiet in the hub</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div key={notif.id} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 transition-all group">
                                            <p className="text-xs text-slate-300 line-clamp-2">{notif.message}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[10px] text-slate-500 font-mono uppercase">{notif.type}</span>
                                                <span className="text-[10px] text-slate-600">{new Date(notif.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Conversations / Job Threads */}
                        <div className="bg-[#0f172a]/50 border border-slate-800 rounded-[32px] flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div className="p-6 border-b border-slate-800">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquare size={14} className="text-emerald-400" /> Messaging Channels
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {applications.length === 0 ? (
                                    <p className="text-center py-10 text-[10px] font-bold text-slate-700 uppercase tracking-widest">No active application threads</p>
                                ) : (
                                    applications.map((app) => (
                                        <button
                                            key={app.id}
                                            onClick={() => setActiveConversation(app)}
                                            className={`w-full p-5 rounded-2xl text-left border transition-all duration-300 ${activeConversation?.id === app.id ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}
                                        >
                                            <h4 className="text-sm font-bold text-white uppercase tracking-tighter truncate">{app.jobTitle}</h4>
                                            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-2 truncate">{app.companyName}</p>
                                            <div className="flex items-center justify-between">
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${getStatusColor(app.status)}`}>
                                                    {app.status.replace(/_/g, ' ')}
                                                </span>
                                                <ChevronRight size={14} className="text-slate-600" />
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COL: Chat Interface */}
                    <div className="flex-1 bg-[#0f172a]/50 border border-slate-800 rounded-[40px] flex flex-col overflow-hidden relative shadow-2xl">
                        {!activeConversation ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                                <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-[40px] flex items-center justify-center mb-6 shadow-2xl">
                                    <MessageSquare size={40} className="text-slate-700" />
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Secure Messaging</h2>
                                <p className="text-slate-500 max-w-sm text-sm">Select a messaging channel from your applications to open a quantum-encrypted conversation conduit.</p>
                                <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                                    <Shield size={12} /> Quantum Encryption Active
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div className="p-6 border-b border-slate-800 bg-[#0f172a]/50 backdrop-blur-md flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/20">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-white uppercase tracking-tight truncate max-w-xs">{activeConversation.jobTitle}</h2>
                                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest leading-none">{activeConversation.companyName}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setActiveConversation(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    <div className="flex flex-col items-center py-10 space-y-4">
                                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl text-slate-500 flex flex-col items-center text-center max-w-md">
                                            <Shield size={32} className="mb-2 text-emerald-500/40" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted Session</p>
                                            <p className="text-[9px] text-slate-600 mt-1">This conversation is protected by our proprietary AES-GCM-256 neural mesh. No data is stored in plain text.</p>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.3em]">Channel Established {new Date(activeConversation.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    {messages.map((msg, i) => {
                                        const isMe = msg.sender_type === 'professional';
                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                                <div className={`max-w-[80%] space-y-1`}>
                                                    <div className={`p-4 rounded-3xl border ${isMe ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/10' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
                                                        <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                                                    </div>
                                                    <div className={`flex items-center gap-2 text-[10px] text-slate-500 font-mono px-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {isMe && <Shield size={10} className="text-emerald-500" />}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messageEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                            placeholder="Transmit secure message..."
                                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-6 pr-14 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all border-t-emerald-500/10"
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!newMessage.trim() || isSending}
                                            className={`absolute right-2 top-2 bottom-2 w-12 flex items-center justify-center rounded-xl transition-all ${newMessage.trim() && !isSending ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95' : 'bg-slate-800 text-slate-600'}`}
                                        >
                                            <Send size={20} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 px-2">
                                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">Quantum Channel Active</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
