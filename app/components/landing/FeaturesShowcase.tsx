"use client"

import React from 'react';
import { Palette, Layers, Smartphone, Sparkles, ArrowRight } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

export default function FeaturesShowcase() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <section className={`py-40 px-6 md:px-20 overflow-hidden ${isDark ? 'bg-black' : 'bg-white'}`}>
            <div className="max-w-[1400px] mx-auto">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-end">

                    {/* Left: Manifesto */}
                    <div className="lg:col-span-7 space-y-12">
                        <div className={`text-xs font-bold uppercase tracking-[0.3em] pl-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            The Philosophy
                        </div>

                        <h2 className={`text-6xl md:text-8xl font-serif italic tracking-tight leading-[0.9] ${isDark ? 'text-white' : 'text-black'}`}>
                            Connect with <br />
                            <span className="not-italic font-sans font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-600">Visionaries.</span>
                        </h2>

                        <div className="space-y-8 max-w-2xl">
                            <p className={`text-2xl md:text-3xl font-light leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                We’re building a sanctuary for the world's most dedicated professionals. A space where craft is respected, and connections are curated.
                            </p>
                            <p className={`text-lg font-light leading-relaxed ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                                No noise. No recruiters spamming generic roles. Just a direct line to the people building the future.
                            </p>
                        </div>

                        {/* Vibes Indicators */}
                        <div className="pt-10 flex gap-12">
                            {[
                                { val: "50+", label: "Countries" },
                                { val: "10k+", label: "Verified Pros" },
                                { val: "0%", label: "Noise" },
                            ].map((stat, i) => (
                                <div key={i}>
                                    <div className={`text-4xl md:text-5xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{stat.val}</div>
                                    <div className={`text-xs uppercase tracking-widest mt-2 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Abstract Visual */}
                    <div className="lg:col-span-5 relative h-[600px] flex items-center justify-center">
                        {/* Abstract Shapes - No "UI Cards" */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-80">
                            {/* Circle 1 */}
                            <div className="w-96 h-96 rounded-full border-[1px] border-amber-500/20 animate-[spin_20s_linear_infinite]" />
                            {/* Circle 2 */}
                            <div className="absolute w-[500px] h-[500px] rounded-full border-[1px] border-amber-500/10 animate-[spin_30s_linear_infinite_reverse]" />
                            {/* Gradient Center */}
                            <div className="absolute w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
                        </div>

                        {/* Floating Word Cloud / Concepts */}
                        <div className="relative z-10 text-center space-y-8">
                            {["Designers", "Engineers", "Founders", "Architects"].map((role, i) => (
                                <div key={i} className={`
                                    text-2xl font-light tracking-widest uppercase
                                    ${isDark ? 'text-white' : 'text-black'}
                                    opacity-${100 - (i * 20)}
                                 `}>
                                    {role}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
