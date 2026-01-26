"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, ChevronRight, ChevronLeft, Zap, Send, Shield, Clock, X, Briefcase, UserCircle, Search, CheckCheck, User } from 'lucide-react';
import { useNotificationContext } from '@/app/context/NotificationContext';
import LinkPreview from '@/app/components/LinkPreview';
import InlineLinkPreview, { extractFirstUrl } from '@/app/components/InlineLinkPreview';
import { useSearchParams } from 'next/navigation';

function EmployerNotificationsContent() {
    // Consume Global Context
    const { notifications, applications: channels, loading, refresh, markAsRead } = useNotificationContext();
    const searchParams = useSearchParams();

    // -- Date Helpers --
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
                urlPattern.lastIndex = 0; // Reset regex
                // Use lighter colors for sender messages (green/emerald bubbles) for better contrast
                const linkClass = isSenderMessage
                    ? 'text-white underline hover:text-slate-200 break-all font-medium'
                    : 'text-slate-300 underline hover:text-white break-all';
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

    const groupMessagesByDate = (msgs: any[]) => {
        const groups: { label: string; messages: any[] }[] = [];
        msgs.forEach(msg => {
            const date = new Date(msg.created_at);
            const label = getMessageDateLabel(date);
            const lastGroup = groups[groups.length - 1];
            if (lastGroup && lastGroup.label === label) {
                lastGroup.messages.push(msg);
            } else {
                groups.push({ label, messages: [msg] });
            }
        });
        return groups;
    };

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

    // Handle URL Params for Direct Messaging
    useEffect(() => {
        const targetCandidateId = searchParams.get('candidateId');
        if (targetCandidateId && channels.length > 0 && !activeConversation) {
            // Find application with this candidate
            const targetChannel = channels.find(c => c.user?.id === targetCandidateId);
            if (targetChannel) {
                setActiveConversation(targetChannel);
                // Clean URL
                window.history.replaceState(null, '', '/employer/notifications');
            }
        }
    }, [searchParams, channels]);

    // 1. Fetch Messages when Active Conversation Changes
    useEffect(() => {
        if (activeConversation) {
            // Find all application IDs for this candidate (user)
            const candidateAppIds = getCandidateAppIds(activeConversation);
            fetchMessages(candidateAppIds);
        } else {
            setMessages([]);
        }
    }, [activeConversation]); // Dependency: only when switch conversation

    // 2. Notification-Driven Updates
    useEffect(() => {
        if (!activeConversation) return;

        const candidateAppIds = getCandidateAppIds(activeConversation);

        // Check for new unread notifications that belong to this candidate's applications
        const hasRelevantNotification = notifications.some(n =>
            !n.is_read && n.application_id && candidateAppIds.includes(n.application_id)
        );

        if (hasRelevantNotification) {
            fetchMessages(candidateAppIds);
            // Clear badges
            notifications.forEach(n => {
                if (!n.is_read && n.application_id && candidateAppIds.includes(n.application_id)) {
                    markAsRead(n.id);
                }
            });
        }
    }, [notifications, activeConversation]);

    // 3. Failsafe Polling (3s)
    useEffect(() => {
        if (!activeConversation) return;

        const candidateAppIds = getCandidateAppIds(activeConversation);

        const interval = setInterval(() => {
            fetchMessages(candidateAppIds);
        }, 3000);

        return () => clearInterval(interval);
    }, [activeConversation, channels]);

    // Helper to get grouped IDs
    const getCandidateAppIds = (conv: any) => {
        return channels
            .filter(c => c.user?.id === conv.user?.id) // Group by Candidate User ID
            .map(c => c.id);
    };

    const fetchMessages = async (appIds: string[]) => {
        try {
            const requestTime = Date.now();
            lastFetchTimeRef.current = requestTime;

            const idsParam = appIds.join(',');
            const res = await fetch(`/api/shared/messages?applicationIds=${idsParam}&t=${requestTime}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();

                // Race Condition Guard
                if (requestTime < lastFetchTimeRef.current) return;

                const newMessages = data.messages || [];
                setMessages(prev => {
                    return newMessages;
                });
                refresh(); // Update "Last Message" snippets globally

                // Mark local messages as read
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
                setMessages(prev => {
                    if (prev.some(m => m.id === data.message.id)) return prev;
                    return [...prev, { ...data.message, content: msgContent }];
                });
                refresh(); // Update "Last Message" snippets globally
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

    // Filter Logic
    const filteredChannels = channels.filter(app =>
        (app.job?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Grouping
    const groupedChannels = Object.values(
        filteredChannels.reduce((acc, app) => {
            // Group by user ID (Candidate)
            const userId = app.user?.id;
            if (userId && !acc[userId]) {
                acc[userId] = app;
            }
            return acc;
        }, {} as Record<string, any>)
    );

    return (
        <div className="flex h-full w-full bg-black text-neutral-200 overflow-hidden font-sans">
            {/* LEFT SIDEBAR - Fixed, doesn't scroll with content */}
            <aside className={`md:w-[380px] h-full border-r border-neutral-800 flex-col bg-neutral-900/50 backdrop-blur-xl shrink-0 w-full ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
                <header className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/20 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-white">
                            <Briefcase size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-wider">Messages</h2>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Online</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Search */}
                <div className="p-3 shrink-0">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-neutral-300 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500/50 transition-all"
                        />
                    </div>
                </div>

                {/* List Area - Scrollable */}
                <div className="flex-1 overflow-y-auto px-2" style={{ scrollbarWidth: 'none' }}>
                    {/* Unread notifications - compact */}
                    {notifications.filter(n => !n.is_read).length > 0 && (
                        <div className="px-3 py-3">
                            <h3 className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-2 px-2 flex items-center gap-1.5">
                                <Zap size={10} /> New
                            </h3>
                            {notifications.filter(n => !n.is_read).map((notif) => (
                                <button
                                    key={notif.id}
                                    onClick={() => {
                                        markAsRead(notif.id);
                                        if (notif.application_id) {
                                            const channel = channels.find(c => c.id === notif.application_id);
                                            if (channel) setActiveConversation(channel);
                                        }
                                    }}
                                    className="w-full p-3 rounded-2xl bg-neutral-800 border border-neutral-700 hover:border-neutral-600 transition-all cursor-pointer mb-2 text-left"
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="w-2 h-2 rounded-full bg-white mt-1 shrink-0"></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] text-white font-medium leading-snug line-clamp-2">{notif.message}</p>
                                            <span className="text-[9px] text-neutral-500 mt-1 block">{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Conversation list - WhatsApp style */}
                    <div className="pb-4">
                        <h3 className="px-4 py-2 text-[9px] font-black text-neutral-600 uppercase tracking-widest">Candidates</h3>
                        {groupedChannels.map((app: any) => {
                            const userId = app.user?.id;
                            // Check internal notifications state for badges
                            const hasUnread = notifications.some(n =>
                                !n.is_read && n.application_id &&
                                getCandidateAppIds(app).includes(n.application_id)
                            );

                            return (
                                <button
                                    key={userId}
                                    onClick={() => setActiveConversation(app)}
                                    className={`w-full px-3 py-3 flex items-center gap-3 transition-all ${activeConversation?.user?.id === userId ? 'bg-neutral-700/50' : 'hover:bg-neutral-800/30'}`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 relative overflow-hidden ${activeConversation?.user?.id === userId ? 'bg-neutral-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                                        {app.user?.profileImageUrl ? (
                                            <img src={app.user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={20} />
                                        )}
                                        {hasUnread && (
                                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-white rounded-full border-2 border-[#0b121e] animate-pulse"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 text-left min-w-0 border-b border-neutral-800/50 pb-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-sm font-bold text-white truncate">{app.user?.name || 'Applicant'}</h4>
                                            <span className="text-[9px] text-neutral-500 shrink-0">Now</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mt-1">
                                            <p className="text-xs text-neutral-500 truncate">{app.job?.title || 'Unknown Job'}</p>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </aside>

            {/* MAIN CHAT AREA - Separate scroll context */}
            <main className={`flex-1 flex-col relative bg-black min-w-0 ${activeConversation ? 'flex' : 'hidden md:flex'} w-full`}>
                {!activeConversation ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-24 h-24 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center mb-6">
                            <MessageSquare size={36} className="text-neutral-700" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">Select a Conversation</h2>
                        <p className="text-neutral-500 max-w-sm text-sm">Choose a candidate from the left to start messaging.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat header - Fixed */}
                        <header className="px-6 py-4 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setActiveConversation(null)}
                                    className="md:hidden p-2 -ml-2 text-neutral-400 hover:text-white"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <div className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center overflow-hidden shrink-0">
                                    {activeConversation.user?.profileImageUrl ? (
                                        <img src={activeConversation.user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={20} />
                                    )}
                                </div>
                                <div className="text-left">
                                    <h2 className="text-base font-bold text-white">{activeConversation.user?.name || 'Candidate'}</h2>
                                    <p className="text-xs text-slate-400">{activeConversation.job?.title || 'Job Thread'}</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveConversation(null)} className="hidden md:flex p-2 hover:bg-slate-700 hover:text-white text-slate-400 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </header>

                        {/* Chat messages - Scrollable independently */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ scrollbarWidth: 'none' }}>
                            <div className="flex justify-center mb-4">
                                <div className="px-4 py-1.5 bg-neutral-900/80 border border-neutral-800 rounded-full flex items-center gap-2">
                                    <Shield size={10} className="text-white" />
                                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Encrypted</span>
                                </div>
                            </div>

                            {groupMessagesByDate(
                                messages.filter((msg, index, self) =>
                                    index === self.findIndex((t) => (t.id === msg.id))
                                )
                            ).map((group, groupIndex) => (
                                <div key={group.label} className="space-y-4">
                                    <div className="flex items-center justify-center sticky top-0 z-10 py-2">
                                        <span className="bg-neutral-800/80 backdrop-blur-sm text-neutral-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-neutral-700/50 shadow-sm">
                                            {group.label}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {group.messages.map((msg) => {
                                            const isMe = msg.sender_type === 'employer';
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                        <div className={`px-4 py-2.5 rounded-2xl relative ${isMe
                                                            ? 'bg-neutral-700 text-white rounded-br-sm'
                                                            : 'bg-neutral-800 text-neutral-200 rounded-bl-sm'}`}>
                                                            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{linkifyText(msg.content, isMe)}</p>

                                                            {/* Inline link preview */}
                                                            {extractFirstUrl(msg.content) && (
                                                                <InlineLinkPreview
                                                                    url={extractFirstUrl(msg.content)!}
                                                                    className={isMe ? 'text-white' : 'text-slate-200'}
                                                                />
                                                            )}

                                                            <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                                <span className={`text-[10px] ${isMe ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                                {isMe && <CheckCheck size={12} className={msg.is_read ? "text-neutral-400" : "text-neutral-500"} />}
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
                        <footer className="px-4 py-3 border-t border-neutral-800 bg-neutral-900/80 shrink-0 relative">
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
                                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-all text-sm"
                                />
                                <button
                                    onClick={() => {
                                        closeLinkPreview();
                                        sendMessage();
                                    }}
                                    disabled={!newMessage.trim() || isSending}
                                    className="w-11 h-11 flex items-center justify-center rounded-full transition-all bg-white text-black hover:bg-neutral-100 active:scale-95 disabled:bg-neutral-800 disabled:text-neutral-600"
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

export default function EmployerNotifications() {
    return (
        <React.Suspense fallback={
            <div className="flex items-center justify-center p-8 h-screen bg-black">
                <div className="animate-spin w-8 h-8 border-2 border-t-transparent border-neutral-500 rounded-full" />
            </div>
        }>
            <EmployerNotificationsContent />
        </React.Suspense>
    );
}
