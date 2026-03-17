"use client"

import React, { useState } from 'react';
import { Bot, GraduationCap, BarChart3, Lock } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import AIChatTab from './tabs/AIChatTab';
import InterviewPrepTab from './tabs/InterviewPrepTab';
import SkillsGapTab from './tabs/SkillsGapTab';

export default function CareerAIGroupPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState<'chat' | 'interview' | 'skills'>('chat');
    
    // AI Model Selection State
    const [selectedModel, setSelectedModel] = useState('gemini-1.5-pro');
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

    const models = [
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', badge: 'Standard' },
        { id: 'gpt-4o', name: 'GPT-4o', badge: 'Plus/Pro' },
        { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', badge: 'Pro' }
    ];

    React.useEffect(() => {
        const saved = localStorage.getItem('profcaria_ai_model');
        if (saved) setSelectedModel(saved);
    }, []);

    // Assuming user is on Free plan for UI purposes
    const isPremium = false; 

    const handleModelChange = (id: string, badge: string) => {
        if (!isPremium && badge !== 'Standard') {
            // In a real app, this would open an upgrade modal
            alert('This model requires a Plus or Pro subscription. Please upgrade in Settings > Billing.');
            return;
        }
        setSelectedModel(id);
        localStorage.setItem('profcaria_ai_model', id);
        setIsModelDropdownOpen(false);
    };

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

                {/* AI Model Dropdown */}
                <div className="ml-auto relative">
                    <button
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${isDark ? 'bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800' : 'bg-white border-neutral-200 text-black hover:bg-neutral-50'}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${selectedModel === 'gemini-1.5-pro' ? 'bg-[#3B5998]' : 'bg-yellow-500'}`} />
                        {models.find(m => m.id === selectedModel)?.name || 'Select Model'}
                    </button>

                    {isModelDropdownOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsModelDropdownOpen(false)} />
                            <div className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                <div className={`px-4 py-3 border-b text-xs font-black uppercase tracking-widest ${isDark ? 'border-neutral-800 text-neutral-500' : 'border-neutral-200 text-neutral-400'}`}>
                                    Select AI Model
                                </div>
                                <div className="p-1">
                                    {models.map(model => {
                                        const isLocked = !isPremium && model.badge !== 'Standard';
                                        return (
                                            <button
                                                key={model.id}
                                                onClick={() => handleModelChange(model.id, model.badge)}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left transition-all ${isLocked ? 'opacity-50 cursor-not-allowed' : ''} ${selectedModel === model.id ? (isDark ? 'bg-neutral-800 text-white font-bold' : 'bg-neutral-100 text-black font-bold') : (isDark ? 'text-neutral-400 hover:bg-neutral-800/50 hover:text-white' : 'text-neutral-600 hover:bg-neutral-50 hover:text-black')}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span>{model.name}</span>
                                                    {isLocked && <Lock size={14} className="text-neutral-500" />}
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${model.badge === 'Standard' ? (isDark ? 'bg-[#3B5998]/20 text-[#6B8CD5]' : 'bg-[#3B5998]/10 text-[#3B5998]') : (isDark ? 'bg-yellow-500/10 text-yellow-500' : 'bg-yellow-50 text-yellow-600')}`}>
                                                    {model.badge}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
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
