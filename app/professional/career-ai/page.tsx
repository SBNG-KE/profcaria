"use client"

import React, { useState } from 'react';
import { Bot, GraduationCap, BarChart3 } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import AIChatTab from './tabs/AIChatTab';
import InterviewPrepTab from './tabs/InterviewPrepTab';
import SkillsGapTab from './tabs/SkillsGapTab';

export default function CareerAIGroupPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState<'chat' | 'interview' | 'skills'>('chat');

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Top Navigation */}
            <div className={`p-4 border-b shrink-0 flex items-center gap-3 overflow-x-auto ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'chat' ? (isDark ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-black text-white shadow-lg shadow-black/10') : isDark ? 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white' : 'bg-white border border-neutral-200 text-neutral-500 hover:text-black'}`}
                >
                    <Bot size={16} /> Career AI
                </button>
                <button
                    onClick={() => setActiveTab('interview')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'interview' ? (isDark ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-black text-white shadow-lg shadow-black/10') : isDark ? 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white' : 'bg-white border border-neutral-200 text-neutral-500 hover:text-black'}`}
                >
                    <GraduationCap size={16} /> Interview Prep
                </button>
                <button
                    onClick={() => setActiveTab('skills')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'skills' ? (isDark ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-black text-white shadow-lg shadow-black/10') : isDark ? 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white' : 'bg-white border border-neutral-200 text-neutral-500 hover:text-black'}`}
                >
                    <BarChart3 size={16} /> Skills Gap
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden bg-transparent">
                {activeTab === 'chat' ? (
                    <div className="absolute inset-0">
                        <AIChatTab />
                    </div>
                ) : (
                    <div className="absolute inset-0 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {activeTab === 'interview' && <InterviewPrepTab />}
                        {activeTab === 'skills' && <SkillsGapTab />}
                    </div>
                )}
            </div>
        </div>
    );
}
