'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { Bot, Send, Loader2, Sparkles, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { isToday, isYesterday, isAfter, subDays } from 'date-fns';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt?: string;
}

interface ChatSession {
    id: string;
    title: string;
    updated_at: string;
}

const SUGGESTED_PROMPTS = [
    { label: 'Screen Applicants', text: 'Screen all my current applicants and give me a summary of the best candidates for each role.' },
    { label: 'Starred Candidates', text: 'Analyze my starred candidates and tell me why each one stands out.' },
    { label: 'Interview Questions', text: 'Generate 5 targeted interview questions for my top applicants based on the job requirements.' },
    { label: 'Skills Gap', text: 'What skills are my current applicants missing compared to what my jobs require?' },
    { label: 'Compare Candidates', text: 'Compare my top 3 applicants side by side in a table format.' },
    { label: 'Draft Job Description', text: 'Help me write a compelling job description for my next hire based on the gaps in my current team.' },
];

export default function RecruiterAIPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch all sessions on mount
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await fetch('/api/employer/recruiter-ai');
                if (res.ok) {
                    const data = await res.json();
                    setSessions(data.sessions || []);
                }
            } catch { /* silent */ } finally {
                setLoadingSessions(false);
            }
        };
        fetchSessions();
    }, []);

    // Fetch messages when active session changes
    useEffect(() => {
        if (!activeSessionId) {
            setMessages([]);
            setLoading(false);
            return;
        }

        const fetchMessages = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/employer/recruiter-ai?sessionId=${activeSessionId}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.messages || []);
                }
            } catch { /* silent */ } finally {
                setLoading(false);
            }
        };
        fetchMessages();
    }, [activeSessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text?: string) => {
        const msg = (text || input).trim();
        if (!msg || sending) return;

        const newSessionId = activeSessionId || uuidv4();
        
        // Optimistically add the message to UI
        const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: msg };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSending(true);

        // If it was a new session, set the active session ID, and ideally prepend to sessions array
        if (!activeSessionId) {
            setActiveSessionId(newSessionId);
            setSessions(prev => [{
                id: newSessionId,
                title: msg.length > 35 ? msg.substring(0, 35) + '...' : msg,
                updated_at: new Date().toISOString()
            }, ...prev]);
        }

        try {
            const res = await fetch('/api/employer/recruiter-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, sessionId: newSessionId }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: 'assistant', content: `⚠️ ${data.error || 'Something went wrong'}` }]);
                return;
            }

            setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: data.response }]);
            
            // Move session to top of the list if it already existed
            if (activeSessionId) {
                setSessions(prev => {
                    const arr = [...prev];
                    const idx = arr.findIndex(s => s.id === activeSessionId);
                    if (idx > 0) {
                        const [item] = arr.splice(idx, 1);
                        item.updated_at = new Date().toISOString();
                        arr.unshift(item);
                    } else if (idx === 0) {
                        arr[0].updated_at = new Date().toISOString();
                    }
                    return arr;
                });
            }
        } catch {
            setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: 'assistant', content: '⚠️ Network error. Please try again.' }]);
        } finally {
            setSending(false);
        }
    };

    const startNewChat = () => {
        setActiveSessionId(null);
        setMessages([]);
    };

    const renderMarkdown = (text: string) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^### (.*$)/gm, '<h3 class="text-base font-bold mt-3 mb-1">$1</h3>')
            .replace(/^## (.*$)/gm, '<h2 class="text-lg font-bold mt-4 mb-1">$1</h2>')
            .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
            .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc">$1</li>')
            .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal">$1</li>')
            .replace(/\n{2,}/g, '<br/><br/>')
            .replace(/\n/g, '<br/>');
    };

    const groupSessions = () => {
        const groups: Record<string, ChatSession[]> = {
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
                                                    <span className="truncate flex-1">{session.title}</span>
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

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full bg-transparent max-w-4xl mx-auto w-full p-4 relative">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 shrink-0">
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                    <Bot size={24} className={isDark ? 'text-white' : 'text-black'} />
                </div>
                <div>
                    <h1 className={`text-2xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                        Recruiter AI
                    </h1>
                    <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        Your AI hiring assistant — knows your jobs & applicants
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className={`flex-1 overflow-y-auto rounded-2xl border p-4 mb-4 space-y-4 ${isDark ? 'bg-neutral-900/30 border-neutral-800' : 'bg-white/50 border-neutral-200'}`}
                style={{ scrollbarWidth: 'thin' }}>

                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-neutral-500" size={24} />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Bot size={48} className={`mb-4 ${isDark ? 'text-neutral-700' : 'text-neutral-300'}`} />
                        <h2 className={`text-lg font-bold mb-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            Recruiter AI Ready
                        </h2>
                        <p className={`text-sm mb-6 max-w-md ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                            I can screen applicants, generate interview questions, compare candidates, and help you make smarter hiring decisions.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                            {SUGGESTED_PROMPTS.map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(p.text)}
                                    className={`text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] border ${isDark
                                        ? 'bg-neutral-800/50 border-neutral-700 text-neutral-300 hover:bg-neutral-800'
                                        : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                    ? (isDark ? 'bg-white text-black' : 'bg-black text-white')
                                    : (isDark ? 'bg-neutral-800 text-neutral-200' : 'bg-white border border-neutral-200 shadow-sm text-neutral-800')
                                    }`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="text-sm leading-relaxed prose-sm" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                                    ) : (
                                        <p className="text-sm leading-relaxed">{msg.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {sending && (
                            <div className="flex justify-start">
                                <div className={`rounded-2xl px-4 py-3 ${isDark ? 'bg-neutral-800' : 'bg-white border border-neutral-200 shadow-sm'}`}>
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={14} className={`${isDark ? 'text-white' : 'text-black'} animate-pulse`} />
                                        <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Analyzing candidates...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <div className={`flex items-center gap-2 p-3 rounded-2xl border shrink-0 ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Ask about applicants, screening, interview questions..."
                    disabled={sending}
                    className={`flex-1 bg-transparent text-sm font-medium outline-none ${isDark ? 'text-white placeholder:text-neutral-600' : 'text-black placeholder:text-neutral-400'}`}
                />
                <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || sending}
                    className={`p-2.5 rounded-xl transition-all ${!input.trim() || sending
                        ? 'opacity-30 cursor-not-allowed'
                        : 'hover:scale-105 active:scale-95'
                        } ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}
                >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
            </div>
            {/* AI Warning */}
            <div className={`mt-2 text-center text-[10px] font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                Recruiter AI can make mistakes. Check important information before relying on it for hiring decisions.
            </div>
            </div>
        </div>
    );
}
