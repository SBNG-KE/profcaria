"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus, Briefcase, Users, Edit3, Trash2, Power,
    MoreHorizontal, ChevronRight, Layout, Zap, Clock
} from 'lucide-react';

interface Job {
    id: string;
    title: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    applicantCount?: number;
}

export default function EmployerJobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchJobs = async () => {
        try {
            const res = await fetch('/api/employer/jobs');
            if (res.ok) {
                const data = await res.json();
                setJobs(data.jobs);
            }
        } catch (error) {
            console.error("Error fetching jobs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const toggleStatus = async (jobId: string, currentStatus: boolean) => {
        try {
            // We'll use the same jobs API with a PATCH method (to be implemented)
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

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 pb-32">
            <header className="flex items-center justify-between border-b border-slate-800 pb-8">
                <div className="text-left">
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Job Management</h1>
                    <p className="text-slate-400 mt-2">Manage your active postings and review candidates.</p>
                </div>
                <button
                    onClick={() => router.push('/employer/jobs/create')}
                    className="flex items-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
                >
                    <Plus size={18} />
                    <span>New Post</span>
                </button>
            </header>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="font-bold text-xs text-slate-500 uppercase tracking-widest">Loading job architecture...</p>
                </div>
            ) : jobs.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-slate-600 space-y-4">
                    <Briefcase size={64} className="opacity-10" />
                    <p className="font-bold text-sm uppercase tracking-widest">No jobs posted yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {jobs.map((job) => (
                        <div key={job.id} className={`group relative bg-[#0f172a] border rounded-[32px] overflow-hidden transition-all duration-300 ${job.isActive ? 'border-slate-800 hover:border-emerald-500/30' : 'border-slate-800 opacity-60 hover:opacity-100'}`}>


                            <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="space-y-4 flex-1 text-left">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">{job.title}</h2>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${job.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                                            {job.isActive ? 'Active & Visible' : 'Closed'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <span className="flex items-center gap-1.5"><Clock size={12} /> Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1.5 text-blue-400"><Users size={12} /> {job.applicantCount || 0} Applicants</span>
                                        {job.isActive && <span className="flex items-center gap-1.5 text-emerald-400"><Zap size={12} /> Live on Board</span>}
                                    </div>
                                    <p className="text-slate-400 text-sm line-clamp-2 max-w-2xl">{job.description}</p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => router.push(`/employer/jobs/create?id=${job.id}`)}
                                        className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
                                    >
                                        <Edit3 size={14} /> Edit
                                    </button>
                                    <button
                                        onClick={() => router.push(`/employer/applications?jobId=${job.id}`)}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2"
                                    >
                                        <Users size={14} /> View Applicants
                                    </button>
                                    <button
                                        onClick={() => toggleStatus(job.id, job.isActive)}
                                        className={`px-4 py-3 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${job.isActive ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20'}`}
                                    >
                                        <Power size={14} /> {job.isActive ? 'Close' : 'Publish'}
                                    </button>
                                    <button
                                        onClick={() => deleteJob(job.id)}
                                        title="Delete Permanently"
                                        className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500/20 transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
