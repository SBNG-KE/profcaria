"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '@/app/context/ThemeContext';
import MatchCard from '@/app/components/employer/MatchCard';
import { Zap, Search, Users, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';

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
    inviteStatus: string | null;
}

export default function JobMatchesPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const params = useParams();
    const router = useRouter();

    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [invitingId, setInvitingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'suggestions' | 'invited'>('suggestions');

    // Limits
    const [isLimitReached, setIsLimitReached] = useState(false);
    const [limitCount, setLimitCount] = useState(0);

    // Pagination (Enterprise)
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalFound, setTotalFound] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);

    const jobId = params.id as string;

    const fetchMatches = async (page: number = 1, append: boolean = false) => {
        try {
            if (page > 1) setLoadingMore(true);
            const res = await fetch(`/api/employer/jobs/${jobId}/matches?page=${page}`);
            if (res.ok) {
                const data = await res.json();
                if (append) {
                    setCandidates(prev => [...prev, ...(data.candidates || [])]);
                } else {
                    setCandidates(data.candidates || []);
                }
                setIsLimitReached(data.isLimitReached || false);
                setLimitCount(data.limit || 0);
                setCurrentPage(data.currentPage || page);
                setHasMore(data.hasMore || false);
                setTotalFound(data.totalFound || 0);
            }
        } catch (e) {
            console.error("Fetch matches error", e);
        } finally {
            setIsLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (jobId) fetchMatches(1);
    }, [jobId]);

    const handleLoadMore = () => {
        fetchMatches(currentPage + 1, true);
    };

    const handleInvite = async (candidateId: string, isReminder = false) => {
        setInvitingId(candidateId);
        try {
            const res = await fetch(`/api/employer/jobs/${jobId}/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ professionalId: candidateId })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Update local state
                setCandidates(prev => prev.map(c =>
                    c.id === candidateId ? { ...c, invited: true, inviteStatus: 'pending' } : c
                ));
                if (isReminder) {
                    alert("Reminder sent successfully!");
                }
            } else {
                alert(`Failed to send invite: ${data.error || 'Unknown error'}`);
            }
        } catch (e: any) {
            console.error("Invite error", e);
            alert(`Network error: ${e.message}`);
        } finally {
            setInvitingId(null);
        }
    };

    // Derived Lists
    const suggestions = useMemo(() => candidates.filter(c => !c.invited), [candidates]);
    const invitedCandidates = useMemo(() => candidates.filter(c => c.invited), [candidates]);

    const displayedCandidates = activeTab === 'suggestions' ? suggestions : invitedCandidates;

    return (
        <div className={`p-8 max-w-7xl mx-auto min-h-screen pb-32 font-sans ${isDark ? 'bg-black text-white' : 'bg-neutral-50 text-black'}`}>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 animate-in fade-in slide-in-from-top-4">
                <div>
                    <h1 className={`text-3xl font-black uppercase tracking-tight flex items-center gap-3 ${isDark ? 'text-white' : 'text-black'}`}>
                        <Zap className="fill-current text-[#6B8CD5]" />
                        Top Matches
                    </h1>
                    <p className={`mt-1 font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        AI-curated candidates for your role.
                    </p>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-8 border-b border-neutral-800">
                <button
                    onClick={() => setActiveTab('suggestions')}
                    className={`
                        px-6 py-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2
                        ${activeTab === 'suggestions'
                            ? (isDark ? 'border-[#6B8CD5] text-white' : 'border-black text-black')
                            : 'border-transparent text-neutral-500 hover:text-neutral-300'}
                    `}
                >
                    <Search size={16} />
                    Suggestions ({suggestions.length})
                </button>
                <button
                    onClick={() => setActiveTab('invited')}
                    className={`
                        px-6 py-4 text-sm font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2
                        ${activeTab === 'invited'
                            ? (isDark ? 'border-[#3B5998] text-white' : 'border-[#3B5998] text-black')
                            : 'border-transparent text-neutral-500 hover:text-neutral-300'}
                    `}
                >
                    <CheckCircle2 size={16} />
                    Invited ({invitedCandidates.length})
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin ${isDark ? 'border-neutral-700 border-t-white' : 'border-neutral-200 border-t-black'}`} />
                    <p className={`font-bold uppercase tracking-widest text-xs animate-pulse ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Finding best matches...</p>
                </div>
            ) : displayedCandidates.length === 0 ? (
                <div className={`text-center py-32 rounded-[32px] border border-dashed ${isDark ? 'border-neutral-800' : 'border-neutral-300'}`}>
                    <Users size={48} className={`mx-auto mb-4 opacity-20 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`} />
                    <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                        {activeTab === 'suggestions' ? 'No New Suggestions' : 'No Candidates Invited Yet'}
                    </h3>
                    <p className={`max-w-md mx-auto ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        {activeTab === 'suggestions'
                            ? "We've analyzed the talent pool and couldn't find more strong matches right now. Check back later!"
                            : "You haven't invited anyone from the Top Matches list yet."}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                        {displayedCandidates.map((candidate) => (
                            <MatchCard
                                key={candidate.id}
                                {...candidate}
                                isLoading={invitingId === candidate.id}
                                onInvite={() => handleInvite(candidate.id, false)}
                                onRemind={() => handleInvite(candidate.id, true)}
                            />
                        ))}
                    </div>

                    {/* Enterprise Pagination: Load Next 100 */}
                    {hasMore && activeTab === 'suggestions' && (
                        <div className="mt-10 flex flex-col items-center gap-3">
                            <button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50 ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                            >
                                {loadingMore ? (
                                    <><Loader2 className="animate-spin" size={14} /> Loading...</>
                                ) : (
                                    <><ChevronRight size={14} /> Load Next 100</>
                                )}
                            </button>
                            <p className={`text-xs font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                Showing {candidates.length} of {totalFound} matches
                            </p>
                        </div>
                    )}
                </>
            )}

            {!isLoading && isLimitReached && activeTab === 'suggestions' && candidates.length > 0 && (
                <div className={`mt-12 p-8 rounded-3xl flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 border bg-gradient-to-b ${isDark ? 'from-neutral-900 to-black border-neutral-800' : 'from-white to-neutral-50 border-neutral-200 shadow-xl'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                        <Zap className="text-[#6B8CD5] fill-current" size={32} />
                    </div>
                    <h3 className={`text-2xl font-black mb-2 uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                        Unlock More Matches
                    </h3>
                    <p className={`max-w-lg mb-8 text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        You've used all {limitCount} top match credits for this job.
                        Upgrade your plan to get more credits per job.
                    </p>
                    <button
                        onClick={() => router.push('/employer/settings')}
                        className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                    >
                        Upgrade Plan
                    </button>
                </div>
            )}
        </div>
    );
}
