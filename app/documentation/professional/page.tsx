import Link from 'next/link';
import {
    User,
    FileCheck,
    Shield,
    Briefcase,
    CheckCircle,
    Key,
    Share2,
    Eye
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
                    Building Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Verified Legacy</span>
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
                    The Professional Dashboard is your command center. Here you verify your history, manage encrypted artifacts, and control exactly who sees your data.
                </p>
            </div>

            {/* Table of Contents / Quick Nav */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { title: "Artifact Management", icon: FileCheck, href: "#artifacts" },
                    { title: "Job Applications", icon: Briefcase, href: "#applications" },
                    { title: "Privacy Controls", icon: Shield, href: "#privacy" }
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

            {/* Section 1: Artifacts */}
            <section id="artifacts" className="space-y-8 scroll-mt-24">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-900/20 rounded-2xl border border-blue-500/20 text-blue-400">
                        <FileCheck size={28} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Artifact Management</h2>
                        <p className="text-slate-400 max-w-3xl leading-relaxed">
                            "Artifacts" are the core building blocks of your Profcaria profile. Unlike a traditional resume which is just text, an Artifact is a verified data object.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400 border border-blue-500/30">1</span>
                            Creating an Artifact
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Navigate to the <strong>My Artifacts</strong> tab. You can create artifacts for Education, Employment, Certifications, or Skills. Each entry is encrypted locally before being saved.
                        </p>
                        <div className="p-4 rounded-lg bg-black/40 border border-white/5 text-xs font-mono text-slate-500">
                            Example: Adding a Degree<br />
                            1. Click "Add Artifact"<br />
                            2. Select "Education"<br />
                            3. Upload Diploma (PDF/Img) - Encrypted instantly<br />
                            4. Save
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs text-emerald-400 border border-emerald-500/30">2</span>
                            Verification Status
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Artifacts have three states:
                        </p>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-500"></span> Unverified (Self-reported)
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Pending Review
                            </li>
                            <li className="flex items-center gap-2 text-emerald-400 font-bold">
                                <CheckCircle size={14} /> Verified (Cryptographically Signed)
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Section 2: Applications */}
            <section id="applications" className="space-y-8 scroll-mt-24">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-900/20 rounded-2xl border border-indigo-500/20 text-indigo-400">
                        <Briefcase size={28} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Connections & Jobs</h2>
                        <p className="text-slate-400 max-w-3xl leading-relaxed">
                            Profcaria reverses the traditional job search. Instead of spamming resumes, you curate a profile and Employers apply to <em>you</em> or you apply to specific verified openings.
                        </p>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/10 rounded-[30px] p-8">
                    <h3 className="text-lg font-bold text-white mb-6">The Handshake Protocol</h3>
                    <div className="relative border-l border-white/10 ml-3 space-y-10 pl-8 py-2">

                        <div className="relative">
                            <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-indigo-500 border-4 border-[#050b14]"></div>
                            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-1">Step 1: Invitation</h4>
                            <p className="text-sm text-slate-400">
                                An Employer finds your anonymized profile summary (Skills & verified badges only). They send an "Invite to Connect".
                            </p>
                        </div>

                        <div className="relative">
                            <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-indigo-500/50 border-4 border-[#050b14]"></div>
                            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-1">Step 2: Key Exchange</h4>
                            <p className="text-sm text-slate-400">
                                If you accept the invite, a cryptographic key exchange occurs. This grants the Employer temporary read-access to your encrypted text data (Name, Resume details).
                            </p>
                        </div>

                        <div className="relative">
                            <div className="absolute -left-[41px] top-1 w-5 h-5 rounded-full bg-indigo-500/20 border-4 border-[#050b14]"></div>
                            <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-1">Step 3: Interview & Offer</h4>
                            <p className="text-sm text-slate-400">
                                Communication happens over encrypted channels. Offers are digitally signed contracts stored in your vault.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* Section 3: Privacy */}
            <section id="privacy" className="space-y-8 scroll-mt-24 pb-20">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-900/20 rounded-2xl border border-emerald-500/20 text-emerald-400">
                        <Shield size={28} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">Privacy Controls</h2>
                        <p className="text-slate-400 max-w-3xl leading-relaxed">
                            You have granular control over visibility.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 border border-white/10 rounded-2xl bg-slate-900/20">
                        <div className="mb-4 text-slate-400"><Eye size={24} /></div>
                        <h4 className="font-bold text-white mb-2">Public Profile</h4>
                        <p className="text-xs text-slate-500">
                            Controls what is visible to public search engines. Default: <span className="text-emerald-400">OFF</span>.
                        </p>
                    </div>

                    <div className="p-5 border border-white/10 rounded-2xl bg-slate-900/20">
                        <div className="mb-4 text-slate-400"><Share2 size={24} /></div>
                        <h4 className="font-bold text-white mb-2">Employer Discovery</h4>
                        <p className="text-xs text-slate-500">
                            Allow verified employers to find you in internal search. Default: <span className="text-blue-400">ON</span>.
                        </p>
                    </div>

                    <div className="p-5 border border-white/10 rounded-2xl bg-slate-900/20">
                        <div className="mb-4 text-slate-400"><Key size={24} /></div>
                        <h4 className="font-bold text-white mb-2">Access Revocation</h4>
                        <p className="text-xs text-slate-500">
                            You can revoke an Employer's access to your data at any time, instantly cutting off their decryption keys.
                        </p>
                    </div>
                </div>
            </section>

        </div>
    );
}
