"use client"

import React, { useState } from 'react';
import { Shield, BadgeCheck, Trophy } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import VaultTab from './tabs/VaultTab';
import VerificationTab from './tabs/VerificationTab';
import CareerScoreTab from './tabs/CareerScoreTab';

export default function VaultGroupPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState<'vault' | 'verification' | 'score'>('vault');

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Top Navigation */}
            <div className={`p-4 border-b shrink-0 flex items-center gap-3 overflow-x-auto ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <button
                    onClick={() => setActiveTab('vault')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'vault' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20' : isDark ? 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white' : 'bg-white border border-neutral-200 text-neutral-500 hover:text-black'}`}
                >
                    <Shield size={16} /> Career Vault
                </button>
                <button
                    onClick={() => setActiveTab('verification')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'verification' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : isDark ? 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white' : 'bg-white border border-neutral-200 text-neutral-500 hover:text-black'}`}
                >
                    <BadgeCheck size={16} /> Verification
                </button>
                <button
                    onClick={() => setActiveTab('score')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'score' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : isDark ? 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white' : 'bg-white border border-neutral-200 text-neutral-500 hover:text-black'}`}
                >
                    <Trophy size={16} /> Career Score
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden bg-transparent">
                <div className="absolute inset-0 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {activeTab === 'vault' && <VaultTab />}
                    {activeTab === 'verification' && <VerificationTab />}
                    {activeTab === 'score' && <CareerScoreTab />}
                </div>
            </div>
        </div>
    );
}
