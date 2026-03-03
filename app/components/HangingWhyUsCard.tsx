"use client"

import React, { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { X, Shield, Zap, Users, Target } from 'lucide-react';

export default function HangingWhyUsCard({
    isOpen,
    onClose
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Prevent scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        } else {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        }
        return () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Overlay Scroll Container */}
            <div className="fixed inset-0 overflow-y-auto custom-scrollbar" data-lenis-prevent="true">
                <div className="flex min-h-full items-start justify-center p-4 md:p-8 text-left">
                    {/* CARD - Enhanced Glassmorphism */}
                    <div
                        className={`
                            relative w-full max-w-[800px] mx-auto
                            rounded-[2rem] p-6 md:p-8 pb-10 md:pb-12
                            transform transition-all duration-500 origin-top
                    ${isDark
                                ? 'glass-card border-neutral-700/50 glow-white text-white'
                                : 'glass-card-light border-neutral-200 text-black'}
                `}
                        style={{
                            animation: 'swing 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className={`
                        absolute top-6 right-6 p-2 rounded-full transition-all duration-300
                        ${isDark ? 'bg-neutral-900 hover:bg-neutral-800 text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-black'}
                    `}
                        >
                            <X size={18} className="font-black" />
                        </button>

                        {/* Content */}
                        <div className="mt-4 md:mt-6 space-y-12">
                            {/* Header with mixed fonts */}
                            <div className="text-center">
                                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none mb-4">
                                    Why <br className="md:hidden" />
                                    <span className="font-pixel text-amber-500 md:ml-4 text-3xl md:text-5xl">Choose Us</span>
                                </h2>
                                <div className={`w-16 h-1 mt-6 mx-auto ${isDark ? 'bg-white' : 'bg-black'}`}></div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                                <div className="space-y-4 group">
                                    <h3 className="text-2xl font-black flex items-center gap-3 uppercase tracking-wide">
                                        <div className={`p-2.5 rounded-2xl ${isDark ? 'bg-neutral-900 group-hover:bg-amber-500/10' : 'bg-neutral-100 group-hover:bg-amber-500/10'} transition-colors`}>
                                            <Shield className={`transition-colors w-6 h-6 ${isDark ? 'text-white group-hover:text-amber-500' : 'text-black group-hover:text-amber-500'}`} />
                                        </div>
                                        <span className="font-sans text-lg md:text-xl">Security First.</span>
                                    </h3>
                                    <p className={`${isDark ? 'text-neutral-400' : 'text-neutral-600'} leading-relaxed font-medium text-sm md:text-base`}>
                                        Built for the modern era with enterprise-grade security. <span className="font-pixel text-[11px] uppercase tracking-widest text-[#d87a16]">Ad-free. Private.</span> Focused entirely on connecting verified professionals with real opportunities, not selling your data.
                                    </p>
                                </div>

                                <div className="space-y-4 group">
                                    <h3 className="text-2xl font-black flex items-center gap-3 uppercase tracking-wide">
                                        <div className={`p-2.5 rounded-2xl ${isDark ? 'bg-neutral-900 group-hover:bg-blue-500/10' : 'bg-neutral-100 group-hover:bg-blue-500/10'} transition-colors`}>
                                            <Zap className={`transition-colors w-6 h-6 ${isDark ? 'text-white group-hover:text-blue-500' : 'text-black group-hover:text-blue-500'}`} />
                                        </div>
                                        <span className="font-sans text-lg md:text-xl">AI Matches.</span>
                                    </h3>
                                    <p className={`${isDark ? 'text-neutral-400' : 'text-neutral-600'} leading-relaxed font-medium text-sm md:text-base`}>
                                        Stop scrolling and let specialized agents work for you. Our ecosystem uses context-aware AI to evaluate skills gaps, prep you for interviews, and pair talent with employers. <span className="font-pixel text-[11px] uppercase tracking-widest text-[#d87a16]">Smart. Precise.</span>
                                    </p>
                                </div>

                                <div className="space-y-4 group">
                                    <h3 className="text-2xl font-black flex items-center gap-3 uppercase tracking-wide">
                                        <div className={`p-2.5 rounded-2xl ${isDark ? 'bg-neutral-900 group-hover:bg-emerald-500/10' : 'bg-neutral-100 group-hover:bg-emerald-500/10'} transition-colors`}>
                                            <Users className={`transition-colors w-6 h-6 ${isDark ? 'text-white group-hover:text-emerald-500' : 'text-black group-hover:text-emerald-500'}`} />
                                        </div>
                                        <span className="font-sans text-lg md:text-xl">Real Talent.</span>
                                    </h3>
                                    <p className={`${isDark ? 'text-neutral-400' : 'text-neutral-600'} leading-relaxed font-medium text-sm md:text-base`}>
                                        We verify employment history directly with employers, eliminating fake profiles and ensuring our AI agents are matching you with <span className="font-pixel text-[11px] uppercase tracking-widest text-[#d87a16]">verified experts.</span>
                                    </p>
                                </div>

                                <div className="space-y-4 group">
                                    <h3 className="text-2xl font-black flex items-center gap-3 uppercase tracking-wide">
                                        <div className={`p-2.5 rounded-2xl ${isDark ? 'bg-neutral-900 group-hover:bg-purple-500/10' : 'bg-neutral-100 group-hover:bg-purple-500/10'} transition-colors`}>
                                            <Target className={`transition-colors w-6 h-6 ${isDark ? 'text-white group-hover:text-purple-500' : 'text-black group-hover:text-purple-500'}`} />
                                        </div>
                                        <span className="font-sans text-lg md:text-xl">Ecosystem.</span>
                                    </h3>
                                    <p className={`${isDark ? 'text-neutral-400' : 'text-neutral-600'} leading-relaxed font-medium text-sm md:text-base`}>
                                        A complete AI Career Operating System. No timeline clutter, just specialized agents accelerating your professional networking, learning, and <span className="font-pixel text-[11px] uppercase tracking-widest text-[#d87a16]">job discovery.</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
