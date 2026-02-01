"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Building2, UserCircle } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import VerificationBadge from '../VerificationBadge';

export default function GlobalSearch({ isMobile = false }: { isMobile?: boolean }) {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

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
                // Determine which API to use or use a generic one. 
                // For now, re-using /api/search/users which returns companies and professionals
                const res = await fetch(`/api/search/users?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data.results || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                // Keep loading state until results set? 
                // Actually setIsSearching(false) usually implies "done fetching" 
                // but here it might flicker if we do it too early. 
                // We'll leave it true if query exists? No, mostly for spinner.
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Handle Route Change (Close Search)
    const handleResultClick = (result: any) => {
        setIsOpen(false);
        setQuery('');
        if (result.type === 'employer') {
            router.push(`/public/companies/${result.id}`);
            // Note: If curr user is employer, they might see it differently? 
            // Employers viewing companies? Usually specific route. 
            // But stick to professional route for now or check user role.
            // If this component is reused, we might need to know 'currentRole'.
            // For now, let's assume /professional/companies works for all (public view).
        } else {
            // "candidate" view for employers, "people" view for professionals?
            // This is tricky if reused exactly. 
            // We'll use a prop or context if needed, but for now specific paths.
            // Let's safe-guess:
            // const isInEmployerPath = window.location.pathname.startsWith('/employer');
            // if (isInEmployerPath) {
            //    router.push(`/employer/candidate/${result.id}`);
            // } else {
            router.push(`/public/people/${result.id}`);
            // }
        }
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
                        placeholder="Search for people or companies..."
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
                    {query.trim() && results.length === 0 ? (
                        <div className="p-8 text-center text-neutral-500">
                            {isSearching ? 'Searching...' : 'No results found.'}
                        </div>
                    ) : (
                        <div>
                            {results.map((result) => (
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
                                                <VerificationBadge tier={result.badgeType} size={32} />
                                            </span>
                                            {result.type === 'employer' && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white">CORP</span>
                                            )}
                                        </div>
                                        <div className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            {result.followers} {result.type === 'employer' ? 'subscribers' : 'followers'}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
