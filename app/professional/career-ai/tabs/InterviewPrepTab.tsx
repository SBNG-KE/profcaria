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

const TYPE_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
    behavioral: { icon: Users, color: 'text-blue-400', label: 'Behavioral' },
    technical: { icon: Brain, color: 'text-purple-400', label: 'Technical' },
    situational: { icon: Target, color: 'text-amber-400', label: 'Situational' },
    competency: { icon: Lightbulb, color: 'text-emerald-400', label: 'Competency' },
    general: { icon: Sparkles, color: 'text-neutral-400', label: 'General' },
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
    const [showHistory, setShowHistory] = useState(false);
    const [expandedHistoryTitle, setExpandedHistoryTitle] = useState<string | null>(null);
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

            // Update history
            setHistory(prev => ({
                ...prev,
                [jobTitle.trim()]: [
                    ...(data.questions || []),
                    ...(prev[jobTitle.trim()] || []),
                ],
            }));
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const totalHistoryCount = Object.values(history).reduce((sum, qs) => sum + qs.length, 0);

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2.5 rounded-xl ${isDark ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-purple-50 border border-purple-200'}`}>
                        <GraduationCap size={24} className="text-purple-500" />
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

            {/* Generator Card */}
            <div className={`rounded-2xl p-6 mb-6 border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                <h2 className={`text-sm font-black uppercase tracking-widest mb-4 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Generate Questions
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
                        className={`w-full px-4 py-3 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/30 ${isDark
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
                        className={`w-full px-4 py-3 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none ${isDark
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
                            } bg-gradient-to-r from-purple-600 to-indigo-600 text-white`}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Generate
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="mt-3 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                        ⚠️ {error}
                    </div>
                )}
            </div>

            {/* Generated Questions */}
            {questions.length > 0 && (
                <div className="mb-6">
                    <h2 className={`text-sm font-black uppercase tracking-widest mb-4 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Generated for &quot;{jobTitle}&quot;
                    </h2>
                    <div className="space-y-3">
                        {questions.map((q, i) => {
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
                                                <Icon size={12} className={config.color} />
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>
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
                                            <p className={`text-xs font-bold uppercase tracking-widest mt-3 mb-2 ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>
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

                    {/* Generate More */}
                    <button
                        onClick={generateQuestions}
                        disabled={loading}
                        className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${loading
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:scale-[1.01] active:scale-[0.99]'
                            } ${isDark
                                ? 'border-neutral-800 text-neutral-400 hover:bg-neutral-800/50'
                                : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                            }`}
                    >
                        <RotateCcw size={14} />
                        Generate More (Never Repeats)
                    </button>
                </div>
            )}

            {/* History */}
            <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-neutral-900/30 border-neutral-800' : 'bg-white/50 border-neutral-200'}`}>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`w-full flex items-center justify-between p-4 transition-all ${isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-neutral-50'}`}
                >
                    <div className="flex items-center gap-2">
                        <h2 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            Question History
                        </h2>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-neutral-100 text-neutral-400'}`}>
                            {totalHistoryCount}
                        </span>
                    </div>
                    {showHistory ? (
                        <ChevronUp size={16} className={isDark ? 'text-neutral-600' : 'text-neutral-400'} />
                    ) : (
                        <ChevronDown size={16} className={isDark ? 'text-neutral-600' : 'text-neutral-400'} />
                    )}
                </button>

                {showHistory && (
                    <div className={`border-t ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                        {loadingHistory ? (
                            <div className="p-6 text-center">
                                <Loader2 size={20} className="animate-spin mx-auto text-neutral-500" />
                            </div>
                        ) : Object.keys(history).length === 0 ? (
                            <div className="p-6 text-center">
                                <p className={`text-sm ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                    No questions generated yet. Start by entering a job title above!
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-800">
                                {Object.entries(history).map(([title, qs]) => (
                                    <div key={title}>
                                        <button
                                            onClick={() => setExpandedHistoryTitle(expandedHistoryTitle === title ? null : title)}
                                            className={`w-full flex items-center justify-between p-4 text-left transition-all ${isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-neutral-50'}`}
                                        >
                                            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{title}</span>
                                            <span className={`text-xs ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                                {qs.length} question{qs.length !== 1 ? 's' : ''}
                                            </span>
                                        </button>
                                        {expandedHistoryTitle === title && (
                                            <div className={`px-4 pb-4 space-y-2`}>
                                                {qs.map((q: Question, i: number) => (
                                                    <div key={q.id || i} className={`p-3 rounded-lg ${isDark ? 'bg-neutral-800/50' : 'bg-neutral-50'}`}>
                                                        <p className={`text-xs font-semibold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                                            {q.question}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
