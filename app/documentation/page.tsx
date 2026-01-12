import Link from 'next/link';
import { ArrowRight, Book, Shield, Code, Users } from 'lucide-react';

export default function DocumentationHome() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header */}
            <div className="space-y-4 border-b border-light-white/10 pb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2">
                    <Book size={12} /> Official Docs
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                    Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Profcaria</span>
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
                    The definitive guide to navigating the Profcaria ecosystem. Learn how to secure your professional legacy, verify your history, and connect with elite employers in an encrypted environment.
                </p>
            </div>

            {/* Quick Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <Link href="/documentation/professional" className="group p-8 bg-slate-900/40 border border-white/5 rounded-3xl hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                        <Users size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">For Professionals</h3>
                    <p className="text-sm text-slate-400 mb-4 h-10">
                        Learn how to build your verified portfolio, manage artifacts, and apply to jobs securely.
                    </p>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-500">
                        Start Guide <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                <Link href="/documentation/employer" className="group p-8 bg-slate-900/40 border border-white/5 rounded-3xl hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                        <Code size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">For Employers</h3>
                    <p className="text-sm text-slate-400 mb-4 h-10">
                        Discover how to find verified talent, verify candidate history, and manage your organization.
                    </p>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-500">
                        Start Guide <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

            </div>

            {/* Core Concepts */}
            <div className="pt-10">
                <h2 className="text-2xl font-black text-white mb-8 tracking-tight">Core Concepts</h2>
                <div className="space-y-4">

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-6 items-start">
                        <div className="p-3 rounded-lg bg-orange-500/10 text-orange-400 mt-1">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2">The Privacy Vault</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                Profcaria is built on a "Privacy First" architecture. We do not sell data. Your artifacts are encrypted.
                                Understand how our Zero-Knowledge proof system works.
                            </p>
                            <Link href="/privacy-vault" className="text-xs font-bold uppercase tracking-widest text-white hover:text-orange-400 transition-colors border-b border-white/20 hover:border-orange-400 pb-0.5">
                                Read the Manifesto
                            </Link>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-6 items-start">
                        <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400 mt-1">
                            <Users size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2">Verified Artifacts</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Unlike traditional networks where anyone can claim anything, Profcaria relies on "Artifacts" -
                                verified pieces of history (Diplomas, Employment Records) that are cryptographically signed.
                            </p>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}
