"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Briefcase, MapPin, Building2, Clock, ChevronRight, Zap, Sparkles, CheckCircle2, Trash2 } from 'lucide-react';

interface Job {
    id: string;
    title: string;
    description: string;
    location?: string;
    location_type?: string;
    company: {
        name: string;
        logoUrl?: string;
    };
    createdAt: string;
    applicationStatus?: string | null;
    applicationId?: string | null;
}

export default function FindJobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'find' | 'applied'>('find');
    const [searchType, setSearchType] = useState<'job' | 'company'>('job');
    const [linkedJobId, setLinkedJobId] = useState<string | null>(null);

    useEffect(() => {
        // Handle URL Ref Param
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');

        if (ref) {
            verifyLink(ref);
        } else {
            fetchJobs();
        }
    }, []);

    const verifyLink = async (token: string) => {
        try {
            const res = await fetch('/api/professional/jobs/verify-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.jobId) {
                    setLinkedJobId(data.jobId);

                    // Fetch THIS specific job to ensure it exists in the list
                    // (The general feed might not include it depending on algos)
                    const jobRes = await fetch(`/api/professional/jobs/${data.jobId}`);
                    if (jobRes.ok) {
                        const { job } = await jobRes.json();
                        if (job) {
                            setJobs([job]); // Show ONLY this job initially
                            setLoading(false);
                            return;
                        }
                    }
                }
            }
            // Fallback if verification fails or job fetch fails
            fetchJobs();
        } catch (e) {
            console.error('Link verification error', e);
            fetchJobs();
        }
    };


    const fetchJobs = async () => {
        try {
            // Use Smart Feed
            const res = await fetch('/api/professional/jobs/feed');
            if (res.ok) {
                const data = await res.json();
                setJobs(data.jobs || []);
            }
        } catch (error) {
            console.error("Error fetching jobs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRetract = async (applicationId: string) => {
        if (!confirm('Are you sure you want to retract your application? You can apply again later.')) return;

        try {
            const res = await fetch(`/api/professional/applications/${applicationId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                // Refresh to update status
                fetchJobs();
            } else {
                alert('Could not retract application. It may have already been processed.');
            }
        } catch (error) {
            console.error('Error retracting:', error);
        }
    };


    const filteredJobs = jobs.filter(job => {
        // If coming from a shared link, SHOW ONLY THAT JOB
        if (linkedJobId) {
            return job.id === linkedJobId;
        }

        const term = searchTerm.toLowerCase();
        let matchesSearch = false;

        if (searchType === 'company') {
            matchesSearch = job.company?.name?.toLowerCase().includes(term);
        } else {
            matchesSearch = job.title?.toLowerCase().includes(term) ||
                job.company?.name?.toLowerCase().includes(term) ||
                (job.description || '').toLowerCase().includes(term);
        }

        const matchesMode = viewMode === 'find'
            ? !job.applicationStatus // Show only filtered/unapplied
            : !!job.applicationStatus; // Show only applied

        return matchesSearch && matchesMode;
    });

    // Search History Logging (Debounced)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm.trim().length > 2) {
                fetch('/api/professional/search/history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: searchTerm,
                        filters: { type: searchType }
                    })
                });
            }
        }, 2000); // 2 second debounce

        return () => clearTimeout(timeoutId);
    }, [searchTerm, searchType]);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-8">
            <header className="space-y-6 pb-8 border-b border-slate-800">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="text-left">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <Zap size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Job Discovery</span>
                        </div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Find Opportunities</h1>
                        <p className="text-slate-400 mt-2 text-sm">Discover secure, encrypted job roles that match your profile.</p>
                    </div>
                </div>

                {/* Tabs & Search */}
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800">
                        <button
                            onClick={() => setViewMode('find')}
                            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'find' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Find Work
                        </button>
                        <button
                            onClick={() => setViewMode('applied')}
                            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'applied' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Applied
                            <span className="ml-2 px-1.5 py-0.5 bg-slate-800 text-white rounded-md">{jobs.filter(j => j.applicationStatus).length}</span>
                        </button>
                    </div>

                    {/* Search Bar - Full Width, Enhanced */}
                    <div className="relative group flex-1 w-full flex items-center gap-2">
                        {/* Glow Effect (Moved to top so it's behind if z-index is managed or just structural) */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-[28px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none"></div>

                        {/* Type Toggle */}
                        <div className="relative z-10 flex bg-slate-900 rounded-full p-1 border border-slate-800 shrink-0">
                            <button
                                onClick={() => setSearchType('job')}
                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${searchType === 'job' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                            >
                                Jobs
                            </button>
                            <button
                                onClick={() => setSearchType('company')}
                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${searchType === 'company' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-white'}`}
                            >
                                Companies
                            </button>
                        </div>

                        <div className="relative z-10 flex-1 flex items-center gap-3 bg-[#0f172a] border-2 border-slate-800 group-focus-within:border-blue-500/50 rounded-[28px] px-6 py-3 transition-all">
                            <Search className="text-slate-500 group-focus-within:text-blue-400 transition-colors shrink-0" size={20} />
                            <input
                                type="text"
                                placeholder={`Search ${searchType === 'company' ? 'companies' : viewMode === 'find' ? 'smart matching jobs' : 'applications'}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 bg-transparent text-white placeholder:text-slate-600 focus:outline-none font-medium text-sm"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="p-1.5 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="font-bold text-xs text-slate-500 uppercase tracking-widest">Scanning network for roles...</p>
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-slate-600 space-y-4">
                    <Briefcase size={64} className="opacity-10" />
                    <p className="font-bold text-sm uppercase tracking-widest">
                        {viewMode === 'find' ? 'No open roles found matching your search' : 'You haven\'t applied to any jobs yet'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredJobs.map((job) => (
                        <div
                            key={job.id}
                            className="group relative flex flex-col text-left bg-[#0f172a] border border-slate-800 rounded-[32px] overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10"
                        >
                            <div className="p-8 space-y-6 flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shadow-lg">
                                        {job.company?.logoUrl ? (
                                            <img src={job.company.logoUrl} alt={job.company.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Building2 size={24} className="text-slate-500" />
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="px-3 py-1 bg-emerald-500/10 text-[10px] font-black text-emerald-400 uppercase tracking-widest rounded-lg border border-emerald-500/20 flex items-center gap-2">
                                            <Zap size={10} /> Active
                                        </div>
                                        {job.applicationStatus && (
                                            <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${job.applicationStatus === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                job.applicationStatus === 'pre_qualified' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    'bg-slate-800 text-slate-500 border-slate-700'
                                                }`}>
                                                <CheckCircle2 size={10} /> {job.applicationStatus.replace('_', ' ')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-white leading-tight group-hover:text-blue-400 transition-colors uppercase tracking-tighter line-clamp-2">{job.title}</h2>
                                    <p className="text-blue-400 font-bold text-sm tracking-tight">{job.company?.name || 'Unknown Company'}</p>
                                </div>

                                <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">{job.description}</p>
                            </div>

                            <div className="px-8 py-5 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between group-hover:bg-blue-600/5 transition-colors">
                                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5 shrink-0"><Clock size={12} /> {new Date(job.createdAt).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1.5 shrink-0"><MapPin size={12} className="text-blue-500" /> {job.location_type ? job.location_type.charAt(0).toUpperCase() + job.location_type.slice(1) : 'Remote'}</span>
                                    {job.location && (
                                        <span className="text-slate-400 truncate max-w-[120px]">— {job.location}</span>
                                    )}
                                </div>

                                {job.applicationStatus === 'pending' ? (
                                    <button
                                        onClick={() => handleRetract(job.applicationId!)}
                                        className="text-red-500 hover:text-red-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-colors z-20"
                                    >
                                        <Trash2 size={14} /> Retract
                                    </button>
                                ) : !job.applicationStatus ? (
                                    <button
                                        onClick={() => router.push(`/professional/jobs/${job.id}`)}
                                        className="text-blue-500 group-hover:translate-x-1 transition-transform z-20"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                ) : (
                                    <span className="text-slate-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                        <CheckCircle2 size={14} /> Applied
                                    </span>
                                )}
                            </div>

                            {/* Clickable Area Overlay for details (if not interacting with buttons) */}
                            {!job.applicationStatus && (
                                <button
                                    className="absolute inset-0 z-10"
                                    onClick={() => router.push(`/professional/jobs/${job.id}`)}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
