"use client"

import React, { useState, useEffect } from 'react';
import DefaultLogo from './DefaultLogo';
import { CheckCircle } from 'lucide-react';

interface ProfileImageProps {
    src?: string | null;
    type?: 'user' | 'company' | 'employer' | 'professional';
    name?: string;
    size?: number; // Used for icon scaling in fallback
    className?: string; // Should include width/height/rounded classes
    alt?: string;
    badge?: 'basic' | 'pro' | 'enterprise' | 'premium' | string | null;
}

export default function ProfileImage({ src, type = 'user', name, size = 24, className = '', alt, badge }: ProfileImageProps) {
    const [error, setError] = useState(false);

    // Reset error if src changes
    useEffect(() => {
        setError(false);
    }, [src]);

    // Check if src is valid (not empty string, not /default-logo.png if we want to avoid it)
    const isValidSrc = src && src !== '' && src !== '/default-logo.png';

    const getBadgeColor = (b: string) => {
        switch (b?.toLowerCase()) {
            case 'item': // For test
            case 'basic': return 'text-neutral-400';
            case 'pro': return 'text-blue-400';
            case 'enterprise':
            case 'premium': return 'text-yellow-400';
            default: return null;
        }
    };

    const badgeColor = badge ? getBadgeColor(badge) : null;

    return (
        <div className="relative inline-block">
            {(!isValidSrc || error) ? (
                <DefaultLogo type={type} name={name} size={size} className={className} />
            ) : (
                <img
                    src={src || ''}
                    alt={alt || name || 'Profile'}
                    className={`${className} object-cover`}
                    onError={() => setError(true)}
                />
            )}

            {badgeColor && (
                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-black rounded-full p-[1px]">
                    <CheckCircle
                        size={size > 30 ? 16 : 12}
                        className={badgeColor}
                        fill="currentColor"
                        fillOpacity={0.2}
                    />
                </div>
            )}
        </div>
    );
}
