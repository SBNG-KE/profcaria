"use client"

import React from 'react';
import { Palette, Layers, Smartphone, Sparkles, ArrowRight } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

export default function FeaturesShowcase() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <section className={`py-0 pt-12 px-6 md:px-20 overflow-hidden ${isDark ? 'bg-[#0A0F1A]' : 'bg-white'}`}>
            <div className="max-w-[1400px] mx-auto">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-end">

                    {/* Left: Manifesto */}
                    <div className="lg:col-span-7 space-y-12">
                        <div className={`text-xs font-bold uppercase tracking-[0.3em] pl-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            The Philosophy
                        </div>

                        <h2 className={`text-4xl md:text-6xl lg:text-7xl font-serif italic tracking-tight leading-[0.9] ${isDark ? 'text-white' : 'text-[#0A0F1A]'}`}>
                            Navigated by <br />
                            <span className="not-italic font-sans font-black text-transparent bg-clip-text bg-gradient-to-r from-[#3B5998] to-[#1B2A4A] font-pixel">Intelligence.</span>
                        </h2>

                        <div className="space-y-8 max-w-2xl">
                            <p className={`text-xl md:text-2xl font-light leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                The 90s gave us digital job boards. The 2000s gave us noisy, disconnected networks. Today demands <span className={`font-bold ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>an all-in-one ecosystem</span>.
                            </p>
                            <p className={`text-lg font-light leading-relaxed ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                                We replaced infinite scrolling and generic recruiter spam with a unified platform. Chat with friends, build communities in groups, prove your skills with Verified Evidence, and let context-aware AI agents connect you with the companies building the future.
                            </p>
                        </div>


                    </div>

                    {/* Right: Abstract Visual */}
                    <div className="lg:col-span-5 relative h-[600px] flex items-center justify-center">
                        {/* Abstract Shapes - Animated Background */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-100">
                            {/* Circle 1 - Inner Ring with Marker */}
                            <div
                                className="relative w-96 h-96 rounded-full border-[2px] border-[#3B5998]/40"
                                style={{ animation: 'spin-slow 20s linear infinite' }}
                            >
                                <div className="absolute -top-1.5 left-1/2 w-3 h-3 bg-[#3B5998] rounded-full shadow-[0_0_10px_rgba(59,89,152,0.5)]" />
                            </div>

                            {/* Circle 2 - Outer Ring with Marker */}
                            <div
                                className="absolute w-[500px] h-[500px] rounded-full border-[1px] border-[#3B5998]/30"
                                style={{ animation: 'spin-slow 30s linear infinite reverse' }}
                            >
                                <div className="absolute top-1/2 -right-1.5 w-3 h-3 bg-[#3B5998]/50 rounded-full" />
                            </div>

                            {/* Gradient Center - Enhanced Glow */}
                            <div className="absolute w-64 h-64 bg-[#3B5998]/10 rounded-full blur-3xl animate-pulse" />
                            <div className="absolute w-48 h-48 bg-[#3B5998]/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
                        </div>

                        {/* Vertical Roles Stack (Static Text, Fits in Circle) */}
                        <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-6">
                            {["Designers", "Engineers", "Founders", "Innovators"].map((role, i) => (
                                <div key={i} className={`
                                    text-2xl md:text-3xl font-light tracking-[0.2em] uppercase transition-all duration-500 cursor-default font-pixel
                                    ${isDark ? 'text-white' : 'text-[#0A0F1A]'}
                                    hover:scale-110 hover:text-[#3B5998] hover:text-glow-navy
                                 `}>
                                    {role}
                                </div>
                            ))}
                        </div>

                        <style jsx>{`
                            @keyframes spin-slow {
                                from { transform: rotate(0deg); }
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                    </div>

                </div>
            </div>
        </section>
    );
}
