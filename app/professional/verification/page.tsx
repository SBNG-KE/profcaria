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
    verified: { color: 'emerald', icon: CheckCircle2, label: 'Verified' },
    partial: { color: 'amber', icon: AlertCircle, label: 'Partial' },
    unverified: { color: 'neutral', icon: XCircle, label: 'Unverified' },
};

export default function VerificationPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [graph, setGraph] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedNode, setExpandedNode] = useState<string | null>(null);

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
        gold: 'from-amber-400 to-yellow-600',
        blue: 'from-blue-400 to-indigo-600',
        gray: 'from-neutral-400 to-neutral-600',
        none: isDark ? 'from-neutral-700 to-neutral-800' : 'from-neutral-200 to-neutral-300',
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 py-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
            {/* Header with Score Ring */}
            <div className={`p-6 md:p-8 rounded-[32px] border relative overflow-hidden ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6, #8b5cf6)' }} />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    {/* Score Ring */}
                    <div className="relative w-32 h-32 shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            <circle cx="50" cy="50" r="42" fill="none" stroke={isDark ? '#262626' : '#e5e5e5'} strokeWidth="8" />
                            <circle
                                cx="50" cy="50" r="42" fill="none"
                                stroke={graph.overallTier === 'gold' ? '#f59e0b' : graph.overallTier === 'blue' ? '#3b82f6' : graph.overallTier === 'gray' ? '#9ca3af' : (isDark ? '#525252' : '#d4d4d4')}
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
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${tierColors[graph.overallTier]} text-white`}>
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
                                <div className={`p-2 rounded-xl ${status.color === 'emerald' ? (isDark ? 'bg-emerald-500/20' : 'bg-emerald-50') :
                                        status.color === 'amber' ? (isDark ? 'bg-amber-500/20' : 'bg-amber-50') :
                                            (isDark ? 'bg-neutral-800' : 'bg-neutral-100')
                                    }`}>
                                    <Icon size={18} className={
                                        status.color === 'emerald' ? 'text-emerald-500' :
                                            status.color === 'amber' ? 'text-amber-500' :
                                                (isDark ? 'text-neutral-600' : 'text-neutral-400')
                                    } />
                                </div>

                                {/* Label + Score */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{node.label}</h3>
                                        <div className="flex items-center gap-1.5">
                                            <StatusIcon size={14} className={
                                                status.color === 'emerald' ? 'text-emerald-500' :
                                                    status.color === 'amber' ? 'text-amber-500' :
                                                        (isDark ? 'text-neutral-600' : 'text-neutral-400')
                                            } />
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${status.color === 'emerald' ? 'text-emerald-500' :
                                                    status.color === 'amber' ? 'text-amber-500' :
                                                        (isDark ? 'text-neutral-600' : 'text-neutral-400')
                                                }`}>{status.label}</span>
                                        </div>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className={`w-full h-1.5 rounded-full mt-2 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${status.color === 'emerald' ? 'bg-emerald-500' :
                                                    status.color === 'amber' ? 'bg-amber-500' :
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
                                                    ? <CheckCircle2 size={13} className="text-emerald-500" />
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

            {/* How to Improve */}
            {graph.overallScore < 80 && (
                <div className={`p-5 md:p-6 rounded-[32px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <h3 className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>
                        💡 Increase Your Verification Score
                    </h3>
                    <div className="space-y-2">
                        {graph.nodes.filter((n: any) => n.status !== 'verified').map((node: any) => {
                            const suggestions: Record<string, string> = {
                                identity: 'Add a profile photo, write an about section, and enable 2FA',
                                employment: 'Get hired through Profcaria for cryptographically verified employment',
                                education: 'Add your education details to your profile',
                                skills: 'Add skills and get endorsements from connections',
                                certifications: 'Add your professional certifications',
                                documents: 'Upload your CV, resume, or other career documents',
                                profiles: 'Link your LinkedIn, GitHub, or other professional profiles',
                                security: 'Enable 2FA, set up a passkey, or get badge verified',
                            };
                            return (
                                <div key={node.id} className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? 'bg-neutral-800/50' : 'bg-neutral-50'}`}>
                                    <TrendingUp size={14} className={`mt-0.5 shrink-0 ${node.status === 'partial' ? 'text-amber-500' : isDark ? 'text-neutral-600' : 'text-neutral-400'}`} />
                                    <div>
                                        <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>{node.label}</div>
                                        <div className={`text-[11px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{suggestions[node.id]}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
