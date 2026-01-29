"use client"

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
// import GlobalSearch from '@/app/components/shared/GlobalSearch';
// import ThemeToggle from '@/app/components/ThemeToggle';
// import Link from 'next/link';

export default function PublicLayoutContent({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Force Light Mode for Public Scope to ensure consistency ('light' is the default expected state)
    React.useEffect(() => {
        document.documentElement.classList.remove('dark');
    }, []);

    return (
        <div className={`public-scope min-h-screen font-sans overflow-hidden transition-colors duration-300 ${isDark ? 'bg-black text-neutral-200 selection:bg-white/30' : 'bg-neutral-50 text-neutral-900 selection:bg-black/20'}`}>
            <main className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {children}
            </main>
        </div>
    );
}
