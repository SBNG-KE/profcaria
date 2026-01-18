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
  Check,
  FileEdit,
  Link2,
  SlidersHorizontal,
  BarChart3,
  BellOff,
  MessageSquare
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
  const [activeTab, setActiveTab] = useState<'painpoints' | 'features' | 'security'>('painpoints');

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
              Join Now
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
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tighter max-w-5xl mx-auto">
              SECURE CAREERS. AUTHENTIC JOBS. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-emerald-400">TRUSTED</span> HIRING.
            </h1>
          </ScrollReveal>

          <ScrollReveal className="delay-200">
            <p className="text-base md:text-lg lg:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Profcaria is an end-to-end encrypted recruitment platform where professionals securely store their career records, find authenticated job opportunities, and where employers hire verified, trusted talent.
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

          {/* World Network Image */}
          <ScrollReveal className="delay-500 pt-16">
            <div className="relative max-w-5xl mx-auto">
              {/* Glow effects around image */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-transparent to-emerald-500/20 blur-3xl rounded-3xl opacity-50" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050b14] via-transparent to-transparent z-10 pointer-events-none" />

              {/* Decorative elements */}
              <div className="absolute -top-8 -left-8 w-16 h-16 border border-blue-500/30 rounded-full animate-pulse" />
              <div className="absolute -bottom-6 -right-6 w-12 h-12 border border-emerald-500/30 rounded-full animate-pulse delay-500" />
              <div className="absolute top-1/2 -right-12 w-3 h-3 bg-purple-500/50 rounded-full animate-ping" />
              <div className="absolute top-1/4 -left-10 w-2 h-2 bg-cyan-500/50 rounded-full animate-ping delay-700" />

              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-500/10">
                <Image
                  src="/images/world-network.png"
                  alt="Global recruitment network - Secure Careers, Authentic Jobs, Trusted Hiring"
                  width={1200}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
              </div>

              {/* Floating badges */}
              <div className="hidden md:flex absolute -bottom-4 left-1/2 -translate-x-1/2 gap-4 z-20">
                <div className="px-4 py-2 bg-[#0a121e]/90 backdrop-blur-md border border-blue-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                  <Globe size={12} /> Global Reach
                </div>
                <div className="px-4 py-2 bg-[#0a121e]/90 backdrop-blur-md border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                  <Shield size={12} /> Verified Talent
                </div>
                <div className="px-4 py-2 bg-[#0a121e]/90 backdrop-blur-md border border-purple-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">
                  <Lock size={12} /> Encrypted
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-20 hidden md:block">
          <ChevronDown size={32} />
        </div>
      </section>

      {/* Feature Grid - Enhanced Cards */}
      <section className="py-32 px-6 relative z-10 bg-gradient-to-b from-transparent via-[#080f1a] to-transparent">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                <Zap size={12} fill="currentColor" /> Why Choose Profcaria
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
                Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Modern Careers</span>
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1 - Encrypted Vault */}
              <div className="group relative p-8 bg-gradient-to-br from-slate-900/60 to-slate-900/30 border border-white/5 rounded-3xl hover:border-blue-500/30 transition-all duration-500 backdrop-blur-3xl hover:shadow-2xl hover:shadow-blue-500/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                    <Lock size={28} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3">Encrypted Vault</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Every document, every detail, and every communication is encrypted locally. Your data belongs to you, secured by advanced algorithms.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    <Shield size={14} /> Bank-grade Security
                  </div>
                </div>
              </div>

              {/* Card 2 - Direct Hiring */}
              <div className="group relative p-8 bg-gradient-to-br from-slate-900/60 to-slate-900/30 border border-white/5 rounded-3xl hover:border-emerald-500/30 transition-all duration-500 backdrop-blur-3xl hover:shadow-2xl hover:shadow-emerald-500/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                    <Building2 size={28} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3">Direct Hiring</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Connect directly with verified employers. No middlemen, no spam — just real opportunities that match your expertise and goals.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    <Users size={14} /> Verified Employers
                  </div>
                </div>
              </div>

              {/* Card 3 - Verified History */}
              <div className="group relative p-8 bg-gradient-to-br from-slate-900/60 to-slate-900/30 border border-white/5 rounded-3xl hover:border-purple-500/30 transition-all duration-500 backdrop-blur-3xl hover:shadow-2xl hover:shadow-purple-500/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300">
                    <Shield size={28} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3">Verified History</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Build a portfolio of verified achievements. Present a career narrative backed by immutable records that employers trust.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    <Check size={14} /> Trusted Records
                  </div>
                </div>
              </div>

              {/* Card 4 - Smart Matching */}
              <div className="group relative p-8 bg-gradient-to-br from-slate-900/60 to-slate-900/30 border border-white/5 rounded-3xl hover:border-cyan-500/30 transition-all duration-500 backdrop-blur-3xl hover:shadow-2xl hover:shadow-cyan-500/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-300">
                    <SlidersHorizontal size={28} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3">Smart Matching</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    AI-powered matching connects you with roles that fit your skills, experience level, and career aspirations perfectly.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    <Zap size={14} /> ML-Powered
                  </div>
                </div>
              </div>

              {/* Card 5 - Zero Spam */}
              <div className="group relative p-8 bg-gradient-to-br from-slate-900/60 to-slate-900/30 border border-white/5 rounded-3xl hover:border-orange-500/30 transition-all duration-500 backdrop-blur-3xl hover:shadow-2xl hover:shadow-orange-500/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-400 mb-6 group-hover:scale-110 group-hover:bg-orange-500/20 transition-all duration-300">
                    <BellOff size={28} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3">Zero Spam</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    No recruiter spam. No cold outreach. No ads. Just authentic job opportunities and meaningful career connections.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    <Ban size={14} /> Ad-Free Platform
                  </div>
                </div>
              </div>

              {/* Card 6 - Global Access */}
              <div className="group relative p-8 bg-gradient-to-br from-slate-900/60 to-slate-900/30 border border-white/5 rounded-3xl hover:border-pink-500/30 transition-all duration-500 backdrop-blur-3xl hover:shadow-2xl hover:shadow-pink-500/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 group-hover:bg-pink-500/20 transition-all duration-300">
                    <Globe size={28} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3">Global Access</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Access opportunities worldwide. Connect with international employers and explore careers without geographical limits.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-pink-400 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight size={14} /> Worldwide Reach
                  </div>
                </div>
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
                  <a href="https://www.linkedin.com/company/profcaria" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                    {/* LinkedIn Logo SVG */}
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect width="4" height="12" x="2" y="9" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal className="relative h-full">
            <div className="h-full bg-[#0a121e] border border-slate-800/60 rounded-[40px] p-8 md:p-10 relative overflow-hidden group hover:border-blue-500/20 transition-all duration-500">

              {/* Header */}
              <div className="mb-6 relative z-10">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Why Profcaria?</h3>

                {/* Toggle Buttons */}
                <div className="flex gap-2 mt-4 flex-wrap">
                  <button
                    onClick={() => setActiveTab('painpoints')}
                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'painpoints'
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50'
                      }`}
                  >
                    Pain Points
                  </button>
                  <button
                    onClick={() => setActiveTab('features')}
                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'features'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50'
                      }`}
                  >
                    Features
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'security'
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700/50'
                      }`}
                  >
                    Security
                  </button>
                </div>
              </div>

              {/* Content based on active tab */}
              <div className="space-y-5 relative z-10">

                {activeTab === 'painpoints' ? (
                  <>
                    {/* Pain Point 1 - Recruiter Spam */}
                    <div className="flex gap-4 items-start group/item">
                      <div className="p-3 bg-red-900/10 rounded-xl text-red-400 border border-red-900/20 group-hover/item:border-red-500/30 transition-colors">
                        <Ban size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">Endless Recruiter Spam</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          Professionals drowning in unsolicited InMail and cold outreach from recruiters.
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 text-xs font-black uppercase">
                        <Check size={16} />
                        <span>Solved</span>
                      </div>
                    </div>

                    {/* Pain Point 2 - Data Sold */}
                    <div className="flex gap-4 items-start group/item">
                      <div className="p-3 bg-orange-900/10 rounded-xl text-orange-400 border border-orange-900/20 group-hover/item:border-orange-500/30 transition-colors">
                        <EyeOff size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">Your Data Gets Sold</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          Traditional platforms profit by selling your personal information to advertisers.
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 text-xs font-black uppercase">
                        <Check size={16} />
                        <span>Solved</span>
                      </div>
                    </div>

                    {/* Pain Point 3 - Malware in Resumes */}
                    <div className="flex gap-4 items-start group/item">
                      <div className="p-3 bg-purple-900/10 rounded-xl text-purple-400 border border-purple-900/20 group-hover/item:border-purple-500/30 transition-colors">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">Resume File Malware</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          PDF and document uploads create security vulnerabilities for employers.
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 text-xs font-black uppercase">
                        <Check size={16} />
                        <span>Solved</span>
                      </div>
                    </div>

                    {/* Pain Point 4 - Fake Jobs */}
                    <div className="flex gap-4 items-start group/item">
                      <div className="p-3 bg-amber-900/10 rounded-xl text-amber-400 border border-amber-900/20 group-hover/item:border-amber-500/30 transition-colors">
                        <Ban size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">Fake Job Postings</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          Professionals waste time applying to ghost jobs and scam listings.
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 text-xs font-black uppercase">
                        <Check size={16} />
                        <span>Solved</span>
                      </div>
                    </div>

                    {/* Pain Point 5 - No Verification */}
                    <div className="flex gap-4 items-start group/item">
                      <div className="p-3 bg-blue-900/10 rounded-xl text-blue-400 border border-blue-900/20 group-hover/item:border-blue-500/30 transition-colors">
                        <Shield size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">Unverified Profiles</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          Employers can't trust candidate credentials and work history claims.
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 text-xs font-black uppercase">
                        <Check size={16} />
                        <span>Solved</span>
                      </div>
                    </div>

                    {/* Pain Point 6 - Irrelevant Matches */}
                    <div className="flex gap-4 items-start group/item">
                      <div className="p-3 bg-cyan-900/10 rounded-xl text-cyan-400 border border-cyan-900/20 group-hover/item:border-cyan-500/30 transition-colors">
                        <SlidersHorizontal size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">Poor Job Matching</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          Generic algorithms show irrelevant jobs and unqualified candidates.
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-400 text-xs font-black uppercase">
                        <Check size={16} />
                        <span>Solved</span>
                      </div>
                    </div>
                  </>
                ) : activeTab === 'features' ? (
                  <>
                    {/* Feature 1 - Document Storage */}
                    <div className="flex gap-4 items-start group/item">
                      <div className="p-3 bg-blue-900/10 rounded-xl text-blue-400 border border-blue-900/20 group-hover/item:border-blue-500/30 transition-colors">
                        <FileEdit size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">Document Storage</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          Write, save all your documents within Profcaria. Your career artifacts, all in one secure place.
                        </p>
                      </div>
                    </div>

                    {/* Feature 2 - Direct Connections */}
                    <div className="flex gap-4 items-start group/item">
                      <div className="p-3 bg-emerald-900/10 rounded-xl text-emerald-400 border border-emerald-900/20 group-hover/item:border-emerald-500/30 transition-colors">
                        <Link2 size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">Direct Connections</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          Make direct connections and employment within the system. No middlemen, just opportunities.
                        </p>
                      </div>
                    </div>

                    {/* Feature 3 - Smart Preferences */}
                    <div className="flex gap-4 items-start group/item">
                      <div className="p-3 bg-purple-900/10 rounded-xl text-purple-400 border border-purple-900/20 group-hover/item:border-purple-500/30 transition-colors">
                        <SlidersHorizontal size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">Smart Preferences</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          Adjust your preferences to jobs you want. Filter by experience level e.g. 2 years, 5 years or 10 years etc.
                        </p>
                      </div>
                    </div>

                    {/* Feature 4 - Best Analytics */}
                    <div className="flex gap-4 items-start group/item">
                      <div className="p-3 bg-amber-900/10 rounded-xl text-amber-400 border border-amber-900/20 group-hover/item:border-amber-500/30 transition-colors">
                        <BarChart3 size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">Best Analytics</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          Get the best analytics of jobs posted. Insights that help you make smarter career decisions.
                        </p>
                      </div>
                    </div>

                    {/* Feature 5 - No Ads */}
                    <div className="flex gap-4 items-start group/item">
                      <div className="p-3 bg-red-900/10 rounded-xl text-red-400 border border-red-900/20 group-hover/item:border-red-500/30 transition-colors">
                        <BellOff size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">No Ads</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          Zero advertisements for a cleaner experience. Focus on what matters — your career.
                        </p>
                      </div>
                    </div>

                    {/* Feature 6 - In-System Chat */}
                    <div className="flex gap-4 items-start group/item">
                      <div className="p-3 bg-cyan-900/10 rounded-xl text-cyan-400 border border-cyan-900/20 group-hover/item:border-cyan-500/30 transition-colors">
                        <MessageSquare size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">In-System Chat</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          Chat and text within the system. No more need to send emails unless absolutely needed.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Security 1 - Privacy First Engine */}
                    <div className="flex gap-4 items-start group/item">
                      <div className="p-3 bg-blue-900/10 rounded-xl text-blue-400 border border-blue-900/20 group-hover/item:border-blue-500/30 transition-colors">
                        <EyeOff size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1">Privacy First Engine</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          Zero tracking. We never sell your data. You are free from the noise of traditional networks.
                        </p>
                      </div>
                    </div>

                    {/* Security 2 - Malware Shield */}
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

                    {/* Security 3 - End-to-End Encryption */}
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

                    {/* Security 4 - Zero Recruiter Spam */}
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

                    {/* Security 5 - You Own Your Data */}
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
                  </>
                )}

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
            <Link href="/contact" className="hover:text-blue-500 transition-colors">Contact Us</Link>
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