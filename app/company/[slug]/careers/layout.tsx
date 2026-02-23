"use client"

import React from 'react';
import Link from 'next/link';
import { useTheme } from '@/app/context/ThemeContext';

export default function CareersLayout({ children }: { children: React.ReactNode }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={`min-h-screen ${isDark ? 'bg-black text-white' : 'bg-neutral-50 text-black'}`}>
            {/* Minimal Header */}
            <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDark ? 'bg-black/80 border-neutral-800' : 'bg-white/80 border-neutral-200'}`}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                            P
                        </div>
                        <span className="font-black text-sm tracking-tight hidden sm:inline">PROFCARIA</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/professional/login"
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-500 hover:text-black hover:bg-neutral-100'}`}
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/professional/signup"
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                        >
                            Join Free
                        </Link>
                    </div>
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
                        Powered by <Link href="/" className="hover:underline">Profcaria</Link> — The Professional Network
                    </p>
                </div>
            </footer>
        </div>
    );
}
