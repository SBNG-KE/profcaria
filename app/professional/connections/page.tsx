"use client"

import React, { useEffect, useState, useMemo } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { Users, Building2, UserPlus, Loader2, Search, Zap, UserMinus } from 'lucide-react';
import NetworkCard from '@/app/components/network/NetworkCard';
import Link from 'next/link';

export default function ConnectionsPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [activeTab, setActiveTab] = useState<'companies' | 'followers'>('companies');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            // Tab 1: Subscriptions (Companies I Follow)
            // Tab 2: Followers (People who follow me)
            const typeParam = activeTab === 'companies' ? 'following_companies' : 'followers';

            const res = await fetch(`/api/professional/follow?type=${typeParam}`);
            if (res.ok) {
                const json = await res.json();
                let list = json.following || json.followers || [];

                // Filter Logic for "Followers" Tab
                // Requirement: 
                // 1. Show: People who follow ME (isFollowing = false [pending follow back])
                // 2. Show: Mutual follows (isFollowing = true)
                // 3. HIDE: People I follow who DO NOT follow me back. (The API `type=followers` ONLY returns people who follow ME, so this condition is automatically met. The API endpoint `followers` returns list of users where `following_id` == ME. So by definition, everyone in this list follows me. I just need to check if I `isFollowing` them back or not.)

                // Note: The user said "it does not show those who you followed and never followed back". 
                // This refers to the 'following' list. Since we REMOVED the "Following" tab, we don't need to worry about filtering that list because we aren't fetching it.
                // We are fetching "Followers" (people following me).

                setData(list);
            }
        } catch (error) {
            console.error("Error fetching connections", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleUnfollow = (id: string) => {
        // If in Subscriptions (Companies), unfollowing removes them from the list immediately.
        if (activeTab === 'companies') {
            setData(prev => prev.filter(item => item.id !== id));
        }
        // If in Followers (People), unfollowing (or following back) just changes state, usually doesn't remove them from "Followers" list unless we block them (not implemented).
        // Wait, "Unfollow" button implies I was following them (Mutual). If I unfollow, they are still my follower, just not mutual.
        // So I should just update the `isFollowing` state locally?
        if (activeTab === 'followers') {
            setData(prev => prev.map(item => item.id === id ? { ...item, isFollowing: !item.isFollowing } : item));
        }
    };

    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const term = searchTerm.toLowerCase();
        return data.filter(item =>
            (item.name || '').toLowerCase().includes(term) ||
            (item.role || '').toLowerCase().includes(term)
        );
    }, [data, searchTerm]);

    const TabButton = ({ id, label, icon: Icon }: any) => (
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
                        placeholder={activeTab === 'companies' ? "Search companies..." : "Search followers..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`flex-1 min-w-0 bg-transparent focus:outline-none font-bold text-sm ${isDark ? 'text-white placeholder:text-neutral-600' : 'text-black placeholder:text-neutral-400'}`}
                    />
                    {searchTerm && <button onClick={() => setSearchTerm('')} className={`p-1 rounded-full ${isDark ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-neutral-100 text-neutral-500 hover:text-black'}`}>×</button>}
                </div>
            </header>

            {/* Tabs */}
            <div className={`flex border-b mb-6 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                <TabButton id="companies" label="Subscriptions" icon={Building2} />
                <TabButton id="followers" label="Followers" icon={Users} />
            </div>

            {/* Content */}
            {loading ? (
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
                            type={item.type || (activeTab === 'companies' ? 'company' : 'user')}
                            isFollowing={activeTab === 'companies' ? true : !!item.isFollowing}
                            onToggle={() => handleUnfollow(item.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-32 text-center opacity-60">
                    <div className={`p-6 rounded-full mb-4 ${isDark ? 'bg-neutral-900' : 'bg-neutral-100'}`}>
                        {activeTab === 'companies' ? <Building2 size={48} className="opacity-20" /> : <Users size={48} className="opacity-20" />}
                    </div>
                    <p className="text-lg font-bold mb-2">No {activeTab} found</p>
                    <p className="text-sm text-neutral-500 max-w-xs">{searchTerm ? `No matches for "${searchTerm}"` : activeTab === 'companies' ? "You haven't subscribed to any companies yet." : "You don't have any followers yet."}</p>

                    {activeTab === 'companies' && !searchTerm && (
                        <Link href="/professional/find" className={`mt-6 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}>
                            Find Companies
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
