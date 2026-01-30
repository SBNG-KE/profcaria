"use client"

import Link from 'next/link';
import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import FollowButton from './FollowButton';
import { MapPin, Briefcase } from 'lucide-react';
import VerificationBadge from '../VerificationBadge';

interface NetworkCardProps {
    id: string;
    name: string;
    image?: string;
    role?: string; // or Industry for companies
    type: 'user' | 'company';
    isFollowing: boolean;
    badgeType?: string;
    onToggle?: () => void; // Parent callback to remove from list if needed
}

export default function NetworkCard({
    id,
    name,
    image,
    role,
    type,
    isFollowing,
    badgeType,
    onToggle
}: NetworkCardProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const messageLink = `/professional/notifications?chat=${id}`;

    return (
        <div className={`
            flex flex-col items-center p-6 rounded-2xl border transition-all duration-300
            ${isDark
                ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 shadow-lg shadow-black/20'
                : 'bg-white border-neutral-100 hover:border-neutral-200 shadow-sm hover:shadow-md'}
        `}>
            {/* Avatar / Logo */}
            <div className={`
                relative w-20 h-20 rounded-full overflow-hidden mb-4 border-2
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
            <div className="text-center w-full mb-4 flex-1">
                <Link href={type === 'company' ? `/professional/companies/${id}` : `/professional/people/${id}`} className="block hover:underline">
                    <h3 className={`font-bold text-lg mb-1 truncate w-full flex items-center justify-center gap-1 ${isDark ? 'text-white' : 'text-black'}`}>
                        {name}
                        <VerificationBadge tier={badgeType} size={16} />
                    </h3>
                </Link>
                <p className={`text-xs flex items-center justify-center gap-1.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    <Briefcase size={12} />
                    <span className="truncate max-w-[150px]">{role || (type === 'company' ? 'Company' : 'Professional')}</span>
                </p>
            </div>

            {/* Actions */}
            <div className="w-full space-y-2">
                {type === 'user' && (
                    <Link
                        href={messageLink}
                        className={`
                            flex items-center justify-center w-full py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors
                            ${isDark
                                ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-black'}
                        `}
                    >
                        Message
                    </Link>
                )}

                <FollowButton
                    targetId={id}
                    type={type}
                    initialIsFollowing={isFollowing}
                    onToggle={onToggle}
                    className="w-full"
                    variant={isFollowing ? "outline" : "primary"}
                />
            </div>
        </div>
    );
}
