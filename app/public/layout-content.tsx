"use client"

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import GlobalSearch from '@/app/components/shared/GlobalSearch';
import ThemeToggle from '@/app/components/ThemeToggle';
import Link from 'next/link';
// import AlertsSidebar from '@/app/components/professional/AlertsSidebar'; // Optional for public? Probably not needed or needs different version.

export default function PublicLayoutContent({ children }: { children: React.ReactNode }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    // Sync HTML class (Force fix for mismatched SSR/CSR state)
    React.useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    return (
        <div className={`public-scope min-h-screen font-sans overflow-hidden transition-colors duration-300 ${isDark ? 'bg-black text-neutral-200 selection:bg-white/30' : 'bg-neutral-50 text-neutral-900 selection:bg-black/20'}`}>

            {/* Top Bar (Simplified for Public) */}
            <div className={`w-full px-4 py-3 z-50 shrink-0 flex items-center justify-between border-b ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                <div className="flex items-center gap-3">
                    <Link href="/" className="font-bold text-lg">Profcaria</Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/login" className={`font-medium text-sm hover:underline ${isDark ? 'text-white' : 'text-black'}`}>Login</Link>
                    <GlobalSearch />
                    <ThemeToggle theme={theme} onToggle={toggleTheme} />
                </div>
            </div>

            <main className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {children}
            </main>
        </div>
    );
}
