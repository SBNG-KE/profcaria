import Link from 'next/link';
import {
    Briefcase,
    Search,
    CreditCard,
    UserCheck,
    FileText,
    Globe,
    Users,
    MessageSquare,
    Zap,
    CheckCircle,
    Eye,
    BarChart3,
    Bell
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
                    Complete Guide for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Employers</span>
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
                    Everything you need to know about finding, evaluating, and hiring top talent through Profcaria.
                </p>
            </div>

            {/* Quick Nav */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { title: "Getting Started", icon: Zap, href: "#getting-started" },
                    { title: "Post Jobs", icon: Briefcase, href: "#jobs" },
                    { title: "Find Talent", icon: Search, href: "#search" },
                    { title: "Plans & Billing", icon: CreditCard, href: "#billing" }
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

            {/* Section 1: Getting Started */}
            <section id="getting-started" className="space-y-8 scroll-mt-24">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-900/20 rounded-2xl border border-emerald-500/20 text-emerald-400">
                        <Zap size={28} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Getting Started</h2>
                        <p className="text-slate-400 max-w-3xl leading-relaxed">
                            Set up your company account in minutes. Here's the process:
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">1</div>
                        <h3 className="text-lg font-bold text-white">Create Company Account</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Sign up with your work email and company name. Your account is immediately protected with enterprise-grade encryption.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">2</div>
                        <h3 className="text-lg font-bold text-white">Set Up 2FA</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Two-Factor Authentication is required for all accounts. Verify with OTP or set up a passkey for passwordless login.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">3</div>
                        <h3 className="text-lg font-bold text-white">Complete Company Profile</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Add your company logo, description, and website. This helps candidates recognize your brand and learn about your culture.
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 2: Posting Jobs */}
            <section id="jobs" className="space-y-8 scroll-mt-24">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-900/20 rounded-2xl border border-blue-500/20 text-blue-400">
                        <Briefcase size={28} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Posting Jobs</h2>
                        <p className="text-slate-400 max-w-3xl leading-relaxed">
                            Create job listings that reach the right candidates automatically.
                        </p>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/10 rounded-[30px] p-8 space-y-6">
                    <h3 className="text-lg font-bold text-white">What's in a Job Listing</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Job Details</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Job Title</li>
                                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Description & Requirements</li>
                                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Role Category (Engineering, Design, etc.)</li>
                                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Employment Type (Full-time, Contract, etc.)</li>
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Location & Settings</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Work Mode (Remote, Hybrid, Onsite)</li>
                                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Location (if applicable)</li>
                                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Geographic Restrictions (optional)</li>
                                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Application Limits</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/20">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                        <FileText size={18} className="text-purple-400" /> Custom Application Forms
                    </h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Create custom application forms with questions specific to your role. Candidates answer these when applying, giving you the information you need upfront.
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                        <Zap size={18} className="text-blue-400" /> Smart Matching
                    </h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        When you post a job, our system automatically matches it to relevant candidates. The matching algorithm is continuously being improved with the best available technologies to ensure quality applications.
                    </p>
                </div>
            </section>

            {/* Section 3: Finding Talent */}
            <section id="search" className="space-y-8 scroll-mt-24">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-900/20 rounded-2xl border border-indigo-500/20 text-indigo-400">
                        <Search size={28} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Finding & Evaluating Talent</h2>
                        <p className="text-slate-400 max-w-3xl leading-relaxed">
                            Review applications and find your ideal candidates.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                        <Users size={24} className="text-indigo-400" />
                        <h3 className="text-lg font-bold text-white">Applications Dashboard</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            View all applications in one place. See candidate responses to your custom questions and evaluate their fit for the role.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                        <BarChart3 size={24} className="text-cyan-400" />
                        <h3 className="text-lg font-bold text-white">Match Indicators</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Our system indicates how well each candidate matches your job requirements based on their profile and preferences.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                        <Eye size={24} className="text-orange-400" />
                        <h3 className="text-lg font-bold text-white">Candidate Profiles</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            When a candidate applies, you can view their resume and connection history (previous employments made through the platform).
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                        <MessageSquare size={24} className="text-emerald-400" />
                        <h3 className="text-lg font-bold text-white">Secure Messaging</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Communicate with candidates through encrypted messaging. Discuss the role, schedule interviews, and move forward securely.
                        </p>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                        <Bell size={18} className="text-emerald-400" /> Invite to Apply
                    </h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Found a matching candidate? Send them an invite to apply for your job. They'll receive a notification and your job moves to the top of their feed.
                    </p>
                </div>
            </section>

            {/* Section 4: Plans & Billing */}
            <section id="billing" className="space-y-8 scroll-mt-24 pb-20">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-900/20 rounded-2xl border border-purple-500/20 text-purple-400">
                        <CreditCard size={28} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Plans & Billing</h2>
                        <p className="text-slate-400 max-w-3xl leading-relaxed">
                            Simple, transparent pricing for your hiring needs.
                        </p>
                    </div>
                </div>

                <div className="p-10 border border-white/10 rounded-[30px] bg-white/[0.02] backdrop-blur-xl">
                    <div className="flex flex-col items-center justify-center text-center space-y-6">
                        <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-400">
                            <Globe size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Competitive Rates</h3>
                        <p className="text-slate-400 max-w-md leading-relaxed">
                            Our pricing is ever-changing to match market conditions, but we always offer better rates than traditional platforms. We believe in making quality hiring accessible to everyone.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-sm text-emerald-400 font-bold">
                                Cheaper
                            </div>
                            <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 font-bold">
                                Fair
                            </div>
                            <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm text-purple-400 font-bold">
                                Free Tier Available
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
}
