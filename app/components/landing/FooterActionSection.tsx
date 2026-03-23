"use client"

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';

export default function FooterActionSection({ onJoin, onContact }: { onJoin: () => void, onContact: () => void }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // The design draws immediately as you scroll into the section
    const arcLength = useTransform(scrollYProgress, [0.0, 0.5], [0, 1]);
    const buttonPointerEvents = useTransform(scrollYProgress, (latest) => latest < 0.5 ? "none" : "auto");

    // White for dark mode (blending with other sections), dark navy for light mode
    const primaryColor = isDark ? '#FFFFFF' : '#0A0F1A';

    return (
        <section ref={containerRef} className={`relative h-[110vh] flex flex-col justify-end items-center pb-8 ${isDark ? 'bg-[#0A0F1A]' : 'bg-white'} overflow-hidden`}>
            
            {/* The Sticky Container - Standardized centering */}
            <div className="sticky top-0 h-screen w-full relative overflow-hidden flex items-center justify-center">
                
                {/* RESTORED 224px S-CURVE SVG - Anchored perfectly in the center */}
                <div className="absolute top-1/2 inset-x-0 h-[600px] -translate-y-1/2 flex justify-center pointer-events-none z-10">
                    <svg width="2560" height="600" viewBox="0 0 2560 600" className="absolute top-0 pointer-events-none">
                        <defs>
                            <filter id="gold-glow-arcs" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {/* Top Left S-Curve: 224px radius restored */}
                        <motion.path 
                            d="M 1100 300 C 1200 300, 1168 188, 1280 188" 
                            fill="none" stroke={primaryColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" 
                            filter={isDark ? "url(#gold-glow-arcs)" : "none"}
                            style={{ pathLength: arcLength }} 
                        />
                        {/* Bottom Left S-Curve */}
                        <motion.path 
                            d="M 1100 300 C 1200 300, 1168 412, 1280 412" 
                            fill="none" stroke={primaryColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" 
                            filter={isDark ? "url(#gold-glow-arcs)" : "none"}
                            style={{ pathLength: arcLength }} 
                        />
                        
                        {/* Top Right S-Curve */}
                        <motion.path 
                            d="M 1460 300 C 1360 300, 1392 188, 1280 188" 
                            fill="none" stroke={primaryColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" 
                            filter={isDark ? "url(#gold-glow-arcs)" : "none"}
                            style={{ pathLength: arcLength }} 
                        />
                        {/* Bottom Right S-Curve */}
                        <motion.path 
                            d="M 1460 300 C 1360 300, 1392 412, 1280 412" 
                            fill="none" stroke={primaryColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" 
                            filter={isDark ? "url(#gold-glow-arcs)" : "none"}
                            style={{ pathLength: arcLength }} 
                        />
                    </svg>
                </div>

                {/* THE "KOMME I GANG" Internal Trigger locked perfectly in the center */}
                <motion.button
                    onClick={onJoin}
                    style={{ opacity: arcLength, pointerEvents: buttonPointerEvents }}
                    className="group absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[224px] h-[224px] rounded-full flex items-center justify-center cursor-pointer outline-none"
                >
                    <div 
                        className="absolute inset-0 rounded-full transition-opacity duration-300 opacity-[0.02] group-hover:opacity-[0.08] group-active:opacity-[0.15]"
                        style={{ backgroundColor: primaryColor }}
                    />

                    {/* Text with high contrast */}
                    <span 
                        style={{ 
                            color: primaryColor, 
                            textShadow: isDark ? '0 0 12px rgba(255,215,0,0.8)' : 'none' 
                        }}
                        className="font-black uppercase tracking-widest font-pixel text-lg md:text-xl text-center leading-snug transition-transform duration-200 group-active:scale-[0.80]"
                    >
                        Komme <br/> i gang
                    </span>
                </motion.button>

            </div>

            <div className="absolute bottom-6 w-full px-8 flex justify-between items-center z-30 pointer-events-auto">
                <div className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest font-pixel flex-1 text-left ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                    &copy; 2026 PROFCARIA
                </div>

                <div className="flex gap-8 sm:gap-12 items-center justify-center flex-1">
                    <a href="#" className={`transition-all hover:scale-110 flex items-center justify-center ${isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <title>X</title>
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                    </a>

                    <a href="#" className={`transition-all hover:scale-110 flex items-center justify-center ${isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <title>TikTok</title>
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                    </a>

                    <a href="#" className={`transition-all hover:scale-110 flex items-center justify-center ${isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'}`}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                            <title>Threads</title>
                            <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75-4.365-9.75-9.75-9.75zM12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12zM12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5zM12 13.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                        </svg>
                    </a>
                </div>

                <div className="flex-1 flex justify-end">
                    <button onClick={onContact} className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest font-pixel transition-colors hover:underline ${isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'}`}>
                        Contact Us
                    </button>
                </div>

            </div>
            
        </section>
    );
}
