import Link from 'next/link';
import {
    Briefcase,
    Search,
    ShieldCheck,
    CreditCard,
    UserCheck,
    Filter,
    FileText,
    Globe,
    ArrowRight
} from 'lucide-react';

export default function EmployerDocsPage() {
    return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header */}
            <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                    <Briefcase size={12} /> Employer Guide
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                    Elite <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Talent Acquisition</span>
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
                    Access a pool of pre-verified professionals. Eliminate background check delays and hire with confidence using our encrypted verification layer.
                </p>
            </div>

            {/* Table of Contents / Quick Nav */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { title: "Talent Search", icon: Search, href: "#search" },
                    { title: "Verification", icon: ShieldCheck, href: "#verification" },
                    { title: "Subscriptions", icon: CreditCard, href: "#billing" }
                ].map((item) => (
                    <a key={item.title} href={item.href} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-emerald-500/30 transition-all group">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:scale-110 transition-transform">
                            <item.icon size={18} />
                        </div>
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white">{item.title}</span>
                    </a>
                ))}
            </div>

            <hr className="border-white/5" />

            {/* Section 1: Search */}
            <section id="search" className="space-y-8 scroll-mt-24">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-900/20 rounded-2xl border border-emerald-500/20 text-emerald-400">
                        <Search size={28} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Finding Talent</h2>
                        <p className="text-slate-400 max-w-3xl leading-relaxed">
                            Our search engine indexes verified artifacts rather than keywords. This ensures that when you search for "Senior Engineer", you only see candidates with verified history matching that criteria.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Filter size={18} className="text-emerald-500" />
                            Advanced Filters
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed mb-4">
                            Narrow down your pool using:
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                            <div className="bg-black/40 p-2 rounded border border-white/5">Locations</div>
                            <div className="bg-black/40 p-2 rounded border border-white/5">Skills</div>
                            <div className="bg-black/40 p-2 rounded border border-white/5">Education Level</div>
                            <div className="bg-black/40 p-2 rounded border border-white/5">Yrs Experience</div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <UserCheck size={18} className="text-emerald-500" />
                            The Invite System
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            To protect candidate privacy, profiles are partially redacted until you send an <strong>Invite to Connect</strong>.
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="px-3 py-1 bg-slate-800 rounded text-xs text-slate-500 line-through">John Doe</div>
                            <div className="text-xs text-emerald-500">→ Invite Accepted →</div>
                            <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold">John Doe</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 2: Verification */}
            <section id="verification" className="space-y-8 scroll-mt-24">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-900/20 rounded-2xl border border-blue-500/20 text-blue-400">
                        <ShieldCheck size={28} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Instant Verification</h2>
                        <p className="text-slate-400 max-w-3xl leading-relaxed">
                            Profcaria serves as the "Source of Truth". When you view a candidate's profile, badges indicate data that has been cryptographically signed by issuing institutions or previous employers.
                        </p>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/10 rounded-[30px] p-8">
                    <h3 className="text-lg font-bold text-white mb-6">Verification Tiers</h3>
                    <div className="grid md:grid-cols-3 gap-6">

                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tier 1</div>
                            <h4 className="text-white font-bold mb-1">Self-Reported</h4>
                            <p className="text-xs text-slate-400">Claims made by the candidate without external proof. Marked with a grey indicator.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-500/20">
                            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Tier 2</div>
                            <h4 className="text-white font-bold mb-1">Document Verified</h4>
                            <p className="text-xs text-slate-400">PDF/Image uploaded and analyzed by our system. Marked with a blue badge.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-emerald-900/10 border border-emerald-500/20">
                            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Tier 3</div>
                            <h4 className="text-white font-bold mb-1">Source Verified</h4>
                            <p className="text-xs text-slate-400">Direct cryptographic signature from the issuer. Gold standard. Marked with gold/emerald badge.</p>
                        </div>

                    </div>
                </div>
            </section>

            {/* Section 3: Subscriptions */}
            <section id="billing" className="space-y-8 scroll-mt-24 pb-20">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-900/20 rounded-2xl border border-purple-500/20 text-purple-400">
                        <CreditCard size={28} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Plans & Billing</h2>
                        <p className="text-slate-400 max-w-3xl leading-relaxed">
                            Simple, transparent pricing based on your hiring volume.
                        </p>
                    </div>
                </div>

                <div className="p-10 border border-white/10 rounded-[30px] bg-slate-900/20 backdrop-blur-xl">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="p-6 bg-purple-500/10 rounded-full text-purple-400">
                            <CreditCard size={48} />
                        </div>
                        <div className="space-y-4 text-center md:text-left">
                            <h3 className="text-2xl font-bold text-white">Fair & Dynamic Pricing</h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                                We believe in fair pricing that reflects the current economic landscape. Our plans are variable and tailored to your organization's size and hiring volume.
                                We offer competitive rates designed to be accessible for startups while scaling effectively for enterprise needs.
                            </p>
                            <div className="pt-2">
                                <Link href="/contact" className="inline-flex items-center gap-2 text-purple-400 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors">
                                    Contact Sales for a Quote <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
