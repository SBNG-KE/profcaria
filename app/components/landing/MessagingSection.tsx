"use client"

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/app/context/ThemeContext';
import { Lock, Zap, ShieldCheck, Mailbox, RefreshCcw } from 'lucide-react';

const messageStates = [
    { id: 'COMPOSE', label: 'PLAIN TEXT', content: 'Let\'s close the $2M deal.', icon: Mailbox },
    { id: 'ENCRYPT', label: 'END-TO-END ENCRYPTION (E2EE)', content: '0x8F2A... [CYPHER_LOCKED]', icon: Lock },
    { id: 'TRANSIT', label: 'SECURE TRANSIT OVER MESH', content: 'g#9k!@... [PACKET_FWD_542]', icon: Zap },
    { id: 'DECRYPT', label: 'DECRYPTED AT RECEIVER', content: 'Let\'s close the $2M deal.', icon: ShieldCheck },
];

export default function MessagingSection() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    // Animation for message encryption flow
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % messageStates.length);
        }, 2000); // Change state every 2 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <section className={`relative min-h-screen py-32 flex flex-col justify-center px-4 sm:px-8 md:px-24 overflow-hidden z-10 ${isDark ? 'bg-[#0A0F1A]' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                
                {/* Text Content */}
                <div className="flex flex-col gap-8 z-20">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className={`text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6 ${isDark ? 'text-white' : 'text-black'}`}>
                            Absolute <br /> <span className={`font-pixel text-4xl md:text-6xl ${isDark ? 'text-[#3B5998]' : 'text-[#1B2A4A]'}`}>Separation.</span>
                        </h2>
                        <p className={`text-lg md:text-xl font-light leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            Why mix your professional network with your personal WhatsApp or Signal chats? Profcaria provides a dedicated, highly secure messaging ecosystem specifically tailored for professionals, recruiters, and companies. Keep your social life entirely separate, while operating with absolute privacy and unparalleled speed in your professional communications. You stay in control.
                        </p>
                    </motion.div>

                    <div className="flex flex-col gap-6">
                        {[
                            { title: 'Advanced Cryptographic Shielding', desc: 'Every single message, document, and contract you send is encrypted before it ever leaves your device. Not even we can read your communications. Your corporate negotiations and private career moves are guarded by unbreakable cryptographic protocols ensuring total peace of mind.' },
                            { title: 'Instantaneous Delivery Networks', desc: 'No lag, no waiting. Utilizing global edge network distribution, messages flow instantly across continents without compromising the heavy encryption layer. It feels as instantaneous as your favorite social chat app, but built with a foundation suitable for high-stakes business environments.' }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: idx * 0.2 }}
                                className={`p-6 rounded-3xl border backdrop-blur-xl transition-all ${isDark ? 'bg-[#111827]/80 border-[#1B2A4A] hover:bg-[#111827]' : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'}`}
                            >
                                <h3 className={`text-xl font-bold mb-3 font-pixel tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>{feature.title}</h3>
                                <p className={`text-sm leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Animated Diagram: Real Encryption Simulation */}
                <div className="relative h-[600px] flex items-center justify-center z-20">
                    <div className={`relative w-full max-w-md p-8 rounded-[2rem] border overflow-hidden
                        ${isDark ? 'bg-[#0A0F1A] border-[#3B5998] shadow-[0_0_50px_rgba(59,89,152,0.15)]' : 'bg-white border-[#1B2A4A]/20 shadow-2xl'}
                    `}>
                        {/* Status Header */}
                        <div className="flex justify-between items-center mb-12 border-b pb-4 border-inherit">
                            <span className={`text-xs font-bold uppercase tracking-[0.2em] font-pixel ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                Protocol Status
                            </span>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-green-400' : 'bg-green-500'} animate-pulse`} />
                                <span className={`text-xs font-pixel uppercase ${isDark ? 'text-green-400' : 'text-green-500'}`}>SECURE</span>
                            </div>
                        </div>

                        {/* Interactive Message Stage */}
                        <div className="relative h-64 flex flex-col justify-center items-center">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeIndex}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                    transition={{ duration: 0.5 }}
                                    className="flex flex-col items-center w-full"
                                >
                                    {/* Icon Indicator */}
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 border-2 
                                        ${isDark ? 'bg-[#1B2A4A] border-[#3B5998] text-white' : 'bg-neutral-100 border-[#1B2A4A] text-black'}`}
                                    >
                                        {React.createElement(messageStates[activeIndex].icon, { size: 28 })}
                                    </div>

                                    {/* Stage Label */}
                                    <h4 className={`text-[10px] md:text-xs font-pixel uppercase tracking-widest mb-4 opacity-70 ${isDark ? 'text-[#3B5998]' : 'text-[#1B2A4A]'}`}>
                                        {messageStates[activeIndex].label}
                                    </h4>

                                    {/* The Payload */}
                                    <div className={`w-full p-4 rounded-xl border text-center font-mono text-sm break-all
                                        ${[1, 2].includes(activeIndex) ? "tracking-widest" : "text-lg"}
                                        ${isDark ? 'bg-black border-neutral-800 text-green-400' : 'bg-neutral-50 border-neutral-200 text-[#1B2A4A]'}
                                    `}>
                                        {messageStates[activeIndex].content}
                                    </div>
                                    
                                    {/* Progress indicators underneath */}
                                    {activeIndex === 1 || activeIndex === 2 ? (
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 2, ease: "linear" }}
                                            className={`h-1 mt-6 rounded-full ${isDark ? 'bg-[#3B5998]' : 'bg-[#1B2A4A]'}`}
                                        />
                                    ) : (
                                        <div className="h-1 mt-6" /> // spacer
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        
                        {/* Static Footer Legend */}
                        <div className={`mt-12 text-[10px] font-pixel text-center leading-relaxed opacity-50 ${isDark ? 'text-white' : 'text-black'}`}>
                            Every step is protected by asymmetric key exchange. No intermediaries. No data farming. Only you and the recipient hold the keys.
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
