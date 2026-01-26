"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, MapPin, Briefcase, Star, Send, CheckCircle, Zap } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface Candidate {
    id: string;
    name: string;
    role: string;
    image: string;
    score: number;
    location: string;
    matchBreakdown: {
        role: boolean;
        location: boolean;
        relocation: boolean;
    };
    invited: boolean;
}

export default function JobMatchesPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const params = useParams();
    const useRouterHook = useRouter();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [invitingId, setInvitingId] = useState<string | null>(null);
    const [isLimitReached, setIsLimitReached] = useState(false);
    const [limitCount, setLimitCount] = useState(0);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const res = await fetch(`/api/employer/jobs/${params.id}/matches`);
                if (res.ok) {
                    const data = await res.json();
                    setCandidates(data.candidates || []);
                    setIsLimitReached(data.isLimitReached || false);
                    setLimitCount(data.limit || 0);
                }
            } catch (e) {
                console.error("Fetch matches error", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMatches();
    }, [params.id]);

    const handleInvite = async (candidateId: string) => {
        setInvitingId(candidateId);
        try {
            const res = await fetch(`/api/employer/jobs/${params.id}/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ professionalId: candidateId })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, invited: true } : c));
            } else {
                alert(`Failed to send invite: ${data.error || 'Unknown error'}`);
                console.error("Invite response error", data);
            }
        } catch (e: any) {
            console.error("Invite error", e);
            alert(`Network error: ${e.message}`);
        } finally {
            setInvitingId(null);
        }
    };

    return (
        <div className={`p-8 max-w-5xl mx-auto min-h-screen pb-32 font-sans ${isDark ? 'bg-black text-white' : 'bg-neutral-50 text-black'}`}>
            <header className="flex items-center gap-6 mb-12 animate-in fade-in slide-in-from-top-4">
                <div>
                    <h1 className={`text-3xl font-black uppercase tracking-tight flex items-center gap-3 ${isDark ? 'text-white' : 'text-black'}`}>
                        <Zap className={isDark ? 'text-white' : 'text-black'} fill="currentColor" />
                        Top Matches
                    </h1>
                    <p className={`mt-1 font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Candidates for your job. Invite them to get instant attention.
                    </p>
                </div>
            </header>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${isDark ? 'border-white' : 'border-black'}`} />
                    <p className={`font-bold uppercase tracking-widest text-xs animate-pulse ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Analyzing Profiles...</p>
                </div>
            ) : candidates.length === 0 ? (
                <div className={`text-center py-20 rounded-[32px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <User size={48} className={`mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-neutral-300'}`} />
                    <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>No Matches Found Yet</h3>
                    <p className={`max-w-md mx-auto ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        We couldn't find strong matches for this role right now. Check back later as new professionals join!
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {candidates.map((candidate, i) => (
                        <div
                            key={candidate.id}
                            style={{ animationDelay: `${i * 100}ms` }}
                            className={`group p-6 rounded-[24px] border transition-all flex flex-col md:flex-row gap-6 items-center animate-in fade-in slide-in-from-bottom-4 ${isDark
                                ? 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
                                : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'
                                }`}
                        >
                            {/* Score Badge */}
                            <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl border shrink-0 transition-all ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-200'}`}>
                                <span className={`text-2xl font-black ${candidate.score >= 80 ? (isDark ? 'text-white' : 'text-black') : (isDark ? 'text-neutral-300' : 'text-neutral-500')}`}>
                                    {candidate.score}%
                                </span>
                                <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Match</span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center md:text-left space-y-2">
                                <h3 className={`text-xl font-bold transition-colors ${isDark ? 'text-white group-hover:text-neutral-200' : 'text-black group-hover:text-neutral-700'}`}>
                                    {candidate.name}
                                </h3>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'}`}>
                                        <Briefcase size={12} /> {candidate.role}
                                    </span>
                                    <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-600'}`}>
                                        <MapPin size={12} /> {candidate.location || 'Unknown Location'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {candidate.matchBreakdown.role && <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-200 text-neutral-700'}`}>Role Match</span>}
                                    {candidate.matchBreakdown.location && <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-200 text-neutral-700'}`}>Local</span>}
                                    {candidate.matchBreakdown.relocation && <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-200 text-neutral-700'}`}>Relocation</span>}
                                </div>
                            </div>

                            {/* Action */}
                            <button
                                onClick={() => handleInvite(candidate.id)}
                                disabled={candidate.invited || invitingId === candidate.id}
                                className={`
                                    flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all
                                    ${candidate.invited
                                        ? (isDark ? 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-default' : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-default')
                                        : (isDark ? 'bg-white hover:bg-neutral-200 text-black shadow-lg shadow-white/10 active:scale-95' : 'bg-black hover:bg-neutral-800 text-white shadow-lg active:scale-95')
                                    }
                                `}
                            >
                                {candidate.invited ? (
                                    <>
                                        <CheckCircle size={16} /> Invited
                                    </>
                                ) : invitingId === candidate.id ? (
                                    <>Sending...</>
                                ) : (
                                    <>
                                        <Send size={16} /> Invite
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {!isLoading && isLimitReached && candidates.length > 0 && (
                <div className={`mt-8 p-6 rounded-2xl flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                        <Star className={isDark ? 'text-white' : 'text-black'} size={24} />
                    </div>
                    <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                        Matches Limited by Plan
                    </h3>
                    <p className={`max-w-lg mb-6 text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        You are seeing the top {limitCount} candidates allowed by your current plan.
                        Upgrade to Enterprise or check back next month to see more matches.
                    </p>
                    <button
                        onClick={() => useRouterHook.push('/employer/settings')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${isDark ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-black hover:bg-neutral-800 text-white'}`}
                    >
                        Upgrade Plan
                    </button>
                </div>
            )}
        </div>
    );
}
