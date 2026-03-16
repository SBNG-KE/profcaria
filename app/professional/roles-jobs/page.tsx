"use client"

import React, { useState } from 'react';
import { Briefcase, Cable, Sparkles } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import RolesTab from './tabs/RolesTab';
import EmploymentTab from './tabs/EmploymentTab';
import InvitesTab from './tabs/InvitesTab';

export default function MyJobsPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState<'roles' | 'employment' | 'invites'>('roles');

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Top Navigation */}
            <div className={`p-4 border-b shrink-0 flex items-center gap-3 overflow-x-auto ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <button
                    onClick={() => setActiveTab('roles')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'roles' ? (isDark ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-black text-white shadow-lg shadow-black/10') : isDark ? 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white' : 'bg-white border border-neutral-200 text-neutral-500 hover:text-black'}`}
                >
                    <Briefcase size={16} /> My Jobs
                </button>
                <button
                    onClick={() => setActiveTab('employment')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'employment' ? (isDark ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-black text-white shadow-lg shadow-black/10') : isDark ? 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white' : 'bg-white border border-neutral-200 text-neutral-500 hover:text-black'}`}
                >
                    <Cable size={16} /> Employment
                </button>
                <button
                    onClick={() => setActiveTab('invites')}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'invites' ? (isDark ? 'bg-white text-black shadow-lg shadow-white/10' : 'bg-black text-white shadow-lg shadow-black/10') : isDark ? 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white' : 'bg-white border border-neutral-200 text-neutral-500 hover:text-black'}`}
                >
                    <Sparkles size={16} /> Job Invites
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative overflow-hidden bg-transparent">
                <div className="absolute inset-0 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {activeTab === 'roles' && <RolesTab />}
                    {activeTab === 'employment' && <EmploymentTab />}
                    {activeTab === 'invites' && <InvitesTab />}
                </div>
            </div>
        </div>
    );
}
