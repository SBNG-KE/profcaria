"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    MessageSquare, ChevronLeft, Send, Shield, X, Building2, UserCircle, Search,
    CheckCheck, Plus, FileText, Users, Briefcase, MessagesSquare, Zap, Lock, UserPlus,
    Smile, Sticker, Heart, Star as StarIcon, ChevronDown, Download, Bookmark
} from 'lucide-react';
import { useNotificationContext } from '@/app/context/NotificationContext';
import LinkPreview from '@/app/components/LinkPreview';
import InlineLinkPreview, { extractFirstUrl } from '@/app/components/InlineLinkPreview';
import { useTheme } from '@/app/context/ThemeContext';
import { useSearchParams } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────
type FilterTab = 'social' | 'groups' | 'job' | 'connections';
type SearchResult = {
    id: string;
    name: string;
    image: string;
    type: 'professional' | 'employer';
    followers: number;
    badgeType?: string;
};

// ─── Message Cache (module-level for persistence across rerenders) ──
const messageCache = new Map<string, { messages: any[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedMessages(conversationKey: string): any[] | null {
    const cached = messageCache.get(conversationKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.messages;
    }
    return null;
}

function setCachedMessages(conversationKey: string, messages: any[]) {
    messageCache.set(conversationKey, { messages, timestamp: Date.now() });
}

function getConversationKey(conv: any): string {
    if (conv.otherPartyId) return `dm-${conv.otherPartyId}`;
    return `app-${conv.companyId || conv.company?.id || conv.id}`;
}

// ─── Main Component ───────────────────────────────────────────
function ChatContent() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const searchParams = useSearchParams();

    // Context
    const { notifications, applications, loading, refresh, markAsRead } = useNotificationContext();

    // Core State
    const [activeConversation, setActiveConversation] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterTab>('social');

    // Connections State
    const [platformConnections, setPlatformConnections] = useState<any[]>([]);
    const [connectionsSuggestions, setPlatformSuggestions] = useState<any[]>([]);
    const [connectionsLoading, setConnectionsLoading] = useState(false);

    // Contact Search State
    const [contactResults, setContactResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Link preview state
    const [linkPreviewUrl, setLinkPreviewUrl] = useState<string | null>(null);
    const [linkPreviewPosition, setLinkPreviewPosition] = useState<{ x: number; y: number } | null>(null);

    // File upload preview state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Refs
    const messageEndRef = useRef<HTMLDivElement>(null);
    const lastMessageCountRef = useRef(0);
    const lastFetchTimeRef = useRef(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Emoji & Sticker State
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showStickerPanel, setShowStickerPanel] = useState(false);
    const [emojiCategory, setEmojiCategory] = useState<'smileys' | 'people' | 'nature' | 'food' | 'activities' | 'objects' | 'symbols'>('smileys');
    const [savedStickers, setSavedStickers] = useState<string[]>([]);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const stickerPanelRef = useRef<HTMLDivElement>(null);

    // Emoji Data
    const emojiData: Record<string, string[]> = {
        smileys: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🫢','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐'],
        people: ['👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','🫵','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄'],
        nature: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🌸','🌺','🌻','🌹','🌷','🪻','🌱','🌲','🌳','🍀','🌿','☘️','🍃'],
        food: ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶️','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🫘','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🌮','🌯','🫔','🥙','🧆','🥗','🥘','🫕','🍜','🍝','🍣','🍱','🍙'],
        activities: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂','🪂','🏋️','🤸','🤼','🤽','🤾','🤺','⛹️','🧘','🏄','🏊','🤽','🧗','🚴','🚵','🎯','🎮','🕹️','🎲','🎰','🧩'],
        objects: ['⌚','📱','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏰','🔔','📯','📢','💡','🔦','🕯️','🧯','💰','💳','💎','⚖️','🔧','🔨','⚒️','🛠️','⛏️','🪚','🔩','⚙️','🧱','⛓️','🧲','🔫','💣','🧨','🪓','🔪','🗡️'],
        symbols: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️']
    };

    const defaultStickers = ['🎉','🔥','👀','💯','😂','❤️','👍','🙏','🎊','✨','💪','🚀','👏','😍','🥺','😤'];

    // Close emoji/stickers when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) setShowEmojiPicker(false);
            if (stickerPanelRef.current && !stickerPanelRef.current.contains(e.target as Node)) setShowStickerPanel(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Load saved stickers from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('profcaria_saved_stickers');
        if (saved) setSavedStickers(JSON.parse(saved));
    }, []);

    const insertEmoji = (emoji: string) => {
        setNewMessage(prev => prev + emoji);
        textareaRef.current?.focus();
    };

    const sendSticker = async (sticker: string) => {
        setShowStickerPanel(false);
        setNewMessage(sticker);
        // Auto-send after a short delay to let state settle
        setTimeout(() => {
            const sendBtn = document.getElementById('chat-send-btn');
            if (sendBtn) sendBtn.click();
        }, 50);
    };

    const saveSticker = (sticker: string) => {
        if (!savedStickers.includes(sticker)) {
            const updated = [...savedStickers, sticker];
            setSavedStickers(updated);
            localStorage.setItem('profcaria_saved_stickers', JSON.stringify(updated));
        }
    };

    const removeSticker = (sticker: string) => {
        const updated = savedStickers.filter(s => s !== sticker);
        setSavedStickers(updated);
        localStorage.setItem('profcaria_saved_stickers', JSON.stringify(updated));
    };

    // ─── Fetch Current User ───────────────────────────────────
    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => { if (data.id) setCurrentUserId(data.id); })
            .catch(e => console.error("Error fetching user", e));
    }, []);

    // ─── Fetch Connections when tab active ─────────────────────
    useEffect(() => {
        if (activeFilter === 'connections' && platformConnections.length === 0 && !connectionsLoading) {
            setConnectionsLoading(true);
            Promise.all([
                fetch('/api/professional/connections').then(r => r.ok ? r.json() : { connections: [] }),
                fetch('/api/professional/follow/followers').then(r => r.ok ? r.json() : { followers: [] })
            ]).then(([connectionsData, followersData]) => {
                setPlatformConnections(connectionsData.connections || []);
                setPlatformSuggestions(followersData.followers || []);
            }).catch(e => console.error('Connections fetch error:', e))
            .finally(() => setConnectionsLoading(false));
        }
    }, [activeFilter]);

    // ─── Auto-resize textarea ─────────────────────────────────
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [newMessage]);

    // ─── Auto-scroll on new messages ──────────────────────────
    useEffect(() => {
        if (messages.length > lastMessageCountRef.current) {
            messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            lastMessageCountRef.current = messages.length;
        }
    }, [messages]);

    // ─── Click-outside to close search results ───────────────
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setShowSearchResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ─── URL Params for Direct Messaging ─────────────────────
    useEffect(() => {
        const targetId = searchParams.get('recipientId');
        const targetType = searchParams.get('recipientType');
        const targetName = searchParams.get('recipientName');
        const targetImage = searchParams.get('recipientImage');

        if (targetId && applications.length > 0 && !activeConversation) {
            let existingParamsMatch: any = null;

            if (targetType === 'employer') {
                existingParamsMatch = applications.find(app => (app.companyId === targetId) || (app.otherPartyId === targetId));
            } else {
                existingParamsMatch = applications.find(app => app.otherPartyId === targetId);
            }

            if (existingParamsMatch) {
                setActiveConversation(existingParamsMatch);
            } else if (!activeConversation) {
                setActiveConversation({
                    id: 'new_dm_' + targetId,
                    isTemp: true,
                    companyName: targetName || 'User',
                    jobTitle: 'Direct Message',
                    companyLogoUrl: targetImage || null,
                    companyId: targetType === 'employer' ? targetId : null,
                    otherPartyId: targetId,
                    otherPartyType: targetType || 'professional',
                    status: 'active'
                });
            }
            window.history.replaceState(null, '', '/professional/notifications');
        } else if (targetId && !activeConversation) {
            setActiveConversation({
                id: 'new_dm_' + targetId,
                isTemp: true,
                companyName: targetName || 'User',
                jobTitle: 'Direct Message',
                companyLogoUrl: targetImage || null,
                companyId: targetType === 'employer' ? targetId : null,
                otherPartyId: targetId,
                otherPartyType: targetType || 'professional',
                status: 'active'
            });
            window.history.replaceState(null, '', '/professional/notifications');
        }
    }, [searchParams, applications]);

    // ─── Fetch Messages (with Cache) ─────────────────────────
    useEffect(() => {
        if (activeConversation) {
            // Try cache first for instant display
            const key = getConversationKey(activeConversation);
            const cached = getCachedMessages(key);
            if (cached) {
                setMessages(cached);
            }

            if (activeConversation.otherPartyId) {
                fetchMessages(activeConversation.otherPartyId);
            } else {
                const companyAppIds = getCompanyAppIds(activeConversation);
                fetchMessages(companyAppIds);
            }
        } else {
            setMessages([]);
        }
    }, [activeConversation]);

    // ─── Notification-Driven Updates ─────────────────────────
    useEffect(() => {
        if (!activeConversation) return;

        if (activeConversation.otherPartyId) {
            const hasRelevantNotification = notifications.some(n =>
                !n.is_read && n.sender_id === activeConversation.otherPartyId
            );
            if (hasRelevantNotification) {
                fetchMessages(activeConversation.otherPartyId);
            }
        } else {
            const companyAppIds = getCompanyAppIds(activeConversation);
            const hasRelevantNotification = notifications.some(n =>
                !n.is_read && n.application_id && companyAppIds.includes(n.application_id)
            );
            if (hasRelevantNotification) {
                fetchMessages(companyAppIds);
                notifications.forEach(n => {
                    if (!n.is_read && n.application_id && companyAppIds.includes(n.application_id)) {
                        markAsRead(n.id);
                    }
                });
            }
        }
    }, [notifications, activeConversation]);

    // ─── Failsafe Polling ────────────────────────────────────
    useEffect(() => {
        if (!activeConversation) return;

        const interval = setInterval(() => {
            if (activeConversation.otherPartyId) {
                fetchMessages(activeConversation.otherPartyId);
            } else {
                const companyAppIds = getCompanyAppIds(activeConversation);
                fetchMessages(companyAppIds);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [activeConversation, applications]);

    // ─── Helper Functions ────────────────────────────────────
    const getCompanyAppIds = (conv: any) => {
        return applications
            .filter(app => app.companyName === conv.companyName)
            .filter(app => app.company?.id === conv.company?.id || app.companyId === conv.companyId)
            .map(app => app.id);
    };

    const fetchMessages = async (idsOrRecipient: string[] | string) => {
        try {
            if (activeConversation?.isTemp) {
                setMessages([]);
                return;
            }

            const requestTime = Date.now();
            lastFetchTimeRef.current = requestTime;

            let url = '';
            if (Array.isArray(idsOrRecipient)) {
                const idsParam = idsOrRecipient.join(',');
                url = `/api/shared/messages?applicationIds=${idsParam}&t=${requestTime}`;
            } else {
                url = `/api/shared/messages?recipientId=${idsOrRecipient}&t=${requestTime}`;
            }

            const res = await fetch(url, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (requestTime < lastFetchTimeRef.current) return;
                const msgs = data.messages || [];
                setMessages(msgs);

                // Update cache
                if (activeConversation) {
                    setCachedMessages(getConversationKey(activeConversation), msgs);
                }

                if (Array.isArray(idsOrRecipient)) {
                    markMessagesAsRead(idsOrRecipient);
                }
            }
        } catch (error) {
            console.error("Error fetching messages", error);
        }
    };

    const sendMessage = async (content: string = newMessage, attachmentUrl?: string) => {
        if ((!content.trim() && !attachmentUrl && !selectedFile) || !activeConversation || isSending) return;

        setIsSending(true);

        let finalAttachmentUrl = attachmentUrl;

        if (selectedFile && !finalAttachmentUrl) {
            setIsUploading(true);
            try {
                const response = await fetch(`/api/upload?filename=${encodeURIComponent(selectedFile.name)}`, {
                    method: 'POST',
                    body: selectedFile,
                });
                if (response.ok) {
                    const blob = await response.json();
                    finalAttachmentUrl = selectedFile.type.startsWith('image/')
                        ? `\n![${selectedFile.name}](${blob.url})`
                        : `\n[Download ${selectedFile.name}](${blob.url})`;
                } else {
                    console.error("Upload failed");
                    setIsSending(false);
                    setIsUploading(false);
                    return;
                }
            } catch (error) {
                console.error("Error uploading file", error);
                setIsSending(false);
                setIsUploading(false);
                return;
            }
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
                    // Update cache optimistically
                    if (activeConversation) {
                        setCachedMessages(getConversationKey(activeConversation), updated);
                    }
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

    // ─── File Upload ─────────────────────────────────────────
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setSelectedFile(file);
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
    };

    // ─── Input Handlers ──────────────────────────────────────
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            closeLinkPreview();
            sendMessage();
        }
    };

    // ─── Link Preview ────────────────────────────────────────
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

    // ─── Contact Search ──────────────────────────────────────
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
                } catch (e) {
                    console.error("Search error", e);
                } finally {
                    setIsSearching(false);
                }
            }, 300);
        } else {
            setShowSearchResults(false);
            setContactResults([]);
            setIsSearching(false);
        }
    };

    const startNewConversation = (result: SearchResult) => {
        // Check if there's an existing conversation with this person
        const existing = applications.find(app =>
            app.otherPartyId === result.id ||
            app.companyId === result.id
        );

        if (existing) {
            setActiveConversation(existing);
        } else {
            setActiveConversation({
                id: 'new_dm_' + result.id,
                isTemp: true,
                companyName: result.name,
                jobTitle: 'Direct Message',
                companyLogoUrl: result.image || null,
                companyId: result.type === 'employer' ? result.id : null,
                otherPartyId: result.id,
                otherPartyType: result.type,
                status: 'active'
            });
        }

        setShowSearchResults(false);
        setSearchQuery('');
        setContactResults([]);
    };

    // ─── Filtered Conversations ──────────────────────────────
    const filteredConversations = useMemo(() => {
        let filtered = applications;

        // Apply filter tab
        if (activeFilter === 'social') {
            filtered = filtered.filter(app => app.isDm && app.otherPartyType === 'professional');
        } else if (activeFilter === 'job') {
            const jobsList = filtered.filter(app => !app.isDm || app.otherPartyType === 'employer');
            
            // Inject Company Group 
            const uniqueCompanies = Array.from(new Set(jobsList.map(app => app.companyId || app.company?.id).filter(Boolean)));
            const companyGroups = uniqueCompanies.map(companyId => {
                const firstApp = jobsList.find(app => (app.companyId || app.company?.id) === companyId);
                return {
                    id: `prof-company-group-${companyId}`,
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    companyId: companyId,
                    companyName: firstApp?.companyName || 'Company',
                    jobTitle: 'Company Group',
                    companyLogoUrl: firstApp?.companyLogoUrl,
                    isDm: false,
                    isGroup: true,
                    user: {
                        name: `${firstApp?.companyName || 'Company'} Group`,
                        profileImageUrl: firstApp?.companyLogoUrl
                    }
                };
            });

            filtered = [...companyGroups, ...jobsList];
        }

        // Apply search query (only when not showing search results dropdown)
        if (searchQuery && !showSearchResults) {
            filtered = filtered.filter(app =>
                (app.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (app.companyName || '').toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    }, [applications, activeFilter, searchQuery, showSearchResults]);

    const groupedConversations = useMemo(() => {
        return Object.values(filteredConversations.reduce((acc, app) => {
            const key = app.companyId || app.company?.id || app.otherPartyId || app.id;
            if (!key) return acc;
            if (!acc[key]) acc[key] = app;
            return acc;
        }, {} as Record<string, any>));
    }, [filteredConversations]);

    // ─── Message Rendering ───────────────────────────────────
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
                const linkClass = isSenderMessage ? 'text-white underline hover:text-neutral-200 break-all font-medium' : (isDark ? 'text-neutral-300 underline hover:text-white break-all' : 'text-neutral-600 underline hover:text-black break-all');
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
                                <img
                                    src={imgMatch[2]}
                                    alt={imgMatch[1]}
                                    className="w-auto h-auto max-w-[240px] max-h-[240px] object-contain rounded-lg border border-white/10 cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(imgMatch[2], '_blank')}
                                    onLoad={() => messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                />
                            </div>
                        );
                    }
                    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
                    if (linkMatch) {
                        return (
                            <a key={index} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
                                className={`flex items-center gap-2 p-3 my-1 rounded-xl transition-colors border ${isDark ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700' : 'bg-neutral-100 border-neutral-200 hover:bg-neutral-200'}`}
                            >
                                <div className={`p-2 rounded-full ${isDark ? 'bg-neutral-700' : 'bg-white'}`}>
                                    <FileText size={16} className={isDark ? 'text-neutral-300' : 'text-neutral-600'} />
                                </div>
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

    // ─── Filter Tab Component ────────────────────────────────
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

    // ─── Count unread per filter ─────────────────────────────
    const socialUnread = notifications.filter(n => {
        if (n.is_read) return false;
        const conv = applications.find(a => a.otherPartyId === n.sender_id);
        return conv?.isDm && conv?.otherPartyType === 'professional';
    }).length;

    const jobUnread = notifications.filter(n => {
        if (n.is_read) return false;
        return n.application_id != null;
    }).length;

    // ─── RENDER ──────────────────────────────────────────────
    return (
        <div className="h-full w-full p-1.5 md:p-3 pb-24 md:pb-3">
            <div className={`flex h-full w-full overflow-hidden font-sans rounded-3xl border shadow-2xl ${isDark ? 'bg-[#0A0F1A]/90 backdrop-blur-2xl border-neutral-800/50 text-neutral-200' : 'bg-white/90 backdrop-blur-2xl border-neutral-200/50 text-neutral-800'}`}>
                {/* ── LEFT SIDEBAR ── */}
            <aside className={`md:w-[380px] h-full border-r flex-col backdrop-blur-xl shrink-0 w-full ${isDark ? 'border-neutral-800 bg-neutral-900/50' : 'border-neutral-200 bg-white'} ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <header className={`p-5 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-neutral-800 bg-neutral-900/80' : 'border-neutral-200 bg-white'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}><MessageSquare size={20} /></div>
                        <h2 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>Chats</h2>
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
                            className={`w-full border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-neutral-900/50 border-neutral-800 focus:ring-white/20' : 'bg-white border-neutral-200 focus:ring-black/10'}`}
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
                                    <p className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                        People on Profcaria
                                    </p>
                                    {contactResults.map(result => (
                                        <button
                                            key={result.id}
                                            onClick={() => startNewConversation(result)}
                                            className={`w-full px-4 py-3 flex items-center gap-3 transition-all ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-50'}`}
                                        >
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
                                                <p className={`text-xs truncate ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                    {result.type === 'employer' ? 'Company' : 'Professional'} · {result.followers} followers
                                                </p>
                                            </div>
                                            <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                                                Chat
                                            </div>
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
                    <FilterButton id="connections" label="Connections" icon={UserPlus} />
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto px-2" style={{ scrollbarWidth: 'none' }}>
                    {activeFilter === 'groups' ? (
                        /* Groups Coming Soon */
                        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-8">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                <MessagesSquare size={28} className={isDark ? 'text-neutral-600' : 'text-neutral-300'} />
                            </div>
                            <h3 className={`text-lg font-black uppercase tracking-tight mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Group Chats</h3>
                            <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Coming Soon — Connect with multiple professionals and employers in group conversations.</p>
                        </div>
                    ) : activeFilter === 'connections' ? (
                        /* Connections Panel */
                        <div className="py-4 px-2 space-y-4">
                            {connectionsLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="animate-spin w-6 h-6 border-2 border-t-transparent border-neutral-500 rounded-full" />
                                </div>
                            ) : (
                                <>
                                    {platformConnections.length > 0 && (
                                        <div>
                                            <h3 className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-neutral-400'}`}>Your Network</h3>
                                            {platformConnections.map((conn: any) => (
                                                <button
                                                    key={conn.id}
                                                    onClick={() => {
                                                        const companyId = conn.company?.id;
                                                        if (companyId) {
                                                            startNewConversation({ id: companyId, name: conn.company?.name || 'Company', image: '', type: 'employer', followers: 0 });
                                                        }
                                                    }}
                                                    className={`w-full px-3 py-3 flex items-center gap-3 transition-all ${isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-neutral-100'}`}
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}>
                                                        <Building2 size={18} />
                                                    </div>
                                                    <div className="flex-1 text-left min-w-0">
                                                        <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-black'}`}>{conn.company?.name || 'Company'}</p>
                                                        <p className={`text-xs truncate ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{conn.job?.title || 'Connection'}</p>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase ${conn.status === 'active' ? 'bg-[#3B5998]/10 text-[#3B5998]' : isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-neutral-100 text-neutral-500'}`}>
                                                        {conn.status}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {connectionsSuggestions.length > 0 && (
                                        <div>
                                            <h3 className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-neutral-400'}`}>Followers</h3>
                                            {connectionsSuggestions.slice(0, 10).map((follower: any) => (
                                                <button
                                                    key={follower.id}
                                                    onClick={() => startNewConversation({ id: follower.id, name: follower.name || 'User', image: follower.profileImageUrl || '', type: 'professional', followers: 0 })}
                                                    className={`w-full px-3 py-3 flex items-center gap-3 transition-all ${isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-neutral-100'}`}
                                                >
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}>
                                                        {follower.profileImageUrl ? <img src={follower.profileImageUrl} alt="" className="w-full h-full object-cover" /> : <UserCircle size={18} />}
                                                    </div>
                                                    <div className="flex-1 text-left min-w-0">
                                                        <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-black'}`}>{follower.name || 'User'}</p>
                                                        <p className={`text-xs truncate ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Follower</p>
                                                    </div>
                                                    <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>Chat</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {platformConnections.length === 0 && connectionsSuggestions.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                                <UserPlus size={24} className={isDark ? 'text-neutral-600' : 'text-neutral-300'} />
                                            </div>
                                            <p className={`text-sm font-bold mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>No connections yet</p>
                                            <p className={`text-xs ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Follow people and get followed back to build your network</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Unread Notifications */}
                            {notifications.filter(n => !n.is_read).length > 0 && (
                                <div className="px-3 py-3">
                                    <h3 className={`text-[9px] font-black uppercase tracking-widest mb-2 px-2 flex items-center gap-1.5 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}><Zap size={10} /> New</h3>
                                    {notifications.filter(n => !n.is_read).slice(0, 3).map((notif) => (
                                        <button key={notif.id} onClick={() => { markAsRead(notif.id); if (notif.application_id) { const app = applications.find(a => a.id === notif.application_id); if (app) setActiveConversation(app); } }} className={`w-full p-3 rounded-2xl border transition-all cursor-pointer mb-2 text-left ${isDark ? 'bg-white/5 border-white/20' : 'bg-black/5 border-black/10'}`}>
                                            <div className="flex items-start gap-2"><div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${isDark ? 'bg-white' : 'bg-black'}`}></div><p className={`text-[11px] font-medium leading-snug line-clamp-2 ${isDark ? 'text-white' : 'text-black'}`}>{notif.message}</p></div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Conversation Items */}
                            <div className="pb-4">
                                <h3 className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-neutral-400'}`}>
                                    {activeFilter === 'social' ? 'People' : 'Applications'}
                                </h3>
                                {groupedConversations.map((app: any) => {
                                    const uniqueId = app.companyId || app.company?.id || app.otherPartyId || app.id;
                                    const unreadCount = notifications.filter(n => !n.is_read && (
                                        (n.application_id && getCompanyAppIds(app).includes(n.application_id)) ||
                                        (n.sender_id === uniqueId || n.sender_id === app.otherPartyId)
                                    )).length;

                                    const isActive = (activeConversation?.companyId === uniqueId) ||
                                        (activeConversation?.company?.id === uniqueId) ||
                                        (activeConversation?.otherPartyId === uniqueId) ||
                                        (activeConversation?.id === app.id);

                                    return (
                                        <button key={uniqueId} onClick={() => setActiveConversation(app)} className={`w-full px-3 py-3 flex items-center gap-3 transition-all ${isActive ? (isDark ? 'bg-white/10' : 'bg-black/5') : (isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-neutral-100')}`}>
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 relative overflow-hidden ${isActive ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : (isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500')}`}>
                                                {app.companyLogoUrl ? <img src={app.companyLogoUrl} alt="" className="w-full h-full object-cover" /> : (app.isDm && app.otherPartyType === 'professional' ? <UserCircle size={20} /> : <Building2 size={20} />)}
                                                {unreadCount > 0 && <div className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full border-2 border-neutral-900 flex items-center justify-center animate-pulse"><span className="text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span></div>}
                                            </div>
                                            <div className={`flex-1 text-left min-w-0 border-b pb-3 ${isDark ? 'border-neutral-800/50' : 'border-neutral-200'}`}>
                                                <h4 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-black'}`}>{app.companyName}</h4>
                                                <p className={`text-xs truncate ${isDark ? 'text-slate-500' : 'text-neutral-500'}`}>{app.isDm ? (app.otherPartyType === 'employer' ? 'Company' : 'Professional') : app.jobTitle}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                                {groupedConversations.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                            {activeFilter === 'social' ? <Users size={24} className={isDark ? 'text-neutral-600' : 'text-neutral-300'} /> : <Briefcase size={24} className={isDark ? 'text-neutral-600' : 'text-neutral-300'} />}
                                        </div>
                                        <p className={`text-sm font-bold mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                            {activeFilter === 'social' ? 'No conversations yet' : 'No job chats yet'}
                                        </p>
                                        <p className={`text-xs ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                            {activeFilter === 'social' ? 'Search for people above to start chatting' : 'Apply to jobs to start conversations with employers'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </aside>

            {/* ── MAIN CHAT AREA ── */}
            <main className={`flex-1 flex-col relative min-w-0 ${isDark ? 'bg-black' : 'bg-white'} ${activeConversation ? 'flex' : 'hidden md:flex'}`}>
                {!activeConversation ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className={`w-24 h-24 border rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}><MessageSquare size={36} className={isDark ? 'text-neutral-700' : 'text-neutral-300'} /></div>
                        <h2 className={`text-2xl font-black uppercase tracking-tighter mb-3 ${isDark ? 'text-white' : 'text-black'}`}>Select a Conversation</h2>
                        <p className={`text-sm max-w-sm mx-auto ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Choose a conversation from the sidebar or search for someone to chat with.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <header className={`px-6 py-4 border-b backdrop-blur-md flex items-center justify-between shrink-0 z-10 ${isDark ? 'border-neutral-800 bg-neutral-900/80' : 'border-neutral-200 bg-white/80'}`}>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setActiveConversation(null)} className={`md:hidden p-2 -ml-2 ${isDark ? 'text-slate-400' : 'text-neutral-400'}`}><ChevronLeft size={24} /></button>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${isDark ? 'bg-white/10 text-neutral-300' : 'bg-black/5 text-neutral-500'}`}>{activeConversation.companyLogoUrl ? <img src={activeConversation.companyLogoUrl} alt="" className="w-full h-full object-cover" /> : (activeConversation.isDm && activeConversation.otherPartyType === 'professional' ? <UserCircle size={20} /> : <Building2 size={20} />)}</div>
                                <div>
                                    <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-black'}`}>{activeConversation.companyName}</h2>
                                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{activeConversation.isDm ? (activeConversation.otherPartyType === 'employer' ? 'Company' : 'Professional') : activeConversation.jobTitle}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <Lock size={12} className={isDark ? 'text-neutral-600' : 'text-neutral-400'} />
                                    <span className={`text-[9px] font-bold ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>E2E</span>
                                </div>
                                <button onClick={() => setActiveConversation(null)} className={`hidden md:flex p-2 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all ${isDark ? 'text-slate-400' : 'text-neutral-400'}`}><X size={20} /></button>
                            </div>
                        </header>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8" style={{ scrollbarWidth: 'none' }}>
                            {groupedMessages.map((group) => (
                                <div key={group.label} className="space-y-4">
                                    <div className="flex items-center justify-center sticky top-0 z-10 py-2"><span className={`backdrop-blur text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border ${isDark ? 'bg-neutral-800/80 text-neutral-400 border-neutral-700/50' : 'bg-neutral-100/80 text-neutral-500 border-neutral-200'}`}>{group.label}</span></div>
                                    <div className="space-y-2">
                                        {group.messages.map((msg: any) => {
                                            const isMe = currentUserId ? msg.sender_id === currentUserId : msg.sender_type === 'professional';
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                        <div className={`px-4 py-3 rounded-2xl relative ${isMe ? (isDark ? 'bg-white text-black rounded-br-sm' : 'bg-black text-white rounded-br-sm') : (isDark ? 'bg-neutral-800 text-neutral-200 rounded-bl-sm' : 'bg-neutral-100 text-neutral-800 rounded-bl-sm')}`}>
                                                            {renderMessageContent(msg.content, isMe)}
                                                            {extractFirstUrl(msg.content) && !extractFirstUrl(msg.content)?.includes('public.blob.vercel-storage.com') && (
                                                                <div className="mt-2"><InlineLinkPreview url={extractFirstUrl(msg.content)!} className={isMe ? (isDark ? 'text-black' : 'text-white') : (isDark ? 'text-neutral-200' : 'text-neutral-800')} /></div>
                                                            )}
                                                            <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                                <span className={`text-[10px] ${isMe ? (isDark ? 'text-neutral-500' : 'text-neutral-400') : (isDark ? 'text-neutral-500' : 'text-neutral-400')}`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                {isMe && <CheckCheck size={12} className={msg.is_read ? "text-[#3B5998]" : (isDark ? 'text-neutral-400' : 'text-neutral-300')} />}
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
                        <footer className={`px-4 py-4 border-t shrink-0 relative ${isDark ? 'border-neutral-800 bg-neutral-900/80' : 'border-neutral-200 bg-white'}`}>
                            {linkPreviewUrl && linkPreviewPosition && <div className="absolute bottom-full left-0 right-0 mb-2 px-4"><LinkPreview url={linkPreviewUrl} onClose={closeLinkPreview} onInsert={() => closeLinkPreview()} /></div>}

                            {/* File Preview */}
                            {previewUrl && (
                                <div className="px-4 mb-2 flex items-center gap-2">
                                    <div className="relative group">
                                        {selectedFile?.type.startsWith('image/') ? (
                                            <img src={previewUrl!} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-neutral-700" />
                                        ) : (
                                            <div className={`h-16 w-16 flex items-center justify-center rounded-lg border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-200'}`}>
                                                <FileText size={24} className={isDark ? "text-neutral-400" : "text-neutral-500"} />
                                            </div>
                                        )}
                                        <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                                    </div>
                                    <div className="text-xs text-neutral-500">
                                        <p className="font-medium truncate max-w-[200px]">{selectedFile?.name}</p>
                                        <p>{(selectedFile?.size || 0) > 1024 * 1024 ? `${((selectedFile?.size || 0) / (1024 * 1024)).toFixed(1)} MB` : `${((selectedFile?.size || 0) / 1024).toFixed(1)} KB`}</p>
                                    </div>
                                </div>
                            )}

                            <div className={`flex items-end gap-2 p-2 rounded-2xl border transition-all ${isDark ? 'bg-neutral-900/80 border-neutral-800 focus-within:border-neutral-600' : 'bg-white border-neutral-200 focus-within:border-neutral-400 shadow-sm'}`}>
                                <div className="flex gap-0.5 pb-1 shrink-0">
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />
                                    <button onClick={() => fileInputRef.current?.click()} className={`p-2 rounded-full transition-all ${isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-500 hover:bg-neutral-100 hover:text-black'}`} title="Attach file">
                                        <Plus size={18} />
                                    </button>
                                    {/* Emoji Button */}
                                    <div className="relative" ref={emojiPickerRef}>
                                        <button onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowStickerPanel(false); }} className={`p-2 rounded-full transition-all ${showEmojiPicker ? (isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black') : isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-500 hover:bg-neutral-100 hover:text-black'}`} title="Emojis">
                                            <Smile size={18} />
                                        </button>
                                        {showEmojiPicker && (
                                            <div className={`absolute bottom-12 left-0 z-50 w-[320px] rounded-2xl border shadow-2xl overflow-hidden ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-200'}`}>
                                                <div className={`flex gap-0.5 p-2 overflow-x-auto border-b ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`} style={{ scrollbarWidth: 'none' }}>
                                                    {(Object.keys(emojiData) as Array<keyof typeof emojiData>).map(cat => (
                                                        <button key={cat} onClick={() => setEmojiCategory(cat as typeof emojiCategory)} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${emojiCategory === cat ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : isDark ? 'text-neutral-500 hover:text-white hover:bg-white/5' : 'text-neutral-400 hover:text-black hover:bg-black/5'}`}>
                                                            {cat === 'smileys' ? '😀' : cat === 'people' ? '👋' : cat === 'nature' ? '🌸' : cat === 'food' ? '🍎' : cat === 'activities' ? '⚽' : cat === 'objects' ? '💡' : '❤️'}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-8 gap-0.5 p-2 max-h-[220px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                                                    {emojiData[emojiCategory].map((emoji, i) => (
                                                        <button key={i} onClick={() => insertEmoji(emoji)} className="w-9 h-9 flex items-center justify-center rounded-lg text-xl hover:bg-neutral-800/30 active:scale-90 transition-all">
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Sticker Button */}
                                    <div className="relative" ref={stickerPanelRef}>
                                        <button onClick={() => { setShowStickerPanel(!showStickerPanel); setShowEmojiPicker(false); }} className={`p-2 rounded-full transition-all ${showStickerPanel ? (isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black') : isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-500 hover:bg-neutral-100 hover:text-black'}`} title="Stickers">
                                            <Sticker size={18} />
                                        </button>
                                        {showStickerPanel && (
                                            <div className={`absolute bottom-12 left-0 z-50 w-[300px] rounded-2xl border shadow-2xl overflow-hidden ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-200'}`}>
                                                <div className={`p-3 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                                                    <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>Stickers</h4>
                                                </div>
                                                {savedStickers.length > 0 && (
                                                    <div className={`p-2 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                                                        <p className={`text-[9px] font-bold uppercase tracking-widest px-1 mb-1.5 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Saved</p>
                                                        <div className="grid grid-cols-6 gap-1">
                                                            {savedStickers.map((s, i) => (
                                                                <div key={i} className="relative group">
                                                                    <button onClick={() => sendSticker(s)} className="w-full aspect-square flex items-center justify-center rounded-xl text-2xl hover:bg-neutral-800/30 active:scale-90 transition-all">{s}</button>
                                                                    <button onClick={() => removeSticker(s)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={8} /></button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="p-2">
                                                    <p className={`text-[9px] font-bold uppercase tracking-widest px-1 mb-1.5 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Quick Send</p>
                                                    <div className="grid grid-cols-6 gap-1">
                                                        {defaultStickers.map((s, i) => (
                                                            <div key={i} className="relative group">
                                                                <button onClick={() => sendSticker(s)} className="w-full aspect-square flex items-center justify-center rounded-xl text-2xl hover:bg-neutral-800/30 active:scale-90 transition-all">{s}</button>
                                                                {!savedStickers.includes(s) && (
                                                                    <button onClick={() => saveSticker(s)} className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}><Bookmark size={8} /></button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                                    id="chat-send-btn"
                                    onClick={() => { closeLinkPreview(); setShowEmojiPicker(false); setShowStickerPanel(false); sendMessage(); }}
                                    disabled={(!newMessage.trim() && !selectedFile) || isSending || isUploading}
                                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all shrink-0 mb-0.5 ${isDark ? 'bg-white text-black hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-600' : 'bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400'}`}
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
        </div>
    );
}

export default function ChatPage() {
    return (
        <React.Suspense fallback={
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin w-8 h-8 border-2 border-t-transparent border-neutral-500 rounded-full" />
            </div>
        }>
            <ChatContent />
        </React.Suspense>
    );
}
