import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';

export default function SecurityAuditPage() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            <div className="space-y-12 relative z-10">

                {/* Header */}
                <div className="space-y-6">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">
                        Security <span className="text-emerald-500">Audit</span>
                    </h1>
                    <p className="text-xl text-slate-400 leading-relaxed font-light">
                        Third-party verification of our cryptographic infrastructure and data handling practices.
                    </p>
                </div>

                {/* Status Card */}
                <div className="p-10 border border-emerald-500/20 rounded-[30px] bg-emerald-900/5 backdrop-blur-xl border-dashed">
                    <div className="flex flex-col items-center justify-center text-center space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                            <Lock size={48} className="relative z-10 text-emerald-400" />
                        </div>

                        <h2 className="text-2xl font-bold text-white">Audit In Progress</h2>
                        <p className="text-slate-400 max-w-md">
                            We are currently undergoing a comprehensive security audit by an independent firm to certify our Zero-Knowledge architecture and SOC 2 Type II compliance.
                        </p>

                        <div className="w-full max-w-xs bg-black/40 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[65%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        </div>
                        <div className="text-xs font-mono text-emerald-500">
                            PHASE 2: PENETRATION TESTING
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/5 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Target Standards</h3>
                    <div className="flex flex-wrap gap-4">
                        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-slate-300">ISO 27001</div>
                        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-slate-300">SOC 2 TYPE II</div>
                        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-slate-300">GDPR</div>
                    </div>
                </div>

            </div>
        </div>
    );
}
