"use client"

import React, { useRef, useState, useEffect } from 'react';
import { ArrowRight, Globe, Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

export default function BusinessSolutions({ onStart }: { onStart?: () => void }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <section className={`py-32 px-6 md:px-20 overflow-hidden relative ${isDark ? 'bg-black' : 'bg-white'}`}>
            <div className="max-w-[1400px] mx-auto">

                {/* HEADLINE - Massive & Fluid */}
                <div className="mb-32 space-y-8">
                    <h2 className={`
                        text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85]
                        ${isDark ? 'text-white' : 'text-black'}
                    `}>
                        SCALE <br />
                        WITHOUT <br />
                        <span className="opacity-30">LIMITS.</span>
                    </h2>
                    <p className={`text-2xl md:text-3xl font-light max-w-2xl leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        The professional landscape is evolving. We provide the infrastructure for the next generation of global teams.
                    </p>
                </div>

                {/* THE SYSTEM - List Flow ("Vibes" - No Cards) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-40 items-start">

                    {/* Left: Narrative Focus */}
                    <div className="space-y-12 sticky top-32">
                        <div className="space-y-4">
                            <div className="h-1 w-20 bg-current opacity-50" />
                            <h3 className="text-4xl font-bold tracking-tight uppercase">The Ecosystem</h3>
                        </div>
                        <p className={`text-xl leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            We don't just connect you with people. We connect you with verified, intelligent professionals who are ready to make an impact. Our system handles the complexity so you can focus on the culture.
                        </p>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={onStart}
                                className={`
                                group flex items-center gap-4 px-8 py-4 rounded-full text-lg font-bold uppercase tracking-widest transition-all
                                ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}
                            `}>
                                Start Building <ArrowRight className="transition-transform group-hover:translate-x-1" />
                            </button>
                            <span className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                For Forward Thinkers
                            </span>
                        </div>
                    </div>

                    {/* Right: The Vibes List (Typography & Icons) */}
                    <div className="space-y-24">
                        {[
                            {
                                num: "01",
                                title: "Global Intelligence",
                                desc: "Access a live network of top-tier professionals. We evaluate career trajectory and proven impact, ensuring you connect with builders who deliver results.",
                                icon: Globe
                            },
                            {
                                num: "02",
                                title: "Instant Verification",
                                desc: "Gone are the days of waiting weeks for background checks. Our automated verification engine ensures every professional is pre-vetted and ready to deploy.",
                                icon: Zap
                            },
                            {
                                num: "03",
                                title: "Unified Standards",
                                desc: "Every professional profile is standardized and deep-vetted, allowing you to compare talent apples-to-apples without the guesswork.",
                                icon: ShieldCheck
                            },
                            {
                                num: "04",
                                title: "Team Synergy",
                                desc: "Beyond skills, we analyze working styles and values to ensure every new addition amplifies your team's existing dynamic.",
                                icon: CheckCircle2
                            }
                        ].map((item, i) => (
                            <div key={i} className="group">
                                <div className={`text-xs font-mono mb-4 opacity-50 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                    /{item.num}
                                </div>
                                <h3 className={`text-4xl md:text-5xl font-bold tracking-tighter mb-6 group-hover:translate-x-4 transition-transform duration-500 ease-out ${isDark ? 'text-white' : 'text-black'}`}>
                                    {item.title}
                                </h3>
                                <p className={`text-lg md:text-xl font-light leading-relaxed max-w-md ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}
