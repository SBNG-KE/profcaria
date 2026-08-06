"use client"

import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import ProfcariaLogo from '@/app/components/brand/ProfcariaLogo';

export default function HeroSection() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <section className={`relative min-h-[100vh] flex flex-col justify-center items-center text-center overflow-hidden`}>
            
            {/* Title Formation */}
            <div className="z-10 mt-12 mb-8">
                <motion.div
                    initial={{ letterSpacing: '40px', opacity: 0, filter: 'blur(20px)' }}
                    animate={{ letterSpacing: '8px', opacity: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 1.8, ease: "easeOut", delay: 0.2 }}
                    className={`text-5xl md:text-8xl lg:text-9xl
                        ${isDark ? 'text-white text-glow' : 'text-black'}`}
                >
                    <ProfcariaLogo markClassName="text-[var(--accent-primary)]" />
                </motion.div>
            </div>

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
                    <ChevronDown size={24} className="text-[var(--accent-primary)]" />
                </motion.div>
            </motion.div>

            {/* Glow Orbs background */}
            {isDark && (
                <>
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#738D7D]/10 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#143D33]/20 rounded-full blur-[120px] pointer-events-none" />
                </>
            )}
        </section>
    );
}
