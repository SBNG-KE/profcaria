"use client"

import React from 'react';
import { BadgeCheck, CheckCircle } from 'lucide-react';

interface VerificationBadgeProps {
    tier?: string | null; // 'none' | 'gray' | 'blue' | 'gold'
    size?: number;
    className?: string;
    showTooltip?: boolean;
}

export default function VerificationBadge({ tier, size = 16, className = '', showTooltip = true }: VerificationBadgeProps) {
    if (!tier || tier === 'none') return null;

    let colorClass = '';
    let Icon = BadgeCheck; // Default to BadgeCheck (Solid look)

    switch (tier.toLowerCase()) {
        case 'gray': // Basic / Business
        case 'basic':
            colorClass = 'text-neutral-500 fill-neutral-100 dark:fill-neutral-800';
            break;
        case 'blue': // Pro / Verified
        case 'pro':
            colorClass = 'text-blue-500 fill-blue-50 dark:fill-blue-900/20';
            Icon = CheckCircle; // Blue usually uses CheckCircle or BadgeCheck
            break;
        case 'gold': // Premium / Enterprise
        case 'premium':
        case 'enterprise':
            colorClass = 'text-amber-500 fill-amber-50 dark:fill-amber-900/20';
            break;
        default:
            return null;
    }

    return (
        <span className={`inline-flex items-center justify-center ${className}`} title={showTooltip ? `${tier.charAt(0).toUpperCase() + tier.slice(1)} Verified` : undefined}>
            <Icon size={size} className={colorClass} aria-label={`${tier} badge`} />
        </span>
    );
}
