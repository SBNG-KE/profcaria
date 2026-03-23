"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';
import { BrainCircuit, Eye, Network, Cpu } from 'lucide-react';

export default function AIHouseSection() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <section className={`relative flex flex-col items-center pt-8 pb-0 px-4 sm:px-8 md:px-24 z-10 overflow-hidden ${isDark ? 'bg-[#0A0F1A]' : 'bg-white'}`}>
            
            {/* INCOMING "NERVES" / STREAMS */}
            <div className="absolute top-0 left-0 right-0 h-16 flex justify-center opacity-70">
                {/* Center stream */}
                <motion.div 
                    initial={{ height: 0 }}
                    whileInView={{ height: '100%' }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className={`w-1 origin-top ${isDark ? 'bg-gradient-to-b from-[#3B5998]/0 via-[#3B5998] to-[#3B5998]' : 'bg-gradient-to-b from-[#1B2A4A]/0 via-[#1B2A4A] to-[#1B2A4A]'}`}
                />
                {/* Left Stream */}
                <motion.div 
                    initial={{ height: 0, x: -100 }}
                    whileInView={{ height: '100%', x: -10 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
                    className={`absolute top-0 w-[2px] origin-top skew-x-[-15deg] ${isDark ? 'bg-gradient-to-b from-[#3B5998]/0 to-[#3B5998]' : 'bg-gradient-to-b from-[#1B2A4A]/0 to-[#1B2A4A]'}`}
                />
                {/* Right Stream */}
                <motion.div 
                    initial={{ height: 0, x: 100 }}
                    whileInView={{ height: '100%', x: 10 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1.5, ease: "easeInOut", delay: 0.4 }}
                    className={`absolute top-0 w-[2px] origin-top skew-x-[15deg] ${isDark ? 'bg-gradient-to-b from-[#3B5998]/0 to-[#3B5998]' : 'bg-gradient-to-b from-[#1B2A4A]/0 to-[#1B2A4A]'}`}
                />
            </div>

            {/* Tightened margin specifically to close the visual gorge to the footer */}
            <div className="mt-16 mb-4 relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center text-center">
                
                {/* Central AI Hub Node: The Overseer */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 1 }}
                    className={`relative w-40 h-40 rounded-full border-4 flex items-center justify-center mb-16 shadow-[0_0_80px_rgba(59,89,152,0.6)]
                        ${isDark ? 'bg-[#0A0F1A] border-white' : 'bg-white border-[#1B2A4A]'}
                    `}
                >
                    <div className="absolute inset-2 rounded-full border border-dashed animate-spin-slow opacity-50" />
                    <Cpu size={56} className={isDark ? 'text-white' : 'text-[#1B2A4A]'} />
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 1.5 }}
                    className="mb-16"
                >
                    <h2 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-8 ${isDark ? 'text-white' : 'text-black'}`}>
                        The <span className={`font-pixel ${isDark ? 'text-white' : 'text-[#1B2A4A]'}`}>Overseer</span> AI.
                    </h2>
                    <p className={`text-xl md:text-2xl font-light max-w-5xl mx-auto leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        Think of Profcaria as a living, breathing digital infrastructure governed by a true presidential intelligence. The Overseer AI watches from the top, simultaneously directing and coordinating a legion of highly specialized sub-agent AIs tailored entirely to your success. It manages timelines, enforces privacy constraints, and strategically deploys lower-level agents precisely when you need them.
                    </p>
                </motion.div>

                {/* Sub-Agents Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left">
                    {[
                        { 
                            icon: Eye, 
                            title: 'Contextual Observer', 
                            desc: 'Operating silently in the background, this agent strictly analyzes your activity, learning your unique professional style, communication quirks, and exact preferences to construct hyper-personalized interactions. The Overseer dictates its boundaries to ensure absolute privacy.' 
                        },
                        { 
                            icon: BrainCircuit, 
                            title: 'Interview Architect', 
                            desc: 'Deployed automatically by the Overseer when you land a meeting. This agent immediately starts pulling public data regarding the company you are meeting, constructs highly probable interview scenarios tailored to your weak points, and sharpens your specific delivery.' 
                        },
                        { 
                            icon: Network, 
                            title: 'Swarm Logistics', 
                            desc: 'A decentralized cluster of scouting agents that infinitely scour the hidden job markets. The Overseer filters their massive raw data inputs and exclusively delivers the 1% of opportunities that fit your incredibly specific, verified career trajectory perfectly.' 
                        }
                    ].map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 2 + (idx * 0.2) }}
                            className={`p-10 rounded-3xl border transition-all hover:-translate-y-2
                                ${isDark 
                                    ? 'bg-[#111827]/80 border-[#1B2A4A] hover:bg-[#111827] hover:shadow-[0_20px_40px_rgba(59,89,152,0.15)]' 
                                    : 'bg-neutral-50 border-neutral-200 hover:shadow-2xl hover:bg-white'
                                }
                            `}
                        >
                            <feature.icon className={`mb-8 ${isDark ? 'text-white' : 'text-[#1B2A4A]'}`} size={40} />
                            <h3 className={`text-xl font-bold font-pixel uppercase tracking-widest mb-6 ${isDark ? 'text-white' : 'text-black'}`}>
                                {feature.title}
                            </h3>
                            <p className={`text-base leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
}
