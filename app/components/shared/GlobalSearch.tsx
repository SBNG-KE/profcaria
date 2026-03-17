"use client"

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X, Building2, UserCircle, Clock, TrendingUp, Briefcase, Rss } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import VerificationBadge from '../VerificationBadge';

export default function GlobalSearch({ isMobile = false }: { isMobile?: boolean }) {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [recentSearches, setRecentSearches] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const pathname = usePathname();

    // Context-aware search scope based on current page
    const getSearchContext = () => {
        if (pathname.includes('/feed')) return { placeholder: 'Search posts and people...', scope: 'feed' };
        if (pathname.includes('/find')) return { placeholder: 'Search jobs...', scope: 'jobs' };
        if (pathname.includes('/connections')) return { placeholder: 'Search connections...', scope: 'connections' };
        if (pathname.includes('/notifications')) return { placeholder: 'Search conversations...', scope: 'chats' };
        if (pathname.includes('/roles-jobs') || pathname.includes('/jobs')) return { placeholder: 'Search your jobs...', scope: 'myjobs' };
        if (pathname.includes('/career-ai') || pathname.includes('/recruiter-ai')) return { placeholder: 'Search AI conversations...', scope: 'ai' };
        if (pathname.includes('/settings')) return { placeholder: 'Search settings...', scope: 'settings' };
        return { placeholder: 'Search for people or companies...', scope: 'global' };
    };
    const searchContext = getSearchContext();

    // Fetch search history when modal opens
    useEffect(() => {
        if (isOpen && recentSearches.length === 0) {
            fetchSearchHistory();
        }
    }, [isOpen]);

    const fetchSearchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const res = await fetch('/api/search/history');
            if (res.ok) {
                const data = await res.json();
                setRecentSearches(data.history || []);
            }
        } catch (err) {
            console.error('Failed to fetch search history:', err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Debounced Search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search/users?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    let searchResults = data.results || [];

                    // Prioritize recently searched users (move them to top)
                    const recentIds = new Set(recentSearches.map(r => r.id));
                    searchResults = searchResults.sort((a: any, b: any) => {
                        const aRecent = recentIds.has(a.id) ? 1 : 0;
                        const bRecent = recentIds.has(b.id) ? 1 : 0;
                        if (aRecent !== bRecent) return bRecent - aRecent;
                        return b.followers - a.followers;
                    });

                    setResults(searchResults);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, recentSearches]);

    // Save search click and navigate
    const handleResultClick = async (result: any) => {
        // Save click to history (fire and forget)
        fetch('/api/search/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                targetId: result.id,
                targetType: result.type,
                query: query.trim() || null
            })
        }).catch(console.error);

        setIsOpen(false);
        setQuery('');

        if (result.type === 'employer') {
            router.push(`/public/companies/${result.id}`);
        } else {
            router.push(`/public/people/${result.id}`);
        }
    };

    // Handle clicking a recent search item
    const handleRecentClick = (item: any) => {
        handleResultClick(item);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={`p-2 rounded-full transition-colors ${isMobile ? '' : ''} ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-700'}`}
                title="Search"
            >
                <Search size={20} />
            </button>
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
                onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <div className={`fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-xl z-[151] rounded-2xl shadow-2xl overflow-hidden border animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                {/* Search Header */}
                <div className={`flex items-center gap-3 p-4 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                    <Search size={20} className={isDark ? 'text-neutral-500' : 'text-neutral-400'} />
                    <input
                        autoFocus
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={searchContext.placeholder}
                        className={`flex-1 bg-transparent text-lg focus:outline-none ${isDark ? 'text-white placeholder-neutral-600' : 'text-black placeholder-neutral-400'}`}
                    />
                    <button
                        onClick={() => setIsOpen(false)}
                        className={`p-1 rounded-full ${isDark ? 'hover:bg-neutral-800 text-neutral-500' : 'hover:bg-neutral-100 text-neutral-400'}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {/* Show Recent Searches if no query */}
                    {!query.trim() && recentSearches.length > 0 && (
                        <div>
                            <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-neutral-500 bg-neutral-900' : 'text-neutral-400 bg-neutral-50'}`}>
                                <Clock size={12} />
                                Recent Searches
                            </div>
                            {recentSearches.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleRecentClick(item)}
                                    className={`w-full px-4 py-3 flex items-center gap-4 text-left transition-colors border-b last:border-0 ${isDark ? 'border-neutral-800 hover:bg-neutral-800/50' : 'border-neutral-100 hover:bg-neutral-50'}`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-200'}`}>
                                        {item.image ? (
                                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            item.type === 'employer' ? <Building2 size={18} className="text-neutral-400" /> : <UserCircle size={18} className="text-neutral-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-semibold flex items-center gap-1 ${isDark ? 'text-white' : 'text-black'}`}>
                                                {item.name}
                                                <VerificationBadge tier={item.badgeType} size={24} />
                                            </span>
                                            {item.type === 'employer' && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white">CORP</span>
                                            )}
                                        </div>
                                        <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            {item.followers} {item.type === 'employer' ? 'subscribers' : 'followers'}
                                        </div>
                                    </div>
                                    <Clock size={14} className={isDark ? 'text-neutral-600' : 'text-neutral-300'} />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Loading History */}
                    {!query.trim() && isLoadingHistory && (
                        <div className="p-8 text-center text-neutral-500">
                            Loading recent searches...
                        </div>
                    )}

                    {/* No Recent Searches */}
                    {!query.trim() && !isLoadingHistory && recentSearches.length === 0 && (
                        <div className={`p-8 text-center ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            <Search size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Search for people or companies</p>
                        </div>
                    )}

                    {/* Search Results */}
                    {query.trim() && results.length === 0 ? (
                        <div className="p-8 text-center text-neutral-500">
                            {isSearching ? 'Searching...' : 'No results found.'}
                        </div>
                    ) : query.trim() && (
                        <div>
                            {results.some(r => recentSearches.find(rs => rs.id === r.id)) && (
                                <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-neutral-500 bg-neutral-900' : 'text-neutral-400 bg-neutral-50'}`}>
                                    <TrendingUp size={12} />
                                    Results (Recently searched first)
                                </div>
                            )}
                            {results.map((result) => {
                                const isRecent = recentSearches.find(rs => rs.id === result.id);
                                return (
                                    <button
                                        key={result.id}
                                        onClick={() => handleResultClick(result)}
                                        className={`w-full px-4 py-3 flex items-center gap-4 text-left transition-colors border-b last:border-0 ${isDark ? 'border-neutral-800 hover:bg-neutral-800/50' : 'border-neutral-100 hover:bg-neutral-50'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-200'}`}>
                                            {result.image ? (
                                                <img src={result.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                result.type === 'employer' ? <Building2 size={18} className="text-neutral-400" /> : <UserCircle size={18} className="text-neutral-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-semibold flex items-center gap-1 ${isDark ? 'text-white' : 'text-black'}`}>
                                                    {result.name}
                                                    <VerificationBadge tier={result.badgeType} size={24} />
                                                </span>
                                                {result.type === 'employer' && (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white">CORP</span>
                                                )}
                                            </div>
                                            <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                {result.followers} {result.type === 'employer' ? 'subscribers' : 'followers'}
                                            </div>
                                        </div>
                                        {isRecent && (
                                            <Clock size={14} className={isDark ? 'text-neutral-600' : 'text-neutral-300'} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

