import { ShieldCheck, Lock, CheckCircle, Clock, FileText, AlertCircle } from 'lucide-react';

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
                        Security <span className="text-emerald-500">&</span> Privacy
                    </h1>
                    <p className="text-xl text-slate-400 leading-relaxed font-light">
                        How we protect your data and ensure your privacy on Profcaria.
                    </p>
                </div>

                {/* Security Features */}
                <div className="bg-white/[0.02] border border-white/10 rounded-[30px] p-8 space-y-6">
                    <h2 className="text-xl font-bold text-white">Security Implementation</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle size={18} className="text-emerald-400 mt-1" />
                                <div>
                                    <h4 className="font-bold text-white">AES-256-GCM Encryption</h4>
                                    <p className="text-sm text-slate-400">All personal data encrypted with military-grade encryption</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle size={18} className="text-emerald-400 mt-1" />
                                <div>
                                    <h4 className="font-bold text-white">Secure Password Storage</h4>
                                    <p className="text-sm text-slate-400">Industry-leading password protection algorithms</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle size={18} className="text-emerald-400 mt-1" />
                                <div>
                                    <h4 className="font-bold text-white">Rate Limiting</h4>
                                    <p className="text-sm text-slate-400">Protection against brute force and DDoS attacks</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle size={18} className="text-emerald-400 mt-1" />
                                <div>
                                    <h4 className="font-bold text-white">XSS Protection</h4>
                                    <p className="text-sm text-slate-400">DOMPurify sanitization on all user content</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle size={18} className="text-emerald-400 mt-1" />
                                <div>
                                    <h4 className="font-bold text-white">Security Headers</h4>
                                    <p className="text-sm text-slate-400">X-Frame-Options, CSP, and more</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle size={18} className="text-emerald-400 mt-1" />
                                <div>
                                    <h4 className="font-bold text-white">Two-Factor Authentication</h4>
                                    <p className="text-sm text-slate-400">Mandatory OTP verification with passkey support</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Status */}
                <div className="p-10 border border-yellow-500/20 rounded-[30px] bg-yellow-900/5 backdrop-blur-xl">
                    <div className="flex flex-col items-center justify-center text-center space-y-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                            <Clock size={48} className="relative z-10 text-yellow-400" />
                        </div>

                        <h2 className="text-2xl font-bold text-white">Third-Party Audit Pending</h2>
                        <p className="text-slate-400 max-w-md">
                            We are preparing for a comprehensive third-party security audit. Once completed, we will share the results here to provide full transparency about our security practices.
                        </p>

                        <div className="inline-block px-4 py-2 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xs font-bold uppercase tracking-widest">
                            Status: Awaiting Audit Schedule
                        </div>
                    </div>
                </div>

                {/* Privacy Commitment */}
                <div className="bg-white/[0.02] border border-white/10 rounded-[30px] p-8 space-y-6">
                    <h2 className="text-xl font-bold text-white">Our Privacy Commitment</h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                                <Lock size={16} className="text-emerald-400" /> Data Ownership
                            </h4>
                            <p className="text-sm text-slate-400">You own your data. Only employers you apply to can access your information.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                                <ShieldCheck size={16} className="text-blue-400" /> No Data Selling
                            </h4>
                            <p className="text-sm text-slate-400">We never sell, rent, or share your personal data with third parties.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                                <FileText size={16} className="text-purple-400" /> Minimal Collection
                            </h4>
                            <p className="text-sm text-slate-400">We only collect data necessary for the platform to function.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                                <AlertCircle size={16} className="text-orange-400" /> Local ML Processing
                            </h4>
                            <p className="text-sm text-slate-400">Our AI matching runs locally - your data is never sent to external AI services.</p>
                        </div>
                    </div>
                </div>

                {/* Target Standards */}
                <div className="pt-8 border-t border-white/5 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Target Compliance Standards</h3>
                    <div className="flex flex-wrap gap-4">
                        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-slate-300">GDPR</div>
                        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-slate-300">CCPA</div>
                        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-slate-300">ISO 27001</div>
                        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-mono text-slate-300">SOC 2</div>
                    </div>
                </div>

            </div>
        </div>
    );
}
