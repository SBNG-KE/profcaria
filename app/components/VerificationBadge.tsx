"use client"

import React from 'react';

interface VerificationBadgeProps {
    tier?: string | null; // 'none' | 'gray' | 'blue' | 'gold' | 'basic' | 'pro' | 'enterprise' | 'premium'
    size?: number;
    className?: string;
    showTooltip?: boolean;
}

export default function VerificationBadge({ tier, size = 16, className = '', showTooltip = true }: VerificationBadgeProps) {
    if (!tier || tier === 'none') return null;

    const tierLower = tier.toLowerCase();

    // Determine colors based on tier
    let gradientColors: { from: string; to: string; shadow: string; checkColor: string; label: string };

    switch (tierLower) {
        case 'gray':
        case 'basic':
            gradientColors = {
                from: '#6B7280', // gray-500
                to: '#4B5563',   // gray-600
                shadow: 'rgba(107, 114, 128, 0.4)',
                checkColor: '#FFFFFF',
                label: 'Verified Business'
            };
            break;
        case 'blue':
        case 'pro':
        case 'verified':
            gradientColors = {
                from: '#3B82F6', // blue-500
                to: '#1D4ED8',   // blue-700
                shadow: 'rgba(59, 130, 246, 0.5)',
                checkColor: '#FFFFFF',
                label: 'Pro Verified'
            };
            break;
        case 'gold':
        case 'premium':
        case 'enterprise':
            gradientColors = {
                from: '#F59E0B', // amber-500
                to: '#D97706',   // amber-600
                shadow: 'rgba(245, 158, 11, 0.5)',
                checkColor: '#FFFFFF',
                label: 'Premium Verified'
            };
            break;
        default:
            return null;
    }

    // SVG checkmark path - premium style with rounded check
    const checkPath = "M16.707 7.207a1 1 0 0 0-1.414-1.414L9.5 11.586 6.707 8.793a1 1 0 0 0-1.414 1.414l3.5 3.5a1 1 0 0 0 1.414 0l6.5-6.5z";

    return (
        <span
            className={`inline-flex items-center justify-center shrink-0 ${className}`}
            title={showTooltip ? gradientColors.label : undefined}
            style={{
                filter: `drop-shadow(0 1px 2px ${gradientColors.shadow})`,
            }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label={gradientColors.label}
            >
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id={`badge-gradient-${tierLower}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={gradientColors.from} />
                        <stop offset="100%" stopColor={gradientColors.to} />
                    </linearGradient>
                </defs>

                {/* Badge Shape - 8-pointed star / starburst with rounded edges */}
                <path
                    d="M11 0C11.7 0 12.3 0.4 12.6 1L14.4 4.2C14.7 4.7 15.3 5 15.9 5L19.5 5.3C20.2 5.4 20.8 5.9 21 6.5C21.2 7.2 21 7.9 20.5 8.4L17.9 11C17.5 11.4 17.3 12 17.4 12.6L18.1 16.2C18.2 16.9 17.9 17.6 17.3 18C16.7 18.4 15.9 18.4 15.3 18L12.1 16C11.6 15.7 11 15.7 10.5 16L7.3 18C6.7 18.4 5.9 18.4 5.3 18C4.7 17.6 4.4 16.9 4.5 16.2L5.2 12.6C5.3 12 5.1 11.4 4.7 11L2.1 8.4C1.6 7.9 1.4 7.2 1.6 6.5C1.8 5.9 2.4 5.4 3.1 5.3L6.7 5C7.3 5 7.9 4.7 8.2 4.2L10 1C10.3 0.4 10.9 0 11.6 0H11Z"
                    fill={`url(#badge-gradient-${tierLower})`}
                />

                {/* Inner shine/highlight for 3D effect */}
                <path
                    d="M11 2C11.4 2 11.7 2.2 11.9 2.6L13.4 5.3C13.6 5.7 14 5.9 14.4 6L17.4 6.2C17.8 6.3 18.2 6.5 18.3 6.9C18.4 7.3 18.3 7.7 18 8L15.8 10.2C15.5 10.5 15.4 10.9 15.4 11.3L15.9 14.3C16 14.7 15.8 15.1 15.4 15.4C15.1 15.6 14.6 15.6 14.2 15.4L11.5 13.8C11.2 13.6 10.8 13.6 10.5 13.8L7.8 15.4C7.4 15.6 6.9 15.6 6.6 15.4C6.2 15.1 6 14.7 6.1 14.3L6.6 11.3C6.7 10.9 6.5 10.5 6.2 10.2L4 8C3.7 7.7 3.6 7.3 3.7 6.9C3.8 6.5 4.2 6.3 4.6 6.2L7.6 6C8 5.9 8.4 5.7 8.6 5.3L10.1 2.6C10.3 2.2 10.6 2 11 2Z"
                    fill={gradientColors.from}
                    opacity="0.3"
                />

                {/* Checkmark */}
                <path
                    d={checkPath}
                    fill={gradientColors.checkColor}
                />
            </svg>
        </span>
    );
}
