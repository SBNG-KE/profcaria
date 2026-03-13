'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { GraduationCap, Sparkles, ChevronDown, ChevronUp, Loader2, Brain, Target, Users, Lightbulb, RotateCcw } from 'lucide-react';

interface Question {
    id: string;
    question: string;
    answer: string;
    type: string;
    jobTitle: string;
}

const TYPE_CONFIG: Record<string, { icon: any; label: string }> = {
    behavioral: { icon: Users, label: 'Behavioral' },
    technical: { icon: Brain, label: 'Technical' },
    situational: { icon: Target, label: 'Situational' },
    competency: { icon: Lightbulb, label: 'Competency' },
    general: { icon: Sparkles, label: 'General' },
};

export default function InterviewPrepPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [jobTitle, setJobTitle] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [count, setCount] = useState(5);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [history, setHistory] = useState<Record<string, Question[]>>({});
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [expandedHistoryTitle, setExpandedHistoryTitle] = useState<string | null>(null);
    const [activeJobTitle, setActiveJobTitle] = useState<string | null>(null);
    const [error, setError] = useState('');

    // Fetch history on mount
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/professional/interview-prep');
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data.history || {});
                }
            } catch {
                // silent
            } finally {
                setLoadingHistory(false);
            }
        };
        fetchHistory();
    }, []);

    const generateQuestions = async () => {
        if (!jobTitle.trim()) return;
        setLoading(true);
        setError('');
        setQuestions([]);

        try {
            const res = await fetch('/api/professional/interview-prep', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobTitle: jobTitle.trim(),
                    jobDescription: jobDescription.trim() || undefined,
                    count,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to generate questions');
                return;
            }

            setQuestions(data.questions || []);

            // Update history and set active job title to view it immediately
            const title = jobTitle.trim();
            setHistory(prev => ({
                ...prev,
                [title]: [
                    ...(data.questions || []),
                    ...(prev[title] || []),
                ],
            }));
            setActiveJobTitle(title);
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const startNewSession = () => {
        setActiveJobTitle(null);
        setJobTitle('');
        setJobDescription('');
        setQuestions([]);
        setError('');
    };

    const totalHistoryCount = Object.keys(history).length;

    // The questions to show: either from current generation, or from history when activeJobTitle is selected.
    const displayQuestions = activeJobTitle ? (history[activeJobTitle] || []) : questions;

    return (
        <div className="h-full flex w-full">
            {/* Sidebar */}
            <div className={`w-64 shrink-0 flex flex-col border-r ${isDark ? 'border-neutral-800 bg-neutral-950/50' : 'border-neutral-200 bg-neutral-50/50'}`}>
                <div className="p-4">
                    <button
                        onClick={startNewSession}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                    >
                        + New Prep Session
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {loadingHistory ? (
                        <div className="p-4 flex justify-center"><Loader2 size={16} className="animate-spin text-neutral-500" /></div>
                    ) : (
                        <div className="px-3 pb-4 space-y-4">
                            <div>
                                <div className={`px-2 mb-1 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                    Past Sessions
                                </div>
                                <div className="space-y-0.5">
                                    {Object.keys(history).length === 0 && (
                                        <div className={`px-2 py-2 text-xs ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                            No questions generated yet.
                                        </div>
                                    )}
                                    {Object.entries(history).map(([title, qs]) => (
                                        <button
                                            key={title}
                                            onClick={() => setActiveJobTitle(title)}
                                            className={`w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm transition-all text-left truncate ${activeJobTitle === title 
                                                ? (isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-200 text-black') 
                                                : (isDark ? 'text-neutral-400 hover:bg-neutral-900' : 'text-neutral-600 hover:bg-neutral-100')}`}
                                        >
                                            <span className="truncate flex-1">{title}</span>
                                            <span className={`text-[10px] ml-2 ${activeJobTitle === title ? (isDark ? 'text-neutral-400' : 'text-neutral-500') : (isDark ? 'text-neutral-600' : 'text-neutral-400')}`}>
                                                {qs.length}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full bg-transparent max-w-4xl mx-auto w-full overflow-y-auto px-4 sm:px-8 py-8" style={{ scrollbarWidth: 'thin' }}>
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                        <GraduationCap size={24} className={isDark ? 'text-white' : 'text-black'} />
                    </div>
                    <div>
                        <h1 className={`text-2xl md:text-3xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                            Interview Prep
                        </h1>
                        <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            AI-powered mock interview questions — never repeats
                        </p>
                    </div>
                </div>
            </div>
            {/* Generated Questions View */}
            {(displayQuestions.length > 0) && (
                <div className="mb-6">
                    <h2 className={`text-sm font-black uppercase tracking-widest mb-4 flex items-center justify-between ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        <span>Questions for &quot;{activeJobTitle || jobTitle}&quot;</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-neutral-100 text-neutral-400'}`}>
                            {displayQuestions.length} Questions
                        </span>
                    </h2>
                    <div className="space-y-3">
                        {displayQuestions.map((q, i) => {
                            const config = TYPE_CONFIG[q.type] || TYPE_CONFIG.general;
                            const Icon = config.icon;
                            const isExpanded = expandedId === q.id;

                            return (
                                <div
                                    key={q.id}
                                    className={`rounded-xl border overflow-hidden transition-all ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200'}`}
                                >
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : q.id)}
                                        className="w-full text-left p-4 flex items-start gap-3"
                                    >
                                        <span className={`text-xs font-black mt-0.5 ${isDark ? 'text-neutral-600' : 'text-neutral-300'}`}>
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Icon size={12} className={isDark ? 'text-neutral-400' : 'text-neutral-500'} />
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                                    {config.label}
                                                </span>
                                            </div>
                                            <p className={`text-sm font-semibold leading-relaxed ${isDark ? 'text-white' : 'text-black'}`}>
                                                {q.question}
                                            </p>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronUp size={16} className={isDark ? 'text-neutral-600' : 'text-neutral-400'} />
                                        ) : (
                                            <ChevronDown size={16} className={isDark ? 'text-neutral-600' : 'text-neutral-400'} />
                                        )}
                                    </button>
                                    {isExpanded && (
                                        <div className={`px-4 pb-4 pt-0 ml-8 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                                            <p className={`text-xs font-bold uppercase tracking-widest mt-3 mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                                                Model Answer
                                            </p>
                                            <p className={`text-sm leading-relaxed ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                                {q.answer}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Generate More for Active Job Title */}
                    {activeJobTitle && (
                        <div className="mt-6">
                            <h2 className={`text-sm font-black uppercase tracking-widest mb-3 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                Want more practice?
                            </h2>
                            <div className="flex items-center gap-3">
                                <select
                                    value={count}
                                    onChange={(e) => setCount(Number(e.target.value))}
                                    className={`px-3 py-3 rounded-xl text-sm font-bold border transition-all focus:outline-none ${isDark
                                        ? 'bg-neutral-800 border-neutral-700 text-white'
                                        : 'bg-neutral-50 border-neutral-200 text-black'
                                        }`}
                                >
                                    <option value={5}>+5 Questions</option>
                                    <option value={10}>+10 Questions</option>
                                    <option value={15}>+15 Questions</option>
                                </select>
                                <button
                                    onClick={() => {
                                        setJobTitle(activeJobTitle);
                                        // The backend will automatically generate new specific ones because we already have history saved
                                        generateQuestions(); 
                                    }}
                                    disabled={loading}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${loading
                                        ? 'opacity-40 cursor-not-allowed'
                                        : 'hover:scale-[1.01] active:scale-[0.99]'
                                        } ${isDark
                                            ? 'bg-white text-black hover:bg-neutral-200 border-transparent shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                                            : 'bg-black text-white hover:bg-neutral-800 border-transparent shadow-[0_0_20px_rgba(0,0,0,0.1)]'
                                        }`}
                                >
                                    {loading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                                    {loading ? 'Generating...' : 'Generate New Unique Questions (Never Repeats)'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {/* Show Form only when NO activeSession */}
            {!activeJobTitle && (
                 <div className={`rounded-2xl p-6 mb-6 border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                    <h2 className={`text-sm font-black uppercase tracking-widest mb-4 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Start a new prep session
                    </h2>

                    {/* Job Title */}
                    <div className="mb-4">
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            Job Title *
                        </label>
                        <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g. Senior Backend Engineer"
                            className={`w-full px-4 py-3 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-neutral-500/30 ${isDark
                                ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600'
                                : 'bg-neutral-50 border-neutral-200 text-black placeholder:text-neutral-400'
                                }`}
                        />
                    </div>

                    {/* Job Description (optional) */}
                    <div className="mb-4">
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            Job Description <span className="text-neutral-600">(optional — paste for more targeted questions)</span>
                        </label>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste the job description here for more targeted questions..."
                            rows={3}
                            className={`w-full px-4 py-3 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-neutral-500/30 resize-none ${isDark
                                ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600'
                                : 'bg-neutral-50 border-neutral-200 text-black placeholder:text-neutral-400'
                                }`}
                        />
                    </div>

                    {/* Count + Generate */}
                    <div className="flex items-center gap-3">
                        <select
                            value={count}
                            onChange={(e) => setCount(Number(e.target.value))}
                            className={`px-3 py-3 rounded-xl text-sm font-bold border transition-all focus:outline-none ${isDark
                                ? 'bg-neutral-800 border-neutral-700 text-white'
                                : 'bg-neutral-50 border-neutral-200 text-black'
                                }`}
                        >
                            <option value={5}>5 Questions</option>
                            <option value={10}>10 Questions</option>
                            <option value={15}>15 Questions</option>
                        </select>

                        <button
                            onClick={generateQuestions}
                            disabled={loading || !jobTitle.trim()}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${loading || !jobTitle.trim()
                                ? 'opacity-40 cursor-not-allowed'
                                : 'hover:scale-[1.02] active:scale-[0.98]'
                                } ${isDark ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-black text-white shadow-lg shadow-black/10'}`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Capture & Generate
                                </>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-3 px-4 py-2 rounded-lg bg-neutral-500/10 border border-neutral-500/20 text-neutral-400 text-xs font-medium">
                            ⚠️ {error}
                        </div>
                    )}
                </div>
            )}
        </div>
        </div>
    );
}
