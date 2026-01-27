"use client"

import React from 'react';
import { User, Building2 } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface DefaultLogoProps {
    type?: 'user' | 'company' | 'employer' | 'professional';
    name?: string;
    size?: number; // Size in pixels for the icon/text scaling
    className?: string; // Container classes (should likely include w- and h-)
}

export default function DefaultLogo({ type = 'user', name, size = 24, className = '' }: DefaultLogoProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Normalize type to just user (default) or company
    const normalizedType = (type === 'company' || type === 'employer') ? 'company' : 'user';

    return (
        <div className={`flex items-center justify-center overflow-hidden ${className} ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}>
            {normalizedType === 'company' ? <Building2 size={size * 0.6} /> : <User size={size * 0.6} />}
        </div>
    );
}
