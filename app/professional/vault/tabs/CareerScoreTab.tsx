"use client"

import React, { useState, useEffect, useCallback } from 'react';
import {
    Trophy, User, Code2, Shield, Users, TrendingUp, Loader2,
    ChevronRight, Star, Zap, Award, Eye, FileText, Briefcase, BadgeCheck
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

const TIER_CONFIG: Record<string, { label: string; bg: string; text: string; description: string }> = {
    legendary: { label: 'Legendary', bg: 'bg-black dark:bg-white', text: 'text-white dark:text-black', description: 'Top-tier professional with exceptional career proof' },
    elite: { label: 'Elite', bg: 'bg-neutral-800 dark:bg-neutral-200', text: 'text-white dark:text-black', description: 'Highly verified with strong skill validation' },
    rising: { label: 'Rising', bg: 'bg-neutral-600 dark:bg-neutral-400', text: 'text-white dark:text-black', description: 'Growing presence with solid fundamentals' },
    emerging: { label: 'Emerging', bg: 'bg-neutral-400 dark:bg-neutral-600', text: 'text-white dark:text-black', description: 'Building proof — every action counts' },
    newcomer: { label: 'Newcomer', bg: 'bg-neutral-200 dark:bg-neutral-800', text: 'text-black dark:text-neutral-400', description: 'Just getting started — build your proof' },
};

const PILLAR_ICONS: Record<string, React.ElementType> = {
    user: User,
    code: Code2,
    shield: Shield,
    users: Users,
    trending: TrendingUp,
};

export default function CareerScorePage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [score, setScore] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

    const fetchScore = useCallback(async () => {
        try {
            const res = await fetch('/api/professional/career-score');
            if (res.ok) {
                const data = await res.json();
                setScore(data.score);
            }
        } catch (err) {
            console.error('Error fetching career score:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchScore(); }, [fetchScore]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="animate-spin text-neutral-400" />
            </div>
        );
    }

    if (!score) {
        return (
            <div className={`text-center py-20 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                <Trophy size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-bold">Unable to load career score</p>
            </div>
        );
    }

    const tier = TIER_CONFIG[score.tier] || TIER_CONFIG.newcomer;

    return (
        <div className="max-w-5xl mx-auto space-y-6 py-4 animate-in fade-in slide-in-from-bottom-8 duration-500">

            {/* Hero Card — Score + Tier */}
            <div className={`relative p-6 md:p-8 rounded-[32px] border overflow-hidden ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    {/* Score Ring */}
                    <div className="relative w-40 h-40 shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            {/* Track */}
                            <circle cx="50" cy="50" r="42" fill="none" stroke={isDark ? '#262626' : '#e5e5e5'} strokeWidth="6" />
                            {/* Score Arc */}
                            <circle
                                cx="50" cy="50" r="42" fill="none"
                                strokeWidth="6" strokeLinecap="round"
                                className="transition-all duration-1000"
                                style={{
                                    stroke: isDark ? '#ffffff' : '#000000',
                                    strokeDasharray: `${score.overall * 2.64} 264`,
                                }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-4xl font-black flex items-center gap-1 ${isDark ? 'text-white' : 'text-black'}`}>
                                {score.overall}
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Career Score</span>
                        </div>
                    </div>

                    {/* Tier Info */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${tier.bg} ${tier.text} shadow-lg`}>
                                {tier.label}
                            </span>
                            {score.trend && (
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    {score.trend === 'increase' ? '↗ Increasing' : score.trend === 'decrease' ? '↘ Decreasing' : '→ Constant'}
                                </span>
                            )}
                        </div>
                        <h1 className={`text-2xl md:text-3xl font-black tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
                            Career Reputation
                        </h1>
                        <p className={`text-sm max-w-md ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            {tier.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Pillar Breakdown */}
            <div className="space-y-3">
                <div className={`text-[10px] font-bold uppercase tracking-widest px-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    Score Breakdown — 5 Pillars
                </div>
                {score.pillars.map((pillar: any) => {
                    const Icon = PILLAR_ICONS[pillar.icon] || Trophy;
                    const isExpanded = expandedPillar === pillar.id;

                    // Color based on theme
                    const barColor = isDark ? 'bg-white' : 'bg-black';
                    const textColor = isDark ? 'text-white' : 'text-black';

                    return (
                        <button
                            key={pillar.id}
                            onClick={() => setExpandedPillar(isExpanded ? null : pillar.id)}
                            className={`w-full text-left p-4 md:p-5 rounded-2xl border transition-all ${isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                    <Icon size={18} className={textColor} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{pillar.label}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-lg font-black ${textColor}`}>{pillar.score}</span>
                                            <span className={`text-[9px] font-bold ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>/{100}</span>
                                        </div>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className={`w-full h-2 rounded-full ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pillar.score}%` }} />
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{pillar.description}</span>
                                        <span className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>{pillar.weight}% weight</span>
                                    </div>
                                </div>
                                <ChevronRight size={14} className={`shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''} ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`} />
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className={`mt-4 p-3 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? 'bg-neutral-800/50' : 'bg-neutral-50'}`}>
                                    <PillarDetail pillar={pillar} stats={score.stats} radar={score.radarBreakdown} isDark={isDark} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Stats Grid */}
            <div className={`p-5 md:p-6 rounded-[32px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Raw Stats</h3>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {[
                        { label: 'Followers', value: score.stats.followers, icon: Users },
                        { label: 'Profile Views', value: score.stats.views, icon: Eye },
                        { label: 'Posts', value: score.stats.posts, icon: FileText },
                        { label: 'Skills', value: score.stats.skills, icon: Code2 },
                        { label: 'Endorsed', value: score.stats.endorsedSkills, icon: Star },
                        { label: 'Verified Roles', value: score.stats.verifiedRoles, icon: BadgeCheck },
                        { label: 'Documents', value: score.stats.documents, icon: FileText },
                        { label: 'Connections', value: score.stats.connections, icon: Users },
                    ].map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className={`p-3 rounded-xl text-center ${isDark ? 'bg-neutral-800/50' : 'bg-neutral-50'}`}>
                                <Icon size={14} className={`mx-auto mb-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`} />
                                <div className={`text-lg font-black ${isDark ? 'text-white' : 'text-black'}`}>{stat.value}</div>
                                <div className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>{stat.label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Pillar Detail Component
function PillarDetail({ pillar, stats, radar, isDark }: { pillar: any; stats: any; radar: any; isDark: boolean }) {
    const details: Record<string, React.ReactNode> = {
        profile: (
            <div className="space-y-1 text-xs">
                <DetailRow label="Profile Photo" value={stats.followers > -1 ? '✓' : '✗'} isDark={isDark} />
                <DetailRow label="Skills Added" value={stats.skills} isDark={isDark} />
                <DetailRow label="Documents" value={stats.documents} isDark={isDark} />
                <p className={`text-[10px] mt-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Complete your profile sections to increase this score.</p>
            </div>
        ),
        skills: radar ? (
            <div className="space-y-1 text-xs">
                <DetailRow label="Depth" value={`${radar.depth}/100`} isDark={isDark} />
                <DetailRow label="Execution Speed" value={`${radar.execution}/100`} isDark={isDark} />
                <DetailRow label="Collaboration" value={`${radar.collaboration}/100`} isDark={isDark} />
                <DetailRow label="Creativity" value={`${radar.creativity}/100`} isDark={isDark} />
                <p className={`text-[10px] mt-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>AI-analyzed from your profile, skills, and career data.</p>
            </div>
        ) : (
            <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Generate your AI Radar Stats on your profile page to unlock this pillar.</p>
        ),
        trust: (
            <div className="space-y-1 text-xs">
                <DetailRow label="Badge Tier" value={stats.badgeTier === 'none' ? 'None' : stats.badgeTier} isDark={isDark} />
                <DetailRow label="Verified Roles" value={stats.verifiedRoles} isDark={isDark} />
                <DetailRow label="Endorsed Skills" value={stats.endorsedSkills} isDark={isDark} />
                <p className={`text-[10px] mt-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Get hired via Profcaria and earn endorsements to increase trust.</p>
            </div>
        ),
        network: (
            <div className="space-y-1 text-xs">
                <DetailRow label="Followers" value={stats.followers} isDark={isDark} />
                <DetailRow label="Profile Views" value={stats.views} isDark={isDark} />
                <DetailRow label="Posts" value={stats.posts} isDark={isDark} />
                <DetailRow label="Connections" value={stats.connections} isDark={isDark} />
                <p className={`text-[10px] mt-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Engage with the community to grow your influence.</p>
            </div>
        ),
        growth: (
            <div className="space-y-1 text-xs">
                <DetailRow label="Has Employment" value={stats.verifiedRoles > 0 ? 'Yes' : 'No'} isDark={isDark} />
                <DetailRow label="3+ Skills" value={stats.skills >= 3 ? 'Yes' : 'No'} isDark={isDark} />
                <DetailRow label="Active Posts" value={stats.posts > 0 ? 'Yes' : 'No'} isDark={isDark} />
                <p className={`text-[10px] mt-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Keep building your career infrastructure consistently.</p>
            </div>
        ),
    };

    return details[pillar.id] || null;
}

function DetailRow({ label, value, isDark }: { label: string; value: any; isDark: boolean }) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>{label}</span>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{value}</span>
        </div>
    );
}
