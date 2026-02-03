"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Bell, MessageSquare, ChevronRight, ChevronLeft, Zap, Send, Shield, Clock, X, Building2, UserCircle, Search, CheckCheck, Plus } from 'lucide-react';
import { useNotificationContext } from '@/app/context/NotificationContext';
import VerificationBadge from '@/app/components/VerificationBadge';
import LinkPreview from '@/app/components/LinkPreview';
import InlineLinkPreview, { extractFirstUrl } from '@/app/components/InlineLinkPreview';
import { useTheme } from '@/app/context/ThemeContext';
import { useSearchParams } from 'next/navigation';

function MessagesContent() {
    // Theme
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const searchParams = useSearchParams();

    // Consume Global Context
    const { notifications, applications, loading, refresh, markAsRead } = useNotificationContext();

    // Local State
    const [activeConversation, setActiveConversation] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Refs
    const messageEndRef = useRef<HTMLDivElement>(null);
    const lastMessageCountRef = useRef(0);
    const lastFetchTimeRef = useRef(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Link preview state
    const [linkPreviewUrl, setLinkPreviewUrl] = useState<string | null>(null);
    const [linkPreviewPosition, setLinkPreviewPosition] = useState<{ x: number; y: number } | null>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [newMessage]);

    // Initial Scroll
    useEffect(() => {
        if (messages.length > lastMessageCountRef.current) {
            messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            lastMessageCountRef.current = messages.length;
        }
    }, [messages]);

    // Handle URL Params for Direct Messaging or Application Messaging
    useEffect(() => {
        const targetCompanyId = searchParams.get('companyId');
        const recipientId = searchParams.get('recipientId');
        const recipientName = searchParams.get('recipientName');
        const recipientType = searchParams.get('recipientType') || 'professional';

        if (targetCompanyId && applications.length > 0 && !activeConversation) {
            const targetApp = applications.find(app => (app.companyId === targetCompanyId || app.company?.id === targetCompanyId));
            if (targetApp) {
                setActiveConversation(targetApp);
                window.history.replaceState(null, '', '/professional/messages');
            }
        } else if (recipientId && !activeConversation) {
            // Direct Message Mode
            setActiveConversation({
                id: 'new_dm_' + recipientId, // Temporary ID
                isDirect: true,
                recipientId: recipientId,
                recipientType: recipientType, // Store dynamic type
                companyName: recipientName || (recipientType === 'employer' ? 'Company' : 'Professional'),
                jobTitle: 'Direct Message',
                companyLogoUrl: null
            });
        }
    }, [searchParams, applications]);

    // 1. Fetch Messages
    useEffect(() => {
        if (activeConversation) {
            if (activeConversation.isDirect) {
                fetchMessages([], activeConversation.recipientId);
            } else {
                const companyAppIds = getCompanyAppIds(activeConversation);
                fetchMessages(companyAppIds);
            }
        } else {
            setMessages([]);
        }
    }, [activeConversation]);

    // 2. Notification-Driven Updates
    useEffect(() => {
        if (!activeConversation) return;

        if (activeConversation.isDirect) {
            // Poll or check notifications for DM? For now, we rely on polling/manual refresh for DMs or implement specific logic
            const hasRelevantNotification = notifications.some(n =>
                !n.is_read && !n.application_id && (n.user_id === activeConversation.recipientId || n.company_id === activeConversation.recipientId) // Logic for DM notifications needs refinement
            );
            if (hasRelevantNotification) fetchMessages([], activeConversation.recipientId);

        } else {
            const companyAppIds = getCompanyAppIds(activeConversation);
            const hasRelevantNotification = notifications.some(n =>
                !n.is_read && n.application_id && companyAppIds.includes(n.application_id)
            );
            if (hasRelevantNotification) {
                fetchMessages(companyAppIds);
                // Mark as read...
            }
        }
    }, [notifications, activeConversation]);

    // 3. Failsafe Polling
    useEffect(() => {
        if (!activeConversation) return;
        const interval = setInterval(() => {
            if (activeConversation.isDirect) {
                fetchMessages([], activeConversation.recipientId);
            } else {
                const companyAppIds = getCompanyAppIds(activeConversation);
                fetchMessages(companyAppIds);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [activeConversation, applications]);

    const getCompanyAppIds = (conv: any) => {
        if (conv.isDirect) return [];
        return applications
            .filter(app => app.companyName === conv.companyName)
            .filter(app => app.company?.id === conv.company?.id || app.companyId === conv.companyId)
            .map(app => app.id);
    };

    const fetchMessages = async (appIds: string[], otherPartyId?: string) => {
        try {
            const requestTime = Date.now();
            lastFetchTimeRef.current = requestTime;
            let url = `/api/shared/messages?t=${requestTime}`;

            if (otherPartyId) {
                url += `&otherPartyId=${otherPartyId}`;
            } else {
                const idsParam = appIds.join(',');
                url += `&applicationIds=${idsParam}`;
            }

            const res = await fetch(url, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (requestTime < lastFetchTimeRef.current) return;
                setMessages(data.messages || []);
                // Mark as read logic needs adapting for DMs
                if (otherPartyId) markMessagesAsRead([], otherPartyId);
                else markMessagesAsRead(appIds);
            }
        } catch (error) {
            console.error("Error fetching messages", error);
        }
    };

    const sendMessage = async (content: string = newMessage, attachmentUrl?: string) => {
        if ((!content.trim() && !attachmentUrl) || !activeConversation || isSending) return;

        setNewMessage('');
        setIsSending(true);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        try {
            const body: any = {
                content: content,
                attachmentUrl: attachmentUrl
            };

            if (activeConversation.isDirect) {
                body.recipientId = activeConversation.recipientId;
                body.recipientType = activeConversation.recipientType || 'professional';
            } else {
                body.applicationId = activeConversation.id;
            }

            const res = await fetch('/api/shared/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => {
                    if (prev.some(m => m.id === data.message.id)) return prev;
                    return [...prev, { ...data.message, content: content }];
                });
                refresh();
            }
        } catch (error) {
            console.error("Error sending message", error);
        } finally {
            setIsSending(false);
        }
    };

    const markMessagesAsRead = async (appIds: string[], senderId?: string) => {
        try {
            const body: any = {};
            if (senderId) body.senderId = senderId;
            else body.applicationIds = appIds;

            await fetch('/api/shared/messages', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        } catch (e) { console.error(e); }
    };

    // File Upload Handler
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setIsUploading(true);

        try {
            const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
                method: 'POST',
                body: file,
            });

            if (response.ok) {
                const blob = await response.json();
                // Send message with the image/file URL
                // We'll append it to the content as markdown for now or handle as specific field if DB supports it.
                // Assuming Markdown support for images:
                const attachmentMarkdown = file.type.startsWith('image/')
                    ? `\n![${file.name}](${blob.url})`
                    : `\n[Download ${file.name}](${blob.url})`;

                await sendMessage("", attachmentMarkdown); // Send just the attachment
            } else {
                console.error("Upload failed");
            }
        } catch (error) {
            console.error("Error uploading file", error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Input Handlers
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            // Check if user wants Shift+Enter behavior (Standard) or Enter to Send
            // User requested: "enter button does not send it moves down to write down"
            // So Enter => New Line (Default behavior)
            // We don't prevent default.
            // Ctrl+Enter to send?
            // "then add in chat place for sending that enter button does not send it moves down to write down"
            // So we ONLY send on button click? Or maybe Ctrl+Enter.
            // Let's implement Ctrl+Enter to send as a power user feature, but keep Enter for new line.
        }
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            closeLinkPreview();
            sendMessage();
        }
    };

    // ... Copy existing Link Preview Logic ...
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastDetectedUrlRef = useRef<string | null>(null);
    const handleMessageInput = (value: string) => {
        setNewMessage(value);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        const urlPattern = /(https?:\/\/|www\.)[^\s]+/gi;
        const matches = value.match(urlPattern);
        if (matches && matches.length > 0) {
            const url = matches[matches.length - 1];
            const fullUrl = url.startsWith('www.') ? 'https://' + url : url;
            debounceTimerRef.current = setTimeout(() => {
                if (lastDetectedUrlRef.current !== fullUrl) {
                    lastDetectedUrlRef.current = fullUrl;
                    if (textareaRef.current) {
                        const rect = textareaRef.current.getBoundingClientRect();
                        setLinkPreviewUrl(fullUrl);
                        setLinkPreviewPosition({ x: Math.min(rect.left, window.innerWidth - 350), y: rect.top - 10 });
                    }
                }
            }, 500);
        } else {
            lastDetectedUrlRef.current = null;
            setLinkPreviewUrl(null);
            setLinkPreviewPosition(null);
        }
    };
    const closeLinkPreview = () => { lastDetectedUrlRef.current = null; setLinkPreviewUrl(null); setLinkPreviewPosition(null); };

    // Sidebar Data
    const allConversations = [...applications];

    // If activeConversation is a "new direct message" (has isDirect flag) and not in the list, add it temporarily
    if (activeConversation && activeConversation.isDirect && !allConversations.find(a => (a.companyId === activeConversation.companyId) || (a.company?.id === activeConversation.company?.id) || (a.id === activeConversation.id))) {
        // Normalize for sidebar group logic
        allConversations.unshift(activeConversation);
    }

    const filteredConversations = allConversations.filter(app => (app.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) || (app.companyName || '').toLowerCase().includes(searchQuery.toLowerCase()));

    // Group logic adjustment to handle generic IDs or DM IDs
    const groupedConversations = filteredConversations;
    // Note: The previous grouping logic was reducing by companyId. For DMs, we might not have a companyId, or it might be unique per DM. 
    // Simplifying to just list them for now as grouping by company might hide DMs if ID logic is flawed.
    // However, keeping close to original behavior but allowing DMs:
    /* 
    const groupedConversations = Object.values(filteredConversations.reduce((acc, app) => {
        const key = app.companyId || app.company?.id || app.id; // Use ID as fallback key for DMs
        if (!key) return acc;
        if (!acc[key]) acc[key] = app;
        return acc;
    }, {} as Record<string, any>));
    */
    // Actually, let's stick to the list since 'applications' vs 'conversations' might be 1:1 in this context usually, or specific to job applications.
    // But to respect existing structure:
    const finalConversations = Object.values(filteredConversations.reduce((acc, app) => {
        const key = app.companyId || app.company?.id || app.id;
        if (!key) return acc;
        if (!acc[key]) acc[key] = app;
        return acc;
    }, {} as Record<string, any>));

    // Message Rendering Helpers (Date Label, Linkify)
    const getMessageDateLabel = (date: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    };
    const linkifyText = (text: string, isSenderMessage: boolean = false) => {
        const urlPattern = /(https?:\/\/[^\s]+)/gi;
        const parts = text.split(urlPattern);
        return parts.map((part, i) => {
            if (urlPattern.test(part)) {
                urlPattern.lastIndex = 0;
                // Basic check for image markdown we just added
                if (part.match(/\.(jpeg|jpg|gif|png)$/) != null) {
                    return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="block mt-2"><img src={part} alt="attachment" className="max-w-full rounded-lg border border-white/10" /></a>
                }
                const linkClass = isSenderMessage ? 'text-white underline hover:text-neutral-200 break-all font-medium' : (isDark ? 'text-neutral-300 underline hover:text-white break-all' : 'text-neutral-600 underline hover:text-black break-all');
                return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={linkClass}>{part}</a>;
            }
            return part;
        });
    };
    // Proper markdown renderer for images from our upload
    const renderMessageContent = (content: string, isMe: boolean) => {
        // Simple parser for detecting markdown image syntax: ![alt](url)
        const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
        const hasImage = imgRegex.test(content);

        if (hasImage) {
            const parts = content.split(imgRegex); // Split keeps capturing groups
            // This simple split needs care. Let's strictly match or replace.
            // Better: Replace image syntax with <img> tag in a safe way or return array of elements.
            // For safety and speed, let's just use a simple replacer for now or handle the specific case of "Only Image" vs "Text + Image".

            // If content is JUST an image (our upload style):
            const match = content.match(/^!\[(.*?)\]\((.*?)\)$/);
            if (match) {
                return (
                    <div className="mt-1">
                        <img src={match[2]} alt={match[1]} className="max-w-[240px] md:max-w-sm rounded-lg border border-white/10 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(match[2], '_blank')} />
                    </div>
                );
            }
        }
        return <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{linkifyText(content, isMe)}</p>;
    };

    const groupedMessages = (() => {
        const groups: { label: string; messages: any[] }[] = [];
        messages.filter((msg, index, self) => index === self.findIndex((t) => (t.id === msg.id))).forEach(msg => {
            const date = new Date(msg.created_at);
            const label = getMessageDateLabel(date);
            let group = groups.find(g => g.label === label);
            if (!group) { group = { label, messages: [] }; groups.push(group); }
            group.messages.push(msg);
        });
        return groups;
    })();

    return (
        <div className={`flex h-full w-full overflow-hidden font-sans ${isDark ? 'bg-black text-neutral-200' : 'bg-neutral-50 text-neutral-800'}`}>
            {/* LEFT SIDEBAR */}
            <aside className={`md:w-[380px] h-full border-r flex-col backdrop-blur-xl shrink-0 w-full ${isDark ? 'border-neutral-800 bg-neutral-900/50' : 'border-neutral-200 bg-white'} ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
                <header className={`p-5 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-neutral-800 bg-neutral-900/80' : 'border-neutral-200 bg-white'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}><UserCircle size={20} /></div>
                        <h2 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>Messages</h2>
                    </div>
                </header>
                <div className={`p-3 shrink-0 ${isDark ? 'bg-neutral-900/80' : 'bg-neutral-50'}`}>
                    <div className="relative group">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-500' : 'text-neutral-400'}`} size={16} />
                        <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-neutral-900/50 border-neutral-800 focus:ring-white/20' : 'bg-white border-neutral-200 focus:ring-black/10'}`} />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-2" style={{ scrollbarWidth: 'none' }}>
                    {notifications.filter(n => !n.is_read).length > 0 && (
                        <div className="px-3 py-3">
                            <h3 className={`text-[9px] font-black uppercase tracking-widest mb-2 px-2 flex items-center gap-1.5 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}><Zap size={10} /> New</h3>
                            {notifications.filter(n => !n.is_read).map((notif) => (
                                <button key={notif.id} onClick={() => { markAsRead(notif.id); if (notif.application_id) { const app = applications.find(a => a.id === notif.application_id); if (app) setActiveConversation(app); } }} className={`w-full p-3 rounded-2xl border transition-all cursor-pointer mb-2 text-left ${isDark ? 'bg-white/5 border-white/20' : 'bg-black/5 border-black/10'}`}>
                                    <div className="flex items-start gap-2"><div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${isDark ? 'bg-white' : 'bg-black'}`}></div><p className={`text-[11px] font-medium leading-snug line-clamp-2 ${isDark ? 'text-white' : 'text-black'}`}>{notif.message}</p></div>
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="pb-4">
                        <h3 className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-neutral-400'}`}>Conversations</h3>
                        {finalConversations.map((app: any) => {
                            const companyId = app.companyId || app.company?.id || app.id;
                            const unreadCount = notifications.filter(n => !n.is_read && n.application_id && getCompanyAppIds(app).includes(n.application_id)).length;
                            return (
                                <button key={companyId} onClick={() => setActiveConversation(app)} className={`w-full px-3 py-3 flex items-center gap-3 transition-all ${(activeConversation?.companyId === companyId || activeConversation?.company?.id === companyId || activeConversation?.id === companyId) ? (isDark ? 'bg-white/10' : 'bg-black/5') : (isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-neutral-100')}`}>
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 relative overflow-hidden ${(activeConversation?.companyId === companyId || activeConversation?.company?.id === companyId || activeConversation?.id === companyId) ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : (isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500')}`}>
                                        {app.companyLogoUrl ? (
                                            <img src={app.companyLogoUrl} alt="" className="w-full h-full object-cover" />
                                        ) : app.isDirect && app.role === 'professional' ? (
                                            /* If we have a profile image in the app object (needs to be ensured in construction) */
                                            <UserCircle size={20} /> /* Placeholder until we map profileImage correctly in activeConversation constr */
                                        ) : (
                                            <Building2 size={20} />
                                        )}
                                        {unreadCount > 0 && <div className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full border-2 border-neutral-900 flex items-center justify-center animate-pulse"><span className="text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span></div>}
                                    </div>
                                    <div className={`flex-1 text-left min-w-0 border-b pb-3 ${isDark ? 'border-neutral-800/50' : 'border-neutral-200'}`}>
                                        <h4 className={`text-sm font-bold truncate flex items-center gap-1 ${isDark ? 'text-white' : 'text-black'}`}>
                                            {app.companyName}
                                            <VerificationBadge tier={app.badgeType} size={12} />
                                        </h4>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </aside>

            {/* MAIN CHAT AREA */}
            <main className={`flex-1 flex-col relative min-w-0 ${isDark ? 'bg-black' : 'bg-white'} ${activeConversation ? 'flex' : 'hidden md:flex'}`}>
                {!activeConversation ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className={`w-24 h-24 border rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}><MessageSquare size={36} className={isDark ? 'text-neutral-700' : 'text-neutral-300'} /></div>
                        <h2 className={`text-2xl font-black uppercase tracking-tighter mb-3 ${isDark ? 'text-white' : 'text-black'}`}>Select a Conversation</h2>
                    </div>
                ) : (
                    <>
                        <header className={`px-6 py-4 border-b backdrop-blur-md flex items-center justify-between shrink-0 z-10 ${isDark ? 'border-neutral-800 bg-neutral-900/80' : 'border-neutral-200 bg-white/80'}`}>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setActiveConversation(null)} className={`md:hidden p-2 -ml-2 ${isDark ? 'text-slate-400' : 'text-neutral-400'}`}><ChevronLeft size={24} /></button>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${isDark ? 'bg-white/10 text-neutral-300' : 'bg-black/5 text-neutral-500'}`}>{activeConversation.companyLogoUrl ? <img src={activeConversation.companyLogoUrl} alt="" className="w-full h-full object-cover" /> : <Building2 size={20} />}</div>
                                <div>
                                    <h2 className={`text-base font-bold flex items-center gap-1 ${isDark ? 'text-white' : 'text-black'}`}>
                                        {activeConversation.companyName}
                                        <VerificationBadge tier={activeConversation.badgeType} size={16} />
                                    </h2>
                                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{activeConversation.jobTitle}</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveConversation(null)} className={`hidden md:flex p-2 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all ${isDark ? 'text-slate-400' : 'text-neutral-400'}`}><X size={20} /></button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8" style={{ scrollbarWidth: 'none' }}>
                            {groupedMessages.map((group) => (
                                <div key={group.label} className="space-y-4">
                                    <div className="flex items-center justify-center sticky top-0 z-10 py-2"><span className={`backdrop-blur text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border ${isDark ? 'bg-neutral-800/80 text-neutral-400 border-neutral-700/50' : 'bg-neutral-100/80 text-neutral-500 border-neutral-200'}`}>{group.label}</span></div>
                                    <div className="space-y-2">
                                        {group.messages.map((msg: any) => {
                                            const isMe = msg.sender_type === 'professional';
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                        <div className={`px-4 py-3 rounded-2xl relative ${isMe ? (isDark ? 'bg-white text-black rounded-br-sm' : 'bg-black text-white rounded-br-sm') : (isDark ? 'bg-neutral-800 text-neutral-200 rounded-bl-sm' : 'bg-neutral-100 text-neutral-800 rounded-bl-sm')}`}>
                                                            {renderMessageContent(msg.content, isMe)}
                                                            {extractFirstUrl(msg.content) && <div className="mt-2"><InlineLinkPreview url={extractFirstUrl(msg.content)!} className={isMe ? (isDark ? 'text-black' : 'text-white') : (isDark ? 'text-neutral-200' : 'text-neutral-800')} /></div>}
                                                            <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                                <span className={`text-[10px] ${isMe ? (isDark ? 'text-neutral-500' : 'text-neutral-400') : (isDark ? 'text-neutral-500' : 'text-neutral-400')}`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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

                        {/* Message input */}
                        <footer className={`px-4 py-4 border-t shrink-0 relative ${isDark ? 'border-neutral-800 bg-neutral-900/80' : 'border-neutral-200 bg-white'}`}>
                            {linkPreviewUrl && linkPreviewPosition && <div className="absolute bottom-full left-0 right-0 mb-2 px-4"><LinkPreview url={linkPreviewUrl} onClose={closeLinkPreview} onInsert={() => closeLinkPreview()} /></div>}
                            <div className={`flex items-end gap-3 p-2 rounded-[24px] transition-all ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
                                <div className="flex gap-1 pb-1">
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />
                                    <button onClick={() => fileInputRef.current?.click()} className={`p-2 rounded-full transition-all ${isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-500 hover:bg-neutral-200 hover:text-black'}`} title="Attach file">
                                        <Plus size={20} />
                                    </button>
                                </div>
                                <textarea
                                    ref={textareaRef}
                                    value={newMessage}
                                    onChange={(e) => handleMessageInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isSending || isUploading}
                                    placeholder="Type a message..."
                                    className={`flex-1 bg-transparent border-none focus:ring-0 resize-none py-2.5 max-h-32 min-h-[44px] text-sm ${isDark ? 'text-white placeholder:text-neutral-600' : 'text-black placeholder:text-neutral-400'}`}
                                    rows={1}
                                />
                                <button
                                    onClick={() => { closeLinkPreview(); sendMessage(); }}
                                    disabled={(!newMessage.trim() && !isUploading) || isSending}
                                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all shrink-0 mb-0.5 ${isDark ? 'bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-600' : 'bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400'}`}
                                >
                                    {isUploading ? <div className="animate-spin w-4 h-4 border-2 border-t-transparent border-current rounded-full" /> : <Send size={18} />}
                                </button>
                            </div>
                            <p className={`text-[10px] text-center mt-2 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Press <strong>Enter</strong> for new line. <strong>Ctrl+Enter</strong> to send.</p>
                        </footer>
                    </>
                )}
            </main>
        </div>
    );
}

export default function NotificationsPage() {
    return (
        <React.Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin w-8 h-8 border-2 border-t-transparent border-neutral-500 rounded-full" />
            </div>
        }>
            <MessagesContent />
        </React.Suspense>
    );
}
