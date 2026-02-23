"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Building2, MapPin, Briefcase, Search, ChevronDown, Clock,
    ExternalLink, Check, X, Globe, Users, Sparkles, Copy, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import VerificationBadge from '@/app/components/VerificationBadge';

interface Job {
    id: string;
    title: string;
    description: string;
    location: string;
    location_type: string;
    role_categories: string[];
    createdAt: string;
    relevanceScore?: number;
}

interface CompanyInfo {
    id: string;
    name: string;
    industry: string;
    size: string;
    website: string;
    about: string;
    logo: string;
    location: string;
    badge_type: string;
}

interface Filters {
    categories: string[];
    locationTypes: string[];
}

export default function CareersPage() {
    const params = useParams();
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const slug = params.slug as string;

    const [company, setCompany] = useState<CompanyInfo | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [filters, setFilters] = useState<Filters>({ categories: [], locationTypes: [] });
    const [totalJobs, setTotalJobs] = useState(0);
    const [isPersonalized, setIsPersonalized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedLocationType, setSelectedLocationType] = useState('all');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isLocationOpen, setIsLocationOpen] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    const categoryRef = useRef<HTMLDivElement>(null);
    const locationRef = useRef<HTMLDivElement>(null);

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
                setIsCategoryOpen(false);
            }
            if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
                setIsLocationOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch jobs
    useEffect(() => {
        if (!slug) return;
        fetchJobs();
    }, [slug, selectedCategory, selectedLocationType]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchJobs();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (selectedCategory !== 'all') params.set('category', selectedCategory);
            if (selectedLocationType !== 'all') params.set('location_type', selectedLocationType);
            if (searchTerm.trim()) params.set('search', searchTerm.trim());

            const url = `/api/company/${slug}/jobs${params.toString() ? '?' + params.toString() : ''}`;
            const res = await fetch(url);

            if (!res.ok) {
                if (res.status === 404) {
                    setError('Company not found');
                } else {
                    setError('Failed to load careers page');
                }
                return;
            }

            const data = await res.json();
            setCompany(data.company);
            setJobs(data.jobs || []);
            setFilters(data.filters || { categories: [], locationTypes: [] });
            setTotalJobs(data.totalJobs || 0);
            setIsPersonalized(data.isPersonalized || false);
            setError(null);
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = (jobId: string) => {
        // Navigate to the job detail/apply page
        // If not logged in, the page itself will redirect to login
        router.push(`/professional/jobs/${jobId}`);
    };

    const handleCopyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return date.toLocaleDateString();
    };

    const locationTypeColors: Record<string, string> = {
        remote: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        onsite: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        hybrid: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    };

    // --- Error State ---
    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="text-center space-y-4">
                    <Building2 size={64} className={`mx-auto ${isDark ? 'text-neutral-700' : 'text-neutral-300'}`} />
                    <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{error}</h1>
                    <p className={`text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        The careers page you&apos;re looking for doesn&apos;t exist or may have been removed.
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                    >
                        Go to Profcaria
                    </button>
                </div>
            </div>
        );
    }

    // --- Loading State ---
    if (loading && !company) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className={`w-12 h-12 border-4 rounded-full animate-spin mx-auto ${isDark ? 'border-neutral-700 border-t-white' : 'border-neutral-200 border-t-black'}`} />
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Loading careers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {/* --- Company Header --- */}
            {company && (
                <div className={`border rounded-[32px] p-6 sm:p-10 space-y-6 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                        {/* Logo */}
                        <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border overflow-hidden flex items-center justify-center shrink-0 shadow-lg ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-200'}`}>
                            {company.logo ? (
                                <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                            ) : (
                                <Building2 size={36} className={isDark ? 'text-neutral-600' : 'text-neutral-400'} />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                                    {company.name}
                                </h1>
                                {company.badge_type && company.badge_type !== 'none' && (
                                    <VerificationBadge tier={company.badge_type} size={22} />
                                )}
                            </div>

                            <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                {company.industry && (
                                    <span className="flex items-center gap-1.5">
                                        <Briefcase size={14} /> {company.industry}
                                    </span>
                                )}
                                {company.location && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin size={14} /> {company.location}
                                    </span>
                                )}
                                {company.size && (
                                    <span className="flex items-center gap-1.5">
                                        <Users size={14} /> {company.size} employees
                                    </span>
                                )}
                                {company.website && (
                                    <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 hover:underline">
                                        <Globe size={14} /> Website
                                    </a>
                                )}
                            </div>

                            {company.about && (
                                <p className={`text-sm leading-relaxed line-clamp-3 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                    {company.about}
                                </p>
                            )}
                        </div>

                        {/* Share Button */}
                        <button
                            onClick={handleCopyLink}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all shrink-0 ${copiedLink
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                : isDark
                                    ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-600'
                                    : 'bg-neutral-100 border-neutral-200 text-neutral-500 hover:text-black hover:border-neutral-400'
                                }`}
                        >
                            {copiedLink ? <><CheckCircle2 size={14} /> Copied!</> : <><Copy size={14} /> Share Page</>}
                        </button>
                    </div>

                    {/* Stats */}
                    <div className={`flex items-center gap-6 pt-4 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                        <div className="flex items-center gap-2">
                            <div className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                {totalJobs} {totalJobs === 1 ? 'Open Role' : 'Open Roles'}
                            </div>
                        </div>
                        {isPersonalized && (
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                                <Sparkles size={14} />
                                <span>Personalized for you</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- Filters --- */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search roles, skills, locations..."
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-bold transition-all focus:outline-none focus:ring-2 ${isDark
                            ? 'bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus:ring-neutral-600'
                            : 'bg-white border-neutral-200 text-black placeholder-neutral-400 focus:ring-neutral-300'
                            }`}
                    />
                </div>

                {/* Category Dropdown */}
                {filters.categories.length > 0 && (
                    <div ref={categoryRef} className="relative">
                        <button
                            onClick={() => { setIsCategoryOpen(!isCategoryOpen); setIsLocationOpen(false); }}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory !== 'all'
                                ? isDark ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                : isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-600' : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-400'
                                }`}
                        >
                            <Briefcase size={14} />
                            <span>{selectedCategory === 'all' ? 'All Categories' : selectedCategory}</span>
                            <ChevronDown size={14} className={`transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isCategoryOpen && (
                            <div className={`absolute top-full right-0 mt-2 w-56 border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                <div className="p-1 max-h-64 overflow-y-auto">
                                    <button
                                        onClick={() => { setSelectedCategory('all'); setIsCategoryOpen(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-between ${selectedCategory === 'all'
                                            ? isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-black'
                                            : isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-600 hover:bg-neutral-100'
                                            }`}
                                    >
                                        All Categories
                                        {selectedCategory === 'all' && <Check size={14} />}
                                    </button>
                                    {filters.categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => { setSelectedCategory(cat); setIsCategoryOpen(false); }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-between ${selectedCategory === cat
                                                ? isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-black'
                                                : isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-600 hover:bg-neutral-100'
                                                }`}
                                        >
                                            <span className="truncate">{cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                            {selectedCategory === cat && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Location Type Dropdown */}
                {filters.locationTypes.length > 0 && (
                    <div ref={locationRef} className="relative">
                        <button
                            onClick={() => { setIsLocationOpen(!isLocationOpen); setIsCategoryOpen(false); }}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedLocationType !== 'all'
                                ? isDark ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                : isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-600' : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-400'
                                }`}
                        >
                            <MapPin size={14} />
                            <span>{selectedLocationType === 'all' ? 'All Locations' : selectedLocationType.charAt(0).toUpperCase() + selectedLocationType.slice(1)}</span>
                            <ChevronDown size={14} className={`transition-transform ${isLocationOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isLocationOpen && (
                            <div className={`absolute top-full right-0 mt-2 w-48 border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                <div className="p-1">
                                    <button
                                        onClick={() => { setSelectedLocationType('all'); setIsLocationOpen(false); }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-between ${selectedLocationType === 'all'
                                            ? isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-black'
                                            : isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-100'
                                            }`}
                                    >
                                        All Locations
                                        {selectedLocationType === 'all' && <Check size={14} />}
                                    </button>
                                    {filters.locationTypes.map(loc => (
                                        <button
                                            key={loc}
                                            onClick={() => { setSelectedLocationType(loc); setIsLocationOpen(false); }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-between ${selectedLocationType === loc
                                                ? isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-black'
                                                : isDark ? 'text-neutral-400 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-100'
                                                }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${loc === 'remote' ? 'bg-blue-500' : loc === 'onsite' ? 'bg-orange-500' : 'bg-purple-500'}`} />
                                                {loc.charAt(0).toUpperCase() + loc.slice(1)}
                                            </span>
                                            {selectedLocationType === loc && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Clear Filters */}
                {(selectedCategory !== 'all' || selectedLocationType !== 'all' || searchTerm) && (
                    <button
                        onClick={() => { setSelectedCategory('all'); setSelectedLocationType('all'); setSearchTerm(''); }}
                        className={`flex items-center gap-1 px-3 py-3 rounded-xl text-xs font-bold transition-all ${isDark ? 'text-neutral-500 hover:text-white hover:bg-neutral-800' : 'text-neutral-500 hover:text-black hover:bg-neutral-100'}`}
                    >
                        <X size={12} /> Clear
                    </button>
                )}
            </div>

            {/* --- Personalization Banner --- */}
            {isPersonalized && jobs.some(j => (j.relevanceScore || 0) > 0) && (
                <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${isDark ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-100'}`}>
                    <Sparkles size={16} className="text-amber-500 shrink-0" />
                    <p className="text-xs font-bold text-amber-500">
                        Jobs are sorted by relevance to your profile. Matched roles appear first.
                    </p>
                </div>
            )}

            {/* --- Job Cards --- */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-neutral-700 border-t-white' : 'border-neutral-200 border-t-black'}`} />
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Loading roles...</p>
                </div>
            ) : jobs.length === 0 ? (
                <div className={`py-20 flex flex-col items-center justify-center text-center space-y-4 border rounded-[32px] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                    <Briefcase size={48} className={isDark ? 'text-neutral-700' : 'text-neutral-300'} />
                    <h3 className={`text-lg font-black ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        {searchTerm || selectedCategory !== 'all' || selectedLocationType !== 'all'
                            ? 'No roles match your filters'
                            : 'No open roles right now'}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                        {searchTerm || selectedCategory !== 'all' || selectedLocationType !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'Check back later for new opportunities'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {jobs.map(job => (
                        <div
                            key={job.id}
                            onClick={() => handleApply(job.id)}
                            className={`group relative cursor-pointer flex flex-col border rounded-[32px] overflow-hidden transition-all duration-300 hover:scale-[1.02] ${isDark
                                ? 'bg-black border-neutral-800 hover:border-neutral-600 hover:shadow-2xl hover:shadow-white/5'
                                : 'bg-white border-neutral-200 hover:border-neutral-400 hover:shadow-xl'
                                }`}
                        >
                            {/* Relevance indicator */}
                            {isPersonalized && (job.relevanceScore || 0) > 0 && (
                                <div className="absolute top-4 right-4 z-10">
                                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                        <Sparkles size={10} className="text-amber-500" />
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Match</span>
                                    </div>
                                </div>
                            )}

                            <div className="p-5 sm:p-8 space-y-5 flex-1">
                                {/* Title */}
                                <div className="space-y-2 pr-16">
                                    <h2 className={`text-xl sm:text-2xl font-black leading-tight uppercase tracking-tighter line-clamp-2 transition-colors ${isDark ? 'text-white group-hover:text-neutral-300' : 'text-black group-hover:text-neutral-600'}`}>
                                        {job.title}
                                    </h2>
                                </div>

                                {/* Description */}
                                <p className={`text-sm line-clamp-3 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    {job.description}
                                </p>

                                {/* Role categories */}
                                {job.role_categories.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {job.role_categories.slice(0, 3).map(cat => (
                                            <span
                                                key={cat}
                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-400' : 'bg-neutral-100 border-neutral-200 text-neutral-500'}`}
                                            >
                                                {cat.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </span>
                                        ))}
                                        {job.role_categories.length > 3 && (
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                                +{job.role_categories.length - 3}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className={`px-5 sm:px-8 py-4 border-t transition-colors ${isDark ? 'bg-neutral-900/50 border-neutral-800 group-hover:bg-white/5' : 'bg-neutral-50 border-neutral-200 group-hover:bg-neutral-100'}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                                        <span className="flex items-center gap-1.5">
                                            <Clock size={12} /> {formatDate(job.createdAt)}
                                        </span>
                                        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border ${locationTypeColors[job.location_type] || (isDark ? 'border-neutral-700 text-neutral-500' : 'border-neutral-200 text-neutral-400')}`}>
                                            <MapPin size={10} />
                                            {job.location_type ? job.location_type.charAt(0).toUpperCase() + job.location_type.slice(1) : 'Remote'}
                                        </span>
                                        {job.location && (
                                            <span className={`${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                                {job.location}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-end shrink-0">
                                        <span className={`flex items-center gap-1 text-xs font-bold uppercase tracking-widest transition-colors ${isDark ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-emerald-600 group-hover:text-emerald-500'}`}>
                                            View & Apply <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </span>
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
