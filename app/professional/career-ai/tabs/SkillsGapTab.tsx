'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { BarChart3, Sparkles, Loader2, CheckCircle2, XCircle, ArrowRight, ChevronDown, ChevronUp, Zap } from 'lucide-react';

interface GapResult {
    jobTitle: string;
    matchPercentage: number;
    matchedSkills: string[];
    missingSkills: string[];
    analysis: string;
    topPriority: string;
    learningPath: string[];
}

interface HistoryItem {
    id: string;
    jobTitle: string;
    matchPercentage: number;
    matchedSkills: string[];
    missingSkills: string[];
    analysis: string;
    createdAt: string;
}

export default function SkillsGapPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [jobTitle, setJobTitle] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [result, setResult] = useState<GapResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/professional/skills-gap');
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data.analyses || []);
                }
            } catch { /* silent */ } finally {
                setLoadingHistory(false);
            }
        };
        fetchHistory();
    }, []);

    const analyze = async () => {
        if (!jobTitle.trim()) return;
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await fetch('/api/professional/skills-gap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobTitle: jobTitle.trim(),
                    jobDescription: jobDescription.trim() || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to analyze');
                return;
            }

            setResult(data.result);

            // Add to history
            setHistory(prev => [{
                id: `new-${Date.now()}`,
                jobTitle: data.result.jobTitle,
                matchPercentage: data.result.matchPercentage,
                matchedSkills: data.result.matchedSkills,
                missingSkills: data.result.missingSkills,
                analysis: data.result.analysis,
                createdAt: new Date().toISOString(),
            }, ...prev]);
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (pct: number) => {
        if (pct >= 80) return isDark ? 'text-white' : 'text-black';
        if (pct >= 60) return 'text-neutral-500';
        return 'text-neutral-500';
    };

    const getScoreBg = (pct: number) => {
        return isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200';
    };

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                        <BarChart3 size={24} className={isDark ? 'text-white' : 'text-black'} />
                    </div>
                    <div>
                        <h1 className={`text-2xl md:text-3xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                            Skills Gap
                        </h1>
                        <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            See how your skills match up against any job
                        </p>
                    </div>
                </div>
            </div>

            {/* Analyzer Card */}
            <div className={`rounded-2xl p-6 mb-6 border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                <h2 className={`text-sm font-black uppercase tracking-widest mb-4 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Analyze Gap
                </h2>

                <div className="mb-4">
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        Target Job Title *
                    </label>
                    <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. Senior Full-Stack Engineer"
                        className={`w-full px-4 py-3 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-neutral-500/30 ${isDark
                            ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600'
                            : 'bg-neutral-50 border-neutral-200 text-black placeholder:text-neutral-400'
                            }`}
                    />
                </div>

                <div className="mb-4">
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        Job Description <span className="text-neutral-600">(optional — paste for more accurate analysis)</span>
                    </label>
                    <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste a job description for a more precise analysis..."
                        rows={3}
                        className={`w-full px-4 py-3 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-neutral-500/30 resize-none ${isDark
                            ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600'
                            : 'bg-neutral-50 border-neutral-200 text-black placeholder:text-neutral-400'
                            }`}
                    />
                </div>

                <button
                    onClick={analyze}
                    disabled={loading || !jobTitle.trim()}
                    className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${loading || !jobTitle.trim()
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:scale-[1.02] active:scale-[0.98]'
                        } ${isDark ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-black text-white shadow-lg shadow-black/10'}`}
                >
                    {loading ? (
                        <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
                    ) : (
                        <><Sparkles size={16} /> Analyze My Gap</>
                    )}
                </button>

                {error && (
                    <div className="mt-3 px-4 py-2 rounded-lg bg-neutral-500/10 border border-neutral-500/20 text-neutral-400 text-xs font-medium">
                        ⚠️ {error}
                    </div>
                )}
            </div>

            {/* Results */}
            {result && (
                <div className="mb-6 space-y-4">
                    {/* Score Card */}
                    <div className={`rounded-2xl p-6 border ${getScoreBg(result.matchPercentage)}`}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                Match Score
                            </h2>
                            <span className={`text-4xl font-black ${getScoreColor(result.matchPercentage)}`}>
                                {result.matchPercentage}%
                            </span>
                        </div>
                        <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${isDark ? 'bg-neutral-500' : 'bg-neutral-900'}`}
                                style={{ width: `${result.matchPercentage}%` }}
                            />
                        </div>
                        <p className={`mt-3 text-sm leading-relaxed ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                            {result.analysis}
                        </p>
                    </div>

                    {/* Skills Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Matched */}
                        <div className={`rounded-2xl p-5 border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                            <h3 className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                <CheckCircle2 size={14} /> Skills You Have ({result.matchedSkills.length})
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {result.matchedSkills.map((s, i) => (
                                    <span key={i} className={`px-3 py-1 rounded-full text-xs font-bold border ${isDark ? 'bg-neutral-800 text-neutral-300 border-neutral-700' : 'bg-neutral-100 text-neutral-700 border-neutral-200'}`}>
                                        {s}
                                    </span>
                                ))}
                                {result.matchedSkills.length === 0 && (
                                    <span className={`text-xs ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>None matched</span>
                                )}
                            </div>
                        </div>

                        {/* Missing */}
                        <div className={`rounded-2xl p-5 border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                            <h3 className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                <XCircle size={14} /> Skills You Need ({result.missingSkills.length})
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {result.missingSkills.map((s, i) => (
                                    <span key={i} className={`px-3 py-1 rounded-full text-xs font-bold border ${isDark ? 'bg-neutral-800 text-neutral-300 border-neutral-700' : 'bg-neutral-100 text-neutral-700 border-neutral-200'}`}>
                                        {s}
                                    </span>
                                ))}
                                {result.missingSkills.length === 0 && (
                                    <span className={`text-xs ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No gaps — great match!</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Priority + Learning Path */}
                    {(result.topPriority || result.learningPath.length > 0) && (
                        <div className={`rounded-2xl p-5 border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                            {result.topPriority && (
                                <div className="mb-4">
                                    <h3 className={`text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                                        <Zap size={14} /> #1 Priority
                                    </h3>
                                    <p className={`text-sm leading-relaxed ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                        {result.topPriority}
                                    </p>
                                </div>
                            )}

                            {result.learningPath.length > 0 && (
                                <div>
                                    <h3 className={`text-xs font-black uppercase tracking-widest mb-3 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                        Learning Path
                                    </h3>
                                    <div className="space-y-2">
                                        {result.learningPath.map((step, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black shrink-0 ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'}`}>
                                                    {i + 1}
                                                </div>
                                                <p className={`text-sm leading-relaxed ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                                    {step}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
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
                            Analysis History
                        </h2>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-neutral-100 text-neutral-400'}`}>
                            {history.length}
                        </span>
                    </div>
                    {showHistory ? <ChevronUp size={16} className={isDark ? 'text-neutral-600' : 'text-neutral-400'} /> : <ChevronDown size={16} className={isDark ? 'text-neutral-600' : 'text-neutral-400'} />}
                </button>

                {showHistory && (
                    <div className={`border-t divide-y ${isDark ? 'border-neutral-800 divide-neutral-800' : 'border-neutral-200 divide-neutral-200'}`}>
                        {loadingHistory ? (
                            <div className="p-6 text-center"><Loader2 size={20} className="animate-spin mx-auto text-neutral-500" /></div>
                        ) : history.length === 0 ? (
                            <div className="p-6 text-center">
                                <p className={`text-sm ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No analyses yet.</p>
                            </div>
                        ) : (
                            history.map((item) => (
                                <div key={item.id} className={`p-4 ${isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-neutral-50'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{item.jobTitle}</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-lg font-black ${getScoreColor(item.matchPercentage)}`}>
                                                {item.matchPercentage}%
                                            </span>
                                            <ArrowRight size={12} className={isDark ? 'text-neutral-600' : 'text-neutral-400'}
                                                onClick={() => { setJobTitle(item.jobTitle); setResult(null); window.scrollTo(0, 0); }}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                        {item.missingSkills.slice(0, 4).map((s, i) => (
                                            <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border ${isDark ? 'bg-neutral-800 text-neutral-400 border-neutral-700' : 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>
                                                {s}
                                            </span>
                                        ))}
                                        {item.missingSkills.length > 4 && (
                                            <span className={`text-[10px] ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>+{item.missingSkills.length - 4} more</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
