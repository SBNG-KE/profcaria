"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';

export default function CareerSection() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <section className={`relative min-h-screen py-32 flex flex-col justify-center px-4 sm:px-8 md:px-24 z-10 ${isDark ? 'bg-[#0A0F1A]' : 'bg-white'}`}>
            <div className={`absolute inset-0 z-0 ${isDark ? 'bg-[radial-gradient(circle_at_center,rgba(59,89,152,0.05)_0%,transparent_70%)]' : 'bg-[radial-gradient(circle_at_center,rgba(27,42,74,0.03)_0%,transparent_70%)]'}`} />
            
            <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col lg:flex-row items-center gap-20">
                
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="flex-1 space-y-10"
                >
                    <h2 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none ${isDark ? 'text-white' : 'text-black'}`}>
                        Career<br />
                        <span className="font-pixel text-[#3B5998]">Management.</span><br />
                        Evolved.
                    </h2>
                    <p className={`text-xl leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        Take absolute, uncompromising control over your entire professional trajectory. Profcaria is not just a place to find your next job—it is a comprehensive command center for your entire life's work. 
                    </p>
                    <p className={`text-lg leading-relaxed ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                        Everything you need is centralized, securely vaulted, brilliantly analyzed, and relentlessly optimized for your continuous growth. Instead of scattering your career across dozens of disjointed platforms, PDFs, and endless email chains, you now have a single source of truth. Manage live applications in real-time without losing track, monitor your skill progression through verifiable metrics, securely network with key players behind closed doors, and watch your professional capital grow natively within the ecosystem. We turn your chaotic job history into a structured, indisputable asset.
                    </p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full"
                >
                    {[
                        { num: '01', title: 'The Vault', tag: 'IMPREGNABLE', desc: 'A deeply secure repository storing all your certificates, verified work history, and essential documents. Access strictly controlled by you.' },
                        { num: '02', title: 'Network', tag: 'ACTIVE NOISELESS', desc: 'Professional connections stripped of social media static. Build relationships fundamentally rooted in professional value, not engagement farming.' },
                        { num: '03', title: 'Insights', tag: 'LIVE ANALYTICS', desc: 'Real-time telemetry on how employers view your profile, what skills are surging in demand, and where your direct market value stands.' },
                        { num: '04', title: 'Growth', tag: 'TRACKED & GUIDED', desc: 'Automated milestone tracking that identifies what you need to learn next to bridge the gap between your current position and your absolute dream role.' }
                    ].map((item, idx) => (
                        <div key={idx} className={`p-8 rounded-3xl border flex flex-col justify-between transition-all
                            ${isDark ? 'bg-[#111827]/50 border-[#1B2A4A] hover:bg-[#1B2A4A]/40 hover:-translate-y-1' : 'bg-neutral-50/80 border-neutral-200 hover:bg-white hover:-translate-y-1 hover:shadow-xl'}
                        `}>
                            <div className="mb-8">
                                <span className={`text-[10px] md:text-xs font-pixel uppercase tracking-[0.2em] ${isDark ? 'text-[#3B5998]' : 'text-[#1B2A4A]/50'}`}>
                                    {item.num} // {item.tag}
                                </span>
                            </div>
                            <div>
                                <h3 className={`text-2xl md:text-3xl font-bold uppercase mb-4 ${isDark ? 'text-white' : 'text-black'}`}>
                                    {item.title}
                                </h3>
                                <p className={`text-sm leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    {item.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
