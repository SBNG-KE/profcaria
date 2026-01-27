"use client"

import React, { useState, useEffect, useRef } from 'react';
export const dynamic = 'force-dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Briefcase,
  Users,
  Shield,
  Zap,
  Globe,
  Ban,
  EyeOff,
  Lock,
  MessageCircle,
  FileSearch,
  Check,
  Building2,
  Handshake
} from 'lucide-react';
import { Analytics } from "@vercel/analytics/next";
import { useTheme } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import HangingAuthCard from './components/HangingAuthCard';
import BusinessSolutions from './components/landing/BusinessSolutions';
import FeaturesShowcase from './components/landing/FeaturesShowcase';

// Scroll Reveal Component
const ScrollReveal = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 transform ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20 blur-sm"
        } ${className}`}
    >
      {children}
    </div>
  );
};

// Main Landing Page Content
function LandingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [initialAuthScreen, setInitialAuthScreen] = useState<'auth' | 'security_setup' | 'security_verify'>('auth');
  const [initialAuthTab, setInitialAuthTab] = useState<'professional' | 'employer'>('professional');

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

            // Logic for verified check could go here, but omitted for now to avoid redirect loops
            // if (hasAny) { ... }
          }

          if (data.schema === 'professional') {
            router.push('/professional/feed');
          } else if (data.schema === 'employer') {
            router.push('/employer/home');
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

      {/* ============================================
          FLOATING HEADER ELEMENT (No Container)
          ============================================ */}
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
          ============================================ */}
      <section className="relative min-h-[90vh] flex flex-col justify-center px-6 md:px-20 z-10">

        <ScrollReveal>
          <div className="flex flex-col md:flex-row items-center justify-between gap-16">

            {/* LEFT: VINTAGE FRAME & LOGO */}
            <div className={`
              border-[8px] p-2
              ${isDark ? 'border-neutral-800' : 'border-neutral-200'}
            `}>
              <div className={`
                border border-current p-12 flex flex-col items-center gap-6
                ${isDark ? 'text-white' : 'text-black'}
              `}>
                <Image
                  src="/profcaria.png"
                  alt="Profcaria Logo"
                  width={100}
                  height={100}
                  className="rounded-full shadow-2xl"
                />
                {/* MASSIVE TYPOGRAPHY */}
                <h1 className={`
                  text-6xl md:text-8xl font-black tracking-tighter leading-none
                  font-serif italic
                `}>
                  #PROFCARIA
                </h1>
              </div>
            </div>

            {/* RIGHT: Main Value Prop - Connecting Focus */}
            <div className="max-w-xl text-right md:text-left">
              <h2 className={`text-4xl md:text-5xl font-light leading-tight ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                Where <span className={isDark ? 'text-white font-medium' : 'text-black font-medium'}>ambition</span> finds its home. <br />
                <span className="opacity-60 text-3xl">The professional network for the modern era.</span>
              </h2>
            </div>

          </div>
        </ScrollReveal>
      </section>

      {/* ============================================
          FEATURES - NO CARDS, JUST CONTENT
          ============================================ */}
      <ScrollReveal>
        <BusinessSolutions onStart={() => setIsAuthOpen(true)} />
      </ScrollReveal>

      <ScrollReveal>
        <FeaturesShowcase />
      </ScrollReveal>

      {/* NEW SECTION: The Standard / Future of Work */}
      <section className={`py-40 px-6 ${isDark ? 'bg-neutral-900/50' : 'bg-neutral-50'}`}>
        <ScrollReveal>
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <h3 className={`text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none ${isDark ? 'text-white' : 'text-black'}`}>
              The Standard <br /> Has Been Raised.
            </h3>
            <p className={`text-2xl font-light italic font-serif ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
              "We are not just filling positions. We are architecting the future of human collaboration."
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ============================================
          TAILORED FOR YOUR GROWTH - The Only "Card"
          ============================================ */}
      <section className={`py-40 px-6 ${isDark ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">

              {/* Left Side - Narrative */}
              <div className="space-y-10">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter">
                  TAILORED FOR <br /> YOUR GROWTH
                </h2>
                <div className="h-1 w-20 bg-current" />
                <p className={`text-2xl font-light leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Focus on your career trajectory. We provide the tools and connections you need to level up.
                </p>

                <div className="grid grid-cols-2 gap-10 pt-10">
                  <div>
                    <div className="text-5xl font-black">100%</div>
                    <div className="text-xs uppercase tracking-widest mt-2 opacity-60">Career Focus</div>
                  </div>
                  <div>
                    <div className="text-5xl font-black">Global</div>
                    <div className="text-xs uppercase tracking-widest mt-2 opacity-60">Opportunities</div>
                  </div>
                </div>
              </div>

              {/* Right Side - The Specific Layout "Card" - CURVED EDGES */}
              <div className={`
                p-12 md:p-16 flex flex-col justify-between rounded-[3rem]
                ${isDark ? 'bg-black' : 'bg-white'}
              `}>
                <div className="space-y-8">
                  <h3 className="text-2xl font-bold uppercase tracking-widest border-b border-current pb-6">Why Profcaria?</h3>

                  <ul className="space-y-6">
                    {[
                      { icon: Users, label: "Exclusive Networking" },
                      { icon: Building2, label: "Business Connections" },
                      { icon: Handshake, label: "Direct Partnerships" },
                      { icon: Globe, label: "Global Opportunities" }
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-6 group cursor-default">
                        <item.icon size={24} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                        <span className={`text-lg font-medium group-hover:translate-x-2 transition-transform duration-300`}>
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-12 text-sm opacity-40 font-mono">
                  Member Verified Platform
                </div>
              </div>

            </div>
          </ScrollReveal>
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
          <Link
            href="/contact"
            className={`
              text-xs font-bold uppercase tracking-[0.2em] relative group
              ${isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'}
              transition-colors
            `}
          >
            Contact Us
          </Link>
        </div>
      </div>

      <Analytics />
    </div>
  );
}

// Main Export - Theme is provided by root layout
export default function LandingPage() {
  return <LandingPageContent />;
}