"use client"

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/app/context/ThemeContext';
import ThemeToggle from '@/app/components/ThemeToggle';
import OndwiraLogo from '@/app/components/brand/OndwiraLogo';

export default function CareersLayout({ children }: { children: React.ReactNode }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={`min-h-screen ${isDark ? 'bg-black text-white' : 'bg-neutral-50 text-black'}`}>
            {/* Minimal Header */}
            <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDark ? 'bg-black/80 border-neutral-800' : 'bg-white/80 border-neutral-200'}`}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <OndwiraLogo className="text-lg" markClassName="text-[var(--accent-primary)]" />
                    </Link>
                    <ThemeToggle theme={theme} onToggle={toggleTheme} />
                </div>
            </header>

            {/* Content */}
            <main>
                {children}
            </main>

            {/* Footer */}
            <footer className={`border-t py-8 mt-16 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
                    <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        Powered by Ondwira
                    </p>
                </div>
            </footer>
        </div>
    );
}
