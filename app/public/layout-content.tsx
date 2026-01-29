"use client"

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
// import GlobalSearch from '@/app/components/shared/GlobalSearch';
// import ThemeToggle from '@/app/components/ThemeToggle';
// import Link from 'next/link';

export default function PublicLayoutContent({ children }: { children: React.ReactNode }) {
    return (
        <div className="public-scope min-h-screen font-sans overflow-hidden transition-colors duration-300 bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-200 selection:bg-black/20 dark:selection:bg-white/30">
            <main className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {children}
            </main>
        </div>
    );
}
