"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/app/context/ThemeContext';
import { UserPlus, Building2, Briefcase, Check, Loader2 } from 'lucide-react';
import VerificationBadge from '../VerificationBadge';
import FollowButton from './FollowButton';

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

    const profileLink = type === 'company'
        ? `/professional/companies/${id}`
        : `/professional/people/${id}`;

    return (
        <div
            className={`
                group flex flex-col rounded-2xl border overflow-hidden transition-all duration-300
                hover:scale-[1.02] hover:shadow-lg
                ${isDark
                    ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                    : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'}
            `}
        >
            {/* Image - Squared with curved corners */}
            <Link href={profileLink} className={`
                relative w-full aspect-square overflow-hidden block
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
            </Link>

            {/* Content */}
            <div className="p-4 flex flex-col gap-2">
                {/* Name with Badge */}
                <Link href={profileLink} className="flex items-center gap-1.5 hover:underline decoration-1 underline-offset-2">
                    <h3 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-black'}`}>
                        {name}
                    </h3>
                    <VerificationBadge tier={badgeType} size={18} />
                </Link>

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

                {/* Action Button - Uses Shared Component */}
                <div className="mt-2">
                    <FollowButton
                        targetId={id}
                        type={type}
                        initialIsFollowing={isFollowing}
                        onToggle={(newState) => {
                            if (newState) onFollow(id, type);
                        }}
                        className="w-full"
                        size="sm"
                        isFollowBack={true}
                    />
                </div>
            </div>
        </div>
    );
}
