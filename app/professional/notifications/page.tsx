"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, ChevronRight, ChevronLeft, Zap, Send, Shield, Clock, X, Building2, UserCircle, Search, CheckCheck } from 'lucide-react';
import { useNotificationContext } from '@/app/context/NotificationContext';
import LinkPreview from '@/app/components/LinkPreview';
import InlineLinkPreview, { extractFirstUrl } from '@/app/components/InlineLinkPreview';
import { useTheme } from '@/app/context/ThemeContext';

export default function NotificationsPage() {
    // Theme
    const { theme } = useTheme();
    const isDark = theme === 'dark';

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
    const inputRef = useRef<HTMLInputElement>(null);

    // Link preview state
    const [linkPreviewUrl, setLinkPreviewUrl] = useState<string | null>(null);
    const [linkPreviewPosition, setLinkPreviewPosition] = useState<{ x: number; y: number } | null>(null);

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

    // URL detection in message input with debouncing
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastDetectedUrlRef = useRef<string | null>(null);

    const handleMessageInput = (value: string) => {
        setNewMessage(value);

        // Clear any existing debounce timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Detect if there's a URL in the input
        const urlPattern = /(https?:\/\/|www\.)[^\s]+/gi;
        const matches = value.match(urlPattern);

        if (matches && matches.length > 0) {
            const url = matches[matches.length - 1]; // Get the last URL
            const fullUrl = url.startsWith('www.') ? 'https://' + url : url;

            // Debounce to prevent flickering - only show preview after typing stops for 500ms
            // And only if it's a new URL (not already showing)
            debounceTimerRef.current = setTimeout(() => {
                if (lastDetectedUrlRef.current !== fullUrl) {
                    lastDetectedUrlRef.current = fullUrl;

                    // Position the preview above the input
                    if (inputRef.current) {
                        const rect = inputRef.current.getBoundingClientRect();
                        setLinkPreviewUrl(fullUrl);
                        setLinkPreviewPosition({
                            x: Math.min(rect.left, window.innerWidth - 350),
                            y: rect.top - 10
                        });
                    }
                }
            }, 500);
        } else {
            // Clear preview if no URL
            lastDetectedUrlRef.current = null;
            setLinkPreviewUrl(null);
            setLinkPreviewPosition(null);
        }
    };

    // Close link preview
    const closeLinkPreview = () => {
        lastDetectedUrlRef.current = null;
        setLinkPreviewUrl(null);
        setLinkPreviewPosition(null);
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

    // Linkify helper: convert URLs to clickable links with context-aware colors
    const linkifyText = (text: string, isSenderMessage: boolean = false) => {
        const urlPattern = /(https?:\/\/[^\s]+)/gi;
        const parts = text.split(urlPattern);
        return parts.map((part, i) => {
            if (urlPattern.test(part)) {
                urlPattern.lastIndex = 0;
                // Use lighter colors for sender messages for better contrast
                const linkClass = isSenderMessage
                    ? 'text-white underline hover:text-neutral-200 break-all font-medium'
                    : (isDark ? 'text-neutral-300 underline hover:text-white break-all' : 'text-neutral-600 underline hover:text-black break-all');
                return (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer"
                        className={linkClass}>
                        {part}
                    </a>
                );
            }
            return part;
        });
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
        <div className={`flex h-full w-full overflow-hidden font-sans ${isDark ? 'bg-black text-neutral-200' : 'bg-neutral-50 text-neutral-800'}`}>
            {/* LEFT SIDEBAR - Fixed, doesn't scroll with content */}
            <aside className={`md:w-[380px] h-full border-r flex-col backdrop-blur-xl shrink-0 w-full ${isDark ? 'border-neutral-800 bg-neutral-900/50' : 'border-neutral-200 bg-white'} ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
                <header className={`p-5 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-neutral-800 bg-neutral-900/80' : 'border-neutral-200 bg-white'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                            <UserCircle size={20} />
                        </div>
                        <div>
                            <h2 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>Messages</h2>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-neutral-400'}`}>Online</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className={`p-3 shrink-0 ${isDark ? 'bg-neutral-900/80' : 'bg-neutral-50'}`}>
                    <div className="relative group">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-white' : 'text-neutral-400 group-focus-within:text-black'}`} size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-neutral-900/50 border-neutral-800 focus:ring-white/20 focus:border-neutral-600 placeholder:text-neutral-600' : 'bg-white border-neutral-200 focus:ring-black/10 focus:border-neutral-400 placeholder:text-neutral-400'}`}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2" style={{ scrollbarWidth: 'none' }}>
                    {/* Unread notifications - compact */}
                    {notifications.filter(n => !n.is_read).length > 0 && (
                        <div className="px-3 py-3">
                            <h3 className={`text-[9px] font-black uppercase tracking-widest mb-2 px-2 flex items-center gap-1.5 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
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
                                    className={`w-full p-3 rounded-2xl border transition-all cursor-pointer mb-2 text-left ${isDark ? 'bg-white/5 border-white/20 hover:border-white/40' : 'bg-black/5 border-black/10 hover:border-black/30'}`}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${isDark ? 'bg-white' : 'bg-black'}`}></div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[11px] font-medium leading-snug line-clamp-2 ${isDark ? 'text-white' : 'text-black'}`}>{notif.message}</p>
                                            <span className={`text-[9px] mt-1 block ${isDark ? 'text-slate-500' : 'text-neutral-400'}`}>{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Conversation list - WhatsApp style */}
                    <div className="pb-4">
                        <h3 className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-neutral-400'}`}>Conversations</h3>
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
                                        ? (isDark ? 'bg-white/10' : 'bg-black/5') : (isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-neutral-100')}`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 relative overflow-hidden ${(activeConversation?.companyId === companyId || activeConversation?.company?.id === companyId)
                                        ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : (isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500')}`}>
                                        {app.companyLogoUrl ? (
                                            <img src={app.companyLogoUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Building2 size={20} />
                                        )}
                                        {unreadCount > 0 && (
                                            <div className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full border-2 border-neutral-900 flex items-center justify-center animate-[pulse_3s_infinite]">
                                                <span className="text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`flex-1 text-left min-w-0 border-b pb-3 ${isDark ? 'border-neutral-800/50' : 'border-neutral-200'}`}>
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-black'}`}>{app.companyName}</h4>
                                            <span className={`text-[9px] shrink-0 ${isDark ? 'text-slate-500' : 'text-neutral-400'}`}>Now</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mt-1">
                                            <p className={`text-xs truncate ${isDark ? 'text-slate-500' : 'text-neutral-500'}`}>{app.jobTitle}</p>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </aside>

            {/* MAIN CHAT AREA - Separate scroll context */}
            <main className={`flex-1 flex-col relative min-w-0 ${isDark ? 'bg-black' : 'bg-white'} ${activeConversation ? 'flex' : 'hidden md:flex'}`}>
                {!activeConversation ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className={`w-24 h-24 border rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
                            <MessageSquare size={36} className={isDark ? 'text-neutral-700' : 'text-neutral-300'} />
                        </div>
                        <h2 className={`text-2xl font-black uppercase tracking-tighter mb-3 ${isDark ? 'text-white' : 'text-black'}`}>Select a Conversation</h2>
                        <p className={`max-w-sm text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Choose a conversation from the left to start messaging.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat header - Fixed */}
                        <header className={`px-6 py-4 border-b backdrop-blur-md flex items-center justify-between shrink-0 z-10 ${isDark ? 'border-neutral-800 bg-neutral-900/80' : 'border-neutral-200 bg-white/80'}`}>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setActiveConversation(null)}
                                    className={`md:hidden p-2 -ml-2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-neutral-400 hover:text-black'}`}
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${isDark ? 'bg-white/10 text-neutral-300' : 'bg-black/5 text-neutral-500'}`}>
                                    {activeConversation.companyLogoUrl ? (
                                        <img src={activeConversation.companyLogoUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 size={20} />
                                    )}
                                </div>
                                <div className="text-left">
                                    <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>{activeConversation.companyName}</h2>
                                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{activeConversation.jobTitle}</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveConversation(null)} className={`hidden md:flex p-2 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all ${isDark ? 'text-slate-400' : 'text-neutral-400'}`}>
                                <X size={20} />
                            </button>
                        </header>

                        {/* Chat messages - Scrollable independently */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8" style={{ scrollbarWidth: 'none' }}>
                            {groupedMessages.map((group, groupIndex) => (
                                <div key={group.label} className="space-y-4">
                                    <div className="flex items-center justify-center sticky top-0 z-10 py-2">
                                        <span className={`backdrop-blur text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border ${isDark ? 'bg-neutral-800/80 text-neutral-400 border-neutral-700/50' : 'bg-neutral-100/80 text-neutral-500 border-neutral-200'}`}>
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
                                                            ? (isDark ? 'bg-white text-black rounded-br-sm' : 'bg-black text-white rounded-br-sm')
                                                            : (isDark ? 'bg-neutral-800 text-neutral-200 rounded-bl-sm' : 'bg-neutral-100 text-neutral-800 rounded-bl-sm')}`}>
                                                            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{linkifyText(msg.content, isMe)}</p>

                                                            {/* Inline link preview */}
                                                            {extractFirstUrl(msg.content) && (
                                                                <InlineLinkPreview
                                                                    url={extractFirstUrl(msg.content)!}
                                                                    className={isMe ? (isDark ? 'text-black' : 'text-white') : (isDark ? 'text-neutral-200' : 'text-neutral-800')}
                                                                />
                                                            )}

                                                            <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                                <span className={`text-[10px] ${isMe ? (isDark ? 'text-neutral-500' : 'text-neutral-400') : (isDark ? 'text-neutral-500' : 'text-neutral-400')}`}>
                                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                {isMe && <CheckCheck size={12} className={msg.is_read ? "text-emerald-500" : (isDark ? 'text-neutral-400' : 'text-neutral-300')} />}
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
                        <footer className={`px-4 py-3 border-t shrink-0 relative ${isDark ? 'border-neutral-800 bg-neutral-900/80' : 'border-neutral-200 bg-white'}`}>
                            {/* Link Preview Popup */}
                            {linkPreviewUrl && linkPreviewPosition && (
                                <div className="absolute bottom-full left-0 right-0 mb-2 px-4">
                                    <LinkPreview
                                        url={linkPreviewUrl}
                                        onClose={closeLinkPreview}
                                        onInsert={() => {
                                            // Just close the preview - the URL is already in the message 
                                            closeLinkPreview();
                                        }}
                                    />
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => handleMessageInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            closeLinkPreview();
                                            sendMessage();
                                        }
                                    }}
                                    placeholder="Type a message..."
                                    className={`flex-1 border rounded-2xl px-4 py-3 focus:outline-none transition-all text-sm ${isDark ? 'bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-neutral-600' : 'bg-neutral-50 border-neutral-200 text-black placeholder:text-neutral-400 focus:border-neutral-400'}`}
                                />
                                <button
                                    onClick={() => {
                                        closeLinkPreview();
                                        sendMessage();
                                    }}
                                    disabled={!newMessage.trim() || isSending}
                                    className={`w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-95 ${isDark ? 'bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-600' : 'bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400'}`}
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
