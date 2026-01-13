//app/page.tsx

"use client"

import React, { useState, useEffect, useRef } from 'react';
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Shield,
  Lock,
  Zap,
  Globe,
  ChevronDown,
  Building2,
  Users,
  // Linkedin, // Deprecated
  // Instagram, // Deprecated
  FileText,
  Ban,
  EyeOff,
  Server,
  Check
} from 'lucide-react';
import { Analytics } from "@vercel/analytics/next";

// Inline replacements for deprecated Lucide icons
const YoutubeIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

const InstagramIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

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

export default function LandingPage() {
  const router = useRouter();
  const [trailerClicked, setTrailerClicked] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.schema === 'professional') {
            router.push('/professional/home');
          } else if (data.schema === 'employer') {
            router.push('/employer/home');
          }
        }
      } catch (e) {
        // Not authenticated, stay here
      }
    };
    checkSession();
  }, []);

  return (
    <div className="min-h-screen bg-[#050b14] text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-emerald-600/5 blur-[100px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[30%] bg-blue-900/10 blur-[150px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050b14]/50 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tight">
              PROFCARIA
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/auth')}
              className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-white/5"
            >
              Launch
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 z-10">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
              <Zap size={12} fill="currentColor" /> The Future of Professional Identity
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <h1 className="text-6xl md:text-8xl font-black text-white leading-[0.9] tracking-tighter max-w-4xl mx-auto">
              SECURE YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-emerald-400">LEGACY</span> IN PROFCARIA.
            </h1>
          </ScrollReveal>

          <ScrollReveal className="delay-200">
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Profcaria is an encrypted ecosystem for professionals and employers.
              Store your career artifacts with uncompromising, enterprise-grade security.
            </p>
          </ScrollReveal>

          <ScrollReveal className="delay-300 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setTrailerClicked(true)}
                className="w-full md:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl font-black uppercase tracking-[0.15em] text-xs transition-all flex items-center justify-center gap-3 backdrop-blur-md"
              >
                {trailerClicked ? 'Coming Soon' : 'Watch Trailer'}
              </button>
            </div>
          </ScrollReveal>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-20 hidden md:block">
          <ChevronDown size={32} />
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-32 px-6 relative z-10 bg-gradient-to-b from-transparent via-[#080f1a] to-transparent">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Card 1 */}
              <div className="group p-10 bg-slate-900/40 border border-white/5 rounded-[40px] hover:border-blue-500/20 transition-all backdrop-blur-3xl hover:bg-blue-500/5">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-8 group-hover:scale-110 transition-transform">
                  <Lock size={32} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Encrypted Vault</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Every document, every detail, and every communication is encrypted locally. Your data belongs to you, secured by advanced algorithms.
                </p>
              </div>

              {/* Card 2 */}
              <div className="group p-10 bg-slate-900/40 border border-white/5 rounded-[40px] hover:border-emerald-500/20 transition-all backdrop-blur-3xl hover:bg-emerald-500/5">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-8 group-hover:scale-110 transition-transform">
                  <Building2 size={32} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Employer Connection</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Directly connect with top-tier employers. Our platform cuts through the noise, presenting your verified profile to those who matter.
                </p>
              </div>

              {/* Card 3 */}
              <div className="group p-10 bg-slate-900/40 border border-white/5 rounded-[40px] hover:border-purple-500/20 transition-all backdrop-blur-3xl hover:bg-purple-500/5">
                <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-8 group-hover:scale-110 transition-transform">
                  <Shield size={32} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Verified History</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Build a portfolio of verified achievements. From education to work history, present a career narrative that is trusted and immutable.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* "Built for Professionals" Content Section */}
      <section className="py-32 px-6 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <ScrollReveal>
            <div className="space-y-12">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                  TAILORED FOR YOUR <br />
                  <span className="text-blue-500">CAREER GROWTH.</span>
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Profcaria isn't just a platform; it's a career catalyst. We've redesigned the job search and professional networking experience to be focused, secure, and effective.
                  Showcase your true value with verified artifacts and connect with opportunities that match your expertise.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <div className="text-4xl font-black text-white">100%</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">User Control</div>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-black text-emerald-500">Global</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Job Access</div>
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-6">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Join the future of professional networking.</div>
                <div className="flex gap-6">
                  <a href="https://x.com/profcaria" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                    {/* X Logo SVG */}
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M4 4l11.733 16h4.267l-11.733-16z" /><path d="M4 20l6.768-6.768m2.46-2.46L20 4" /></svg>
                  </a>
                  <a href="https://www.youtube.com/@Profcaria" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                    <YoutubeIcon size={24} />
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal className="relative h-full">
            <div className="h-full bg-[#0a121e] border border-slate-800/60 rounded-[40px] p-8 md:p-10 relative overflow-hidden group hover:border-blue-500/20 transition-all duration-500">

              {/* Header */}
              <div className="mb-8 relative z-10">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Why Profcaria?</h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Security Protocols</p>
                </div>
              </div>

              {/* List */}
              <div className="space-y-6 relative z-10">

                {/* Item 1 */}
                <div className="flex gap-4 items-start group/item">
                  <div className="p-3 bg-blue-900/10 rounded-xl text-blue-400 border border-blue-900/20 group-hover/item:border-blue-500/30 transition-colors">
                    <EyeOff size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">Privacy First Engine</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Zero ads. Zero tracking. We never sell your data. You are free from the noise of traditional networks.
                    </p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="flex gap-4 items-start group/item">
                  <div className="p-3 bg-emerald-900/10 rounded-xl text-emerald-400 border border-emerald-900/20 group-hover/item:border-emerald-500/30 transition-colors">
                    <Server size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">Dynamic Artifacts</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Stop managing endless file versions. Update your data once within the system, and it reflects everywhere instantly.
                    </p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="flex gap-4 items-start group/item">
                  <div className="p-3 bg-red-900/10 rounded-xl text-red-400 border border-red-900/20 group-hover/item:border-red-500/30 transition-colors">
                    <Ban size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">Malware Shield</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      We prevent PDF-based attacks by eliminating file uploads. Your application process is pure, secure data transfer.
                    </p>
                  </div>
                </div>

                {/* Item 4 */}
                <div className="flex gap-4 items-start group/item">
                  <div className="p-3 bg-purple-900/10 rounded-xl text-purple-400 border border-purple-900/20 group-hover/item:border-purple-500/30 transition-colors">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">End-to-End Encryption</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Your legacy is protected by best-in-class security standards at every step.
                    </p>
                  </div>
                </div>

                {/* Item 5 - No Spam */}
                <div className="flex gap-4 items-start group/item">
                  <div className="p-3 bg-orange-900/10 rounded-xl text-orange-400 border border-orange-900/20 group-hover/item:border-orange-500/30 transition-colors">
                    <Ban size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">Zero Recruiter Spam</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      No InMail harassment. No cold outreach. Just relevant opportunities.
                    </p>
                  </div>
                </div>

                {/* Item 6 - Data Ownership */}
                <div className="flex gap-4 items-start group/item">
                  <div className="p-3 bg-cyan-900/10 rounded-xl text-cyan-400 border border-cyan-900/20 group-hover/item:border-cyan-500/30 transition-colors">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">You Own Your Data</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Only employers you apply to see your info. We never sell data. You're the customer, not the product.
                    </p>
                  </div>
                </div>

              </div>

              {/* Background Effects */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] pointer-events-none -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-600/5 rounded-full blur-[60px] pointer-events-none -ml-10 -mb-10"></div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 relative z-10 bg-[#02060c]" >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-xl font-black text-white tracking-widest">PROFCARIA</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">&copy; {new Date().getFullYear()} Secured ecosystem. All rights reserved.</p>
          </div>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <Link href="/documentation" className="hover:text-blue-500 transition-colors">Documentation</Link>
            <Link href="/pricing" className="hover:text-blue-500 transition-colors">Pricing</Link>
          </div>
        </div>
      </footer>

      {/* Aesthetic styles */}
      < style jsx global > {`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .reveal {
          animation: fade-up 1s forwards;
        }
      `}</style>
      <Analytics />
    </div>
  );
}