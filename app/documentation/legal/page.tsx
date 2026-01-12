import Link from 'next/link';
import { ArrowLeft, Scale, FileText } from 'lucide-react';

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
                    Terms of Service, Acceptable Use Policy, and our commitment to operating within global regulatory frameworks.
                </p>
            </div>

            {/* Content */}
            <div className="p-10 border border-white/10 rounded-[30px] bg-white/[0.02] backdrop-blur-xl text-center py-20">
                <FileText size={48} className="mx-auto text-slate-600 mb-6 opacity-50" />
                <h2 className="text-2xl font-bold text-white mb-4">Under Review</h2>
                <p className="text-slate-400 max-w-md mx-auto mb-8">
                    Our legal team is currently finalizing the updated Terms of Service and Privacy Policy to reflect our newest encryption standards.
                </p>
                <div className="inline-block px-4 py-2 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xs font-bold uppercase tracking-widest">
                    Status: Pending Final Approval
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-500">
                <div>
                    <strong className="text-slate-300 block mb-1">Company Registration</strong>
                    Profcaria Systems Inc.<br />
                    Delaware, USA
                </div>
                <div className="md:text-right">
                    <strong className="text-slate-300 block mb-1">Contact Legal</strong>
                    <a href="mailto:legal@profcaria.com" className="hover:text-blue-400 transition-colors">legal@profcaria.com</a>
                </div>
            </div>

        </div>
    );
}
