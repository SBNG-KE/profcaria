"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, ChevronRight, ChevronLeft, Zap, Send, Shield, Clock, X, Building2, UserCircle, Search, CheckCheck } from 'lucide-react';
import { useNotificationContext } from '@/app/context/NotificationContext';

export default function NotificationsPage() {
    // Consume Global Context
    const { notifications, applications, loading, refresh, markAsRead } = useNotificationContext();

    // Local State
    const [activeConversation, setActiveConversation] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const messageEndRef = useRef<HTMLDivElement>(null);
    const lastMessageCountRef = useRef(0);
    const lastFetchTimeRef = useRef(0);

    // Initial Scroll
    useEffect(() => {
        if (messages.length > lastMessageCountRef.current) {
            messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            lastMessageCountRef.current = messages.length;
        }
    }, [messages]);

    // 1. Fetch Messages when Active Conversation Changes
    useEffect(() => {
        if (activeConversation) {
            // Find all application IDs for this company (conversation grouping logic)
            const companyAppIds = getCompanyAppIds(activeConversation);
            fetchMessages(companyAppIds);
        } else {
            setMessages([]);
        }
    }, [activeConversation]); // Dependency: only when switch conversation

    // 2. Notification-Driven Updates (The "Real-time" substitution)
    // If a new notification arrives for the active conversation, fetch messages!
    useEffect(() => {
        if (!activeConversation) return;

        const companyAppIds = getCompanyAppIds(activeConversation);

        // check if any unread notification belongs to one of these app IDs
        const hasRelevantNotification = notifications.some(n =>
            !n.is_read && n.application_id && companyAppIds.includes(n.application_id)
        );

        if (hasRelevantNotification) {
            fetchMessages(companyAppIds);

            // Mark these notifications as read immediately so we don't re-fetch endlessly?
            // Or rely on `fetchMessages` to mark messages as read?
            // The Logic: If we see a notification, we fetch the messages.
            // But we should also clear the notification badge.
            notifications.forEach(n => {
                if (!n.is_read && n.application_id && companyAppIds.includes(n.application_id)) {
                    markAsRead(n.id);
                }
            });
        }
    }, [notifications, activeConversation]);

    // 3. Failsafe Polling (3s)
    // Ensures messages are synchronized even if notification trigger is missed
    useEffect(() => {
        if (!activeConversation) return;
        const companyAppIds = getCompanyAppIds(activeConversation);

        const interval = setInterval(() => {
            fetchMessages(companyAppIds);
        }, 3000);

        return () => clearInterval(interval);
    }, [activeConversation, applications]);

    // Helper to get grouped IDs
    const getCompanyAppIds = (conv: any) => {
        return applications
            .filter(app => app.companyName === conv.companyName) // Ensure consistent grouping
            .filter(app => app.company?.id === conv.company?.id || app.companyId === conv.companyId) // fallback for prop names
            .map(app => app.id);
    };

    const fetchMessages = async (appIds: string[]) => {
        try {
            const requestTime = Date.now();
            lastFetchTimeRef.current = requestTime;

            const idsParam = appIds.join(',');
            const res = await fetch(`/api/shared/messages?applicationIds=${idsParam}&t=${requestTime}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();

                // Race Condition Guard: If a newer request has started/finished, ignore this one
                if (requestTime < lastFetchTimeRef.current) return;

                const newMessages = data.messages || [];

                setMessages(prev => {
                    // Safe replace
                    return newMessages;
                });

                // Also mark messages as read in DB
                markMessagesAsRead(appIds);
            }
        } catch (error) {
            console.error("Error fetching messages", error);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !activeConversation || isSending) return;

        // Security: Block links in messages to prevent phishing/hacking
        const urlPattern = /(https?:\/\/|www\.)[^\s]+/gi;
        if (urlPattern.test(newMessage)) {
            alert('Links are not allowed in messages for security reasons.');
            return;
        }

        const msgContent = newMessage;
        setNewMessage('');
        setIsSending(true);
        try {
            // Send to the specifically selected application
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
                // Optimistic append with safe check
                setMessages(prev => {
                    if (prev.some(m => m.id === data.message.id)) return prev;
                    return [...prev, { ...data.message, content: msgContent }];
                });

                // Trigger global refresh to update "Last Message" snippets if we had them or just consistency
                refresh();
            }
        } catch (error) {
            console.error("Error sending message", error);
        } finally {
            setIsSending(false);
        }
    };

    const markMessagesAsRead = async (appIds: string[]) => {
        try {
            await fetch('/api/shared/messages', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationIds: appIds })
            });
        } catch (error) {
            console.error("Error marking messages as read", error);
        }
    };

    // Filter Logic for Sidebar
    const filteredConversations = applications.filter(app =>
        (app.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.companyName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group apps by Company for the Sidebar List
    const groupedConversations = Object.values(
        filteredConversations.reduce((acc, app) => {
            // Group by company ID
            const key = app.companyId || app.company?.id; // Handle variance
            if (!key) return acc;

            const existing = acc[key];
            if (!existing) {
                acc[key] = app;
            }
            return acc;
        }, {} as Record<string, any>)
    );

    // Helper to format date groups
    const getMessageDateLabel = (date: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    };

    // Group messages function
    const groupMessagesByDate = (msgs: any[]) => {
        const groups: { label: string; messages: any[] }[] = [];
        msgs.forEach(msg => {
            const date = new Date(msg.created_at);
            const label = getMessageDateLabel(date);
            let group = groups.find(g => g.label === label);
            if (!group) {
                group = { label, messages: [] };
                groups.push(group);
            }
            group.messages.push(msg);
        });
        return groups;
    };

    const groupedMessages = groupMessagesByDate(
        messages.filter((msg, index, self) =>
            index === self.findIndex((t) => (t.id === msg.id))
        )
    );

    return (
        <div className="flex h-full w-full bg-[#050b14] text-slate-200 overflow-hidden font-sans">
            {/* LEFT SIDEBAR - Fixed, doesn't scroll with content */}
            <aside className={`md:w-[380px] h-full border-r border-slate-800 flex-col bg-[#0b121e]/50 backdrop-blur-xl shrink-0 w-full ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
                <header className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#0f172a]/80 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                            <UserCircle size={20} />
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

                <div className="p-3 bg-[#0b121e]/80 shrink-0">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2" style={{ scrollbarWidth: 'none' }}>
                    {/* Unread notifications - compact */}
                    {notifications.filter(n => !n.is_read).length > 0 && (
                        <div className="px-3 py-3">
                            <h3 className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 px-2 flex items-center gap-1.5">
                                <Zap size={10} /> New
                            </h3>
                            {notifications.filter(n => !n.is_read).map((notif) => (
                                <button
                                    key={notif.id}
                                    onClick={() => {
                                        markAsRead(notif.id);
                                        if (notif.application_id) {
                                            const app = applications.find(a => a.id === notif.application_id);
                                            if (app) setActiveConversation(app);
                                        }
                                    }}
                                    className="w-full p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer mb-2 text-left"
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0"></div>
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
                        <h3 className="px-4 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">Conversations</h3>
                        {groupedConversations.map((app: any) => {
                            const companyId = app.companyId || app.company?.id;
                            // Check internal notifications state for badges
                            const unreadCount = notifications.filter(n =>
                                !n.is_read && n.application_id &&
                                // Check if notification app ID matches any app for this company
                                getCompanyAppIds(app).includes(n.application_id)
                            ).length;

                            return (
                                <button
                                    key={companyId}
                                    onClick={() => setActiveConversation(app)}
                                    className={`w-full px-3 py-3 flex items-center gap-3 transition-all ${(activeConversation?.companyId === companyId || activeConversation?.company?.id === companyId)
                                        ? 'bg-blue-600/10' : 'hover:bg-slate-800/30'}`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 relative overflow-hidden ${(activeConversation?.companyId === companyId || activeConversation?.company?.id === companyId)
                                        ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                        {app.companyLogoUrl ? (
                                            <img src={app.companyLogoUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Building2 size={20} />
                                        )}
                                        {unreadCount > 0 && (
                                            <div className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full border-2 border-[#0b121e] flex items-center justify-center animate-[pulse_3s_infinite]">
                                                <span className="text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 text-left min-w-0 border-b border-slate-800/50 pb-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-sm font-bold text-white truncate">{app.companyName}</h4>
                                            <span className="text-[9px] text-slate-500 shrink-0">Now</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mt-1">
                                            <p className="text-xs text-slate-500 truncate">{app.jobTitle}</p>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </aside>

            {/* MAIN CHAT AREA - Separate scroll context */}
            <main className={`flex-1 flex-col relative bg-[#050b14] min-w-0 ${activeConversation ? 'flex' : 'hidden md:flex'}`}>
                {!activeConversation ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-24 h-24 bg-[#0b121e] border border-slate-800 rounded-full flex items-center justify-center mb-6">
                            <MessageSquare size={36} className="text-slate-700" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">Select a Conversation</h2>
                        <p className="text-slate-500 max-w-sm text-sm">Choose a conversation from the left to start messaging.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat header - Fixed */}
                        <header className="px-6 py-4 border-b border-slate-800 bg-[#0b121e]/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setActiveConversation(null)}
                                    className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center overflow-hidden shrink-0">
                                    {activeConversation.companyLogoUrl ? (
                                        <img src={activeConversation.companyLogoUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 size={20} />
                                    )}
                                </div>
                                <div className="text-left">
                                    <h2 className="text-base font-bold text-white">{activeConversation.companyName}</h2>
                                    <p className="text-xs text-blue-400">{activeConversation.jobTitle}</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveConversation(null)} className="hidden md:flex p-2 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </header>

                        {/* Chat messages - Scrollable independently */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8" style={{ scrollbarWidth: 'none' }}>
                            {groupedMessages.map((group, groupIndex) => (
                                <div key={group.label} className="space-y-4">
                                    <div className="flex items-center justify-center sticky top-0 z-10 py-2">
                                        <span className="bg-slate-800/80 backdrop-blur text-slate-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border border-slate-700/50">
                                            {group.label}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {group.messages.map((msg) => {
                                            const isMe = msg.sender_type === 'professional';
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                        <div className={`px-4 py-2.5 rounded-2xl relative ${isMe
                                                            ? 'bg-blue-600 text-white rounded-br-sm'
                                                            : 'bg-slate-800 text-slate-200 rounded-bl-sm'}`}>
                                                            <p className="text-sm leading-relaxed">{msg.content}</p>
                                                            <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                                <span className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-slate-500'}`}>
                                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                {isMe && <CheckCheck size={12} className={msg.is_read ? "text-emerald-300" : "text-blue-200/50"} />}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
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
                                    className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all text-sm"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim() || isSending}
                                    className="w-11 h-11 flex items-center justify-center rounded-full transition-all bg-blue-600 text-white hover:bg-blue-500 active:scale-95 disabled:bg-slate-800 disabled:text-slate-600"
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
