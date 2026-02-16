"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Briefcase, MapPin, Building2, Clock, ChevronRight, Zap, CheckCircle2, Trash2, Heart, ChevronLeft, Share2, ChevronDown, Filter, Check, X } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface Job {
    id: string;
    title: string;
    description: string;
    location?: string;
    location_type?: string;
    employment_type?: string;
    role_categories?: string[];
    company: {
        name: string;
        logoUrl?: string;
    };
    createdAt: string;
    applicationStatus?: string | null;
    applicationId?: string | null;
    isInvited?: boolean;
    isSaved?: boolean;
}

interface CategoryOption {
    value: string;
    label: string;
}

const ITEMS_PER_PAGE = 100;

export default function FindJobsPage() {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [jobs, setJobs] = useState<Job[]>([]);
    const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'find' | 'applied' | 'invited' | 'saved'>('find');
    const [appliedFilter, setAppliedFilter] = useState<'all' | 'waiting' | 'rejected' | 'shortlisted' | 'declined' | 'employed'>('all');
    const [searchType, setSearchType] = useState<'job' | 'company'>('job');
    const [linkedJobId, setLinkedJobId] = useState<string | null>(null);
    const [savingJobId, setSavingJobId] = useState<string | null>(null);
    const [copiedJobId, setCopiedJobId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Role Category Filter State
    const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const categoryDropdownRef = useRef<HTMLDivElement>(null);

    // Location Filter State
    const [locationFilter, setLocationFilter] = useState<'all' | 'remote' | 'onsite' | 'hybrid'>('all');
    const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
    const locationDropdownRef = useRef<HTMLDivElement>(null);

    // Fetch categories on mount
    useEffect(() => {
        fetch('/api/employer/categories')
            .then(res => res.json())
            .then(data => {
                if (data.categories) {
                    setCategoryOptions(data.categories.map((c: any) => ({
                        value: c.slug,
                        label: c.label
                    })));
                }
            })
            .catch(console.error);
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
                setIsCategoryDropdownOpen(false);
            }
            if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
                setIsLocationDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Analytics tracking
    const trackedImpressions = useRef<Set<string>>(new Set());
    const impressionQueue = useRef<string[]>([]);
    const flushTimeout = useRef<NodeJS.Timeout | null>(null);


    useEffect(() => {
        // Handle URL Ref Param
        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');

        if (ref) {
            verifyLink(ref);
        } else {
            fetchJobs();
            fetchSavedJobs();
        }
    }, []);

    const fetchSavedJobs = async () => {
        try {
            const res = await fetch('/api/professional/saved-jobs');
            if (res.ok) {
                const data = await res.json();
                const ids = new Set<string>((data.savedJobs || []).map((sj: any) => sj.job_id));
                setSavedJobIds(ids);
            }
        } catch (error) {
            console.error("Error fetching saved jobs", error);
        }
    };

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

                    const jobRes = await fetch(`/api/professional/jobs/${data.jobId}`);
                    if (jobRes.ok) {
                        const { job } = await jobRes.json();
                        if (job) {
                            setJobs([job]);
                            setLoading(false);
                            return;
                        }
                    }
                }
            }
            fetchJobs();
        } catch (e) {
            console.error('Link verification error', e);
            fetchJobs();
        }
    };

    const fetchJobs = async () => {
        try {
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

    const trackJobEvent = useCallback(async (jobId: string, eventType: 'impression' | 'view' | 'apply_start' | 'apply_abandon') => {
        try {
            await fetch('/api/analytics/job-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobId, eventType })
            });
        } catch (error) {
            // Silent fail
        }
    }, []);

    const flushImpressions = useCallback(async () => {
        if (impressionQueue.current.length === 0) return;
        const events = impressionQueue.current.map(jobId => ({ jobId, eventType: 'impression' }));
        impressionQueue.current = [];
        try {
            await fetch('/api/analytics/job-event', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events })
            });
        } catch (error) { }
    }, []);

    const queueImpression = useCallback((jobId: string) => {
        if (trackedImpressions.current.has(jobId)) return;
        trackedImpressions.current.add(jobId);
        impressionQueue.current.push(jobId);
        if (flushTimeout.current) clearTimeout(flushTimeout.current);
        flushTimeout.current = setTimeout(flushImpressions, 2000);
    }, [flushImpressions]);

    const handleJobView = useCallback((jobId: string) => {
        trackJobEvent(jobId, 'view');
        router.push(`/professional/jobs/${jobId}`);
    }, [router, trackJobEvent]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const jobId = entry.target.getAttribute('data-job-id');
                        if (jobId) queueImpression(jobId);
                    }
                });
            },
            { threshold: 0.5 }
        );
        const jobCards = document.querySelectorAll('[data-job-id]');
        jobCards.forEach(card => observer.observe(card));
        return () => {
            observer.disconnect();
            if (flushTimeout.current) {
                clearTimeout(flushTimeout.current);
                flushImpressions();
            }
        };
    }, [jobs, queueImpression, flushImpressions]);

    const handleSaveJob = async (jobId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (savingJobId) return;
        setSavingJobId(jobId);
        const isSaved = savedJobIds.has(jobId);
        try {
            if (isSaved) {
                const res = await fetch('/api/professional/saved-jobs', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jobId })
                });
                if (res.ok) {
                    setSavedJobIds(prev => {
                        const next = new Set(prev);
                        next.delete(jobId);
                        return next;
                    });
                }
            } else {
                const res = await fetch('/api/professional/saved-jobs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jobId })
                });
                if (res.ok) {
                    setSavedJobIds(prev => new Set(prev).add(jobId));
                }
            }
        } catch (error) {
            console.error('Error saving job:', error);
        } finally {
            setSavingJobId(null);
        }
    };

    const handleRetract = async (applicationId: string) => {
        if (!confirm('Are you sure you want to retract your application?')) return;
        try {
            const res = await fetch(`/api/professional/applications/${applicationId}`, { method: 'DELETE' });
            if (res.ok) fetchJobs();
            else alert('Could not retract application.');
        } catch (error) {
            console.error('Error retracting:', error);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [viewMode, appliedFilter, searchTerm, searchType, selectedCategory, locationFilter]);

    const filteredJobs = jobs.filter(job => {
        if (linkedJobId) return job.id === linkedJobId;
        const term = searchTerm.toLowerCase();
        let matchesSearch = false;
        if (searchType === 'company') {
            matchesSearch = job.company?.name?.toLowerCase().includes(term);
        } else {
            matchesSearch = job.title?.toLowerCase().includes(term) ||
                job.company?.name?.toLowerCase().includes(term) ||
                (job.description || '').toLowerCase().includes(term);
        }

        // Category filter
        let matchesCategory = true;
        if (selectedCategory !== 'all') {
            const jobCategories = job.role_categories || [];
            matchesCategory = jobCategories.includes(selectedCategory);
        }

        // Location type filter
        let matchesLocation = true;
        if (locationFilter !== 'all') {
            matchesLocation = job.location_type?.toLowerCase() === locationFilter;
        }

        let matchesMode = false;
        if (viewMode === 'find') {
            matchesMode = !job.applicationStatus;
        } else if (viewMode === 'invited') {
            matchesMode = !!job.isInvited && !job.applicationStatus;
        } else if (viewMode === 'applied') {
            matchesMode = !!job.applicationStatus;
            if (matchesMode && appliedFilter !== 'all') {
                const status = job.applicationStatus?.toLowerCase() || '';
                if (appliedFilter === 'waiting') matchesMode = status === 'pending' || status === 'waiting';
                else if (appliedFilter === 'rejected') matchesMode = status === 'rejected';
                else if (appliedFilter === 'shortlisted') matchesMode = status === 'shortlisted';
                else if (appliedFilter === 'declined') matchesMode = status === 'declined';
                else if (appliedFilter === 'employed') matchesMode = ['employed', 'hired', 'accepted'].includes(status);
            }
        } else if (viewMode === 'saved') {
            matchesMode = savedJobIds.has(job.id) && !job.applicationStatus;
        }
        return matchesSearch && matchesMode && matchesCategory && matchesLocation;
    });

    const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
    const paginatedJobs = filteredJobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const appliedJobs = jobs.filter(j => j.applicationStatus);
    const appliedCounts = {
        all: appliedJobs.length,
        waiting: appliedJobs.filter(j => ['pending', 'waiting'].includes(j.applicationStatus?.toLowerCase() || '')).length,
        rejected: appliedJobs.filter(j => j.applicationStatus?.toLowerCase() === 'rejected').length,
        shortlisted: appliedJobs.filter(j => j.applicationStatus?.toLowerCase() === 'shortlisted').length,
        declined: appliedJobs.filter(j => j.applicationStatus?.toLowerCase() === 'declined').length,
        employed: appliedJobs.filter(j => ['employed', 'hired', 'accepted'].includes(j.applicationStatus?.toLowerCase() || '')).length,
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm.trim().length > 2) {
                fetch('/api/professional/search/history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: searchTerm, filters: { type: searchType } })
                });
            }
        }, 2000);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, searchType]);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-8">
            <header className={`space-y-6 pb-8 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="text-left">
                        <div className={`flex items-center gap-2 mb-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            <Zap size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Job Discovery</span>
                        </div>
                        <h1 className={`text-4xl font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>Find Opportunities</h1>
                        <p className={`mt-2 text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Discover job roles that match your profile.</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-6 w-full">
                    <div className={`flex p-1 rounded-xl border overflow-x-auto scrollbar-hide shrink-0 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
                        <button onClick={() => setViewMode('find')} className={`px-4 md:px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${viewMode === 'find' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' shadow-lg' : isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-500 hover:text-black'}`}>Find Work</button>
                        <button onClick={() => setViewMode('saved')} className={`px-4 md:px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${viewMode === 'saved' ? 'bg-red-600 text-white shadow-lg' : isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-500 hover:text-black'}`}><Heart size={12} className="inline mr-1" />Saved<span className={`ml-2 px-1.5 py-0.5 rounded-md ${isDark ? 'bg-neutral-800 text-white' : 'bg-white text-black'}`}>{jobs.filter(j => savedJobIds.has(j.id) && !j.applicationStatus).length}</span></button>
                        <button onClick={() => setViewMode('invited')} className={`px-4 md:px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${viewMode === 'invited' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' shadow-lg' : isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-500 hover:text-black'}`}>Invited<span className={`ml-2 px-1.5 py-0.5 rounded-md ${isDark ? 'bg-neutral-800 text-white' : 'bg-white text-black'}`}>{jobs.filter(j => j.isInvited && !j.applicationStatus).length}</span></button>
                        <button onClick={() => setViewMode('applied')} className={`px-4 md:px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${viewMode === 'applied' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' shadow-lg' : isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-500 hover:text-black'}`}>Applied<span className={`ml-2 px-1.5 py-0.5 rounded-md ${isDark ? 'bg-neutral-800 text-white' : 'bg-white text-black'}`}>{appliedCounts.all}</span></button>
                    </div>

                    <div className="relative group flex-1 w-full flex items-center gap-2 min-w-0">
                        <div className={`relative z-10 flex rounded-full p-1 border shrink-0 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
                            <button onClick={() => setSearchType('job')} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${searchType === 'job' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-500 hover:text-black'}`}>Jobs</button>
                            <button onClick={() => setSearchType('company')} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${searchType === 'company' ? (isDark ? 'bg-white text-black' : 'bg-black text-white') : isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-500 hover:text-black'}`}>Companies</button>
                        </div>
                        <div className={`relative z-10 flex-1 min-w-0 flex items-center gap-3 border-2 rounded-[28px] px-6 py-3 transition-all ${isDark ? 'bg-black border-neutral-800 group-focus-within:border-neutral-600' : 'bg-white border-neutral-200 group-focus-within:border-neutral-400'}`}>
                            <Search className={`shrink-0 transition-colors ${isDark ? 'text-neutral-500 group-focus-within:text-white' : 'text-neutral-400 group-focus-within:text-black'}`} size={20} />
                            <input type="text" placeholder={`Search ${searchType === 'company' ? 'companies' : viewMode === 'find' ? 'smart matching jobs' : viewMode === 'saved' ? 'saved jobs' : 'applications'}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`flex-1 min-w-0 bg-transparent focus:outline-none font-medium text-sm ${isDark ? 'text-white placeholder:text-neutral-600' : 'text-black placeholder:text-neutral-400'}`} />
                            {searchTerm && <button onClick={() => setSearchTerm('')} className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-500 hover:text-white' : 'hover:bg-neutral-100 text-neutral-400 hover:text-black'}`}>×</button>}
                        </div>
                    </div>
                </div>

                {/* Filter Dropdowns Row */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className={`flex items-center gap-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        <Filter size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
                    </div>

                    {/* Location Type Filter */}
                    <div className="relative" ref={locationDropdownRef}>
                        <button
                            onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-xs font-bold ${locationFilter !== 'all'
                                ? isDark
                                    ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                : isDark
                                    ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-600'
                                    : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:border-neutral-400'
                                }`}
                        >
                            <MapPin size={14} />
                            <span className="uppercase tracking-wider">
                                {locationFilter === 'all' ? 'All Locations' : locationFilter.charAt(0).toUpperCase() + locationFilter.slice(1)}
                            </span>
                            <ChevronDown size={14} className={`transition-transform ${isLocationDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isLocationDropdownOpen && (
                            <div className={`absolute top-full left-0 mt-2 w-48 border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                <div className="p-1">
                                    {(['all', 'remote', 'onsite', 'hybrid'] as const).map(loc => (
                                        <button
                                            key={loc}
                                            onClick={() => {
                                                setLocationFilter(loc);
                                                setIsLocationDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-between ${locationFilter === loc
                                                ? isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-black'
                                                : isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
                                                }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                {loc === 'remote' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                                                {loc === 'onsite' && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                                                {loc === 'hybrid' && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                                                {loc === 'all' ? 'All Locations' : loc.charAt(0).toUpperCase() + loc.slice(1)}
                                            </span>
                                            {locationFilter === loc && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Clear Filters Button */}
                    {locationFilter !== 'all' && (
                        <button
                            onClick={() => {
                                setLocationFilter('all');
                            }}
                            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${isDark ? 'text-neutral-500 hover:text-white hover:bg-neutral-800' : 'text-neutral-500 hover:text-black hover:bg-neutral-100'}`}
                        >
                            <X size={12} />
                            Clear
                        </button>
                    )}
                </div>

                {viewMode === 'applied' && (
                    <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2">
                        <button onClick={() => setAppliedFilter('all')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${appliedFilter === 'all' ? (isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black') : isDark ? 'bg-neutral-800/50 text-neutral-400 border-neutral-700 hover:text-white' : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:text-black'}`}>All ({appliedCounts.all})</button>
                        <button onClick={() => setAppliedFilter('waiting')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${appliedFilter === 'waiting' ? 'bg-amber-600 text-white border-amber-500' : isDark ? 'bg-neutral-800/50 text-neutral-400 border-neutral-700 hover:text-white' : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:text-black'}`}>Waiting ({appliedCounts.waiting})</button>
                        <button onClick={() => setAppliedFilter('shortlisted')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${appliedFilter === 'shortlisted' ? (isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black') : isDark ? 'bg-neutral-800/50 text-neutral-400 border-neutral-700 hover:text-white' : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:text-black'}`}>Shortlisted ({appliedCounts.shortlisted})</button>
                        <button onClick={() => setAppliedFilter('employed')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${appliedFilter === 'employed' ? 'bg-emerald-600 text-white border-emerald-500' : isDark ? 'bg-neutral-800/50 text-neutral-400 border-neutral-700 hover:text-white' : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:text-black'}`}>Employed ({appliedCounts.employed})</button>
                        <button onClick={() => setAppliedFilter('rejected')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${appliedFilter === 'rejected' ? 'bg-red-600 text-white border-red-500' : isDark ? 'bg-neutral-800/50 text-neutral-400 border-neutral-700 hover:text-white' : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:text-black'}`}>Rejected ({appliedCounts.rejected})</button>
                        <button onClick={() => setAppliedFilter('declined')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${appliedFilter === 'declined' ? 'bg-neutral-600 text-white border-neutral-500' : isDark ? 'bg-neutral-800/50 text-neutral-400 border-neutral-700 hover:text-white' : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:text-black'}`}>Declined ({appliedCounts.declined})</button>
                    </div>
                )}
            </header>

            {viewMode === 'applied' && !loading && (
                <div className="flex items-center justify-between">
                    <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}><span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>{filteredJobs.length}</span> Applications{appliedFilter !== 'all' && <span className="text-neutral-500 text-sm ml-2">({appliedFilter.replace('_', ' ')})</span>}</h2>
                    {totalPages > 1 && <p className="text-neutral-500 text-sm">Page {currentPage} of {totalPages}</p>}
                </div>
            )}

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-neutral-700 border-t-white' : 'border-neutral-200 border-t-black'}`}></div>
                    <p className="font-bold text-xs text-neutral-500 uppercase tracking-widest">Scanning network for roles...</p>
                </div>
            ) : paginatedJobs.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center text-neutral-600 space-y-4">
                    <Briefcase size={64} className="opacity-10" />
                    <p className="font-bold text-sm uppercase tracking-widest">
                        {viewMode === 'find' ? 'No open roles found matching your search' :
                            viewMode === 'saved' ? 'No saved jobs yet. Click the heart icon to save jobs for later.' :
                                viewMode === 'applied' && appliedFilter !== 'all' ? `No ${appliedFilter.replace('_', ' ')} applications` :
                                    'You haven\'t applied to any jobs yet'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {paginatedJobs.map((job) => (
                            <div key={job.id} data-job-id={job.id} className={`group relative flex flex-col text-left border rounded-[32px] overflow-hidden transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-black border-neutral-800 hover:border-neutral-600 hover:shadow-2xl hover:shadow-white/5' : 'bg-white border-neutral-200 hover:border-neutral-400 hover:shadow-xl'}`}>
                                <div className="p-5 md:p-8 space-y-6 flex-1">
                                    <div className="flex items-center justify-between">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br border overflow-hidden flex items-center justify-center shadow-lg ${isDark ? 'from-neutral-800 to-neutral-900 border-neutral-700' : 'from-neutral-100 to-neutral-200 border-neutral-200'}`}>
                                            {job.company?.logoUrl ? <img src={job.company.logoUrl} alt={job.company.name} className="w-full h-full object-cover" /> : <Building2 size={24} className={isDark ? 'text-neutral-500' : 'text-neutral-400'} />}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!job.applicationStatus && (
                                                <>
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            try {
                                                                const res = await fetch(`/api/employer/jobs/${job.id}/share`);
                                                                const data = await res.json();
                                                                if (data.link) {
                                                                    navigator.clipboard.writeText(data.link);
                                                                    setCopiedJobId(job.id);
                                                                    setTimeout(() => setCopiedJobId(null), 2500);
                                                                }
                                                            } catch (e) { console.error(e); }
                                                        }}
                                                        className={`p-2 rounded-xl border transition-all z-20 ${copiedJobId === job.id
                                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                            : isDark
                                                                ? 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-emerald-400 hover:border-emerald-500/20'
                                                                : 'bg-neutral-100 border-neutral-200 text-neutral-400 hover:text-emerald-400 hover:border-emerald-500/20'}`}
                                                        title={copiedJobId === job.id ? 'Link copied!' : 'Share job'}
                                                    >
                                                        <Share2 size={16} />
                                                    </button>
                                                    <button onClick={(e) => handleSaveJob(job.id, e)} disabled={savingJobId === job.id} className={`p-2 rounded-xl border transition-all z-20 ${savedJobIds.has(job.id) ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-red-400 hover:border-red-500/20' : 'bg-neutral-100 border-neutral-200 text-neutral-400 hover:text-red-400 hover:border-red-500/20'}`} title={savedJobIds.has(job.id) ? 'Unsave job' : 'Save job for later'}>
                                                        <Heart size={16} fill={savedJobIds.has(job.id) ? 'currentColor' : 'none'} />
                                                    </button>
                                                </>
                                            )}
                                            <div className="px-3 py-1 bg-emerald-500/10 text-[10px] font-black text-emerald-400 uppercase tracking-widest rounded-lg border border-emerald-500/20 flex items-center gap-2"><Zap size={10} /> Active</div>
                                        </div>
                                    </div>
                                    {job.applicationStatus && (
                                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit ${job.applicationStatus === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : job.applicationStatus === 'shortlisted' ? (isDark ? 'bg-white/10 text-white border-white/20' : 'bg-black/10 text-black border-black/20') : ['employed', 'hired', 'accepted'].includes(job.applicationStatus) ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : job.applicationStatus === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' : isDark ? 'bg-neutral-800 text-neutral-500 border-neutral-700' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                                            <CheckCircle2 size={10} /> {job.applicationStatus.replace('_', ' ')}
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <h2 className={`text-2xl font-black leading-tight transition-colors uppercase tracking-tighter line-clamp-2 ${isDark ? 'text-white group-hover:text-neutral-300' : 'text-black group-hover:text-neutral-600'}`}>{job.title}</h2>
                                        <p className={`font-bold text-sm tracking-tight ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{job.company?.name || 'Unknown Company'}</p>
                                    </div>
                                    <p className={`text-sm line-clamp-3 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{job.description}</p>
                                </div>
                                <div className={`px-5 md:px-8 py-4 md:py-5 border-t transition-colors ${isDark ? 'bg-neutral-900/50 border-neutral-800 group-hover:bg-white/5' : 'bg-neutral-50 border-neutral-200 group-hover:bg-neutral-100'}`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                                            <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(job.createdAt).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1.5"><MapPin size={12} className={isDark ? 'text-neutral-400' : 'text-neutral-600'} /> {job.location_type ? job.location_type.charAt(0).toUpperCase() + job.location_type.slice(1) : 'Remote'}</span>
                                            <span className="flex items-center gap-1.5"><Briefcase size={12} className="text-emerald-500" /> {job.employment_type ? job.employment_type.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Full Time'}</span>
                                            {job.location && <span className={`flex items-center gap-1.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}><span className="hidden sm:inline">—</span> {job.location}</span>}
                                        </div>
                                        <div className="flex items-center justify-end shrink-0">
                                            {job.applicationStatus === 'pending' ? (
                                                <button onClick={() => handleRetract(job.applicationId!)} className="text-red-500 hover:text-red-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-colors z-20"><Trash2 size={14} /> Retract</button>
                                            ) : !job.applicationStatus ? (
                                                <button onClick={() => handleJobView(job.id)} className={`group-hover:translate-x-1 transition-transform z-20 ${isDark ? 'text-white' : 'text-black'}`}><ChevronRight size={20} /></button>
                                            ) : (
                                                <span className={`font-bold text-xs uppercase tracking-widest flex items-center gap-2 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}><CheckCircle2 size={14} /> Applied</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {!job.applicationStatus && <button className="absolute inset-0 z-10" onClick={() => handleJobView(job.id)} />}
                            </div>
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 pt-8">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'}`}><ChevronLeft size={16} /> Previous</button>
                            <div className="flex items-center gap-2"><span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Page <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{currentPage}</span> of <span className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{totalPages}</span></span></div>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'}`}>Next <ChevronRight size={16} /></button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
