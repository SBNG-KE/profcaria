"use client"

import React, { ReactNode, useRef, useEffect, useState } from 'react';
import { Cable, Users, MessageSquare, Share2, Plus, Zap } from 'lucide-react';

const ScrollableContainer = ({ children, className = "" }: { children: ReactNode, className?: string }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [showScrollbar, setShowScrollbar] = useState(false);

    const handleScroll = () => {
        const element = scrollRef.current;
        if (!element) return;
        const { scrollTop, scrollHeight, clientHeight } = element;
        if (scrollHeight <= clientHeight) {
            setShowScrollbar(false);
            return;
        }
        setShowScrollbar(true);
        const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
        setScrollProgress(scrollPercentage);
    };

    useEffect(() => {
        handleScroll();
        window.addEventListener('resize', handleScroll);
        return () => window.removeEventListener('resize', handleScroll);
    }, [children]);

    return (
        <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className={`flex-1 overflow-y-auto scrollbar-hide ${className}`}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {children}
            </div>
            {showScrollbar && (
                <div className="absolute right-1 top-2 bottom-2 w-1 pointer-events-none z-50">
                    <div
                        className="absolute right-0 w-full transition-all duration-75 ease-out flex flex-col gap-[2px] items-center"
                        style={{ top: `calc(${scrollProgress * 100}% - ${scrollProgress * 24}px)` }}
                    >
                        <div className="w-1 h-1 bg-slate-500/50 rounded-full shadow-sm"></div>
                        <div className="w-1 h-1 bg-slate-500/70 rounded-full shadow-sm"></div>
                        <div className="w-1 h-1 bg-slate-500/90 rounded-full shadow-sm"></div>
                        <div className="w-1 h-1 bg-slate-500/50 rounded-full shadow-sm"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function ConnectPage() {
    return (
        <ScrollableContainer className="p-8">
            <div className="relative z-10 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tight">Connect & Network</h1>
                        <p className="text-slate-400 mt-2">Grow your professional network and sync with industry leaders.</p>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95">
                        <Plus size={20} />
                        <span>New Connection</span>
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4 text-center">
                        <div className="mx-auto p-3 bg-emerald-500/20 text-emerald-400 w-fit rounded-xl">
                            <Users size={24} />
                        </div>
                        <h3 className="text-3xl font-black text-white">42</h3>
                        <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">Connections</p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4 text-center">
                        <div className="mx-auto p-3 bg-blue-500/20 text-blue-400 w-fit rounded-xl">
                            <MessageSquare size={24} />
                        </div>
                        <h3 className="text-3xl font-black text-white">12</h3>
                        <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">Unread Messages</p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4 text-center">
                        <div className="mx-auto p-3 bg-violet-500/20 text-violet-400 w-fit rounded-xl">
                            <Zap size={24} />
                        </div>
                        <h3 className="text-3xl font-black text-white">8</h3>
                        <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">Active Leads</p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4 text-center">
                        <div className="mx-auto p-3 bg-slate-700/20 text-slate-400 w-fit rounded-xl">
                            <Share2 size={24} />
                        </div>
                        <h3 className="text-3xl font-black text-white">5</h3>
                        <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">Referrals</p>
                    </div>
                </div>

                <div className="bg-[#0f172a] border border-slate-800 rounded-[40px] overflow-hidden">
                    <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Network Activity</h2>
                        <Cable className="text-slate-500" />
                    </div>
                    <div className="p-12 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Cable size={32} className="text-slate-600" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-300">No Recent Activity</h4>
                        <p className="text-slate-500 max-w-md mx-auto">Start connecting with others to see their updates and professional milestones here.</p>
                        <button className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-bold transition-all">Explore Network</button>
                    </div>
                </div>
            </div>
        </ScrollableContainer>
    );
}
