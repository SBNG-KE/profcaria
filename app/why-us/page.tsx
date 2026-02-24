"use client"

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Target, Shield, Users, Zap, Briefcase, Building2 } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

export default function WhyUsPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark' || true; // Force dark mode for consistency with pricing

    const reasons = [
        {
            icon: <Shield className="w-8 h-8 text-amber-500" />,
            title: "Uncompromising Security",
            description: "Built for the modern era with enterprise-grade security. Ad-free, private, and focused entirely on connecting professionals with opportunities, not selling your data."
        },
        {
            icon: <Zap className="w-8 h-8 text-blue-500" />,
            title: "AI-Powered Matches",
            description: "Stop scrolling and start connecting. Our AI ecosystem accurately pairs talent with employers, reducing time to hire and ensuring better cultural and skill fits."
        },
        {
            icon: <Users className="w-8 h-8 text-emerald-500" />,
            title: "Authentic Connections",
            description: "We verify employment history directly with employers, eliminating fake profiles and ensuring you're networking with real professionals."
        },
        {
            icon: <Target className="w-8 h-8 text-purple-500" />,
            title: "Career Focused Ecosystem",
            description: "Where careers are actually built. No timeline clutter, just pure professional networking, learning, and job discovery."
        }
    ];

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#050b14] text-slate-200' : 'bg-white text-black'} font-sans selection:bg-amber-500/30`}>
            {/* Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-amber-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-blue-600/5 blur-[100px] rounded-full" />
            </div>

            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-[#050b14]/80 border-white/5' : 'bg-white/80 border-black/5'} backdrop-blur-xl border-b`}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tight">
                            PROFCARIA
                        </h1>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/pricing" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                            Pricing
                        </Link>
                        <Link href="/why-us" className="text-[10px] font-black uppercase tracking-widest text-white transition-colors">
                            Why Us
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="hidden md:flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </Link>
                        <Link
                            href="/?auth=signup"
                            className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-white/5"
                        >
                            Join Now
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-32 pb-20 px-6 relative z-10 w-full">
                <div className="max-w-6xl mx-auto flex flex-col items-center">

                    {/* Header */}
                    <div className="text-center mb-20 space-y-6 max-w-3xl">
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white uppercase">
                            Why Choose <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Profcaria?</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-400 font-light">
                            We are rebuilding the professional network for the modern era. No ads, no fluff, just authentic career growth and verified talent.
                        </p>
                    </div>

                    {/* Reasons Grid */}
                    <div className="grid md:grid-cols-2 gap-8 w-full mb-24">
                        {reasons.map((reason, idx) => (
                            <div key={idx} className="bg-slate-900/40 border border-slate-800 p-8 rounded-[32px] hover:border-amber-500/30 transition-colors group">
                                <div className="bg-slate-950 p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform duration-300">
                                    {reason.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">{reason.title}</h3>
                                <p className="text-slate-400 leading-relaxed text-lg">
                                    {reason.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Dual Audience Section */}
                    <div className="w-full bg-gradient-to-b from-slate-900/50 to-transparent border border-slate-800 rounded-[40px] p-8 md:p-16 mb-24">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Built For Both Sides Of The Desk</h2>
                            <p className="text-slate-400">An ecosystem that benefits both talent and those seeking it.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-12">
                            {/* For Professionals */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 mb-8">
                                    <Briefcase className="w-10 h-10 text-blue-400" />
                                    <h3 className="text-2xl font-bold text-white">For Professionals</h3>
                                </div>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3 text-slate-300">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                                        <span>Showcase verified experience that employers trust.</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-300">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                                        <span>Connect meaningfully without algorithms throttling your reach.</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-300">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                                        <span>Apply to jobs with total privacy and security controls.</span>
                                    </li>
                                </ul>
                            </div>

                            {/* For Employers */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 mb-8">
                                    <Building2 className="w-10 h-10 text-emerald-400" />
                                    <h3 className="text-2xl font-bold text-white">For Employers</h3>
                                </div>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3 text-slate-300">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 shrink-0" />
                                        <span>Access a pool of verified, authentic talent.</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-300">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 shrink-0" />
                                        <span>Reduce hiring time with AI-powered candidate matching.</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-300">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 shrink-0" />
                                        <span>Manage applicants and pipelines in a secure ecosystem.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="text-center space-y-8">
                        <h2 className="text-4xl font-black text-white">Ready to join the modern era?</h2>
                        <Link
                            href="/?auth=signup"
                            className="inline-block px-12 py-6 bg-white text-black hover:bg-amber-500 hover:text-white rounded-full text-lg font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(245,158,11,0.3)] hover:scale-105"
                        >
                            Get Started
                        </Link>
                    </div>

                </div>
            </main>
        </div>
    );
}
