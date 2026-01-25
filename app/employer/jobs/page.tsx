"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus, Briefcase, Users, Edit3, Trash2, Power,
    ChevronRight, ChevronLeft, Zap, Clock, Share2
} from 'lucide-react';

interface Job {
    id: string;
    title: string;
    description: string;
    location_type?: string;
    isActive: boolean;
    createdAt: string;
    applicantCount?: number;
}

const ITEMS_PER_PAGE = 100;

export default function EmployerJobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [limits, setLimits] = useState<any>(null);

    const fetchJobs = async () => {
        try {
            const [res, limitsRes] = await Promise.all([
                fetch('/api/employer/jobs'),
                fetch('/api/employer/limits')
            ]);
            if (res.ok) {
                const data = await res.json();
                const sortedJobs = (data.jobs || []).sort((a: Job, b: Job) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                setJobs(sortedJobs);
            }
            if (limitsRes.ok) {
                const data = await limitsRes.json();
                setLimits(data);
            }
        } catch (error) {
            console.error("Error fetching jobs/limits", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchJobs(); }, []);
    useEffect(() => { setCurrentPage(1); }, [filter]);

    const toggleStatus = async (jobId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/employer/jobs/${jobId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus })
            });
            if (res.ok) fetchJobs();
        } catch (error) {
            console.error("Toggle error", error);
        }
    };

    const deleteJob = async (jobId: string) => {
        if (!confirm("Are you sure you want to permanently delete this job post? This will also remove all associated applications.")) return;
        try {
            const res = await fetch(`/api/employer/jobs/${jobId}`, { method: 'DELETE' });
            if (res.ok) fetchJobs();
        } catch (error) {
            console.error("Delete error", error);
        }
    };

    const filteredJobs = jobs.filter(job => {
        if (filter === 'active') return job.isActive;
        if (filter === 'closed') return !job.isActive;
        return true;
    });

    const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
    const paginatedJobs = filteredJobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const isLimitReached = limits && limits.limits.jobs < 9999 && (limits.usage?.jobs >= limits.limits.jobs);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-32">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Job Management</h1>
                    <p className="text-neutral-400 mt-1 text-sm">Manage your active postings and review candidates.</p>
                </div>
                <div className="group relative">
                    <button
                        onClick={() => !isLimitReached && router.push('/employer/jobs/create')}
                        disabled={isLimitReached}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95 ${isLimitReached ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-70 shadow-none' : 'bg-white hover:bg-neutral-100 text-black shadow-lg'}`}
                    >
                        <Plus size={16} />
                        <span>{isLimitReached ? 'Plan Limit Reached' : 'New Post'}</span>
                    </button>
                    {isLimitReached && (
                        <div className="absolute top-full mt-2 right-0 w-64 p-3 bg-neutral-800 text-neutral-300 text-[10px] rounded-xl shadow-xl z-20 hidden group-hover:block border border-neutral-700">
                            You have reached the job posting limit for your current plan. Please upgrade to post more.
                        </div>
                    )}
                </div>
            </header>

            <div className="flex gap-2 flex-wrap">
                <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-white text-black shadow-lg' : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}>All ({jobs.length})</button>
                <button onClick={() => setFilter('active')} className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${filter === 'active' ? 'bg-white text-black shadow-lg' : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}>Active ({jobs.filter(j => j.isActive).length})</button>
                <button onClick={() => setFilter('closed')} className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all ${filter === 'closed' ? 'bg-white text-black shadow-lg' : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}>Closed ({jobs.filter(j => !j.isActive).length})</button>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <p className="font-bold text-xs text-neutral-500 uppercase tracking-widest">Loading job architecture...</p>
                </div>
            ) : paginatedJobs.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-neutral-600 space-y-4">
                    <Briefcase size={64} className="opacity-10" />
                    <p className="font-bold text-sm uppercase tracking-widest">{filter === 'all' ? 'No jobs posted yet' : `No ${filter} jobs`}</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paginatedJobs.map((job) => (
                            <div key={job.id} className={`group relative bg-black border rounded-2xl overflow-hidden transition-all duration-300 ${job.isActive ? 'border-neutral-800 hover:border-neutral-600' : 'border-neutral-800 opacity-60 hover:opacity-100'}`}>
                                <div className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <h2 className="text-lg font-black text-white uppercase tracking-tight leading-tight line-clamp-2 flex-1">{job.title}</h2>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0 ${job.isActive ? 'bg-neutral-900 text-white border-neutral-700' : 'bg-neutral-800 text-neutral-500 border-neutral-700'}`}>{job.isActive ? 'Active' : 'Closed'}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                        <span className="flex items-center gap-1"><Clock size={10} /> {new Date(job.createdAt).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1 text-neutral-400"><Users size={10} /> {job.applicantCount || 0}</span>
                                        {job.isActive && <span className="flex items-center gap-1 text-white"><Zap size={10} /> Live</span>}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-800">
                                        {job.isActive && (
                                            <button onClick={async () => { try { const res = await fetch(`/api/employer/jobs/${job.id}/share`); const data = await res.json(); if (data.link) { navigator.clipboard.writeText(data.link); setCopiedId(job.id); setTimeout(() => setCopiedId(null), 2500); } } catch (e) { console.error(e); } }} className={`p-2 rounded-lg transition-all ${copiedId === job.id ? 'bg-neutral-700 text-white' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white'}`} title="Copy Share Link"><Share2 size={14} /></button>
                                        )}
                                        <button onClick={() => router.push(`/employer/jobs/create?id=${job.id}`)} className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-all" title="Edit"><Edit3 size={14} /></button>
                                        <button onClick={() => router.push(`/employer/applications?jobId=${job.id}`)} className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5"><Users size={12} /> Applicants</button>
                                        {limits && limits.limits.topMatches > 0 && (limits.limits.topMatches >= 9999 || (limits.usage?.topMatches || 0) < limits.limits.topMatches) && (
                                            <button onClick={() => router.push(`/employer/jobs/${job.id}/matches`)} className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1.5"><Zap size={12} className="text-white" /> Matches</button>
                                        )}
                                        <button onClick={() => toggleStatus(job.id, job.isActive)} className={`p-2 rounded-lg border transition-all ${job.isActive ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700 hover:text-white' : 'bg-neutral-700 border-neutral-600 text-white hover:bg-neutral-600'}`} title={job.isActive ? 'Close' : 'Publish'}><Power size={14} /></button>
                                        <button onClick={() => deleteJob(job.id)} title="Delete" className="p-2 bg-neutral-800 border border-neutral-700 text-neutral-400 rounded-lg hover:bg-neutral-700 hover:text-white transition-all"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 pt-6">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={16} /> Previous</button>
                            <span className="text-neutral-400 text-sm">Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span></span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed">Next <ChevronRight size={16} /></button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
