import React from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { ExternalLink, Link2 } from 'lucide-react';

export default function VerifiedEvidenceShowcase() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <section className={`py-24 sm:py-32 relative overflow-hidden ${isDark ? 'bg-[#0A0F1A]' : 'bg-[#F0F2F5]'}`}>
            <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
                    <h2 className={`text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter uppercase mb-6 font-pixel ${isDark ? 'text-white' : 'text-[#0A0F1A]'}`}>
                        Beyond the Traditional CV
                    </h2>
                    <p className={`text-lg md:text-xl font-light ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        "Don't just upload a CV. Prove your skills with Verified Evidence built directly into your profile."
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
                    {/* Left: Diagram UI showing explicit skill to evidence mapping */}
                    <div className="relative">
                        {/* Decorative Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#3B5998]/10 dark:bg-[#3B5998]/5 blur-[100px] rounded-full -z-10" />

                        <div className={`p-8 rounded-[32px] border shadow-2xl space-y-12 ${isDark ? 'bg-[#111827]/80 border-[#1B2A4A] backdrop-blur-xl' : 'bg-white/80 border-[#1B2A4A]/20 backdrop-blur-xl shadow-[#3B5998]/5'}`}>
                            <div className="flex items-center justify-between">
                                <h3 className={`font-black uppercase tracking-wider font-pixel ${isDark ? 'text-white' : 'text-[#0A0F1A]'}`}>
                                    Skill-to-Evidence Mapping
                                </h3>
                                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#3B5998]/10 text-[#3B5998]">
                                    LIVE PROOF
                                </span>
                            </div>

                            <div className="space-y-8">
                                {/* Skill Node 1 */}
                                <div className="relative">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        {/* Skill Text */}
                                        <div className={`px-4 py-3 rounded-xl text-sm font-bold border whitespace-nowrap ${isDark ? 'bg-[#111827] border-[#1B2A4A] text-white' : 'bg-[#F0F2F5] border-[#1B2A4A]/20 text-[#0A0F1A]'}`}>
                                            Frontend Architecture
                                        </div>
                                        
                                        {/* Connection line (Desktop) */}
                                        <div className="hidden sm:block flex-1 h-px border-t-2 border-dashed border-blue-500/30 mx-2 relative overflow-hidden">
                                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent -translate-x-full animate-[scan_2s_ease-in-out_infinite]" />
                                        </div>

                                        {/* Connection line (Mobile) */}
                                        <div className="sm:hidden w-px h-8 border-l-2 border-dashed border-blue-500/30 mx-auto relative overflow-hidden">
                                             <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-transparent via-blue-500 to-transparent -translate-y-full animate-[scan_2s_ease-in-out_infinite]" />
                                        </div>
                                        
                                        {/* Evidence Link */}
                                        <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border whitespace-nowrap ${isDark ? 'bg-[#3B5998]/10 border-[#3B5998]/50 text-[#3B5998]' : 'bg-[#3B5998]/5 border-[#3B5998]/30 text-[#3B5998]'}`}>
                                            <ExternalLink size={14} /> GitHub Repository
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Skill Node 2 */}
                                <div className="relative">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        {/* Skill Text */}
                                        <div className={`px-4 py-3 rounded-xl text-sm font-bold border whitespace-nowrap ${isDark ? 'bg-[#111827] border-[#1B2A4A] text-white' : 'bg-[#F0F2F5] border-[#1B2A4A]/20 text-[#0A0F1A]'}`}>
                                            System Design
                                        </div>
                                        
                                        {/* Connection line (Desktop) */}
                                        <div className="hidden sm:block flex-1 h-px border-t-2 border-dashed border-[#1B2A4A]/30 mx-2 relative overflow-hidden">
                                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-[#1B2A4A] to-transparent -translate-x-full animate-[scan_2s_ease-in-out_infinite] [animation-delay:0.5s]" />
                                        </div>

                                        {/* Connection line (Mobile) */}
                                        <div className="sm:hidden w-px h-8 border-l-2 border-dashed border-[#1B2A4A]/30 mx-auto relative overflow-hidden">
                                             <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-transparent via-[#1B2A4A] to-transparent -translate-y-full animate-[scan_2s_ease-in-out_infinite] [animation-delay:0.5s]" />
                                        </div>
                                        
                                        {/* Evidence Link */}
                                        <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border whitespace-nowrap ${isDark ? 'bg-[#1B2A4A]/20 border-[#1B2A4A] text-[#3B5998]' : 'bg-[#1B2A4A]/5 border-[#1B2A4A]/30 text-[#1B2A4A]'}`}>
                                            <Link2 size={14} /> Architecture.pdf
                                        </div>
                                    </div>
                                </div>

                                {/* Skill Node 3 */}
                                <div className="relative">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        {/* Skill Text */}
                                        <div className={`px-4 py-3 rounded-xl text-sm font-bold border whitespace-nowrap ${isDark ? 'bg-[#111827] border-[#1B2A4A] text-white' : 'bg-[#F0F2F5] border-[#1B2A4A]/20 text-[#0A0F1A]'}`}>
                                            AWS Cloud
                                        </div>
                                        
                                        {/* Connection line (Desktop) */}
                                        <div className="hidden sm:block flex-1 h-px border-t-2 border-dashed border-[#3B5998]/30 mx-2 relative overflow-hidden">
                                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-[#3B5998] to-transparent -translate-x-full animate-[scan_2s_ease-in-out_infinite] [animation-delay:1s]" />
                                        </div>

                                        {/* Connection line (Mobile) */}
                                        <div className="sm:hidden w-px h-8 border-l-2 border-dashed border-[#3B5998]/30 mx-auto relative overflow-hidden">
                                             <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-transparent via-[#3B5998] to-transparent -translate-y-full animate-[scan_2s_ease-in-out_infinite] [animation-delay:1s]" />
                                        </div>
                                        
                                        {/* Evidence Link */}
                                        <div className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border whitespace-nowrap ${isDark ? 'bg-[#3B5998]/10 border-[#3B5998]/50 text-[#3B5998]' : 'bg-[#3B5998]/5 border-[#3B5998]/30 text-[#3B5998]'}`}>
                                            <ExternalLink size={14} /> AWS Certificate Form
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Feature Descriptions without icons */}
                    <div className="space-y-12">
                        <div className="space-y-4">
                            <h3 className={`text-2xl md:text-3xl font-black uppercase tracking-tight font-pixel ${isDark ? 'text-white' : 'text-[#0A0F1A]'}`}>
                                Undeniable Proof
                            </h3>
                            <p className={`text-lg leading-relaxed font-light ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                In a world of AI-generated resumes, employers want certainty. Link real projects, repositories, or certificates directly to each skill on your profile.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className={`text-2xl md:text-3xl font-black uppercase tracking-tight font-pixel ${isDark ? 'text-white' : 'text-[#0A0F1A]'}`}>
                                Stand Out Instantly
                            </h3>
                            <p className={`text-lg leading-relaxed font-light ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                Eliminate the guesswork for hiring managers. Your interactive skills graph acts as a portfolio that speaks louder than bullet points.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className={`text-2xl md:text-3xl font-black uppercase tracking-tight font-pixel ${isDark ? 'text-white' : 'text-[#0A0F1A]'}`}>
                                Evidence-Based Matches
                            </h3>
                            <p className={`text-lg leading-relaxed font-light ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                Our matching engine prioritizes candidates with verified evidence layers over those with just text-based descriptions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
