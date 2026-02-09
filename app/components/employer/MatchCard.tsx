"use client"

import Link from 'next/link';
import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { MapPin, Briefcase, Zap, CheckCircle2, RotateCw, Globe, Send } from 'lucide-react';
import VerificationBadge from '../VerificationBadge';

interface MatchBreakdown {
    role: boolean;
    location: boolean;
    relocation: boolean;
}

interface MatchCardProps {
    id: string;
    name: string;
    image?: string;
    role?: string;
    location?: string;
    score: number;
    matchBreakdown?: MatchBreakdown;
    invited?: boolean;
    onInvite?: () => void;
    onRemind?: () => void;
    isLoading?: boolean;
}

export default function MatchCard({
    id,
    name,
    image,
    role,
    location,
    score,
    matchBreakdown,
    invited,
    onInvite,
    onRemind,
    isLoading
}: MatchCardProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const profileLink = `/professional/people/${id}`;

    // Score Color Logic
    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        if (s >= 60) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    };

    return (
        <div className={`
            flex flex-col items-center p-6 rounded-2xl border transition-all duration-300 relative group
            ${isDark
                ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 shadow-lg shadow-black/20'
                : 'bg-white border-neutral-100 hover:border-neutral-200 shadow-sm hover:shadow-md'}
        `}>
            {/* Match Score Badge (Top Right) */}
            <div className={`
                absolute top-4 right-4 px-2 py-1 rounded-lg text-xs font-black border uppercase tracking-widest flex items-center gap-1
                ${getScoreColor(score)}
            `}>
                <Zap size={12} className="fill-current" />
                {score}%
            </div>

            {/* Avatar */}
            <div className={`
                relative w-20 h-20 rounded-2xl overflow-hidden mb-4 border-2 transition-transform group-hover:scale-105
                ${isDark ? 'border-neutral-800 bg-neutral-800' : 'border-neutral-100 bg-neutral-100'}
            `}>
                {image ? (
                    <img src={image} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center text-xl font-bold ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        {name.charAt(0)}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="text-center w-full mb-6 flex-1">
                <Link href={profileLink} className="block hover:underline decoration-neutral-500/50">
                    <h3 className={`font-bold text-lg mb-1 truncate w-full flex items-center justify-center gap-1 ${isDark ? 'text-white' : 'text-black'}`}>
                        {name}
                        {/* Assuming checkmark for verified if implicit, or pass badgeType if available */}
                    </h3>
                </Link>
                <div className="flex flex-col items-center gap-1.5">
                    <p className={`text-xs flex items-center justify-center gap-1.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        <Briefcase size={12} />
                        <span className="truncate max-w-[150px]">{role || 'Professional'}</span>
                    </p>
                    {location && (
                        <p className={`text-[10px] flex items-center justify-center gap-1.5 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            <MapPin size={10} />
                            <span className="truncate max-w-[150px]">{location}</span>
                        </p>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="w-full mt-auto">
                {invited ? (
                    <div className="flex gap-2">
                        <div className={`
                            flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 border cursor-default
                            ${isDark
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'}
                        `}>
                            <CheckCircle2 size={14} />
                            Invited
                        </div>
                        <button
                            onClick={onRemind}
                            disabled={isLoading}
                            className={`
                                px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center transition-all border
                                ${isDark
                                    ? 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white hover:bg-neutral-700'
                                    : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:text-black hover:bg-neutral-200'}
                                ${isLoading ? 'opacity-50 cursor-wait' : ''}
                            `}
                            title="Send Reminder"
                        >
                            <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onInvite}
                        disabled={isLoading}
                        className={`
                            w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95
                            bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20 disabled:opacity-50 disabled:cursor-wait
                        `}
                    >
                        {isLoading ? (
                            <RotateCw size={14} className="animate-spin" />
                        ) : (
                            <Send size={14} />
                        )}
                        Invite to Job
                    </button>
                )}
            </div>
        </div>
    );
}
