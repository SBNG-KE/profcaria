import { Scale, FileText, Clock, Mail, Globe, Shield } from 'lucide-react';

export default function LegalPage() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header */}
            <div className="space-y-6">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10">
                    <Scale size={32} />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">
                    Legal <span className="text-slate-600">&</span> Compliance
                </h1>
                <p className="text-xl text-slate-400 leading-relaxed font-light">
                    Terms of Service, Privacy Policy, and our commitment to operating within global regulatory frameworks.
                </p>
            </div>

            {/* Status Card */}
            <div className="p-10 border border-yellow-500/20 rounded-[30px] bg-yellow-900/5 backdrop-blur-xl">
                <div className="flex flex-col items-center justify-center text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                        <Clock size={48} className="relative z-10 text-yellow-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-white">Legal Documents Under Review</h2>
                    <p className="text-slate-400 max-w-md">
                        Our legal team is currently finalizing the Terms of Service, Privacy Policy, and other legal documents to ensure full compliance with GDPR, CCPA, and other applicable regulations.
                    </p>
                    <p className="text-slate-400 max-w-md text-sm">
                        These documents will be published once we have obtained the necessary legal review and approvals.
                    </p>

                    <div className="inline-block px-4 py-2 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xs font-bold uppercase tracking-widest">
                        Status: Pending Legal Review
                    </div>
                </div>
            </div>

            {/* Core Principles */}
            <div className="bg-white/[0.02] border border-white/10 rounded-[30px] p-8 space-y-6">
                <h2 className="text-xl font-bold text-white">Our Core Principles</h2>
                <p className="text-slate-400">While our formal legal documents are being finalized, these are the principles that guide our platform:</p>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                            <Shield size={16} className="text-emerald-400" /> Privacy by Default
                        </h4>
                        <p className="text-sm text-slate-400">All personal data is encrypted. You control who sees your information.</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                            <Scale size={16} className="text-blue-400" /> Fair Use
                        </h4>
                        <p className="text-sm text-slate-400">The platform is for legitimate job seeking and hiring. Abuse is not tolerated.</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                            <Globe size={16} className="text-purple-400" /> Global Compliance
                        </h4>
                        <p className="text-sm text-slate-400">We aim to comply with GDPR, CCPA, and other privacy regulations worldwide.</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                            <FileText size={16} className="text-orange-400" /> Transparency
                        </h4>
                        <p className="text-sm text-slate-400">We are committed to being transparent about how we handle your data.</p>
                    </div>
                </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-500">
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5">
                    <strong className="text-slate-300 block mb-3">Company Details</strong>
                    <p>Profcaria Systems</p>
                    <p className="text-xs text-slate-600 mt-2">Registration details will be updated upon legal finalization</p>
                </div>
                <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5">
                    <strong className="text-slate-300 block mb-3">Contact Legal</strong>
                    <a href="mailto:legal@profcaria.com" className="hover:text-blue-400 transition-colors flex items-center gap-2">
                        <Mail size={14} /> legal@profcaria.com
                    </a>
                    <p className="text-xs text-slate-600 mt-2">For legal inquiries and compliance questions</p>
                </div>
            </div>

        </div>
    );
}
