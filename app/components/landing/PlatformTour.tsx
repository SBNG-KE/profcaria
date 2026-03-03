"use client"

import React, { useRef } from 'react';
import Image from 'next/image';
import { useTheme } from '@/app/context/ThemeContext';
import { useScroll, useTransform, motion } from 'framer-motion';
import { Bot, Sparkles, GraduationCap } from 'lucide-react';

interface Feature {
    title: string;
    description: string;
    id: string;
    image?: string;
    images?: string[];
    customVisual?: boolean;
}

const features: Feature[] = [
    {
        title: "Find Work",
        description: "Stop searching. Start working. Our AI analyzes your verified history to match you with roles you're already qualified for. No more ghosting. No more application black holes. Just direct access to companies who need your specific expertise.",
        image: "/image1.png", // Keeping existing image temporarily
        id: "find-work"
    },
    {
        title: "Verified Employment",
        description: "No more employment verification. No more background checks. Your employment history is cryptographically verified at the source. When you join a company on Profcaria, your role is stamped as authentic. When you leave, your history is yours to keep instantly trusted by your next employer.",
        images: [
            "/landing/verified-2.png",
            "/landing/verified-1.png",
            "/landing/verified-3.png"
        ],
        id: "verified-profile"
    },
    {
        title: "Professional Networking",
        description: "Build a circle of trust. Connect with professionals whose careers are verified, not just stated. Filter out the noise. See exactly who is hiring, who is open to work, and who is leading the industry based on cryptographic facts, not exaggerated profiles.",
        image: "/landing/networking-preview.png",
        id: "networking"
    },
    {
        title: "The AI Career OS",
        description: "Traditional CVs still work. We just made them smarter.Profcaria enhances your CV with dynamic, AI-powered career agents that operate 24/7, accelerating your growth, discovering aligned opportunities, and preparing you for the right interviews.Your CV becomes intelligent, adaptive, and always working for you.",
        id: "ai-agents",
        customVisual: true
    }
];

export default function PlatformTour() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    return (
        <section ref={containerRef} className={`relative py-12 md:py-32 overflow-hidden ${isDark ? 'bg-black' : 'bg-white'}`}>

            {/* BACKGROUND CONSTELLATION ANIMATION (The "Profcaria Universe") */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className={`absolute top-0 right-0 w-2/3 h-full opacity-20 ${isDark ? 'bg-gradient-to-l from-blue-900/20 to-transparent' : 'bg-gradient-to-l from-blue-100 to-transparent'}`} />
                {/* Simulated connecting lines/nodes could go here with SVG or Canvas */}
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="mb-4 md:mb-8 text-left">
                    <div className={`text-xs font-bold uppercase tracking-[0.3em] pl-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        See how Profcaria redefines professional networking.
                    </div>
                </div>

                <div className="space-y-40">
                    {features.map((feature, index) => (
                        <FeatureSection key={feature.id} feature={feature} index={index} isDark={isDark} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function FeatureSection({ feature, index, isDark }: { feature: Feature, index: number, isDark: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col lg:flex-row items-center gap-12 md:gap-24"
        >
            {/* TEXT CONTENT (Always Left) */}
            <div className={`flex-1 space-y-8 text-left ${index % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
                <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full border ${isDark ? 'border-neutral-800 bg-neutral-900/50 text-blue-400' : 'border-neutral-200 bg-neutral-50 text-blue-600'}`}>
                    <span className="text-xs font-bold uppercase tracking-widest">0{index + 1}</span>
                    <span className="w-px h-3 bg-current opacity-20" />
                    <span className="text-xs font-bold uppercase tracking-widest">{feature.id.replace('-', ' ')}</span>
                </div>

                <h3 className={`text-3xl md:text-5xl font-black tracking-tighter uppercase font-pixel leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
                    {feature.title}
                </h3>
                <p className={`text-xl md:text-2xl leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    {feature.description}
                </p>

                {/* Decorative line */}
                <div className={`h-1 w-24 ${isDark ? 'bg-blue-500' : 'bg-blue-600'}`} />
            </div>

            {/* IMAGE CONTENT (Always Right) */}
            <div className={`flex-1 w-full relative group perspective-1000 ${index % 2 === 1 ? 'lg:order-1' : 'lg:order-2'}`}>
                {/* Glow Effect behind image */}
                <div className={`absolute -inset-4 rounded-3xl blur-3xl opacity-20 transition-opacity duration-500 group-hover:opacity-40 ${isDark ? 'bg-blue-500' : 'bg-blue-400'}`} />

                {feature.customVisual ? (
                    <div className={`relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl border transition-transform duration-500 group-hover:scale-[1.02] flex items-center justify-center ${isDark ? 'border-neutral-700 bg-neutral-900/50' : 'border-neutral-200 bg-white/50'}`}>
                        {/* Animated Background Rings */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-64 h-64 rounded-full border border-dashed animate-[spin_20s_linear_infinite] ${isDark ? 'border-neutral-700/50' : 'border-neutral-300/50'}`} />
                            <div className={`absolute w-80 h-80 rounded-full border md:border-dotted animate-[spin_30s_linear_infinite_reverse] ${isDark ? 'border-neutral-700/50' : 'border-neutral-300/50'}`} />
                            <div className={`absolute w-96 h-96 rounded-full border border-dashed animate-[spin_40s_linear_infinite] ${isDark ? 'border-neutral-800/50' : 'border-neutral-200/50'}`} />
                        </div>

                        {/* Center Agent Icon */}
                        <div className={`absolute p-6 md:p-8 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.2)] border z-10 ${isDark ? 'bg-black border-neutral-800' : 'bg-white border-neutral-200'}`}>
                            <Bot className="w-16 h-16 md:w-20 md:h-20 text-amber-500 animate-[pulse_3s_ease-in-out_infinite]" />
                        </div>

                        {/* Orbiting Icons */}
                        <div className="absolute w-[280px] h-[280px] md:w-[320px] md:h-[320px] animate-[spin_15s_linear_infinite]">
                            {/* Top Orbit */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <div className={`p-4 rounded-full border shadow-lg animate-[spin_15s_linear_infinite_reverse] ${isDark ? 'bg-neutral-900 border-neutral-700 text-blue-400' : 'bg-white border-neutral-200 text-blue-600'}`}>
                                    <Sparkles className="w-6 h-6 md:w-8 md:h-8" />
                                </div>
                            </div>
                            {/* Bottom Orbit */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                                <div className={`p-4 rounded-full border shadow-lg animate-[spin_15s_linear_infinite_reverse] ${isDark ? 'bg-neutral-900 border-neutral-700 text-purple-400' : 'bg-white border-neutral-200 text-purple-600'}`}>
                                    <GraduationCap className="w-6 h-6 md:w-8 md:h-8" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : feature.images ? (
                    <div className="flex flex-col gap-4">
                        {/* Top Image (Wide) - Constrained width if it's the Verified Profile section */}
                        <div className={`
                            relative rounded-2xl overflow-hidden shadow-2xl border transition-transform duration-500 group-hover:scale-[1.02] 
                            ${feature.id === 'verified-profile' ? 'max-w-xl mx-auto w-full' : 'w-full'}
                            ${isDark ? 'border-neutral-700 bg-neutral-900/50' : 'border-neutral-200 bg-white/50'}
                        `}>
                            <Image
                                src={feature.images[0]}
                                alt={`${feature.title} 1`}
                                width={1200}
                                height={600}
                                className="w-full h-auto object-cover"
                            />
                        </div>

                        {/* Bottom Two Images (Side by Side) */}
                        <div className="grid grid-cols-2 gap-4 items-start">
                            {[feature.images[1], feature.images[2]].map((img, i) => (
                                <div key={i} className={`
                                    relative rounded-2xl overflow-hidden shadow-2xl border transition-transform duration-500 group-hover:scale-[1.02]
                                    ${feature.id === 'verified-profile' ? 'max-w-xl mx-auto w-full' : 'w-full'}
                                    ${isDark ? 'border-neutral-700 bg-neutral-900/50' : 'border-neutral-200 bg-white/50'}
                                `}>
                                    <Image
                                        src={img}
                                        alt={`${feature.title} ${i + 2}`}
                                        width={600}
                                        height={400}
                                        className="w-full h-auto object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className={`
                        relative rounded-2xl overflow-hidden shadow-2xl border transition-transform duration-500 group-hover:scale-[1.02] group-hover:-rotate-1 origin-center
                        ${isDark ? 'border-neutral-700 bg-neutral-900/50' : 'border-neutral-200 bg-white/50'}
                    `}>
                        {/* Glass Overlay */}
                        <div className="absolute inset-0 z-10 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none mix-blend-overlay" />

                        <Image
                            src={feature.image!}
                            alt={feature.title}
                            width={1200}
                            height={800}
                            className="w-full h-auto object-cover"
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );
}
