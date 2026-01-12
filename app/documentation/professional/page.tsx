import Link from 'next/link';
import {
    User,
    FileCheck,
    Briefcase,
    CheckCircle,
    MessageSquare,
    Bell,
    Search,
    Heart,
    Lock,
    Zap,
    Users
} from 'lucide-react';

export default function ProfessionalDocsPage() {
    return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header */}
            <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                    <User size={12} /> Professional Guide
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                    Complete Guide for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Professionals</span>
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
                    Everything you need to know about using Profcaria to find your next opportunity while keeping your data private and secure.
                </p>
            </div>

            {/* Quick Nav */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { title: "Getting Started", icon: Zap, href: "#getting-started" },
                    { title: "Your Profile", icon: User, href: "#profile" },
                    { title: "Finding Jobs", icon: Search, href: "#jobs" },
                    { title: "Connections", icon: Users, href: "#connections" }
                ].map((item) => (
                    <a key={item.title} href={item.href} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all group">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:scale-110 transition-transform">
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
                    <div className="p-3 bg-blue-900/20 rounded-2xl border border-blue-500/20 text-blue-400">
                        <Zap size={28} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Getting Started</h2>
                        <p className="text-slate-400 max-w-3xl leading-relaxed">
                            Create your account in under 2 minutes. Here's what happens:
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">1</div>
                        <h3 className="text-lg font-bold text-white">Sign Up</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Enter your email and create a strong password. Your account is immediately protected with enterprise-grade encryption.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">2</div>
                        <h3 className="text-lg font-bold text-white">Set Up 2FA</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Two-Factor Authentication is required for all accounts. Verify with OTP or set up a passkey for passwordless login.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">3</div>
                        <h3 className="text-lg font-bold text-white">Set Preferences</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Tell us what you're looking for: target roles, work mode (remote/hybrid/onsite), and locations. This helps our algorithm match you to relevant jobs.
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 2: Your Profile */}
            <section id="profile" className="space-y-8 scroll-mt-24">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-900/20 rounded-2xl border border-emerald-500/20 text-emerald-400">
                        <User size={28} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Your Profile</h2>
                        <p className="text-slate-400 max-w-3xl leading-relaxed">
                            Your profile is your digital career identity. Here's what you can add:
                        </p>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/10 rounded-[30px] p-8 space-y-6">
                    <h3 className="text-lg font-bold text-white">Profile Sections</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Personal Information</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Name (encrypted)</li>
                                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Email (encrypted)</li>
                                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Profile Photo (optional)</li>
                                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Headline / Current Role</li>
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Career Details</h4>
                            <ul className="space-y-2 text-sm text-slate-400">
                                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Resume / CV</li>
                                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Education History</li>
                                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Skills & Expertise</li>
                                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-emerald-500" /> Certifications</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-orange-500/5 border border-orange-500/20">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                        <Lock size={18} className="text-orange-400" /> No PDF Uploads Required
                    </h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Unlike other platforms, you don't upload your resume as a PDF. You enter your information directly into our system where it's immediately encrypted. This means:
                    </p>
                    <ul className="mt-3 space-y-1 text-sm text-slate-400">
                        <li>• No malware risk from PDF exploits</li>
                        <li>• No wondering what happens to your file</li>
                        <li>• Your data stays encrypted and under your control</li>
                        <li>• Update once, it reflects everywhere</li>
                    </ul>
                </div>
            </section>

            {/* Section 3: Finding Jobs */}
            <section id="jobs" className="space-y-8 scroll-mt-24">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-900/20 rounded-2xl border border-purple-500/20 text-purple-400">
                        <Search size={28} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Finding Jobs</h2>
                        <p className="text-slate-400 max-w-3xl leading-relaxed">
                            Our smart matching algorithm finds jobs that fit you. The system is continuously being improved with the best features available.
                        </p>
                    </div>
                </div>

                <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                        <Zap size={18} className="text-blue-400" /> Algorithm Under Active Development
                    </h4>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        Our matching algorithm is continuously being refined to its finest. We're implementing the best available technologies to ensure you see the most relevant opportunities based on your preferences and skills.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                        <Search size={24} className="text-blue-400" />
                        <h3 className="text-lg font-bold text-white">Job Feed</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Jobs are ranked by how well they match your preferences. Higher matching jobs appear first. Scroll through to find opportunities that fit you.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                        <Heart size={24} className="text-red-400" />
                        <h3 className="text-lg font-bold text-white">Save Jobs</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Bookmark interesting jobs to review later. Access your saved jobs from the "Saved" tab. Once you apply, the job is automatically removed from saved.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                        <FileCheck size={24} className="text-emerald-400" />
                        <h3 className="text-lg font-bold text-white">Apply</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            When you apply, the employer gains access to your resume and profile information. Answer their custom questions to complete your application.
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 4: Connections */}
            <section id="connections" className="space-y-8 scroll-mt-24">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-900/20 rounded-2xl border border-indigo-500/20 text-indigo-400">
                        <Users size={28} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Connections & Work History</h2>
                        <p className="text-slate-400 max-w-3xl leading-relaxed">
                            Your employment history is built through verified connections with employers.
                        </p>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/10 rounded-[30px] p-8 space-y-6">
                    <h3 className="text-lg font-bold text-white">How Connections Work</h3>
                    <p className="text-sm text-slate-400 mb-4">
                        When you work with an employer through Profcaria, that creates a "connection" - a verified record of your employment.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                            <h4 className="text-white font-bold mb-2">Previous Employments</h4>
                            <p className="text-sm text-slate-400">Your connections appear as verified previous employments on your profile. Future employers can see these when viewing your full profile.</p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                            <h4 className="text-white font-bold mb-2">What Employers See</h4>
                            <p className="text-sm text-slate-400">After you apply, employers can view your resume and connection history (previous employments made through the platform).</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 5: Messages */}
            <section id="messages" className="space-y-8 scroll-mt-24 pb-20">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-cyan-900/20 rounded-2xl border border-cyan-500/20 text-cyan-400">
                        <MessageSquare size={28} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Messages & Invites</h2>
                        <p className="text-slate-400 max-w-3xl leading-relaxed">
                            Communicate securely with employers through our encrypted messaging system.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                        <Bell size={24} className="text-yellow-400" />
                        <h3 className="text-lg font-bold text-white">Job Invites</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Employers can send you invites to apply for their jobs. These appear in your inbox and as priority items in your feed. You choose whether to respond.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                        <MessageSquare size={24} className="text-blue-400" />
                        <h3 className="text-lg font-bold text-white">Secure Chat</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            All messages between you and employers are encrypted. Discuss opportunities, ask questions, and negotiate - all within a secure environment.
                        </p>
                    </div>
                </div>
            </section>

        </div>
    );
}
