"use client"

import React, { useState, useEffect } from 'react';
import DefaultLogo from './DefaultLogo';
import VerificationBadge from './VerificationBadge';

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



    // Badge removed from ProfileImage - only show next to name for single badge display
    if (!isValidSrc || error) {
        return <DefaultLogo type={type} name={name} size={size} className={className} />;
    }

    return (
        <img
            src={src || ''}
            alt={alt || name || 'Profile'}
            className={`${className} object-cover`}
            onError={() => setError(true)}
        />
    );
}
