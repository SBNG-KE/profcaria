"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, MapPin, Briefcase, Star, Send, CheckCircle, Zap } from 'lucide-react';

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
    const params = useParams();
    const router = useRouter();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [invitingId, setInvitingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const res = await fetch(`/api/employer/jobs/${params.id}/matches`);
                if (res.ok) {
                    const data = await res.json();
                    setCandidates(data.candidates || []);
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
            if (res.ok) {
                setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, invited: true } : c));
            }
        } catch (e) {
            console.error("Invite error", e);
        } finally {
            setInvitingId(null);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto min-h-screen pb-32 font-sans">
            <header className="flex items-center gap-6 mb-12 animate-in fade-in slide-in-from-top-4">

                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <Zap className="text-yellow-400" fill="currentColor" />
                        Top Matches
                    </h1>
                    <p className="text-slate-400 mt-1 font-medium">
                        AI-curated candidates for your job. Invite them to get instant attention.
                    </p>
                </div>
            </header>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Analyzing Profiles...</p>
                </div>
            ) : candidates.length === 0 ? (
                <div className="text-center py-20 bg-[#0f172a] rounded-[32px] border border-slate-800">
                    <User size={48} className="mx-auto text-slate-700 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Matches Found Yet</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        We couldn't find strong matches for this role right now. Check back later as new professionals join!
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {candidates.map((candidate, i) => (
                        <div
                            key={candidate.id}
                            style={{ animationDelay: `${i * 100}ms` }}
                            className="group bg-[#0f172a] border border-slate-800 p-6 rounded-[24px] hover:border-blue-500/30 transition-all flex flex-col md:flex-row gap-6 items-center animate-in fade-in slide-in-from-bottom-4"
                        >
                            {/* Score Badge */}
                            <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 shrink-0 group-hover:border-blue-500/30 transition-all">
                                <span className={`text-2xl font-black ${candidate.score >= 80 ? 'text-emerald-400' : candidate.score >= 60 ? 'text-yellow-400' : 'text-slate-400'}`}>
                                    {candidate.score}%
                                </span>
                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">Match</span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center md:text-left space-y-2">
                                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                    {candidate.name}
                                </h3>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg">
                                        <Briefcase size={12} /> {candidate.role}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg">
                                        <MapPin size={12} /> {candidate.location || 'Unknown Location'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {candidate.matchBreakdown.role && <span className="text-[10px] uppercase font-bold text-emerald-500/80 bg-emerald-500/10 px-2 py-0.5 rounded">Role Match</span>}
                                    {candidate.matchBreakdown.location && <span className="text-[10px] uppercase font-bold text-blue-500/80 bg-blue-500/10 px-2 py-0.5 rounded">Local</span>}
                                    {candidate.matchBreakdown.relocation && <span className="text-[10px] uppercase font-bold text-yellow-500/80 bg-yellow-500/10 px-2 py-0.5 rounded">Relocation</span>}
                                </div>
                            </div>

                            {/* Action */}
                            <button
                                onClick={() => handleInvite(candidate.id)}
                                disabled={candidate.invited || invitingId === candidate.id}
                                className={`
                                    flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all
                                    ${candidate.invited
                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default'
                                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 active:scale-95'
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
        </div>
    );
}
