"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/app/context/ThemeContext';
import { UserPlus, Building2, Briefcase, Check, Loader2 } from 'lucide-react';
import VerificationBadge from '../VerificationBadge';

interface SuggestionCardProps {
    id: string;
    name: string;
    image?: string;
    role?: string;
    type: 'user' | 'company';
    badgeType?: string;
    companyName?: string; // Current employer for professionals
    isFollowing?: boolean;
    onFollow: (id: string, type: 'user' | 'company') => Promise<void>;
}

export default function SuggestionCard({
    id,
    name,
    image,
    role,
    type,
    badgeType,
    companyName,
    isFollowing = false,
    onFollow
}: SuggestionCardProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [loading, setLoading] = useState(false);
    const [followed, setFollowed] = useState(isFollowing);

    const handleFollow = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setLoading(true);
        try {
            await onFollow(id, type);
            setFollowed(true);
        } catch (err) {
            console.error('Follow failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const profileLink = type === 'company'
        ? `/professional/companies/${id}`
        : `/professional/people/${id}`;

    return (
        <Link
            href={profileLink}
            className={`
                group flex flex-col rounded-2xl border overflow-hidden transition-all duration-300
                hover:scale-[1.02] hover:shadow-lg
                ${isDark
                    ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                    : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'}
            `}
        >
            {/* Image - Squared with curved corners */}
            <div className={`
                relative w-full aspect-square overflow-hidden
                ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}
            `}>
                {image ? (
                    <img
                        src={image}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        {type === 'company' ? (
                            <Building2 size={48} />
                        ) : (
                            <span className="text-5xl font-bold">{name.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col gap-2">
                {/* Name with Badge */}
                <div className="flex items-center gap-1.5">
                    <h3 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-black'}`}>
                        {name}
                    </h3>
                    <VerificationBadge tier={badgeType} size={18} />
                </div>

                {/* Role */}
                <p className={`text-xs truncate ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {role || (type === 'company' ? 'Company' : 'Professional')}
                </p>

                {/* Employment Info (for professionals only) */}
                {type === 'user' && companyName && (
                    <div className={`flex items-center gap-1.5 text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        <Briefcase size={10} />
                        <span className="truncate">{companyName}</span>
                    </div>
                )}

                {/* Action Button */}
                <button
                    onClick={handleFollow}
                    disabled={loading || followed}
                    className={`
                        mt-2 w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest
                        flex items-center justify-center gap-2 transition-all
                        disabled:opacity-70
                        ${followed
                            ? (isDark ? 'bg-neutral-800 text-neutral-400 border border-neutral-700' : 'bg-neutral-100 text-neutral-500 border border-neutral-200')
                            : type === 'company'
                                ? (isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800')
                                : (isDark ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-500')
                        }
                    `}
                >
                    {loading ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : followed ? (
                        <>
                            <Check size={14} />
                            {type === 'company' ? 'Subscribed' : 'Following'}
                        </>
                    ) : (
                        <>
                            <UserPlus size={14} />
                            {type === 'company' ? 'Subscribe' : 'Follow'}
                        </>
                    )}
                </button>
            </div>
        </Link>
    );
}
