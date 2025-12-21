"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Briefcase, MapPin, Building2, Clock, ChevronRight, Zap, Sparkles } from 'lucide-react';

interface Job {
    id: string;
    title: string;
    description: string;
    company: {
        name: string;
        logoUrl?: string;
    };
    createdAt: string;
}

export default function FindJobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await fetch('/api/professional/jobs');
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
        fetchJobs();
    }, []);

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 pb-8">
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

                {/* Search Bar - Full Width, Enhanced */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-[28px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center gap-3 bg-[#0f172a] border-2 border-slate-800 group-focus-within:border-blue-500/50 rounded-[28px] px-6 py-4 transition-all">
                        <Search className="text-slate-500 group-focus-within:text-blue-400 transition-colors shrink-0" size={22} />
                        <input
                            type="text"
                            placeholder="Search jobs by title, company, or keywords..."
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
            </header>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="font-bold text-xs text-slate-500 uppercase tracking-widest">Scanning network for roles...</p>
                </div>
            ) : filteredJobs.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-slate-600 space-y-4">
                    <Briefcase size={64} className="opacity-10" />
                    <p className="font-bold text-sm uppercase tracking-widest">No matching jobs found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredJobs.map((job) => (
                        <button
                            key={job.id}
                            onClick={() => router.push(`/professional/jobs/${job.id}`)}
                            className="group relative flex flex-col text-left bg-[#0f172a] border border-slate-800 rounded-[32px] overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10"
                        >
                            <div className="p-8 space-y-6 flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shadow-lg">
                                        {job.company.logoUrl ? (
                                            <img src={job.company.logoUrl} alt={job.company.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Building2 size={24} className="text-slate-500" />
                                        )}
                                    </div>
                                    <div className="px-3 py-1 bg-emerald-500/10 text-[10px] font-black text-emerald-400 uppercase tracking-widest rounded-lg border border-emerald-500/20 flex items-center gap-2">
                                        <Zap size={10} /> Active Now
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-white leading-tight group-hover:text-blue-400 transition-colors uppercase tracking-tighter line-clamp-2">{job.title}</h2>
                                    <p className="text-blue-400 font-bold text-sm tracking-tight">{job.company.name}</p>
                                </div>

                                <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">{job.description}</p>
                            </div>

                            <div className="px-8 py-5 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between group-hover:bg-blue-600/5 transition-colors">
                                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(job.createdAt).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1.5"><MapPin size={12} /> Remote</span>
                                </div>
                                <div className="text-blue-500 group-hover:translate-x-1 transition-transform"><ChevronRight size={20} /></div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
