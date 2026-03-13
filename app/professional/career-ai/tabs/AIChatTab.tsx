"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, Loader2, User, RefreshCw, Trash2 } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
}

const SUGGESTED_PROMPTS = [
    { label: '🔍 Analyze My Profile', text: 'Analyze my profile and tell me what strengths I have and what I should improve.' },
    { label: '📈 Increase My Score', text: 'How can I increase my career score? Give me specific, actionable steps.' },
    { label: '🎯 Skill Gap Analysis', text: 'Based on my target roles and current skills, what skill gaps do I have?' },
    { label: '💼 Interview Prep', text: 'Help me prepare for an interview for my current target role. Give me likely questions and how to answer them.' },
    { label: '💰 Salary Negotiation', text: 'Help me prepare for a salary negotiation. What should I ask for based on my profile?' },
    { label: '🗺️ Career Roadmap', text: 'Create a 6-month career roadmap for me based on my profile and goals.' },
];

export default function CareerAIPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch history
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/professional/career-ai');
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.messages || []);
                }
            } catch (err) {
                console.error('Failed to load chat history:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

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
                body: JSON.stringify({ message: msg }),
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(prev => [...prev, {
                    id: `ai-${Date.now()}`,
                    role: 'assistant',
                    content: data.response,
                    createdAt: new Date().toISOString(),
                }]);
            } else {
                const err = await res.json();
                setMessages(prev => [...prev, {
                    id: `err-${Date.now()}`,
                    role: 'assistant',
                    content: `⚠️ ${err.error || 'Something went wrong. Please try again.'}`,
                    createdAt: new Date().toISOString(),
                }]);
            }
        } catch {
            setMessages(prev => [...prev, {
                id: `err-${Date.now()}`,
                role: 'assistant',
                content: '⚠️ Network error. Please check your connection.',
                createdAt: new Date().toISOString(),
            }]);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    // Parse markdown-like formatting in AI responses
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

    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto">
            {/* Header */}
            <div className={`px-6 py-5 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20`}>
                            <Bot size={20} className="text-white" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-neutral-950" />
                    </div>
                    <div>
                        <h1 className={`text-lg font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Career AI</h1>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            Your Personal Career Agent · Powered by Gemini
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Loader2 size={32} className="animate-spin text-blue-500" />
                        <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Loading conversation...</p>
                    </div>
                ) : messages.length === 0 ? (
                    // Empty state with suggested prompts
                    <div className="flex flex-col items-center justify-center py-12 space-y-8">
                        <div className="text-center space-y-3">
                            <div className={`w-20 h-20 mx-auto rounded-[28px] flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 shadow-2xl shadow-purple-500/20`}>
                                <Sparkles size={36} className="text-white" />
                            </div>
                            <h2 className={`text-2xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                                Your Career AI
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
                                        ? 'bg-neutral-900 border-neutral-800 hover:border-blue-500/30 hover:bg-neutral-800'
                                        : 'bg-white border-neutral-200 hover:border-blue-500/30 hover:bg-blue-50/50 shadow-sm'
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
                                <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 mt-1`}>
                                    <Bot size={16} className="text-white" />
                                </div>
                            )}
                            <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-md ml-auto'
                                    : isDark
                                        ? 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-bl-md'
                                        : 'bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-bl-md'
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
                                <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-1 ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'
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
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                            <Bot size={16} className="text-white" />
                        </div>
                        <div className={`px-4 py-3 rounded-2xl rounded-bl-md ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-neutral-100 border border-neutral-200'}`}>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '300ms' }} />
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
                        placeholder="Ask your Career AI anything..."
                        disabled={sending}
                        className={`flex-1 px-5 py-3.5 rounded-2xl text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDark
                            ? 'bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-600'
                            : 'bg-neutral-100 border border-neutral-200 text-black placeholder:text-neutral-400'
                            } ${sending ? 'opacity-50' : ''}`}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || sending}
                        className={`p-3.5 rounded-2xl transition-all active:scale-90 ${input.trim() && !sending
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl'
                            : isDark ? 'bg-neutral-900 text-neutral-700' : 'bg-neutral-100 text-neutral-400'
                            }`}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
