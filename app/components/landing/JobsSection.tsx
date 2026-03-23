"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';

export default function JobsSection() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <section className={`relative min-h-screen py-32 flex flex-col justify-center px-4 sm:px-8 md:px-24 z-10`}>
            <div className="max-w-7xl mx-auto w-full text-center space-y-20">
                
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className={`text-4xl md:text-6xl lg:text-8xl font-black uppercase tracking-tighter leading-none mb-8 ${isDark ? 'text-white' : 'text-black'}`}>
                        Find <span className="font-pixel text-[#3B5998]">Work.</span>
                        <br /> Not Noise.
                    </h2>
                    <p className={`text-lg md:text-2xl font-light max-w-5xl mx-auto leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        The days of endlessly scrolling through irrelevant job postings, ghosting recruiters, and bloated networking feeds are entirely over. Job boards today are fundamentally broken spaces filled with spam, untrusted profiles, and wasted time. Profcaria operates on a completely different paradigm. Our intelligent matching system analyzes your verified skills, experience, and trajectory to connect you directly with roles where you undeniably belong. It's not about applying to a hundred jobs; it's about applying to the exact right one.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left mt-24">
                    {[
                        { 
                            title: 'Verified Profiles', 
                            desc: 'Stand out instantly from the massive crowd. Instead of relying on trust, your skills, history, and achievements are cryptographically and objectively verified within our secure vault. This means employers trust your capabilities entirely before the very first interview even begins, cutting down the vetting process from weeks to mere hours. No more proving what you already know how to do.' 
                        },
                        { 
                            title: 'Precision Matching Paradigm', 
                            desc: 'Say goodbye to generic, keyword-based suggestions that misunderstand your reality. Our system understands the highly specific nuances of your tech stack, your industry background, and your deeply desired company culture. We analyze hundreds of micro-data points to calculate compatibility, ensuring you are matched with the exact teams looking for your unique DNA.' 
                        },
                        { 
                            title: 'Direct, Unfiltered Access', 
                            desc: 'Skip the third-party recruiter spam and the endless intermediary agency hurdles. Profcaria enables you to connect directly with hiring managers, founders, and team leads who are actively and urgently looking for exactly what you bring to the table. Our private messaging protocols ensure that these conversations remain strictly confidential and out of the public eye.' 
                        }
                    ].map((card, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: idx * 0.2 }}
                            className={`p-10 rounded-3xl border transition-all hover:-translate-y-2
                                ${isDark 
                                    ? 'bg-[#111827]/80 border-[#1B2A4A] hover:bg-[#111827] hover:shadow-[0_20px_40px_rgba(59,89,152,0.15)]' 
                                    : 'bg-neutral-50 border-neutral-200 hover:shadow-2xl hover:bg-white'
                                }
                            `}
                        >
                            <div className="mb-6 opacity-30">
                                <span className={`text-5xl font-black font-pixel ${isDark ? 'text-white' : 'text-black'}`}>
                                    0{idx + 1}
                                </span>
                            </div>
                            <h3 className={`text-2xl font-bold mb-6 font-pixel tracking-wide uppercase ${isDark ? 'text-white' : 'text-black'}`}>
                                {card.title}
                            </h3>
                            <p className={`text-base leading-loose ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                {card.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
