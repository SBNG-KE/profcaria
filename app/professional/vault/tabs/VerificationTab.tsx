"use client"

import React, { useState, useEffect, useCallback } from 'react';
import {
    Shield, User, Briefcase, GraduationCap, Code2, Award, FileText,
    Link2, Lock, CheckCircle2, AlertCircle, XCircle, ChevronRight,
    Loader2, TrendingUp
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

const NODE_ICONS: Record<string, React.ElementType> = {
    user: User,
    briefcase: Briefcase,
    graduation: GraduationCap,
    code: Code2,
    award: Award,
    file: FileText,
    link: Link2,
    shield: Lock,
};

const STATUS_CONFIG = {
    verified: { color: 'primary', icon: CheckCircle2, label: 'Verified' },
    partial: { color: 'secondary', icon: AlertCircle, label: 'Partial' },
    unverified: { color: 'neutral', icon: XCircle, label: 'Unverified' },
};

export default function VerificationPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [graph, setGraph] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedNode, setExpandedNode] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    const fetchGraph = useCallback(async () => {
        try {
            const res = await fetch('/api/professional/verification');
            if (res.ok) {
                const data = await res.json();
                setGraph(data.graph);
            }
        } catch (err) {
            console.error('Error fetching verification graph:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchGraph(); }, [fetchGraph]);

    const handleRunAIVerification = async () => {
        setIsVerifying(true);
        try {
            const res = await fetch('/api/professional/verification', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setLastUpdated(data.lastUpdated);
                await fetchGraph(); // Refresh the graph data
            }
        } catch (err) {
            console.error('Error running AI verification:', err);
        } finally {
            setIsVerifying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="animate-spin text-neutral-400" />
            </div>
        );
    }

    if (!graph) {
        return (
            <div className={`text-center py-20 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                <Shield size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-bold">Unable to load verification data</p>
            </div>
        );
    }

    const tierColors: Record<string, string> = {
        gold: isDark ? 'bg-white text-black' : 'bg-black text-white',
        blue: isDark ? 'bg-neutral-200 text-black' : 'bg-neutral-800 text-white',
        gray: isDark ? 'bg-neutral-400 text-black' : 'bg-neutral-600 text-white',
        none: isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-200 text-neutral-600',
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 py-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
            {/* Header with Score Ring */}
            <div className={`p-6 md:p-8 rounded-[32px] border relative overflow-hidden ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-5" style={{ background: isDark ? 'linear-gradient(135deg, #404040, #171717)' : 'linear-gradient(135deg, #e5e5e5, #ffffff)' }} />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    {/* Score Ring */}
                    <div className="relative w-32 h-32 shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            <circle cx="50" cy="50" r="42" fill="none" stroke={isDark ? '#262626' : '#e5e5e5'} strokeWidth="8" />
                            <circle
                                cx="50" cy="50" r="42" fill="none"
                                stroke={graph.overallTier === 'gold' ? (isDark ? '#fafafa' : '#171717') : graph.overallTier === 'blue' ? (isDark ? '#e5e5e5' : '#404040') : graph.overallTier === 'gray' ? (isDark ? '#a3a3a3' : '#737373') : (isDark ? '#525252' : '#d4d4d4')}
                                strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={`${graph.overallScore * 2.64} 264`}
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{graph.overallScore}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Score</span>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                        <h1 className={`text-2xl md:text-3xl font-black tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
                            Verified Career Graph
                        </h1>
                        <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            Your proof speaks. Every node below represents verifiable career evidence.
                        </p>
                        <div className="flex items-center gap-3 mt-3 justify-center md:justify-start">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tierColors[graph.overallTier]}`}>
                                <TrendingUp size={11} />
                                {graph.overallTier === 'none' ? 'Unranked' : `${graph.overallTier.charAt(0).toUpperCase() + graph.overallTier.slice(1)} Tier`}
                            </span>
                            <span className={`text-[10px] font-bold ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                {graph.totalVerified} verified · {graph.totalPartial} partial · {graph.totalUnverified} unverified
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Graph Nodes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {graph.nodes.map((node: any) => {
                    const Icon = NODE_ICONS[node.icon] || Shield;
                    const status = STATUS_CONFIG[node.status as keyof typeof STATUS_CONFIG];
                    const StatusIcon = status.icon;
                    const isExpanded = expandedNode === node.id;
                    const percent = Math.round((node.score / node.maxScore) * 100);

                    return (
                        <button
                            key={node.id}
                            onClick={() => setExpandedNode(isExpanded ? null : node.id)}
                            className={`w-full text-left p-4 md:p-5 rounded-2xl border transition-all ${isExpanded
                                    ? (isDark ? 'bg-neutral-800/80 border-neutral-700 shadow-xl' : 'bg-white border-neutral-300 shadow-xl')
                                    : (isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm')
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {/* Status Icon */}
                                <div className={`p-2 rounded-xl flex items-center justify-center ${status.color === 'primary' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') :
                                        status.color === 'secondary' ? (isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-black') :
                                            (isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500')
                                    }`}>
                                    <Icon size={18} />
                                </div>

                                {/* Label + Score */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{node.label}</h3>
                                        <div className="flex items-center gap-1.5">
                                            <StatusIcon size={14} className={
                                                status.color === 'primary' ? (isDark ? 'text-white' : 'text-black') :
                                                    status.color === 'secondary' ? (isDark ? 'text-neutral-300' : 'text-neutral-600') :
                                                        (isDark ? 'text-neutral-600' : 'text-neutral-400')
                                            } />
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${status.color === 'primary' ? (isDark ? 'text-white' : 'text-black') :
                                                    status.color === 'secondary' ? (isDark ? 'text-neutral-300' : 'text-neutral-600') :
                                                        (isDark ? 'text-neutral-600' : 'text-neutral-400')
                                                }`}>{status.label}</span>
                                        </div>
                                    </div>
                                    <div className={`w-full h-1.5 rounded-full mt-2 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${status.color === 'primary' ? (isDark ? 'bg-white' : 'bg-black') :
                                                    status.color === 'secondary' ? (isDark ? 'bg-neutral-400' : 'bg-neutral-500') :
                                                        (isDark ? 'bg-neutral-700' : 'bg-neutral-300')
                                                }`}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>

                                <ChevronRight size={14} className={`shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''} ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`} />
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {node.details.map((detail: any, i: number) => (
                                        <div key={i} className={`flex items-center justify-between p-2.5 rounded-xl ${isDark ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
                                            <div className="flex items-center gap-2">
                                                {detail.verified
                                                    ? <CheckCircle2 size={13} className={isDark ? 'text-white' : 'text-black'} />
                                                    : <XCircle size={13} className={isDark ? 'text-neutral-600' : 'text-neutral-400'} />
                                                }
                                                <span className={`text-xs font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>{detail.label}</span>
                                            </div>
                                            {detail.count !== undefined && (
                                                <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>{detail.count}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* AI Verification Section */}
            <div className={`p-5 md:p-6 rounded-[32px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
                            AI Career Verification
                        </h3>
                        <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            Compute your authentic, non-inflated career verification score using your real career data and proofs.
                        </p>
                        {lastUpdated && (
                            <p className={`text-[10px] mt-2 font-bold ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                Last verified: {new Date(lastUpdated).toLocaleString()}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleRunAIVerification}
                        disabled={isVerifying}
                        className={`shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                    >
                        {isVerifying ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
                        {isVerifying ? 'Analyzing Data...' : 'Run AI Verification'}
                    </button>
                </div>
            </div>
        </div>
    );
}
