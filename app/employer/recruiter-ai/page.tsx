'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { Bot, Send, Loader2, Sparkles } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt?: string;
}

const SUGGESTED_PROMPTS = [
    { label: '📋 Screen Applicants', text: 'Screen all my current applicants and give me a summary of the best candidates for each role.' },
    { label: '⭐ Starred Candidates', text: 'Analyze my starred candidates and tell me why each one stands out.' },
    { label: '🎯 Interview Questions', text: 'Generate 5 targeted interview questions for my top applicants based on the job requirements.' },
    { label: '🔍 Skills Gap', text: 'What skills are my current applicants missing compared to what my jobs require?' },
    { label: '📊 Compare Candidates', text: 'Compare my top 3 applicants side by side in a table format.' },
    { label: '📝 Draft Job Description', text: 'Help me write a compelling job description for my next hire based on the gaps in my current team.' },
];

export default function RecruiterAIPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/employer/recruiter-ai');
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.messages || []);
                }
            } catch { /* silent */ } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text?: string) => {
        const msg = (text || input).trim();
        if (!msg || sending) return;

        const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: msg };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSending(true);

        try {
            const res = await fetch('/api/employer/recruiter-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: 'assistant', content: `⚠️ ${data.error || 'Something went wrong'}` }]);
                return;
            }

            setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: data.response }]);
        } catch {
            setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: 'assistant', content: '⚠️ Network error. Please try again.' }]);
        } finally {
            setSending(false);
        }
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

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto p-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 shrink-0">
                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50 border border-orange-200'}`}>
                    <Bot size={24} className="text-orange-500" />
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
                                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white'
                                    : isDark ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-100 text-neutral-800'
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
                                <div className={`rounded-2xl px-4 py-3 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-orange-500 animate-pulse" />
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
                        } bg-gradient-to-r from-orange-600 to-amber-600 text-white`}
                >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
            </div>
        </div>
    );
}
