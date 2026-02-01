"use client"

import React from 'react';

interface VerificationBadgeProps {
    tier?: string | null; // 'none' | 'gray' | 'blue' | 'gold' | 'basic' | 'pro' | 'enterprise' | 'premium'
    size?: number;
    className?: string;
    showTooltip?: boolean;
}

export default function VerificationBadge({ tier, size = 20, className = '', showTooltip = true }: VerificationBadgeProps) {
    if (!tier || tier === 'none') return null;

    const tierLower = tier.toLowerCase();

    // Enhanced colors for dark mode visibility with glow effects
    let colors: { primary: string; secondary: string; glow: string; checkColor: string; label: string };

    switch (tierLower) {
        case 'gray':
        case 'basic':
            colors = {
                primary: '#9CA3AF',   // gray-400 (brighter)
                secondary: '#6B7280', // gray-500
                glow: '0 0 8px rgba(156, 163, 175, 0.7), 0 0 16px rgba(156, 163, 175, 0.3)',
                checkColor: '#FFFFFF',
                label: 'Verified Business'
            };
            break;
        case 'blue':
        case 'pro':
        case 'verified':
            colors = {
                primary: '#60A5FA',   // blue-400 (brighter for dark mode)
                secondary: '#3B82F6', // blue-500
                glow: '0 0 12px rgba(96, 165, 250, 0.8), 0 0 24px rgba(59, 130, 246, 0.4)',
                checkColor: '#FFFFFF',
                label: 'Pro Verified'
            };
            break;
        case 'gold':
        case 'premium':
        case 'enterprise':
            colors = {
                primary: '#FCD34D',   // amber-300 (brighter for dark mode)
                secondary: '#F59E0B', // amber-500
                glow: '0 0 12px rgba(252, 211, 77, 0.8), 0 0 24px rgba(245, 158, 11, 0.4)',
                checkColor: '#1F2937',
                label: 'Premium Verified'
            };
            break;
        default:
            return null;
    }

    return (
        <span
            className={`inline-flex items-center justify-center shrink-0 ${className}`}
            title={showTooltip ? colors.label : undefined}
            style={{
                filter: `drop-shadow(${colors.glow})`,
            }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label={colors.label}
            >
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id={`badge-grad-${tierLower}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={colors.primary} />
                        <stop offset="100%" stopColor={colors.secondary} />
                    </linearGradient>
                </defs>

                {/* Premium Badge Shape - Clean Circle with inner ring */}
                <circle
                    cx="12"
                    cy="12"
                    r="11"
                    fill={`url(#badge-grad-${tierLower})`}
                />

                {/* Inner highlight ring for depth */}
                <circle
                    cx="12"
                    cy="12"
                    r="9"
                    fill="none"
                    stroke={colors.primary}
                    strokeWidth="0.5"
                    opacity="0.5"
                />

                {/* Bold Checkmark - Thicker and more visible */}
                <path
                    d="M7 12.5L10.5 16L17 8"
                    stroke={colors.checkColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                />
            </svg>
        </span>
    );
}
