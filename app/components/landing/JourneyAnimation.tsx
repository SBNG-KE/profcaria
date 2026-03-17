"use client";

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { NotebookPen, Monitor, User } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

export default function JourneyAnimation() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Path configuration for zigzag
    // M = Move to (x, y)
    // L = Line to (x, y)
    const pathVariants: Variants = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: {
            pathLength: 1,
            opacity: 1,
            transition: {
                duration: 3,
                ease: "linear",
                repeat: Infinity,
                repeatType: "loop",
                repeatDelay: 1
            }
        }
    };

    const iconVariants: Variants = {
        hidden: { scale: 0, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: { duration: 0.5, ease: "backOut" }
        }
    };

    return (
        <div className="w-full h-full relative flex items-center justify-center pointer-events-none">
            <svg
                viewBox="0 0 600 600"
                className="w-full h-full absolute inset-0"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={isDark ? '#3B5998' : '#1B2A4A'} stopOpacity="0.1" />
                        <stop offset="40%" stopColor={isDark ? '#3B5998' : '#1B2A4A'} stopOpacity="0.4" />
                        <stop offset="60%" stopColor={isDark ? '#3B5998' : '#1B2A4A'} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={isDark ? '#3B5998' : '#1B2A4A'} stopOpacity="0.1" />
                    </linearGradient>
                </defs>

                <motion.path
                    d="M 50,300 L 150,100 L 300,500 L 450,100 L 550,300"
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="15 15"
                    variants={pathVariants}
                    initial="hidden"
                    animate="visible"
                />
                <motion.circle
                    r="8"
                    fill={isDark ? '#ffffff' : '#0A0F1A'}
                    initial={{ offsetDistance: "0%" }}
                    animate={{
                        offsetDistance: "100%",
                        opacity: [0, 1, 1, 1, 0]
                    }}
                    transition={{
                        duration: 3,
                        ease: "linear",
                        repeat: Infinity,
                        repeatDelay: 1
                    }}
                    style={{
                        offsetPath: "path('M 50,300 L 150,100 L 300,500 L 450,100 L 550,300')",
                    }}
                />
            </svg>

            {/* Start Icon: Notepad & Pen */}
            <motion.div
                className={`absolute left-[5%] top-1/2 -translate-y-1/2 p-6 rounded-3xl shadow-2xl backdrop-blur-sm border-2 ${isDark ? 'bg-[#0A0F1A]/60 border-[#3B5998]/40 text-[#3B5998]' : 'bg-white/90 border-[#1B2A4A]/30 text-[#1B2A4A]'
                    }`}
                variants={iconVariants}
                initial="hidden"
                animate="visible"
            >
                <NotebookPen size={48} strokeWidth={1.5} />
            </motion.div>

            {/* End Icon: Person at Desk (User + Monitor) */}
            <motion.div
                className={`absolute right-[5%] top-1/2 -translate-y-1/2 p-6 rounded-3xl shadow-2xl backdrop-blur-sm border-2 ${isDark ? 'bg-[#0A0F1A]/60 border-[#3B5998]/40 text-[#3B5998]' : 'bg-white/90 border-[#1B2A4A]/30 text-[#1B2A4A]'
                    }`}
                variants={iconVariants}
                initial="hidden"
                animate={{
                    ...iconVariants.visible,
                    transition: { delay: 2, duration: 0.5, ease: "backOut" }
                }}
            >
                <div className="relative">
                    <Monitor size={48} strokeWidth={1.5} />
                    <User
                        size={28}
                        strokeWidth={2}
                        className={`absolute -bottom-1 -right-1 fill-current ${isDark ? 'text-white' : 'text-[#0A0F1A]'}`}
                    />
                    {/* Hired Pop-up */}
                    <motion.div
                        className={`absolute -top-8 -right-8 px-3 py-1 rounded-lg font-black text-sm rotate-12 shadow-lg ${isDark ? 'bg-[#3B5998] text-white' : 'bg-[#1B2A4A] text-white'
                            }`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            scale: [0, 0, 1, 1, 0],
                            opacity: [0, 0, 1, 1, 0]
                        }}
                        transition={{
                            duration: 4,
                            times: [0, 0.72, 0.75, 0.9, 1],
                            ease: "linear",
                            repeat: Infinity,
                        }}
                    >
                        HIRED!
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
