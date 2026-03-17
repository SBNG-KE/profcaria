"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
import HangingAuthCard from './HangingAuthCard';
import HangingContactCard from './HangingContactCard';
import HangingDocsCard from './HangingDocsCard';
import BusinessSolutions from '@/app/components/landing/BusinessSolutions';
import FeaturesShowcase from '@/app/components/landing/FeaturesShowcase';
import PlatformTour from '@/app/components/landing/PlatformTour';
import VerifiedEvidenceShowcase from '@/app/components/landing/VerifiedEvidenceShowcase';
import JourneyAnimation from '@/app/components/landing/JourneyAnimation';

// Main Landing Page Client Component
export default function LandingPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { theme, toggleTheme } = useTheme();
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [isDocsOpen, setIsDocsOpen] = useState(false);
    const [initialAuthScreen, setInitialAuthScreen] = useState<'auth' | 'security_setup' | 'security_verify'>('auth');
    const [initialAuthTab, setInitialAuthTab] = useState<'professional' | 'employer'>('professional');

    const lenisRef = useRef<Lenis | null>(null);

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

        lenisRef.current = lenis;

        function raf(time: number) {
            lenisRef.current?.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenisRef.current?.destroy();
            lenisRef.current = null;
        };
    }, []);

    // Stop background scrolling when any card is open
    const isAnyCardOpen = isAuthOpen || isContactOpen || isDocsOpen;
    useEffect(() => {
        if (isAnyCardOpen) {
            lenisRef.current?.stop();
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        } else {
            lenisRef.current?.start();
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }
    }, [isAnyCardOpen]);

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
            if (searchParams.get('mode')) return;

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
                        router.push('/professional/notifications');
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
        <div className={`min-h-screen font-sans overflow-x-hidden selection:bg-[#3B5998]/30 ${isDark ? 'bg-[#0A0F1A] text-white' : 'bg-white text-[#0A0F1A]'}`}>

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

            {/* DOCS PANEL */}
            <HangingDocsCard
                isOpen={isDocsOpen}
                onClose={() => setIsDocsOpen(false)}
            />

            {/* LEFT HEADER BUTTONS */}
            <div className="hidden lg:flex fixed top-8 left-8 z-50 items-center gap-8">
                <button
                    onClick={() => setIsDocsOpen(true)}
                    className={`
            text-sm font-black uppercase tracking-[0.2em] relative group
            ${isDark ? 'text-white' : 'text-[#0A0F1A]'}
          `}
                >
                    Docs
                    <span className={`block absolute -bottom-1 left-0 w-0 h-[2px] transition-all duration-300 group-hover:w-full ${isDark ? 'bg-white' : 'bg-[#1B2A4A]'}`} />
                </button>
            </div>

            {/* HEADER BUTTONS */}
            <div className="fixed top-8 right-8 z-50 flex items-center gap-8">
                <ThemeToggle theme={theme} onToggle={toggleTheme} />

                <button
                    onClick={() => setIsAuthOpen(!isAuthOpen)}
                    className={`
            text-sm font-black uppercase tracking-[0.2em] relative group
            ${isDark ? 'text-white' : 'text-[#0A0F1A]'}
          `}
                >
                    Join Now
                    <span className={`block absolute -bottom-1 left-0 w-0 h-[2px] transition-all duration-300 group-hover:w-full ${isDark ? 'bg-white' : 'bg-[#1B2A4A]'}`} />
                </button>
            </div>

            {/* ============================================
          HERO SECTION - Minimalist & Bold
          Shows peek of next section at bottom
          ============================================ */}
            {/* ============================================
          HERO SECTION - Minimalist & Bold
          Shows peek of next section at bottom
          ============================================ */}
            <section className="relative min-h-auto lg:min-h-[75vh] flex flex-col justify-center px-4 sm:px-8 md:px-24 z-10 py-12 md:py-0">
                {/* Full Width Background Animation REMOVED */}

                <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24 w-full relative z-10">

                    {/* LEFT: CARD & DETAILS */}
                    <div className="flex-1 flex flex-col items-center lg:items-start gap-12 w-full lg:w-auto">

                        {/* PROFCARIA CARD - Stone/Rigid Shape */}
                        <div className="flex flex-col items-center gap-6">
                            <div className={`
                                relative p-2 inline-block animate-float-slow shadow-2xl scale-[0.85] md:scale-90 origin-center
                                before:absolute before:inset-0 before:bg-neutral-500/20 before:blur-xl before:-z-10
                            `}>
                                <div
                                    className={`
                                        border-[4px] md:border-[6px] p-6 md:p-10 flex flex-col items-center gap-4
                                        ${isDark ? 'text-white bg-[#111827] border-[#1B2A4A]/50' : 'text-[#0A0F1A] bg-white border-[#1B2A4A]/30'}
                                    `}
                                    style={{
                                        // Complex jagged "ruins" polygon
                                        clipPath: "polygon(2% 0%, 15% 4%, 25% 1%, 40% 3%, 55% 0%, 75% 4%, 85% 1%, 98% 2%, 100% 15%, 96% 25%, 99% 40%, 97% 60%, 100% 75%, 96% 90%, 95% 100%, 80% 96%, 60% 99%, 40% 97%, 20% 99%, 5% 98%, 0% 90%, 3% 75%, 0% 60%, 2% 40%, 0% 20%, 3% 10%)",
                                        borderRadius: "0px"
                                    }}
                                >
                                    <Image
                                        src="/profcaria.png"
                                        alt="Profcaria Logo"
                                        width={100}
                                        height={100}
                                        className="rounded-full w-16 h-16 md:w-24 md:h-24 shadow-lg shrink-0"
                                    />
                                    <h1 className={`
                                    text-4xl md:text-6xl font-black tracking-tighter leading-none
                                    font-pixel uppercase text-center
                                    `}>
                                        #PROFCARIA
                                    </h1>
                                </div>
                            </div>

                            {/* DETAILS TEXT (Tiny, under card) */}
                            <div className="text-center max-w-sm space-y-2 opacity-80 mt-4">
                                <h2 className={`
                                    text-xs font-bold uppercase tracking-widest
                                    ${isDark ? 'text-neutral-300' : 'text-[#4A5568]'}
                                `}>
                                    The AI-Powered Career Operating System.
                                </h2>
                                <p className={`
                                    text-[10px] uppercase tracking-widest font-pixel mt-4 leading-relaxed
                                    ${isDark ? 'text-[#3B5998]' : 'text-[#1B2A4A]'}
                                `}>
                                    Don't just upload a CV.<br/>
                                    Prove your skills with Verified Evidence directly in your profile.
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* RIGHT: SPACER (Animation is now background) */}
                    {/* RIGHT: SPACER (Animation is now background) */}
                    <div className="w-full lg:flex-1 relative -mt-12 lg:mt-0 -mb-8 lg:mb-0 flex justify-center lg:justify-center lg:items-center h-[220px] lg:h-[600px] overflow-hidden">
                        {/* Mobile: Scale down significantly (0.5). Desktop: Full scale (1). */}
                        {/* We force the inner container to be 600x600 so SVG renders perfectly, then shrink it. */}
                        <div className="w-[600px] h-[600px] origin-top scale-[0.5] lg:scale-100 lg:origin-center">
                            <JourneyAnimation />
                        </div>
                    </div>

                </div>
            </section>

            {/* ============================================
          BUSINESS SOLUTIONS (Restored)
          ============================================ */}
            <BusinessSolutions onStart={() => setIsAuthOpen(true)} />

            {/* ============================================
          FEATURES SHOWCASE (Restored)
          ============================================ */}
            <FeaturesShowcase />

            {/* ============================================
          PLATFORM TOUR (New)
          ============================================ */}
            {/* <PlatformTour /> Commented out to prioritize skill evidence over platform tour */}

            {/* ============================================
          VERIFIED EVIDENCE (Replaces Platform Tour)
          ============================================ */}
            <VerifiedEvidenceShowcase />



            {/* CALL TO ACTION - Join Profcaria Today */}
            <section className={`py-32 px-6 text-center relative z-10 ${isDark ? 'bg-[#0A0F1A]' : 'bg-white'}`}>
                <div className="max-w-4xl mx-auto space-y-12">
                    <h2 className={`text-5xl md:text-8xl font-black tracking-tighter leading-none ${isDark ? 'text-white' : 'text-[#0A0F1A]'}`}>
                        JOIN <br /> PROFCARIA <br /> TODAY
                    </h2>
                    <p className={`text-2xl md:text-3xl font-light ${isDark ? 'text-neutral-400' : 'text-[#4A5568]'}`}>
                        Connect. Apply. Hire. Securely.
                    </p>
                    <button
                        onClick={() => setIsAuthOpen(true)}
                        className={`
                            px-12 py-6 rounded-none text-lg font-black uppercase tracking-[0.2em]
                            border-2 transition-all duration-300 hover:scale-105
                            ${isDark
                                ? 'border-[#3B5998] text-[#3B5998] hover:bg-[#3B5998] hover:text-white shadow-[0_0_30px_rgba(59,89,152,0.3)]'
                                : 'border-[#1B2A4A] text-[#1B2A4A] hover:bg-[#1B2A4A] hover:text-white'}
                        `}
                    >
                        Get Started
                    </button>
                </div>
            </section>


            {/* ============================================
          FLOATING FOOTER ELEMENT (No Container)
          ============================================ */}
            <div className="fixed bottom-8 left-0 right-0 z-40 px-6 md:px-8 flex justify-between items-end pointer-events-none">
                <div className="pointer-events-auto">
                    {/* Copyright Restored */}
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-[#1B2A4A]/50' : 'text-neutral-300'}`}>
                        &copy; {new Date().getFullYear()} Profcaria
                    </p>
                </div>

                <div className="pointer-events-auto">
                    <button
                        onClick={() => setIsContactOpen(true)}
                        className={`
              text-xs font-bold uppercase tracking-[0.2em] relative group
              ${isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-[#0A0F1A]'}
              transition-colors
            `}
                    >
                        Contact Us
                    </button>
                </div>
            </div>

            {/* ============================================
          MOBILE/TABLET NAV PILL (Fixed)
          ============================================ */}
            <div className={`
                lg:hidden fixed bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 z-50 
                flex justify-center items-center gap-6 px-6 py-3 rounded-full
                backdrop-blur-xl border shadow-2xl
                ${isDark ? 'bg-[#0A0F1A]/80 border-[#1B2A4A]/50 text-white' : 'bg-white/80 border-neutral-200/50 text-[#0A0F1A]'}
            `}>
                <button onClick={() => setIsDocsOpen(true)} className="text-[11px] font-black uppercase tracking-widest hover:text-[#3B5998] transition-colors pointer-events-auto">
                    Docs
                </button>
            </div>

            <Analytics />
        </div>
    );
}
