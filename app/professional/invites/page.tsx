"use client"

import React, { useState, useEffect, useCallback } from 'react';
import {
    Mail, Briefcase, Building2, MapPin, CheckCircle2, XCircle,
    Clock, Loader2, Inbox, ExternalLink, ChevronRight, Sparkles, Eye
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import Link from 'next/link';

export default function InvitesPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [invites, setInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
    const [actioning, setActioning] = useState<string | null>(null);

    const fetchInvites = useCallback(async () => {
        try {
            const res = await fetch('/api/professional/invites');
            if (res.ok) {
                const data = await res.json();
                setInvites(data.invites || []);
            }
        } catch (err) {
            console.error('Error fetching invites:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchInvites(); }, [fetchInvites]);

    const handleAction = async (inviteId: string, action: 'accept' | 'decline' | 'view') => {
        setActioning(inviteId);
        try {
            const res = await fetch('/api/professional/invites', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteId, action }),
            });
            if (res.ok) {
                fetchInvites(); // Refresh
            }
        } catch (err) {
            console.error('Action error:', err);
        } finally {
            setActioning(null);
        }
    };

    const filtered = invites.filter(inv =>
        filter === 'all' ? true : inv.status === filter
    );

    const pendingCount = invites.filter(i => i.status === 'pending').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 py-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
            {/* Header */}
            <div className={`p-6 md:p-8 rounded-[32px] border relative overflow-hidden ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #f59e0b)' }} />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <Sparkles size={24} className="text-amber-500" />
                        <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                            Job Invites
                        </h1>
                        {pendingCount > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white">{pendingCount}</span>
                        )}
                    </div>
                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Employers found your profile compelling. No application needed — accept to proceed.
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className={`flex gap-1.5 p-1 rounded-xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
                {(['all', 'pending', 'accepted', 'declined'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold capitalize transition-all ${filter === tab
                                ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' shadow-lg'
                                : isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'
                            }`}
                    >
                        {tab} {tab === 'pending' && pendingCount > 0 ? `(${pendingCount})` : ''}
                    </button>
                ))}
            </div>

            {/* Invites List */}
            {filtered.length === 0 ? (
                <div className={`text-center py-16 rounded-[32px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <Inbox size={48} className={`mx-auto mb-4 ${isDark ? 'text-neutral-700' : 'text-neutral-300'}`} />
                    <p className={`text-lg font-bold ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        {filter === 'all' ? 'No invites yet' : `No ${filter} invites`}
                    </p>
                    <p className={`text-xs mt-1 max-w-sm mx-auto ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        Keep your profile strong and your career score high — employers are always looking for top talent.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((invite) => (
                        <div
                            key={invite.id}
                            className={`p-4 md:p-5 rounded-2xl border transition-all ${invite.status === 'pending'
                                    ? (isDark ? 'bg-neutral-900 border-blue-500/30 shadow-lg shadow-blue-500/5' : 'bg-white border-blue-200 shadow-lg shadow-blue-100')
                                    : (isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm')
                                }`}
                        >
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Company Logo */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                    {invite.companyLogo ? (
                                        <img src={invite.companyLogo} alt="" className="w-8 h-8 rounded-lg object-contain" />
                                    ) : (
                                        <Building2 size={20} className={isDark ? 'text-neutral-600' : 'text-neutral-400'} />
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{invite.jobTitle}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{invite.companyName}</span>
                                                {invite.jobLocation && (
                                                    <>
                                                        <span className={`text-[8px] ${isDark ? 'text-neutral-700' : 'text-neutral-300'}`}>•</span>
                                                        <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                            <MapPin size={10} /> {invite.jobLocation}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {invite.status === 'pending' && (
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-500">New</span>
                                            )}
                                            {invite.status === 'accepted' && (
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-500">Accepted</span>
                                            )}
                                            {invite.status === 'declined' && (
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-500/10 text-red-500">Declined</span>
                                            )}
                                        </div>
                                    </div>

                                    {invite.message && (
                                        <p className={`text-xs mt-2 p-2.5 rounded-xl ${isDark ? 'bg-neutral-800/50 text-neutral-300' : 'bg-neutral-50 text-neutral-600'}`}>
                                            &ldquo;{invite.message}&rdquo;
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between mt-3">
                                        <span className={`text-[10px] flex items-center gap-1 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                            <Clock size={10} />
                                            {new Date(invite.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>

                                        <div className="flex items-center gap-2">
                                            {invite.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleAction(invite.id, 'decline')}
                                                        disabled={actioning === invite.id}
                                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${isDark ? 'border-neutral-700 text-neutral-400 hover:border-red-500 hover:text-red-400' : 'border-neutral-200 text-neutral-500 hover:border-red-300 hover:text-red-500'}`}
                                                    >
                                                        Decline
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(invite.id, 'accept')}
                                                        disabled={actioning === invite.id}
                                                        className="px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90 transition-all shadow-lg shadow-blue-500/20"
                                                    >
                                                        {actioning === invite.id ? <Loader2 size={12} className="animate-spin" /> : 'Accept'}
                                                    </button>
                                                </>
                                            )}
                                            <Link
                                                href={`/professional/roles-jobs?jobId=${invite.jobId}`}
                                                className={`p-1.5 rounded-lg transition-all ${isDark ? 'hover:bg-neutral-800 text-neutral-500' : 'hover:bg-neutral-100 text-neutral-400'}`}
                                            >
                                                <ExternalLink size={14} />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
