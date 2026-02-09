"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
    Users,
    Globe,
    Building2,
    Handshake
} from 'lucide-react';
import { Analytics } from "@vercel/analytics/next";
import Lenis from 'lenis';
import { useTheme } from '@/app/context/ThemeContext';
import ThemeToggle from '@/app/components/ThemeToggle';
import HangingAuthCard from '@/app/components/HangingAuthCard';
import HangingContactCard from '@/app/components/HangingContactCard';
import BusinessSolutions from '@/app/components/landing/BusinessSolutions';
import FeaturesShowcase from '@/app/components/landing/FeaturesShowcase';

// Main Landing Page Client Component
export default function LandingPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { theme, toggleTheme } = useTheme();
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [initialAuthScreen, setInitialAuthScreen] = useState<'auth' | 'security_setup' | 'security_verify'>('auth');
    const [initialAuthTab, setInitialAuthTab] = useState<'professional' | 'employer'>('professional');

    // Initialize Smooth Scrolling (Lenis)
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    // Handle URL Query Params
    useEffect(() => {
        const authParam = searchParams.get('auth'); // 'login' or 'signup'
        const modeParam = searchParams.get('mode'); // 'setup', 'verify'
        const roleParam = searchParams.get('role'); // 'professional', 'employer'

        if (modeParam === 'verify') {
            setInitialAuthScreen('security_verify');
            setIsAuthOpen(true);
        } else if (modeParam === 'setup') {
            setInitialAuthScreen('security_setup');
            setIsAuthOpen(true);
        } else if (authParam) {
            setInitialAuthScreen('auth');
            if (roleParam === 'employer') setInitialAuthTab('employer');
            else setInitialAuthTab('professional');
            setIsAuthOpen(true);
        }
    }, [searchParams]);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    // Check security status first
                    if (data.security) {
                        const { hasPasskey, hasTotp, hasEmail } = data.security;
                        const hasAny = hasPasskey || hasTotp || hasEmail;

                        if (!hasAny) {
                            setInitialAuthScreen('security_setup');
                            setIsAuthOpen(true);
                            return;
                        }
                    }

                    if (data.schema === 'professional') {
                        router.push('/professional/feed');
                    } else if (data.schema === 'employer') {
                        router.push('/employer/feed');
                    }
                }
            } catch (e) {
                // Not authenticated
            }
        };
        checkSession();
    }, [router]);

    const isDark = theme === 'dark';

    return (
        <div className={`min-h-screen font-sans overflow-x-hidden selection:bg-amber-500/30 ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>

            {/* AUTH CARD COMPONENT */}
            <HangingAuthCard
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                initialScreen={initialAuthScreen}
                initialTab={initialAuthTab}
            />

            {/* CONTACT CARD COMPONENT */}
            <HangingContactCard
                isOpen={isContactOpen}
                onClose={() => setIsContactOpen(false)}
            />

            {/* HEADER BUTTONS */}
            <div className="fixed top-8 right-8 z-50 flex items-center gap-8">
                <ThemeToggle theme={theme} onToggle={toggleTheme} />

                <button
                    onClick={() => setIsAuthOpen(!isAuthOpen)} // Toggle card instead of route
                    className={`
            text-sm font-black uppercase tracking-[0.2em] relative group
            ${isDark ? 'text-white' : 'text-black'}
          `}
                >
                    Join Now
                    <span className={`block absolute -bottom-1 left-0 w-0 h-[2px] transition-all duration-300 group-hover:w-full ${isDark ? 'bg-white' : 'bg-black'}`} />
                </button>
            </div>

            {/* ============================================
          HERO SECTION - Minimalist & Bold
          Shows peek of next section at bottom
          ============================================ */}
            <section className="relative min-h-[75vh] md:min-h-[80vh] flex flex-col justify-center px-4 sm:px-6 md:px-20 z-10 py-8 md:py-0">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">

                    {/* LEFT: VINTAGE FRAME & LOGO - Enhanced with Glassmorphism */}
                    <div className="flex-1 flex justify-center md:justify-start">
                        <div className={`
              border-[6px] md:border-[8px] p-1 md:p-2 inline-block rounded-2xl animate-float-slow
              ${isDark ? 'border-neutral-800/50 glass-panel glow-white' : 'border-neutral-200/50 glass-panel-light'}
            `}>
                            <div className={`
                border border-current p-6 sm:p-8 md:p-12 flex flex-col items-center gap-4 md:gap-6 rounded-xl
                ${isDark ? 'text-white bg-black/20 backdrop-blur-sm' : 'text-black bg-white/30 backdrop-blur-sm'}
              `}>
                                <Image
                                    src="/profcaria.png"
                                    alt="Profcaria Logo"
                                    width={100}
                                    height={100}
                                    className="rounded-full w-16 h-16 sm:w-20 sm:h-20 md:w-[100px] md:h-[100px]"
                                />
                                {/* MASSIVE TYPOGRAPHY - Geist Pixel Font */}
                                <h1 className={`
                  text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black tracking-tighter leading-none
                  font-pixel uppercase text-center
                `}>
                                    #PROFCARIA
                                </h1>
                            </div>
                        </div>


                    </div>

                    {/* RIGHT: Main Value Prop - Connecting Focus */}
                    <div className="max-w-xl text-center md:text-left">
                        <h2 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light leading-tight ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                            Where <span className={isDark ? 'text-white font-medium' : 'text-black font-medium'}>ambition</span> finds its home.
                        </h2>
                        <p className={`mt-4 md:mt-6 text-lg sm:text-xl md:text-2xl lg:text-3xl leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            The professional network for the modern era.
                        </p>
                    </div>

                </div>
            </section>

            {/* ============================================
          FEATURES - NO CARDS, JUST CONTENT
          ============================================ */}
            <BusinessSolutions onStart={() => setIsAuthOpen(true)} />

            <FeaturesShowcase />

            {/* ============================================
          VERIFIED EMPLOYMENT SECTION (Replaced Scale)
          ============================================ */}
            <section className={`py-40 px-6 relative overflow-hidden ${isDark ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
                {/* Background glow effect */}
                <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-amber-500/5 via-transparent to-transparent' : 'bg-gradient-to-br from-amber-500/10 via-transparent to-transparent'}`} />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                        <div className="space-y-8">
                            <h2 className={`text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] font-pixel`}>
                                VERIFIED <br />
                                EMPLOYMENT
                            </h2>
                            <div className="h-1 w-20 bg-current glow-amber" />
                        </div>

                        <div className="space-y-10">
                            <p className={`text-3xl font-light leading-relaxed ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                No more employment verification. <br />
                                No more background checks.
                            </p>
                            <p className={`text-xl leading-relaxed opacity-80 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                Your employment history is cryptographically verified at the source.
                                When you join a company on Profcaria, your role is stamped as authentic.
                                When you leave, your history is yours to keep instantly trusted by your next employer.
                            </p>

                            <div className="pt-8">
                                <button
                                    onClick={() => setIsAuthOpen(true)}
                                    className={`
                                        px-8 py-4 rounded-full text-sm font-black uppercase tracking-widest
                                        border transition-all duration-300
                                        ${isDark
                                            ? 'border-white text-white hover:bg-white hover:text-black'
                                            : 'border-black text-black hover:bg-black hover:text-white'}
                                    `}
                                >
                                    Claim Your Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* ============================================
          FLOATING FOOTER ELEMENT (No Container)
          ============================================ */}
            <div className="fixed bottom-8 left-0 right-0 z-40 px-8 flex justify-between items-end pointer-events-none">
                <div className="pointer-events-auto">
                    {/* Copyright Restored */}
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-700' : 'text-neutral-300'}`}>
                        &copy; {new Date().getFullYear()} Profcaria
                    </p>
                </div>

                <div className="pointer-events-auto">
                    <button
                        onClick={() => setIsContactOpen(true)}
                        className={`
              text-xs font-bold uppercase tracking-[0.2em] relative group
              ${isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'}
              transition-colors
            `}
                    >
                        Contact Us
                    </button>
                </div>
            </div>

            <Analytics />
        </div>
    );
}
