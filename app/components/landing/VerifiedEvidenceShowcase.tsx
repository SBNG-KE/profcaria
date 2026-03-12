import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { ShieldCheck, TrendingUp, BarChart3, CheckCircle2, FileText, BadgeCheck, FileDigit } from 'lucide-react';

export default function VerifiedEvidenceShowcase() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <section className={`py-24 sm:py-32 relative overflow-hidden border-y ${isDark ? 'bg-black border-neutral-900' : 'bg-[#fafbfd] border-neutral-200'}`}>
            <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
                    <h2 className={`text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase mb-6 ${isDark ? 'text-white' : 'text-black'}`}>
                        Beyond the Traditional CV
                    </h2>
                    <p className={`text-lg md:text-xl font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        "Don't just upload a CV. Prove your skills with Verified Evidence built directly into your profile."
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
                    {/* Left: Diagram & Charts UI */}
                    <div className="relative">
                        {/* Decorative Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/10 dark:bg-blue-500/5 blur-[100px] rounded-full -z-10" />

                        <div className="space-y-6">
                            {/* Main Chart Card */}
                            <div className={`p-8 rounded-[32px] border shadow-2xl ${isDark ? 'bg-neutral-900/80 border-neutral-800 backdrop-blur-xl' : 'bg-white/80 border-neutral-200 backdrop-blur-xl shadow-blue-500/5'}`}>
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="text-blue-500" size={24} />
                                        <h3 className={`font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>Skill Verification Trajectory</h3>
                                    </div>
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500">
                                        Auto-Updating
                                    </span>
                                </div>
                                
                                {/* Mock Bar Chart */}
                                <div className="h-48 flex items-end gap-4 justify-between pt-4 border-b border-dashed border-neutral-200 dark:border-neutral-800">
                                    {[30, 45, 65, 50, 85, 95, 100].map((height, i) => (
                                        <div key={i} className="relative w-full group">
                                            <div 
                                                className={`w-full rounded-t-md transition-all duration-500 ${height >= 85 ? 'bg-blue-500' : isDark ? 'bg-neutral-800' : 'bg-neutral-200'}`} 
                                                style={{ height: `${height}%` }}
                                            />
                                            {/* Tooltip on hover */}
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold px-2 py-1 rounded-md pointer-events-none whitespace-nowrap">
                                                {height}% Verified
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-4">
                                    <span className="text-[10px] font-bold uppercase text-neutral-400">Claims</span>
                                    <span className="text-[10px] font-bold uppercase text-blue-500">Verified Evidence</span>
                                </div>
                            </div>

                            {/* Evidence Links Diagram */}
                            <div className={`p-6 rounded-[24px] border flex items-center justify-between gap-4 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white shadow-sm border-neutral-200'}`}>
                                <div className={`flex shrink-0 items-center justify-center w-12 h-12 rounded-xl border ${isDark ? 'bg-black border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                                    <BadgeCheck className="text-emerald-500" size={20} />
                                </div>
                                <div className="flex-1 border-t-2 border-dashed border-neutral-200 dark:border-neutral-800 relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-white dark:bg-neutral-900">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-75" />
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 relative" />
                                    </div>
                                </div>
                                <div className={`flex shrink-0 items-center justify-center w-12 h-12 rounded-xl border ${isDark ? 'bg-black border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                                    <FileDigit className="text-blue-500" size={20} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Feature Descriptions */}
                    <div className="space-y-10">
                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-tl-2xl rounded-tr-sm rounded-br-2xl rounded-bl-sm bg-blue-500/10 flex items-center justify-center">
                                <ShieldCheck className="text-blue-500" size={24} />
                            </div>
                            <h3 className={`text-2xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                                Undeniable Proof
                            </h3>
                            <p className={`text-base leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                In a world of AI-generated resumes, employers want certainty. Link real projects, repositories, or certificates directly to each skill on your profile.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-tl-2xl rounded-tr-sm rounded-br-2xl rounded-bl-sm bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="text-emerald-500" size={24} />
                            </div>
                            <h3 className={`text-2xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                                Stand Out Instantly
                            </h3>
                            <p className={`text-base leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                Eliminate the guesswork for hiring managers. Your interactive skills graph acts as a portfolio that speaks louder than bullet points.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="w-12 h-12 rounded-tl-2xl rounded-tr-sm rounded-br-2xl rounded-bl-sm bg-amber-500/10 flex items-center justify-center">
                                <BarChart3 className="text-amber-500" size={24} />
                            </div>
                            <h3 className={`text-2xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                                Evidence-Based Matches
                            </h3>
                            <p className={`text-base leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                Our matching engine prioritizes candidates with verified evidence layers over those with just text-based descriptions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
