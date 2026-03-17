"use client"

import React, { useEffect, useState, useMemo } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { Users, Building2, UserPlus, Loader2, Search, Zap, Sparkles } from 'lucide-react';
import NetworkCard from '@/app/components/network/NetworkCard';
import SuggestionCard from '@/app/components/network/SuggestionCard';
import Link from 'next/link';

export default function ConnectionsPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [activeTab, setActiveTab] = useState<'suggestions' | 'subscriptions' | 'followers'>('suggestions');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Suggestions State
    const [suggestions, setSuggestions] = useState<{ companies: any[], professionals: any[], followBacks: any[] }>({
        companies: [],
        professionals: [],
        followBacks: []
    });
    const [suggestionsLoading, setSuggestionsLoading] = useState(true);


    // Fetch Subscriptions/Followers data
    const fetchData = async () => {
        if (activeTab === 'suggestions') return;

        setLoading(true);
        try {
            const typeParam = activeTab === 'subscriptions' ? 'following_companies' : 'followers';
            const entityTypeParam = activeTab === 'followers' ? '&entityType=user' : '';
            const res = await fetch(`/api/professional/follow?type=${typeParam}${entityTypeParam}`, { cache: 'no-store' });
            if (res.ok) {
                const json = await res.json();
                let list = json.following || json.followers || [];
                setData(list);
            }
        } catch (error) {
            console.error("Error fetching connections", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Suggestions data
    const fetchSuggestions = async () => {
        setSuggestionsLoading(true);
        try {
            // Fetch recommendations
            const recRes = await fetch('/api/professional/recommendations', { cache: 'no-store' });
            const recData = recRes.ok ? await recRes.json() : { companies: [], professionals: [] };

            // Fetch followers who I haven't followed back
            const followRes = await fetch('/api/professional/follow?type=followers&entityType=user', { cache: 'no-store' });
            const followData = followRes.ok ? await followRes.json() : { followers: [] };
            const followBacks = (followData.followers || []).filter((f: any) => !f.isFollowing);

            setSuggestions({
                companies: recData.companies || [],
                professionals: recData.professionals || [],
                followBacks
            });
        } catch (error) {
            console.error("Error fetching suggestions", error);
        } finally {
            setSuggestionsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'suggestions') {
            fetchSuggestions();
        } else {
            fetchData();
        }

        // If viewing followers tab, mark as viewed (clear badge)
        if (activeTab === 'followers') {
            fetch('/api/professional/follow/viewed', {
                method: 'POST'
            }).catch(err => console.error("Error marking followers viewed", err));
        }
    }, [activeTab]);

    const handleFollow = async (id: string, type: 'user' | 'company') => {
        // API call is handled by FollowButton component
        // This function simply updates the local state to remove the item from suggestions
        setSuggestions(prev => ({
            ...prev,
            companies: type === 'company' ? prev.companies.filter(c => c.id !== id) : prev.companies,
            professionals: type === 'user' ? prev.professionals.filter(p => p.id !== id) : prev.professionals,
            followBacks: type === 'user' ? prev.followBacks.filter(p => p.id !== id) : prev.followBacks
        }));
    };

    const handleUnfollow = (id: string) => {
        if (activeTab === 'subscriptions') {
            setData(prev => prev.filter(item => item.id !== id));
        }
        if (activeTab === 'followers') {
            setData(prev => prev.map(item => item.id === id ? { ...item, isFollowing: !item.isFollowing } : item));
        }
    };

    // Filter data for subscriptions/followers
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const term = searchTerm.toLowerCase();
        return data.filter(item =>
            (item.name || '').toLowerCase().includes(term) ||
            (item.role || '').toLowerCase().includes(term)
        );
    }, [data, searchTerm]);

    // Filter suggestions
    const filteredSuggestions = useMemo(() => {
        if (!searchTerm) return suggestions;
        const term = searchTerm.toLowerCase();
        return {
            companies: suggestions.companies.filter(c =>
                (c.companyName || '').toLowerCase().includes(term) ||
                (c.industry || '').toLowerCase().includes(term)
            ),
            professionals: suggestions.professionals.filter(p =>
                (`${p.firstName} ${p.lastName}` || '').toLowerCase().includes(term) ||
                (p.currentRole || '').toLowerCase().includes(term)
            ),
            followBacks: suggestions.followBacks.filter(p =>
                (p.name || '').toLowerCase().includes(term) ||
                (p.role || '').toLowerCase().includes(term)
            )
        };
    }, [suggestions, searchTerm]);

    const TabButton = ({ id, label, icon: Icon }: { id: 'suggestions' | 'subscriptions' | 'followers', label: string, icon: React.ElementType }) => (
        <button
            onClick={() => { setActiveTab(id); setSearchTerm(''); }}
            className={`
                flex-1 flex items-center justify-center gap-2 py-4 border-b-2 transition-all font-bold text-xs uppercase tracking-widest
                ${activeTab === id
                    ? (isDark ? 'border-white text-white' : 'border-black text-black')
                    : (isDark ? 'border-transparent text-neutral-600 hover:text-neutral-400' : 'border-transparent text-neutral-400 hover:text-neutral-600')}
            `}
        >
            <Icon size={16} />
            {label}
        </button>
    );

    const renderSuggestions = () => {
        if (suggestionsLoading) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className={`animate-spin ${isDark ? 'text-white' : 'text-black'}`} size={32} />
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Loading suggestions...</p>
                </div>
            );
        }

        const hasFollowBacks = filteredSuggestions.followBacks.length > 0;
        const hasCompanies = filteredSuggestions.companies.length > 0;
        const hasProfessionals = filteredSuggestions.professionals.length > 0;

        if (!hasFollowBacks && !hasCompanies && !hasProfessionals) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center py-32 text-center opacity-60">
                    <div className={`p-6 rounded-full mb-4 ${isDark ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
                        <Sparkles size={48} className="opacity-20" />
                    </div>
                    <p className="text-lg font-bold mb-2">No suggestions yet</p>
                    <p className="text-sm text-neutral-500 max-w-xs">
                        {searchTerm ? `No matches for "${searchTerm}"` : "We're working on finding the best connections for you."}
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-10">
                {/* Follow Backs Section */}
                {hasFollowBacks && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                                <UserPlus size={14} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                            </div>
                            <h3 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                Follow Back
                            </h3>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                {filteredSuggestions.followBacks.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {filteredSuggestions.followBacks.map((p: any) => (
                                <SuggestionCard
                                    key={p.id}
                                    id={p.id}
                                    name={p.name}
                                    image={p.profileImage}
                                    role={p.role}
                                    type="user"
                                    badgeType={p.badgeType}
                                    onFollow={handleFollow}
                                    isFollowBack={true}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Companies Section */}
                {hasCompanies && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-[#3B5998]/20' : 'bg-[#3B5998]/10'}`}>
                                <Building2 size={14} className={isDark ? 'text-[#6B8CD5]' : 'text-[#3B5998]'} />
                            </div>
                            <h3 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                Companies to Subscribe
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {filteredSuggestions.companies.map((c: any) => (
                                <SuggestionCard
                                    key={c.id}
                                    id={c.id}
                                    name={c.companyName}
                                    image={c.logoUrl}
                                    role={c.industry}
                                    type="company"
                                    badgeType={c.badge_type}
                                    onFollow={handleFollow}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Professionals Section */}
                {hasProfessionals && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-[#3B5998]/20' : 'bg-[#3B5998]/10'}`}>
                                <Users size={14} className={isDark ? 'text-[#6B8CD5]' : 'text-[#3B5998]'} />
                            </div>
                            <h3 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                People to Follow
                            </h3>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {filteredSuggestions.professionals.map((p: any) => (
                                <SuggestionCard
                                    key={p.id}
                                    id={p.id}
                                    name={`${p.firstName} ${p.lastName}`}
                                    image={p.profileImageUrl}
                                    role={p.currentRole}
                                    type="user"
                                    badgeType={p.badge_type}
                                    companyName={p.currentCompany}
                                    onFollow={handleFollow}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8 pb-32">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-neutral-200 dark:border-neutral-800">
                <div className="text-left">
                    <div className={`flex items-center gap-2 mb-2 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                        <Users size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Network</span>
                    </div>
                    <h1 className={`text-4xl font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>My Connections</h1>
                    <p className={`mt-2 text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Manage your professional network and subscriptions.
                    </p>
                </div>

                {/* Search Bar */}
                <div className={`flex items-center gap-3 border-2 rounded-full px-5 py-2.5 transition-all w-full md:w-auto min-w-[300px] ${isDark ? 'bg-black border-neutral-800 focus-within:border-neutral-600' : 'bg-white border-neutral-200 focus-within:border-neutral-400'}`}>
                    <Search className={`shrink-0 transition-colors ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`} size={18} />
                    <input
                        type="text"
                        placeholder={activeTab === 'subscriptions' ? "Search companies..." : activeTab === 'followers' ? "Search followers..." : "Search suggestions..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`flex-1 min-w-0 bg-transparent focus:outline-none font-bold text-sm ${isDark ? 'text-white placeholder:text-neutral-600' : 'text-black placeholder:text-neutral-400'}`}
                    />
                    {searchTerm && <button onClick={() => setSearchTerm('')} className={`p-1 rounded-full ${isDark ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-neutral-100 text-neutral-500 hover:text-black'}`}>×</button>}
                </div>
            </header>

            {/* Tabs */}
            <div className={`flex border-b mb-6 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                <TabButton id="suggestions" label="Suggestions" icon={Sparkles} />
                <TabButton id="subscriptions" label="Subscriptions" icon={Building2} />
                <TabButton id="followers" label="Followers" icon={Users} />
            </div>

            {/* Content */}
            {activeTab === 'suggestions' ? (
                renderSuggestions()
            ) : loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className={`animate-spin ${isDark ? 'text-white' : 'text-black'}`} size={32} />
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Loading connections...</p>
                </div>
            ) : filteredData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredData.map((item) => (
                        <NetworkCard
                            key={item.id}
                            id={item.id}
                            name={item.name}
                            image={item.profileImage}
                            role={item.role}
                            type={item.type || (activeTab === 'subscriptions' ? 'company' : 'user')}
                            isFollowing={activeTab === 'subscriptions' ? true : !!item.isFollowing}
                            badgeType={item.badgeType}
                            onToggle={() => handleUnfollow(item.id)}
                            isFollowBack={activeTab === 'followers'}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-32 text-center opacity-60">
                    <div className={`p-6 rounded-full mb-4 ${isDark ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
                        {activeTab === 'subscriptions' ? <Building2 size={48} className="opacity-20" /> : <Users size={48} className="opacity-20" />}
                    </div>
                    <p className="text-lg font-bold mb-2">No {activeTab} found</p>
                    <p className="text-sm text-neutral-500 max-w-xs">{searchTerm ? `No matches for "${searchTerm}"` : activeTab === 'subscriptions' ? "You haven't subscribed to any companies yet." : "You don't have any followers yet."}</p>

                    {activeTab === 'subscriptions' && !searchTerm && (
                        <Link href="/professional/find" className={`mt-6 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}>
                            Find Companies
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
