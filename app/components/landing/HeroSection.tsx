"use client"

import React from 'react';
import Image from 'next/image';
import { useTheme } from '@/app/context/ThemeContext';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <section className={`relative min-h-[100vh] flex flex-col justify-center items-center text-center overflow-hidden`}>
            
            {/* Title Formation */}
            <div className="z-10 mt-12 mb-8">
                <motion.h1 
                    initial={{ letterSpacing: '40px', opacity: 0, filter: 'blur(20px)' }}
                    animate={{ letterSpacing: '8px', opacity: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 1.8, ease: "easeOut", delay: 0.2 }}
                    className={`text-5xl md:text-8xl lg:text-9xl font-black uppercase tracking-widest font-pixel 
                        ${isDark ? 'text-white text-glow' : 'text-black'}`}
                >
                    PROFCARIA
                </motion.h1>
            </div>

            {/* Circular Logo Formation */}
            <motion.div
                initial={{ scale: 0, opacity: 0, rotate: -180 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ duration: 1.2, ease: "circOut", delay: 1.5 }}
                className={`relative p-[1px] rounded-full overflow-hidden ${isDark ? 'shadow-[0_0_40px_rgba(59,89,152,0.4)]' : 'shadow-2xl'}`}
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-[#3B5998] to-transparent animate-spin-slow" />
                <div className={`relative rounded-full p-2 ${isDark ? 'bg-[#0A0F1A]' : 'bg-white'}`}>
                    <Image
                        src="/profcaria.png"
                        alt="Profcaria Logo"
                        width={64}
                        height={64}
                        className="rounded-full w-12 h-12 md:w-16 md:h-16 border"
                    />
                </div>
            </motion.div>

            {/* Downward Arrow */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 2.5 }}
                className="absolute bottom-12 flex flex-col items-center gap-2"
            >
                <span className={`text-[10px] uppercase tracking-[0.3em] font-pixel ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    Initialize Scan
                </span>
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    <ChevronDown size={24} className={isDark ? 'text-[#3B5998]' : 'text-black'} />
                </motion.div>
            </motion.div>

            {/* Glow Orbs background */}
            {isDark && (
                <>
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#3B5998]/10 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#1B2A4A]/20 rounded-full blur-[120px] pointer-events-none" />
                </>
            )}
        </section>
    );
}
