import Link from 'next/link';
import { ArrowLeft, EyeOff, Server, Key, Database } from 'lucide-react';

export default function PrivacyVaultPage() {
    return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">

            {/* Background decoration */}
            <div className="absolute top-[20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-4xl mx-auto space-y-16 relative z-10">

                {/* Header */}
                <div className="text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
                        Transparency Center
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
                        THE SECURITY & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">PRIVACY VAULT</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        We believe your data is your property. This page details exactly how we protect it, where it lives, and why we can't sell it even if we wanted to.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Card 1 */}
                    <div className="p-8 bg-slate-900/40 border border-white/10 rounded-[30px] hover:border-blue-500/30 transition-colors">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-6">
                            <Key size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Zero-Knowledge Architecture</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            We use AES-256 encryption for all sensitive artifacts. The decryption keys are derived from your credentials and never stored in plain text on our servers. This means <strong>we cannot read your documents</strong>.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="p-8 bg-slate-900/40 border border-white/10 rounded-[30px] hover:border-purple-500/30 transition-colors">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-6">
                            <EyeOff size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">No Tracking, No Ads</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Our business model is simple: Employers pay for access to verified talent. We do not sell user data to advertisers, brokers, or third parties. You are the customer, not the product.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="p-8 bg-slate-900/40 border border-white/10 rounded-[30px] hover:border-indigo-500/30 transition-colors">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 mb-6">
                            <Database size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Data Sovereignty</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Your data is stored in redundant, secure data centers with strict access controls. You have the right to request a full export or deletion of your data at any time (Right to be Forgotten).
                        </p>
                    </div>

                    {/* Card 4 */}
                    <div className="p-8 bg-slate-900/40 border border-white/10 rounded-[30px] hover:border-emerald-500/30 transition-colors">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-6">
                            <Server size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Canary Statement</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            As of {new Date().toLocaleDateString()}, Profcaria has not received any national security letters or secret court orders subject to a gag order.
                        </p>
                    </div>

                </div>

                <div className="text-center pt-10 border-t border-white/5">
                    <p className="text-slate-500 text-sm">
                        Last Updated: {new Date().toLocaleDateString()}
                    </p>
                </div>

            </div>
        </div>
    );
}
