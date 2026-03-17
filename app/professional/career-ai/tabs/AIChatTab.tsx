"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, Loader2, User, RefreshCw, Trash2, Plus, MessageSquare } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { format, isToday, isYesterday, subDays, isAfter } from 'date-fns';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
}

interface Session {
    id: string;
    title: string;
    updated_at: string;
}

const SUGGESTED_PROMPTS = [
    { label: '🔍 Analyze My Profile', text: 'Analyze my profile and tell me what strengths I have and what I should improve.' },
    { label: '📈 Increase My Score', text: 'How can I increase my career score? Give me specific, actionable steps.' },
    { label: '🎯 Skill Gap Analysis', text: 'Based on my target roles and current skills, what skill gaps do I have?' },
    { label: '💼 Interview Prep', text: 'Help me prepare for an interview for my current target role. Give me likely questions and how to answer them.' },
    { label: '💰 Salary Negotiation', text: 'Help me prepare for a salary negotiation. What should I ask for based on my profile?' },
    { label: '🗺️ Career Roadmap', text: 'Create a 6-month career roadmap for me based on my profile and goals.' },
];

export default function AIChatTab() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch sessions
    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/professional/career-ai?type=sessions');
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions || []);
            }
        } catch (err) {
            console.error('Failed to load sessions:', err);
        } finally {
            setLoadingSessions(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    // Fetch messages when session changes
    useEffect(() => {
        if (!activeSessionId) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            setLoadingMessages(true);
            try {
                const res = await fetch(`/api/professional/career-ai?sessionId=${activeSessionId}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.messages || []);
                }
            } catch (err) {
                console.error('Failed to load messages:', err);
            } finally {
                setLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [activeSessionId]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (text?: string) => {
        const msg = (text || input).trim();
        if (!msg || sending) return;

        setInput('');

        // Optimistic add
        const tempId = `temp-${Date.now()}`;
        setMessages(prev => [...prev, { id: tempId, role: 'user', content: msg, createdAt: new Date().toISOString() }]);

        setSending(true);
        try {
            const res = await fetch('/api/professional/career-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, sessionId: activeSessionId }),
            });

            if (res.ok) {
                const data = await res.json();
                
                // Replace temp user message and add AI response
                setMessages(prev => {
                    const filtered = prev.filter(m => m.id !== tempId);
                    return [
                        ...filtered,
                        { id: `user-${Date.now()}`, role: 'user', content: msg, createdAt: new Date().toISOString() },
                        {
                            id: `ai-${Date.now()}`,
                            role: 'assistant',
                            content: data.response,
                            createdAt: new Date().toISOString(),
                        }
                    ];
                });
                
                if (data.sessionId && data.sessionId !== activeSessionId) {
                    setActiveSessionId(data.sessionId);
                    fetchSessions(); // refresh sidebar titles
                }
            } else {
                const err = await res.json();
                setMessages(prev => {
                    const filtered = prev.filter(m => m.id !== tempId);
                    return [
                        ...filtered,
                        { id: `user-${Date.now()}`, role: 'user', content: msg, createdAt: new Date().toISOString() },
                        {
                            id: `err-${Date.now()}`,
                            role: 'assistant',
                            content: `⚠️ ${err.error || 'Something went wrong. Please try again.'}`,
                            createdAt: new Date().toISOString(),
                        }
                    ];
                });
            }
        } catch {
            setMessages(prev => {
                const filtered = prev.filter(m => m.id !== tempId);
                return [
                    ...filtered,
                    { id: `user-${Date.now()}`, role: 'user', content: msg, createdAt: new Date().toISOString() },
                    {
                        id: `err-${Date.now()}`,
                        role: 'assistant',
                        content: '⚠️ Network error. Please check your connection.',
                        createdAt: new Date().toISOString(),
                    }
                ];
            });
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const startNewChat = () => {
        setActiveSessionId(null);
        setMessages([]);
        inputRef.current?.focus();
    };

    const formatContent = (text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^### (.*$)/gm, '<h3 class="text-base font-bold mt-3 mb-1">$1</h3>')
            .replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
            .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
            .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
            .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 list-decimal">$1. $2</li>')
            .replace(/\n/g, '<br/>');
    };

    // Grouping sessions
    const groupSessions = () => {
        const groups: { [key: string]: Session[] } = {
            'Today': [],
            'Yesterday': [],
            'Previous 7 Days': [],
            'Older': []
        };

        const now = new Date();
        const sevenDaysAgo = subDays(now, 7);

        sessions.forEach(session => {
            const date = new Date(session.updated_at);
            if (isToday(date)) {
                groups['Today'].push(session);
            } else if (isYesterday(date)) {
                groups['Yesterday'].push(session);
            } else if (isAfter(date, sevenDaysAgo)) {
                groups['Previous 7 Days'].push(session);
            } else {
                groups['Older'].push(session);
            }
        });

        return groups;
    };

    const groupedSessions = groupSessions();

    return (
        <div className="h-full flex w-full">
            {/* Sidebar */}
            <div className={`w-64 shrink-0 flex flex-col border-r ${isDark ? 'border-neutral-800 bg-neutral-950/50' : 'border-neutral-200 bg-neutral-50/50'}`}>
                <div className="p-4">
                    <button
                        onClick={startNewChat}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                    >
                        <Plus size={16} /> New Chat
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {loadingSessions ? (
                        <div className="p-4 flex justify-center"><Loader2 size={16} className="animate-spin text-neutral-500" /></div>
                    ) : (
                        <div className="px-3 pb-4 space-y-4">
                            {['Today', 'Yesterday', 'Previous 7 Days', 'Older'].map(group => {
                                const groupItems = groupedSessions[group];
                                if (groupItems.length === 0) return null;
                                return (
                                    <div key={group}>
                                        <div className={`px-2 mb-1 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                            {group}
                                        </div>
                                        <div className="space-y-0.5">
                                            {groupItems.map(session => (
                                                <button
                                                    key={session.id}
                                                    onClick={() => setActiveSessionId(session.id)}
                                                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-left transition-all truncate ${activeSessionId === session.id 
                                                        ? (isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-200 text-black') 
                                                        : (isDark ? 'text-neutral-400 hover:bg-neutral-900' : 'text-neutral-600 hover:bg-neutral-100')}`}
                                                >
                                                    <MessageSquare size={14} className="shrink-0" />
                                                    <span className="truncate">{session.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full bg-transparent max-w-4xl mx-auto w-full">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {loadingMessages ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Loader2 size={32} className="animate-spin text-neutral-500" />
                            <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Loading conversation...</p>
                        </div>
                    ) : messages.length === 0 ? (
                        // Empty state with suggested prompts
                        <div className="flex flex-col items-center justify-center h-full py-12 space-y-8">
                            <div className="text-center space-y-3">
                                <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                    <Sparkles size={24} className={isDark ? 'text-white' : 'text-black'} />
                                </div>
                                <h2 className={`text-2xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                                    How can I help your career today?
                                </h2>
                                <p className={`text-sm max-w-md ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    I know your profile, skills, employment history, and radar scores. Ask me anything about your career.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                                {SUGGESTED_PROMPTS.map((prompt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(prompt.text)}
                                        disabled={sending}
                                        className={`text-left p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDark
                                            ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800'
                                            : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 shadow-sm'
                                            }`}
                                    >
                                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{prompt.label}</span>
                                        <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{prompt.text}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Chat messages
                        messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border mt-1 ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-300 shadow-sm'}`}>
                                        <Bot size={16} className={isDark ? 'text-white' : 'text-black'} />
                                    </div>
                                )}
                                <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? (isDark ? 'bg-white text-black rounded-br-md ml-auto' : 'bg-black text-white rounded-br-md ml-auto')
                                        : isDark
                                            ? 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-bl-md'
                                            : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-md shadow-sm'
                                        }`}>
                                        {msg.role === 'assistant' ? (
                                            <div
                                                className="prose prose-sm max-w-none [&_li]:mb-1 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_strong]:font-bold"
                                                dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                                            />
                                        ) : (
                                            <span>{msg.content}</span>
                                        )}
                                    </div>
                                    <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 px-2 ${msg.role === 'user' ? 'text-right' : ''
                                        } ${isDark ? 'text-neutral-700' : 'text-neutral-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                {msg.role === 'user' && (
                                    <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-1 border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-200'
                                        }`}>
                                        <User size={16} className={isDark ? 'text-neutral-400' : 'text-neutral-500'} />
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {/* Typing indicator */}
                    {sending && (
                        <div className="flex gap-3 items-start">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-300 shadow-sm'}`}>
                                <Bot size={16} className={isDark ? 'text-white' : 'text-black'} />
                            </div>
                            <div className={`px-4 py-3 rounded-2xl rounded-bl-md ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-neutral-200 shadow-sm'}`}>
                                <div className="flex items-center gap-1.5 h-5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-neutral-500' : 'bg-neutral-400'} animate-bounce`} style={{ animationDelay: '0ms' }} />
                                    <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-neutral-500' : 'bg-neutral-400'} animate-bounce`} style={{ animationDelay: '150ms' }} />
                                    <div className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-neutral-500' : 'bg-neutral-400'} animate-bounce`} style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <div className={`px-4 sm:px-6 py-4 border-t ${isDark ? 'border-neutral-800 bg-neutral-950/80' : 'border-neutral-200 bg-white/80'} backdrop-blur-lg`}>
                    <div className="flex items-center gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Message your career AI..."
                            disabled={sending}
                            className={`flex-1 px-5 py-3.5 rounded-2xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-neutral-500/30 ${isDark
                                ? 'bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600'
                                : 'bg-neutral-50 border border-neutral-200 text-black placeholder:text-neutral-400'
                                } ${sending ? 'opacity-50' : ''}`}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || sending}
                            className={`p-3.5 rounded-2xl transition-all active:scale-90 ${input.trim() && !sending
                                ? (isDark ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-black text-white shadow-lg shadow-black/10')
                                : (isDark ? 'bg-neutral-900 text-neutral-700' : 'bg-neutral-100 text-neutral-400')
                                }`}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <div className="text-center mt-2">
                         <p className={`text-[10px] ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                              AI agents can make mistakes. Verify important career advice.
                         </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
