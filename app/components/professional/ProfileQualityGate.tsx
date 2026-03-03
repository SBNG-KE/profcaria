"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, CheckCircle2, Circle, Sparkles, Crown, TrendingUp, Loader2 } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

const QUALITY_LEVELS = [
    { min: 0, label: 'Starter', color: 'neutral', features: ['Basic profile visibility'] },
    { min: 20, label: 'Verified', color: 'emerald', features: ['Appear in search results', 'Receive job invites'] },
    { min: 40, label: 'Pro', color: 'blue', features: ['Priority in smart matching', 'Access career insights'] },
    { min: 60, label: 'Elite', color: 'indigo', features: ['Featured in top results', 'Employer direct contact'] },
    { min: 80, label: 'Legendary', color: 'amber', features: ['VIP badge on profile', 'Exclusive opportunities'] },
];

export default function ProfileQualityGate({ compact = false }: { compact?: boolean }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchScore = useCallback(async () => {
        try {
            const res = await fetch('/api/professional/career-score');
            if (res.ok) {
                const d = await res.json();
                setData(d.score);
            }
        } catch { }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchScore(); }, [fetchScore]);

    if (loading || !data) return null;

    const score = data.overall || 0;
    const currentLevel = [...QUALITY_LEVELS].reverse().find(l => score >= l.min) || QUALITY_LEVELS[0];
    const nextLevel = QUALITY_LEVELS.find(l => l.min > score);
    const pointsToNext = nextLevel ? nextLevel.min - score : 0;

    const colorMap: Record<string, string> = {
        amber: 'bg-amber-500',
        indigo: 'bg-indigo-500',
        purple: 'bg-purple-500',
        blue: 'bg-blue-500',
        emerald: 'bg-emerald-500',
        neutral: isDark ? 'bg-neutral-700' : 'bg-neutral-300'
    };
    const textMap: Record<string, string> = {
        amber: 'text-amber-500',
        indigo: 'text-indigo-500',
        purple: 'text-purple-500',
        blue: 'text-blue-500',
        emerald: 'text-emerald-500',
        neutral: isDark ? 'text-neutral-500' : 'text-neutral-400'
    };

    if (compact) {
        return (
            <div className={`p-3 rounded-2xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <div className="flex items-center gap-2.5">
                    <TrendingUp size={14} className={textMap[currentLevel.color]} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${textMap[currentLevel.color]}`}>{currentLevel.label}</span>
                            <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-black'}`}>{score}/100</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full mt-1 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                            <div className={`h-full rounded-full transition-all duration-700 ${colorMap[currentLevel.color]}`} style={{ width: `${score}%` }} />
                        </div>
                    </div>
                </div>
                {nextLevel && (
                    <p className={`text-[9px] mt-1.5 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        +{pointsToNext}pts to <b>{nextLevel.label}</b>
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className={`p-5 md:p-6 rounded-[32px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
            <div className="flex items-center gap-3 mb-4">
                <Crown size={20} className={textMap[currentLevel.color]} />
                <div>
                    <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>Profile Quality: {currentLevel.label}</h3>
                    <p className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Higher quality = more visibility + better matches</p>
                </div>
            </div>

            {/* Level Progress Bar */}
            <div className="relative mb-4">
                <div className="flex justify-between mb-2">
                    {QUALITY_LEVELS.map(level => {
                        const isActive = score >= level.min;
                        return (
                            <div key={level.label} className="flex flex-col items-center gap-0.5" style={{ width: '20%' }}>
                                {isActive
                                    ? <CheckCircle2 size={11} className={textMap[level.color]} />
                                    : <Circle size={11} className={isDark ? 'text-neutral-700' : 'text-neutral-300'} />
                                }
                                <span className={`text-[8px] font-bold uppercase tracking-wider ${isActive ? (isDark ? 'text-white' : 'text-black') : (isDark ? 'text-neutral-700' : 'text-neutral-300')}`}>
                                    {level.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <div className={`w-full h-2 rounded-full ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                    <div className={`h-full rounded-full transition-all duration-1000 ${isDark ? 'bg-white' : 'bg-black'}`} style={{ width: `${Math.min(score, 100)}%` }} />
                </div>
            </div>

            {/* Current Features */}
            <div className="space-y-1">
                {currentLevel.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 py-0.5">
                        <CheckCircle2 size={11} className="text-emerald-500" />
                        <span className={`text-xs ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>{feat}</span>
                    </div>
                ))}
                {nextLevel && (
                    <div className={`flex items-center gap-2 py-0.5 opacity-50`}>
                        <Circle size={11} className={isDark ? 'text-neutral-600' : 'text-neutral-400'} />
                        <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            Next: {nextLevel.features[0]} (+{pointsToNext}pts)
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
