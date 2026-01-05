//app/page.tsx

"use client"

import React, { useState, useEffect, useRef } from 'react';
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowRight,
  Shield,
  Lock,
  Zap,
  Globe,
  ChevronDown,
  Building2,
  Users
} from 'lucide-react';

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
              className="text-sm font-bold text-slate-400 hover:text-white transition-colors px-4 py-2"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/auth')}
              className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-white/5"
            >
              Get Started
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
              SECURE YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-emerald-400">LEGACY</span> IN THE CLOUD.
            </h1>
          </ScrollReveal>

          <ScrollReveal className="delay-200">
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Profcaria is a post-quantum encrypted ecosystem for professionals and employers.
              Manage your career artifacts with terminal-grade security.
            </p>
          </ScrollReveal>

          <ScrollReveal className="delay-300 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/auth')}
                className="group w-full md:w-auto px-10 py-5 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-3xl font-black uppercase tracking-[0.15em] text-xs transition-all shadow-2xl shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                Launch Dashboard <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                className="w-full md:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl font-black uppercase tracking-[0.15em] text-xs transition-all flex items-center justify-center gap-3 backdrop-blur-md"
              >
                Watch Trailer
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
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">AES-256 Encryption</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Every document, every detail, and every communication is encrypted locally before touching our servers. Your data belongs to you.
                </p>
              </div>

              {/* Card 2 */}
              <div className="group p-10 bg-slate-900/40 border border-white/5 rounded-[40px] hover:border-emerald-500/20 transition-all backdrop-blur-3xl hover:bg-emerald-500/5">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-8 group-hover:scale-110 transition-transform">
                  <Building2 size={32} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Employer Portal</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Manage talent with precision. Post secure job listings and evaluate pre-qualified professionals through our encrypted pipeline.
                </p>
              </div>

              {/* Card 3 */}
              <div className="group p-10 bg-slate-900/40 border border-white/5 rounded-[40px] hover:border-purple-500/20 transition-all backdrop-blur-3xl hover:bg-purple-500/5">
                <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 mb-8 group-hover:scale-110 transition-transform">
                  <Shield size={32} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Secure Contracts</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Legally binding, cryptographically signed contracts that protect both parties. Full version history and immutable logging.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* "Who We Are" Content Section */}
      <section className="py-32 px-6 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <ScrollReveal>
            <div className="space-y-12">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                  A SYSTEM BUILT FOR <br />
                  <span className="text-blue-500">TRUST.</span>
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  We started with a simple belief: Professional data is too sensitive for the traditional web.
                  Our mission is to create a digital vault where your career achievements are preserved and shared only on your terms.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <div className="text-4xl font-black text-white">99.9%</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Uptime Architecture</div>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-black text-emerald-500">256-BIT</div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Military Encryption</div>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-6">
                <div className="flex -space-x-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-[#050b14] bg-slate-800 overflow-hidden">
                      <Image src={`https://i.pravatar.cc/150?u=${i}`} alt="user" width={48} height={48} className="grayscale" unoptimized />
                    </div>
                  ))}
                  <div className="w-12 h-12 rounded-full border-4 border-[#050b14] bg-blue-600 flex items-center justify-center text-[10px] font-bold">
                    +12k
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Trusted by elite professionals worldwide</div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal className="relative">
            {/* Abstract visual */}
            <div className="aspect-[4/5] rounded-[60px] bg-gradient-to-br from-blue-900/50 to-slate-900/50 border border-white/5 relative overflow-hidden p-1">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
              <div className="w-full h-full bg-[#0a121e] rounded-[58px] flex items-center justify-center p-8">
                <div className="w-full space-y-4 animate-pulse">
                  <div className="h-4 bg-slate-800 rounded-full w-3/4"></div>
                  <div className="h-4 bg-slate-800 rounded-full w-1/2"></div>
                  <div className="h-32 bg-blue-500/10 border border-blue-500/20 rounded-3xl w-full"></div>
                  <div className="h-4 bg-slate-800 rounded-full w-2/3"></div>
                  <div className="h-4 bg-slate-800 rounded-full w-3/4"></div>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150">
                <Building2 size={200} className="text-white/5" />
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-10 -left-10 p-6 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-1000">
              <div className="flex items-center gap-4 text-emerald-400">
                <Users size={24} />
                <div>
                  <div className="text-sm font-black uppercase">Identity Verified</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Biometric Check OK</div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 relative z-10 bg-[#02060c]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-xl font-black text-white tracking-widest">PROFCARIA</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">&copy; 2026 Secured ecosystem. All rights reserved.</p>
          </div>
          <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <a href="#" className="hover:text-blue-500 transition-colors">Documentation</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Privacy Vault</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Legal</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Security Audit</a>
          </div>
        </div>
      </footer>

      {/* Aesthetic styles */}
      <style jsx global>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .reveal {
          animation: fade-up 1s forwards;
        }
      `}</style>
    </div>
  );
}