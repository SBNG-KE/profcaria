"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    MessageSquare, ChevronLeft, Send, X, Building2, UserCircle, Search,
    CheckCheck, Plus, FileText, Users, Briefcase, MessagesSquare, Zap, Lock
} from 'lucide-react';
import { useNotificationContext } from '@/app/context/NotificationContext';
import LinkPreview from '@/app/components/LinkPreview';
import InlineLinkPreview, { extractFirstUrl } from '@/app/components/InlineLinkPreview';
import { useTheme } from '@/app/context/ThemeContext';
import { useSearchParams } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────
type FilterTab = 'social' | 'groups' | 'job';
type SearchResult = {
    id: string;
    name: string;
    image: string;
    type: 'professional' | 'employer';
    followers: number;
    badgeType?: string;
};

// ─── Message Cache ────────────────────────────────────────
const messageCache = new Map<string, { messages: any[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCachedMessages(key: string): any[] | null {
    const c = messageCache.get(key);
    if (c && Date.now() - c.timestamp < CACHE_TTL) return c.messages;
    return null;
}
function setCachedMessages(key: string, msgs: any[]) {
    messageCache.set(key, { messages: msgs, timestamp: Date.now() });
}
function getConversationKey(conv: any): string {
    if (conv.otherPartyId) return `dm-${conv.otherPartyId}`;
    return `app-${conv.id}`;
}

// ─── Main Component ───────────────────────────────────────
function ChatContent() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const searchParams = useSearchParams();

    const { notifications, applications, loading, refresh, markAsRead } = useNotificationContext();

    // Core State
    const [activeConversation, setActiveConversation] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterTab>('job');

    // Contact Search State
    const [contactResults, setContactResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Link preview
    const [linkPreviewUrl, setLinkPreviewUrl] = useState<string | null>(null);
    const [linkPreviewPosition, setLinkPreviewPosition] = useState<{ x: number; y: number } | null>(null);

    // File upload
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Refs
    const messageEndRef = useRef<HTMLDivElement>(null);
    const lastMessageCountRef = useRef(0);
    const lastFetchTimeRef = useRef(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [newMessage]);

    // Auto-scroll on new messages
    useEffect(() => {
        if (messages.length > lastMessageCountRef.current) {
            messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            lastMessageCountRef.current = messages.length;
        }
    }, [messages]);

    // Click outside to close search
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // URL Params
    useEffect(() => {
        const targetAppId = searchParams.get('applicationId');
        if (targetAppId && applications.length > 0 && !activeConversation) {
            const targetApp = applications.find(app => app.id === targetAppId);
            if (targetApp) {
                setActiveConversation(targetApp);
                window.history.replaceState(null, '', '/employer/notifications');
            }
        }
    }, [searchParams, applications]);

    // Fetch Messages (with Cache)
    useEffect(() => {
        if (activeConversation) {
            const key = getConversationKey(activeConversation);
            const cached = getCachedMessages(key);
            if (cached) setMessages(cached);

            if (activeConversation.otherPartyId) {
                fetchMessagesDM(activeConversation.otherPartyId);
            } else {
                fetchMessages([activeConversation.id]);
            }
        } else {
            setMessages([]);
        }
    }, [activeConversation]);

    // Notification-Driven Updates
    useEffect(() => {
        if (!activeConversation) return;
        if (activeConversation.otherPartyId) {
            const hasNew = notifications.some(n => !n.is_read && n.sender_id === activeConversation.otherPartyId);
            if (hasNew) fetchMessagesDM(activeConversation.otherPartyId);
        } else {
            const currentAppId = activeConversation.id;
            const hasNew = notifications.some(n => !n.is_read && n.application_id === currentAppId);
            if (hasNew) {
                fetchMessages([currentAppId]);
                notifications.forEach(n => {
                    if (!n.is_read && n.application_id === currentAppId) markAsRead(n.id);
                });
            }
        }
    }, [notifications, activeConversation]);

    // Failsafe Polling
    useEffect(() => {
        if (!activeConversation) return;
        const interval = setInterval(() => {
            if (activeConversation.otherPartyId) {
                fetchMessagesDM(activeConversation.otherPartyId);
            } else {
                fetchMessages([activeConversation.id]);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [activeConversation]);

    // Fetch by application IDs
    const fetchMessages = async (appIds: string[]) => {
        try {
            const requestTime = Date.now();
            lastFetchTimeRef.current = requestTime;
            const idsParam = appIds.join(',');
            const res = await fetch(`/api/shared/messages?applicationIds=${idsParam}&t=${requestTime}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (requestTime < lastFetchTimeRef.current) return;
                const msgs = data.messages || [];
                setMessages(msgs);
                if (activeConversation) setCachedMessages(getConversationKey(activeConversation), msgs);
                markMessagesAsRead(appIds);
            }
        } catch (error) {
            console.error("Error fetching messages", error);
        }
    };

    // Fetch DMs
    const fetchMessagesDM = async (recipientId: string) => {
        try {
            if (activeConversation?.isTemp) { setMessages([]); return; }
            const requestTime = Date.now();
            lastFetchTimeRef.current = requestTime;
            const res = await fetch(`/api/shared/messages?recipientId=${recipientId}&t=${requestTime}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (requestTime < lastFetchTimeRef.current) return;
                const msgs = data.messages || [];
                setMessages(msgs);
                if (activeConversation) setCachedMessages(getConversationKey(activeConversation), msgs);
            }
        } catch (error) {
            console.error("Error fetching DMs", error);
        }
    };

    const sendMessage = async (content: string = newMessage, attachmentUrl?: string) => {
        if ((!content.trim() && !attachmentUrl && !selectedFile) || !activeConversation || isSending) return;
        setIsSending(true);

        let finalAttachmentUrl = attachmentUrl;
        if (selectedFile && !finalAttachmentUrl) {
            setIsUploading(true);
            try {
                const response = await fetch(`/api/upload?filename=${encodeURIComponent(selectedFile.name)}`, { method: 'POST', body: selectedFile });
                if (response.ok) {
                    const blob = await response.json();
                    finalAttachmentUrl = selectedFile.type.startsWith('image/')
                        ? `\n![${selectedFile.name}](${blob.url})`
                        : `\n[Download ${selectedFile.name}](${blob.url})`;
                } else { setIsSending(false); setIsUploading(false); return; }
            } catch { setIsSending(false); setIsUploading(false); return; }
            setIsUploading(false);
        }

        setNewMessage('');
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        try {
            const payload: any = {
                content: content + (finalAttachmentUrl || ''),
                attachmentUrl: null
            };

            if (activeConversation.otherPartyId) {
                payload.recipientId = activeConversation.otherPartyId;
                payload.recipientType = activeConversation.otherPartyType || 'professional';
            } else {
                payload.applicationId = activeConversation.id;
            }

            const res = await fetch('/api/shared/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
                const newMsg = { ...data.message, content: content + (finalAttachmentUrl || '') };
                setMessages(prev => {
                    if (prev.some(m => m.id === data.message.id)) return prev;
                    const updated = [...prev, newMsg];
                    if (activeConversation) setCachedMessages(getConversationKey(activeConversation), updated);
                    return updated;
                });
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
            await fetch('/api/shared/messages', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationIds: appIds }) });
        } catch (e) { console.error(e); }
    };

    // File Upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setSelectedFile(file);
        if (file.type.startsWith('image/')) setPreviewUrl(URL.createObjectURL(file));
        else setPreviewUrl(null);
    };

    // Input Handlers
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); closeLinkPreview(); sendMessage(); }
    };

    // Link Preview
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastDetectedUrlRef = useRef<string | null>(null);
    const handleMessageInput = (value: string) => {
        setNewMessage(value);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        const urlPattern = /(?:https?:\/\/|www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,10}\b(?:[-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
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

    // Contact Search
    const handleSearchInput = (value: string) => {
        setSearchQuery(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (value.trim().length >= 2) {
            setShowSearchResults(true);
            setIsSearching(true);
            searchTimeoutRef.current = setTimeout(async () => {
                try {
                    const res = await fetch(`/api/search/users?q=${encodeURIComponent(value.trim())}&context=chat`);
                    if (res.ok) {
                        const data = await res.json();
                        setContactResults(data.results || []);
                    }
                } catch (e) { console.error("Search error", e); }
                finally { setIsSearching(false); }
            }, 300);
        } else {
            setShowSearchResults(false);
            setContactResults([]);
            setIsSearching(false);
        }
    };

    const startNewConversation = (result: SearchResult) => {
        const existing = applications.find(app => app.otherPartyId === result.id || app.companyId === result.id);
        if (existing) {
            setActiveConversation(existing);
        } else {
            setActiveConversation({
                id: 'new_dm_' + result.id,
                isTemp: true,
                user: { name: result.name, profileImageUrl: result.image },
                job: { title: 'Direct Message' },
                otherPartyId: result.id,
                otherPartyType: result.type,
                status: 'active'
            });
        }
        setShowSearchResults(false);
        setSearchQuery('');
        setContactResults([]);
    };

    // Filtered Conversations
    const filteredConversations = useMemo(() => {
        let filtered = applications;
        if (activeFilter === 'social') {
            filtered = filtered.filter(app => app.isDm);
        } else if (activeFilter === 'job') {
            filtered = filtered.filter(app => !app.isDm);
        }
        if (searchQuery && !showSearchResults) {
            filtered = filtered.filter(app => {
                const name = app.user?.name || 'Candidate';
                const job = app.job?.title || 'Job';
                return name.toLowerCase().includes(searchQuery.toLowerCase()) || job.toLowerCase().includes(searchQuery.toLowerCase());
            });
        }
        return filtered;
    }, [applications, activeFilter, searchQuery, showSearchResults]);

    // Message Date Labels
    const getMessageDateLabel = (date: Date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    };

    const linkifyText = (text: string, isSenderMessage: boolean = false) => {
        const urlPattern = /(?:https?:\/\/|www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,10}\b(?:[-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
        const parts = text.split(urlPattern);
        return parts.map((part, i) => {
            if (urlPattern.test(part)) {
                urlPattern.lastIndex = 0;
                if (part.match(/\.(jpeg|jpg|gif|png)$/) != null) {
                    return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="block mt-2"><img src={part} alt="attachment" className="max-w-full rounded-lg border border-white/10" /></a>
                }
                const displayUrl = part.startsWith('http') ? part : 'https://' + part;
                const linkClass = isSenderMessage ? 'text-[#6B8CD5] underline hover:text-white break-all font-medium' : (isDark ? 'text-neutral-300 underline hover:text-white break-all' : 'text-neutral-600 underline hover:text-black break-all');
                return <a key={i} href={displayUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>{part}</a>;
            }
            return part;
        });
    };

    const renderMessageContent = (content: string, isMe: boolean) => {
        const mediaRegex = /((?:!)?\[.*?\]\(.*?\))/g;
        const parts = content.split(mediaRegex);
        return (
            <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                {parts.map((part, index) => {
                    const imgMatch = part.match(/^!\[(.*?)\]\((.*?)\)$/);
                    if (imgMatch) {
                        return (
                            <div key={index} className="mt-2 mb-1">
                                <img src={imgMatch[2]} alt={imgMatch[1]} className="w-auto h-auto max-w-[240px] max-h-[240px] object-contain rounded-lg border border-white/10 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(imgMatch[2], '_blank')} onLoad={() => messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })} />
                            </div>
                        );
                    }
                    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
                    if (linkMatch) {
                        return (
                            <a key={index} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-3 my-1 rounded-xl transition-colors border ${isDark ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700' : 'bg-white border-neutral-200 hover:bg-neutral-50'}`}>
                                <div className={`p-2 rounded-full ${isDark ? 'bg-neutral-700' : 'bg-[#3B5998]/10'}`}><FileText size={16} className={isDark ? 'text-neutral-300' : 'text-[#3B5998]'} /></div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-black'}`}>{linkMatch[1]}</p>
                                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Click to download</p>
                                </div>
                            </a>
                        );
                    }
                    if (!part.trim()) return null;
                    return <span key={index}>{linkifyText(part, isMe)}</span>;
                })}
            </div>
        );
    };

    const groupedMessages = useMemo(() => {
        const groups: { label: string; messages: any[] }[] = [];
        messages.filter((msg, index, self) => index === self.findIndex((t) => (t.id === msg.id))).forEach(msg => {
            const date = new Date(msg.created_at);
            const label = getMessageDateLabel(date);
            let group = groups.find(g => g.label === label);
            if (!group) { group = { label, messages: [] }; groups.push(group); }
            group.messages.push(msg);
        });
        return groups;
    }, [messages]);

    // Filter Tab
    const FilterButton = ({ id, label, icon: Icon, count }: { id: FilterTab; label: string; icon: React.ElementType; count?: number }) => (
        <button
            onClick={() => setActiveFilter(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${activeFilter === id
                ? (isDark ? 'bg-white text-black' : 'bg-black text-white')
                : (isDark ? 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700')
                }`}
        >
            <Icon size={13} />
            {label}
            {count !== undefined && count > 0 && (
                <span className={`ml-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${activeFilter === id ? (isDark ? 'bg-black/20 text-black' : 'bg-white/20 text-white') : 'bg-red-500 text-white'}`}>
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </button>
    );

    // Unread counts per filter
    const jobUnread = notifications.filter(n => !n.is_read && n.application_id != null).length;
    const socialUnread = notifications.filter(n => {
        if (n.is_read) return false;
        const conv = applications.find(a => a.otherPartyId === n.sender_id);
        return conv?.isDm;
    }).length;

    // ─── RENDER ──────────────────────────────────────────────
    return (
        <div className={`flex h-full w-full overflow-hidden font-sans ${isDark ? 'bg-black text-white' : 'bg-neutral-50 text-neutral-800'}`}>
            {/* ── LEFT SIDEBAR ── */}
            <aside className={`md:w-[380px] h-full border-r flex-col backdrop-blur-xl shrink-0 w-full ${isDark ? 'border-white/10 bg-neutral-900/50' : 'border-neutral-200 bg-white'} ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <header className={`p-5 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-white/10 bg-neutral-900/80' : 'border-neutral-200 bg-white'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#3B5998]/10 text-[#3B5998]' : 'bg-[#3B5998]/10 text-[#3B5998]'}`}><MessageSquare size={20} /></div>
                        <h2 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>Chat</h2>
                    </div>
                    <div className="flex items-center gap-1">
                        <Lock size={14} className={isDark ? 'text-neutral-600' : 'text-neutral-400'} />
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Encrypted</span>
                    </div>
                </header>

                {/* Search */}
                <div className={`p-3 shrink-0 ${isDark ? 'bg-neutral-900/80' : 'bg-neutral-50'}`} ref={searchContainerRef}>
                    <div className="relative group">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-500' : 'text-neutral-400'}`} size={16} />
                        <input
                            type="text"
                            placeholder="Search people or conversations..."
                            value={searchQuery}
                            onChange={(e) => handleSearchInput(e.target.value)}
                            onFocus={() => { if (searchQuery.trim().length >= 2) setShowSearchResults(true); }}
                            className={`w-full border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-neutral-900/50 border-white/10 focus:ring-[#3B5998]/50' : 'bg-white border-neutral-200 focus:ring-[#3B5998]/20'}`}
                        />
                    </div>

                    {/* Search Results Dropdown */}
                    {showSearchResults && (
                        <div className={`absolute left-3 right-3 mt-1 rounded-xl border shadow-2xl z-50 max-h-[300px] overflow-y-auto ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-200'}`} style={{ scrollbarWidth: 'none' }}>
                            {isSearching ? (
                                <div className="flex items-center justify-center p-4">
                                    <div className="animate-spin w-5 h-5 border-2 border-t-transparent border-neutral-500 rounded-full" />
                                </div>
                            ) : contactResults.length > 0 ? (
                                <div className="py-1">
                                    <p className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>People on Profcaria</p>
                                    {contactResults.map(result => (
                                        <button key={result.id} onClick={() => startNewConversation(result)} className={`w-full px-4 py-3 flex items-center gap-3 transition-all ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-50'}`}>
                                            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-neutral-800">
                                                {result.image && result.image !== '/default-avatar.png' && result.image !== '/default-logo.png' ? (
                                                    <img src={result.image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-200 text-neutral-500'}`}>
                                                        {result.type === 'employer' ? <Building2 size={18} /> : <UserCircle size={18} />}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 text-left min-w-0">
                                                <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-black'}`}>{result.name}</p>
                                                <p className={`text-xs truncate ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{result.type === 'employer' ? 'Company' : 'Professional'} · {result.followers} followers</p>
                                            </div>
                                            <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${isDark ? 'bg-[#3B5998] text-white' : 'bg-[#3B5998] text-white'}`}>Chat</div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center">
                                    <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>No people found for &quot;{searchQuery}&quot;</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className={`px-3 py-2 flex gap-2 shrink-0 overflow-x-auto ${isDark ? 'bg-neutral-900/80' : 'bg-neutral-50'}`} style={{ scrollbarWidth: 'none' }}>
                    <FilterButton id="social" label="Social" icon={Users} count={socialUnread} />
                    <FilterButton id="groups" label="Groups" icon={MessagesSquare} />
                    <FilterButton id="job" label="Job" icon={Briefcase} count={jobUnread} />
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto px-2" style={{ scrollbarWidth: 'none' }}>
                    {activeFilter === 'groups' ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-8">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                <MessagesSquare size={28} className={isDark ? 'text-neutral-600' : 'text-neutral-300'} />
                            </div>
                            <h3 className={`text-lg font-black uppercase tracking-tight mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Group Chats</h3>
                            <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Coming Soon — Connect with multiple professionals and candidates in group conversations.</p>
                        </div>
                    ) : (
                        <div className="pb-4">
                            <h3 className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-neutral-400'}`}>
                                {activeFilter === 'social' ? 'People' : 'Applicants'}
                            </h3>
                            {filteredConversations.map((app: any) => {
                                const name = app.user?.name || app.companyName || 'Candidate';
                                const unreadCount = notifications.filter(n => !n.is_read && (n.application_id === app.id || n.sender_id === app.otherPartyId)).length;
                                return (
                                    <button key={app.id} onClick={() => setActiveConversation(app)} className={`w-full px-3 py-3 flex items-center gap-3 transition-all ${activeConversation?.id === app.id ? (isDark ? 'bg-white/5' : 'bg-[#3B5998]/5 border-[#3B5998]/10') : (isDark ? 'hover:bg-white/5' : 'hover:bg-neutral-100')}`}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 relative overflow-hidden ${activeConversation?.id === app.id ? (isDark ? 'bg-[#3B5998] text-white' : 'bg-[#3B5998] text-white') : (isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-200 text-neutral-500')}`}>
                                            {(app.user?.profileImageUrl || app.companyLogoUrl) ? <img src={app.user?.profileImageUrl || app.companyLogoUrl} alt="" className="w-full h-full object-cover" /> : <UserCircle size={24} />}
                                            {unreadCount > 0 && <div className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full border-2 border-neutral-900 flex items-center justify-center animate-pulse"><span className="text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span></div>}
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h4 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-black'}`}>{name}</h4>
                                                {activeConversation?.id === app.id && <div className="w-2 h-2 rounded-full bg-[#3B5998]" />}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs truncate ${isDark ? 'text-[#6B8CD5]' : 'text-[#3B5998]'}`}>{app.job?.title || app.jobTitle}</span>
                                                {app.status && <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/10 text-neutral-400 uppercase font-bold tracking-wider">{app.status}</span>}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                            {filteredConversations.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                        {activeFilter === 'social' ? <Users size={24} className={isDark ? 'text-neutral-600' : 'text-neutral-300'} /> : <Briefcase size={24} className={isDark ? 'text-neutral-600' : 'text-neutral-300'} />}
                                    </div>
                                    <p className={`text-sm font-bold mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                        {activeFilter === 'social' ? 'No conversations yet' : 'No applicant chats yet'}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                        {activeFilter === 'social' ? 'Search for people above to start chatting' : 'When candidates apply, conversations will appear here'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>

            {/* ── MAIN CHAT AREA ── */}
            <main className={`flex-1 flex-col relative min-w-0 ${isDark ? 'bg-black' : 'bg-white'} ${activeConversation ? 'flex' : 'hidden md:flex'}`}>
                {!activeConversation ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className={`w-24 h-24 border rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}><MessageSquare size={36} className={isDark ? 'text-neutral-700' : 'text-neutral-300'} /></div>
                        <h2 className={`text-2xl font-black uppercase tracking-tighter mb-3 ${isDark ? 'text-white' : 'text-black'}`}>Select a Conversation</h2>
                        <p className={`max-w-md mx-auto text-sm ${isDark ? 'text-slate-500' : 'text-neutral-500'}`}>Choose a conversation from the sidebar to start messaging.</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <header className={`px-6 py-4 border-b backdrop-blur-md flex items-center justify-between shrink-0 z-10 ${isDark ? 'border-white/10 bg-neutral-900/80' : 'border-neutral-200 bg-white/80'}`}>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setActiveConversation(null)} className={`md:hidden p-2 -ml-2 ${isDark ? 'text-slate-400' : 'text-neutral-400'}`}><ChevronLeft size={24} /></button>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${isDark ? 'bg-white/10 text-neutral-300' : 'bg-neutral-100 text-neutral-500'}`}>
                                    {(activeConversation.user?.profileImageUrl || activeConversation.companyLogoUrl) ? <img src={activeConversation.user?.profileImageUrl || activeConversation.companyLogoUrl} alt="" className="w-full h-full object-cover" /> : <UserCircle size={24} />}
                                </div>
                                <div>
                                    <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>{activeConversation.user?.name || activeConversation.companyName || 'Candidate'}</h2>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs ${isDark ? 'text-[#6B8CD5]' : 'text-[#3B5998]'} font-medium`}>{activeConversation.job?.title || activeConversation.jobTitle}</span>
                                        {activeConversation.status && <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-white uppercase font-bold tracking-wider">{activeConversation.status}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <Lock size={12} className={isDark ? 'text-neutral-600' : 'text-neutral-400'} />
                                    <span className={`text-[9px] font-bold ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>E2E</span>
                                </div>
                                <button onClick={() => setActiveConversation(null)} className={`hidden md:flex p-2 hover:bg-neutral-800 rounded-xl transition-all ${isDark ? 'text-slate-400' : 'text-neutral-400'}`}><X size={20} /></button>
                            </div>
                        </header>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8" style={{ scrollbarWidth: 'none' }}>
                            {groupedMessages.map((group) => (
                                <div key={group.label} className="space-y-4">
                                    <div className="flex items-center justify-center sticky top-0 z-10 py-2"><span className={`backdrop-blur text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border ${isDark ? 'bg-neutral-800/80 text-neutral-400 border-neutral-700/50' : 'bg-neutral-100/80 text-neutral-500 border-neutral-200'}`}>{group.label}</span></div>
                                    <div className="space-y-2">
                                        {group.messages.map((msg: any) => {
                                            const isMe = msg.sender_type === 'employer' || msg.sender_type === 'company';
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                        <div className={`px-4 py-3 rounded-2xl relative ${isMe ? 'bg-[#3B5998] text-white rounded-br-sm' : (isDark ? 'bg-neutral-800 text-neutral-200 rounded-bl-sm' : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-sm shadow-sm')}`}>
                                                            {renderMessageContent(msg.content, isMe)}
                                                            {extractFirstUrl(msg.content) && !extractFirstUrl(msg.content)?.includes('public.blob.vercel-storage.com') && (
                                                                <div className="mt-2"><InlineLinkPreview url={extractFirstUrl(msg.content)!} className={isMe ? 'text-[#6B8CD5]' : (isDark ? 'text-neutral-200' : 'text-neutral-800')} /></div>
                                                            )}
                                                            <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                                <span className={`text-[10px] ${isMe ? 'text-white/60' : 'text-neutral-400'}`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                {isMe && <CheckCheck size={12} className={msg.is_read ? "text-white/70" : "text-white/30"} />}
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

                        {/* Input Area */}
                        <footer className={`px-4 py-4 border-t shrink-0 relative ${isDark ? 'border-white/10 bg-neutral-900/80' : 'border-neutral-200 bg-white'}`}>
                            {linkPreviewUrl && linkPreviewPosition && <div className="absolute bottom-full left-0 right-0 mb-2 px-4"><LinkPreview url={linkPreviewUrl} onClose={closeLinkPreview} onInsert={() => closeLinkPreview()} /></div>}

                            {selectedFile && (
                                <div className="px-4 mb-2 flex items-center gap-2">
                                    <div className="relative group">
                                        {selectedFile.type.startsWith('image/') && previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-neutral-700" />
                                        ) : (
                                            <div className={`h-16 w-16 flex items-center justify-center rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-200'}`}>
                                                <FileText size={24} className={isDark ? "text-neutral-400" : "text-neutral-500"} />
                                            </div>
                                        )}
                                        <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                    </div>
                                    <div className="text-xs text-neutral-500">
                                        <p className="font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                                        <p>{(selectedFile.size || 0) > 1024 * 1024 ? `${((selectedFile.size || 0) / (1024 * 1024)).toFixed(1)} MB` : `${((selectedFile.size || 0) / 1024).toFixed(1)} KB`}</p>
                                    </div>
                                </div>
                            )}

                            <div className={`flex items-end gap-3 p-2 rounded-[24px] transition-all border-0 ring-0 outline-none ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
                                <div className="flex gap-1 pb-1">
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />
                                    <button onClick={() => fileInputRef.current?.click()} className={`p-2 rounded-full transition-all ${isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-500 hover:bg-neutral-200 hover:text-black'}`} title="Attach file"><Plus size={20} /></button>
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
                                    style={{ border: 'none', boxShadow: 'none', outline: 'none' }}
                                />
                                <button
                                    onClick={() => { closeLinkPreview(); sendMessage(); }}
                                    disabled={(!newMessage.trim() && !selectedFile) || isSending}
                                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all shrink-0 mb-0.5 ${isDark ? 'bg-[#3B5998] text-white hover:bg-[#4A6BB5] disabled:bg-neutral-800 disabled:text-neutral-600' : 'bg-[#3B5998] text-white hover:bg-[#4A6BB5] disabled:bg-neutral-200 disabled:text-neutral-400'}`}
                                >
                                    {isUploading || isSending ? <div className="animate-spin w-4 h-4 border-2 border-t-transparent border-current rounded-full" /> : <Send size={18} />}
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

export default function EmployerChatPage() {
    return (
        <React.Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-2 border-t-transparent border-[#3B5998] rounded-full" /></div>}>
            <ChatContent />
        </React.Suspense>
    );
}
