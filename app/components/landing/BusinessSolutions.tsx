"use client"

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { ArrowRight, Globe, Zap, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

export default function BusinessSolutions({ onStart }: { onStart?: () => void }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <section className={`py-24 px-6 md:px-20 overflow-hidden relative ${isDark ? 'bg-black' : 'bg-white'}`}>
            <div className="max-w-[1400px] mx-auto">

                {/* HEADLINE - Grid Layout */}
                <div className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-8">
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

                    {/* Abstract "Global Network" Visualization - Replaced Images */}
                    <div className={`
                        relative w-full aspect-[16/10] rounded-[2rem] overflow-hidden shadow-2xl 
                        flex items-center justify-center border
                        ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}
                    `}>
                        {/* Background Grid */}
                        <div className={`absolute inset-0 opacity-[0.03] ${isDark ? 'bg-[url("/grid.svg")]' : 'bg-[url("/grid-dark.svg")]'}`} />

                        {/* Animated Nodes */}
                        <div className="relative w-full h-full">
                            {/* Central Hub */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-current opacity-20 animate-pulse" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-current opacity-10 animate-ping" />
                            <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 opacity-80" />

                            {/* Orbiting Satellite Nodes */}
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-current"
                                    style={{
                                        animation: `orbit-${i} ${10 + i * 2}s linear infinite`,
                                        opacity: 0.6
                                    }}
                                >
                                    {/* Connection Line */}
                                    <div className="absolute top-1/2 left-1/2 w-32 h-[1px] bg-current origin-left opacity-20 -rotate-45" />
                                </div>
                            ))}
                        </div>

                        <style jsx>{`
                            @keyframes orbit-0 { from { transform: rotate(0deg) translateX(100px) rotate(0deg); } to { transform: rotate(360deg) translateX(100px) rotate(-360deg); } }
                            @keyframes orbit-1 { from { transform: rotate(60deg) translateX(140px) rotate(-60deg); } to { transform: rotate(420deg) translateX(140px) rotate(-420deg); } }
                            @keyframes orbit-2 { from { transform: rotate(120deg) translateX(80px) rotate(-120deg); } to { transform: rotate(480deg) translateX(80px) rotate(-480deg); } }
                            @keyframes orbit-3 { from { transform: rotate(180deg) translateX(160px) rotate(-180deg); } to { transform: rotate(540deg) translateX(160px) rotate(-540deg); } }
                            @keyframes orbit-4 { from { transform: rotate(240deg) translateX(120px) rotate(-240deg); } to { transform: rotate(600deg) translateX(120px) rotate(-600deg); } }
                            @keyframes orbit-5 { from { transform: rotate(300deg) translateX(180px) rotate(-300deg); } to { transform: rotate(660deg) translateX(180px) rotate(-660deg); } }
                        `}</style>
                    </div>
                </div>

                {/* THE SYSTEM - List Flow ("Vibes" - Restored) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-40 items-start">

                    {/* Left: Narrative Focus & Visuals */}
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

                        {/* Left Side System Visual (Abstract System Stack - Animated) */}
                        <div className="mt-20 relative">
                            {/* Left: The Kinetic Core (Abstract Visualization) */}
                            <div className="relative h-[600px] hidden md:flex items-center justify-center">
                                {/* Central "Spine" */}
                                <div className={`absolute inset-y-0 left-1/2 w-[1px] -translate-x-1/2 ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`} />

                                <div className="w-full max-w-sm space-y-24 relative z-10">

                                    {/* Visual 1: The Scanner (Global Intelligence) */}
                                    <div className="relative group perspective-500">
                                        <div className={`h-24 w-full rounded-lg overflow-hidden border backdrop-blur-sm relative flex items-center justify-center ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white/80 border-neutral-200 shadow-sm'}`}>
                                            {/* Grid Background */}
                                            <div className={`absolute inset-0 bg-[size:20px_20px] opacity-20 ${isDark ? 'bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]' : 'bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)]'}`} />
                                            {/* Scanning Beam */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent w-full h-full -translate-x-full animate-[scan_3s_ease-in-out_infinite]" />
                                            {/* Target Lock */}
                                            <div className={`w-8 h-8 border rounded-sm flex items-center justify-center animate-[pulse-scale_2s_ease-in-out_infinite] ${isDark ? 'border-neutral-600' : 'border-neutral-400'}`}>
                                                <div className="w-1 h-1 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,1)]" />
                                            </div>
                                            <div className="absolute bottom-2 right-2 text-[10px] font-mono opacity-50">SCAN_ACTIVE</div>
                                        </div>
                                    </div>

                                    {/* Visual 2: The Fusion (Predictive Alignment) */}
                                    <div className="relative group">
                                        <div className={`h-24 w-full rounded-lg overflow-hidden border backdrop-blur-sm relative flex items-center justify-center gap-12 ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white/80 border-neutral-200 shadow-sm'}`}>
                                            {/* Left Circle */}
                                            <div className={`w-8 h-8 rounded-full border animate-[merge-left_3s_ease-in-out_infinite] ${isDark ? 'border-neutral-500' : 'border-neutral-400'}`} />
                                            {/* Right Circle */}
                                            <div className={`w-8 h-8 rounded-full border animate-[merge-right_3s_ease-in-out_infinite] ${isDark ? 'border-neutral-500' : 'border-neutral-400'}`} />
                                            {/* Center Impact - Overlapped */}
                                            <div className="absolute w-4 h-4 bg-amber-500 rounded-full blur-md opacity-0 animate-[flash-impact_3s_ease-in-out_infinite]" />
                                            <div className="absolute bottom-2 right-2 text-[10px] font-mono opacity-50">ALIGNMENT_LOCK</div>
                                        </div>
                                    </div>

                                    {/* Visual 3: The Beam (Direct Connection) */}
                                    <div className="relative group">
                                        <div className={`h-24 w-full rounded-lg overflow-hidden border backdrop-blur-sm relative flex items-center justify-center ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white/80 border-neutral-200 shadow-sm'}`}>
                                            <div className={`absolute inset-x-0 h-[1px] ${isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
                                            {/* The Energy Pulse - Shoots across */}
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] w-20 bg-gradient-to-r from-transparent via-amber-500 to-transparent animate-[shoot_1.5s_cubic-bezier(0.4,0,0.2,1)_infinite]" />
                                            <div className="absolute bottom-2 right-2 text-[10px] font-mono opacity-50">LATENCY_ZERO</div>
                                        </div>
                                    </div>

                                    {/* Visual 4: The Levitation (Zero Friction) */}
                                    <div className="relative group">
                                        <div className={`h-24 w-full rounded-lg overflow-hidden border backdrop-blur-sm relative flex items-center justify-center ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white/80 border-neutral-200 shadow-sm'}`}>
                                            {/* Base Shadow */}
                                            <div className="absolute bottom-6 w-8 h-1 bg-black/20 rounded-[100%] blur-sm animate-[shadow-scale_4s_ease-in-out_infinite]" />
                                            {/* Floating Orb */}
                                            <div className={`w-10 h-10 rounded-full border shadow-xl animate-[levitate_4s_ease-in-out_infinite] flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-neutral-800 to-black border-neutral-700' : 'bg-gradient-to-br from-neutral-100 to-white border-neutral-200'}`}>
                                                <div className="w-2 h-2 bg-amber-500/50 rounded-full blur-[1px]" />
                                            </div>
                                            <div className="absolute bottom-2 right-2 text-[10px] font-mono opacity-50">FRICTION_NULL</div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: The Vibes List (Typography & Motion - Numbered) */}
                    <div className="space-y-24">
                        {[
                            {
                                num: "01",
                                title: "Global Intelligence",
                                desc: "Access a live network of top-tier professionals. We evaluate career trajectory and proven impact, ensuring you connect with builders who deliver results."
                            },
                            {
                                num: "02",
                                title: "Predictive Alignment",
                                desc: "Beyond simple resumes, our system analyzes working styles and architectural fit, ensuring every match is calibrated for long-term synergy."
                            },
                            {
                                num: "03",
                                title: "Direct Connection",
                                desc: "No middlemen. No barriers. Connect directly with the talent you need and start building immediately."
                            },
                            {
                                num: "04",
                                title: "Zero Friction",
                                desc: "We handle the complexity of compliance and verification, so you can focus on what matters: the work."
                            }
                        ].map((item, i) => (
                            <div key={i} className="group cursor-default">
                                <div className={`text-xs font-bold mb-6 opacity-30 ${isDark ? 'text-white' : 'text-black'}`}>
                                    /{item.num}
                                </div>
                                <h3 className={`
                                        text-3xl md:text-5xl font-bold tracking-tighter mb-6 transition-transform duration-500 ease-out group-hover:translate-x-10 origin-left
                                        ${isDark ? 'text-white' : 'text-black'}
                                    `}>
                                    {item.title}
                                </h3>
                                <p className={`text-lg font-light leading-relaxed max-w-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
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
