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
    // We'll use percentage-based coordinates for responsiveness if possible, or SVG viewBox
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

    // popupVariants removed in favor of direct keyframe animation for tighter sync

    return (
        <div className="w-full h-full relative flex items-center justify-center pointer-events-none">
            <svg
                viewBox="0 0 600 600"
                className="w-full h-full absolute inset-0"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Defs for gradient */}
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={isDark ? '#3b82f6' : '#2563eb'} stopOpacity="0.1" />
                        <stop offset="40%" stopColor={isDark ? '#3b82f6' : '#2563eb'} stopOpacity="0.4" />
                        <stop offset="60%" stopColor={isDark ? '#eab308' : '#ca8a04'} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={isDark ? '#eab308' : '#ca8a04'} stopOpacity="0.1" />
                    </linearGradient>
                </defs>

                {/* DESKTOP ANIMATION (Zig Zag) - Hidden on mobile */}
                <g className="hidden md:block">
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
                        fill={isDark ? '#ffffff' : '#000000'}
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
                </g>

                {/* MOBILE ANIMATION (Straight Line) - Visible only on mobile */}
                <g className="block md:hidden">
                    <motion.path
                        d="M 50,300 L 550,300"
                        fill="none"
                        stroke="url(#lineGradient)" // Using same gradient as requested
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="15 15"
                        initial={{ pathLength: 0, opacity: 1 }} // Force opacity 1
                        animate={{
                            pathLength: 1,
                            transition: {
                                duration: 3,
                                ease: "linear",
                                repeat: Infinity,
                                repeatType: "loop",
                                repeatDelay: 1
                            }
                        }}
                    />
                    <motion.circle
                        r="8"
                        fill={isDark ? '#ffffff' : '#000000'}
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
                            offsetPath: "path('M 50,300 L 550,300')",
                        }}
                    />
                </g>

            </svg>

            {/* Start Icon: Notepad & Pen */}
            <motion.div
                className={`absolute left-[5%] top-1/2 -translate-y-1/2 p-6 rounded-3xl shadow-2xl backdrop-blur-sm border-2 ${isDark ? 'bg-black/60 border-blue-500/40 text-blue-400' : 'bg-white/90 border-blue-200 text-blue-600'
                    }`}
                variants={iconVariants}
                initial="hidden"
                animate="visible"
            >
                <NotebookPen size={48} strokeWidth={1.5} />
            </motion.div>

            {/* End Icon: Person at Desk (User + Monitor) */}
            <motion.div
                className={`absolute right-[5%] top-1/2 -translate-y-1/2 p-6 rounded-3xl shadow-2xl backdrop-blur-sm border-2 ${isDark ? 'bg-black/60 border-amber-500/40 text-amber-400' : 'bg-white/90 border-amber-200 text-amber-600'
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
                        className={`absolute -bottom-1 -right-1 fill-current ${isDark ? 'text-white' : 'text-black'}`}
                    />
                    {/* Hired Pop-up */}
                    <motion.div
                        className={`absolute -top-8 -right-8 px-3 py-1 rounded-lg font-black text-sm rotate-12 shadow-lg ${isDark ? 'bg-green-500 text-black' : 'bg-green-500 text-white'
                            }`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            scale: [0, 0, 1, 1, 0],
                            opacity: [0, 0, 1, 1, 0]
                        }}
                        transition={{
                            duration: 4, // Matches total ball time (3s move + 1s delay)
                            times: [0, 0.72, 0.75, 0.9, 1], // Appear exactly at 3s (0.75 * 4), vanish by end
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
