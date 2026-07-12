"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Analytics } from "@vercel/analytics/next";
import Lenis from 'lenis';
import ThemeToggle from '@/app/components/ThemeToggle';
import HangingAuthCard from './HangingAuthCard';
import HangingContactCard from './HangingContactCard';
import HangingDocsCard from './HangingDocsCard';
import HeroSection from '@/app/components/landing/HeroSection';
import MessagingSection from '@/app/components/landing/MessagingSection';
import JobsSection from '@/app/components/landing/JobsSection';
import CareerSection from '@/app/components/landing/CareerSection';
import AIHouseSection from '@/app/components/landing/AIHouseSection';
import FooterActionSection from '@/app/components/landing/FooterActionSection';


// Main Landing Page Client Component
export default function LandingPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [isDocsOpen, setIsDocsOpen] = useState(false);
    const [initialAuthScreen, setInitialAuthScreen] = useState<'auth' | 'security_setup' | 'security_verify'>('auth');

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

        const syncAuthState = () => { if (modeParam === 'verify') {
            setInitialAuthScreen('security_verify');
            setIsAuthOpen(true);
        } else if (modeParam === 'setup') {
            setInitialAuthScreen('security_setup');
            setIsAuthOpen(true);
        } else if (authParam) {
            setInitialAuthScreen('auth');
            setIsAuthOpen(true);
        } };
        syncAuthState();
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

                    if (data.uid) router.push('/social');
                }
            } catch {
                // Not authenticated
            }
        };
        checkSession();
    }, [router, searchParams]);

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg-primary)] font-sans text-[var(--text-primary)] selection:bg-[var(--accent-soft)]">
            
            {/* AUTH CARD COMPONENT */}
            <HangingAuthCard
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                initialScreen={initialAuthScreen}
                initialTab="professional"
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

            {/* LEFT HEADER BUTTONS - Removed Docs Button from UI */}
            <div className="hidden lg:flex fixed top-8 left-8 z-[60] items-center gap-8">
            </div>

            {/* HEADER BUTTONS */}
            <div className="fixed top-8 right-8 z-50 flex items-center gap-8">
                <ThemeToggle />

                <button
                    onClick={() => setIsAuthOpen(!isAuthOpen)}
                    className={`
            text-sm font-black uppercase tracking-[0.2em] relative group
            text-[var(--text-primary)]
          `}
                >
                    Join Now
                    <span className="absolute -bottom-1 left-0 block h-[2px] w-0 bg-[var(--accent-primary)] transition-all duration-300 group-hover:w-full" />
                </button>
            </div>

            {/* NEW FUTURISTIC SECTIONS */}
            <HeroSection />
            <MessagingSection />
            <JobsSection />
            <CareerSection />
            <AIHouseSection />
            <FooterActionSection onJoin={() => setIsAuthOpen(true)} onContact={() => setIsContactOpen(true)} />


            {/* ============================================
          FLOATING FOOTER ELEMENT (No Container)
          ============================================ */}
            {/* Removed the fixed footer with Copyright and Contact Us as it is moved into FooterActionSection */}

            {/* ============================================
          MOBILE/TABLET NAV PILL (Fixed)
          ============================================ */}
            {/* Nav Pill Docs removed */}

            <Analytics />
        </div>
    );
}
