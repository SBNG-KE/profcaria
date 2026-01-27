"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, UserPlus, Building2, User as UserIcon, Loader2, RefreshCw, Zap } from 'lucide-react';
import { useNotificationContext } from '@/app/context/NotificationContext';
import { useTheme } from '@/app/context/ThemeContext';

export default function AlertsSidebar() {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { notifications, markAsRead } = useNotificationContext();
    const [activeTab, setActiveTab] = useState<'updates' | 'suggestions'>('updates');

    // Real Data: New Connections (replacing fake "Follow Backs")
    const [newConnectionCount, setNewConnectionCount] = useState(0);

    // Simulate AI Data
    const [recommendations, setRecommendations] = useState<{ companies: any[], professionals: any[] }>({ companies: [], professionals: [] });
    const [recLoading, setRecLoading] = useState(true);

    // Fetch Connections for "Network Sync"
    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const res = await fetch('/api/professional/connections');
                if (res.ok) {
                    const data = await res.json();
                    const connections = data.connections || [];
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

                    const newCount = connections.filter((c: any) => new Date(c.created_at) > oneWeekAgo).length;
                    setNewConnectionCount(newCount);
                }
            } catch (err) {
                console.error("Error fetching connections", err);
            }
        };
        fetchConnections();
    }, []);

    // Fetch Recommendations
    useEffect(() => {
        const fetchRecs = async () => {
            try {
                const res = await fetch('/api/professional/recommendations');
                if (res.ok) {
                    const data = await res.json();
                    setRecommendations({
                        companies: data.companies || [],
                        professionals: data.professionals || []
                    });
                }
            } catch (error) {
                console.error("Error fetching recommendations", error);
            } finally {
                setRecLoading(false);
            }
        };
        fetchRecs();
    }, []);

    const handleFollow = async (id: string, type: 'user' | 'company') => {
        try {
            const endpoint = type === 'user' ? '/api/professional/follow/user' : '/api/professional/follow/company';
            const body = type === 'user' ? { followingId: id } : { companyId: id };

            // Optimistic Update
            setRecommendations(prev => ({
                ...prev,
                companies: type === 'company' ? prev.companies.filter(c => c.id !== id) : prev.companies,
                professionals: type === 'user' ? prev.professionals.filter(p => p.id !== id) : prev.professionals
            }));

            await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } catch (error) {
            console.error("Follow error", error);
        }
    };

    const handleNotificationClick = (id: string, isRead: boolean) => {
        if (!isRead) {
            markAsRead(id);
        }
        // In future: navigate to relevant page if notification has link
    };

    // Sort notifications
    const sortedNotifications = notifications.slice(0, 10);

    return (
        <div className="flex flex-col h-full">
            {/* TABS */}
            <div className={`flex items-center gap-1 p-1 rounded-xl mb-4 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <button
                    onClick={() => setActiveTab('updates')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'updates' ? (isDark ? 'bg-neutral-800 text-white shadow-sm' : 'bg-black text-white shadow-md') : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                    Updates
                </button>
                <button
                    onClick={() => setActiveTab('suggestions')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'suggestions' ? (isDark ? 'bg-neutral-800 text-white shadow-sm' : 'bg-black text-white shadow-md') : 'text-neutral-500 hover:text-neutral-700'}`}
                >
                    Suggestions
                </button>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                {activeTab === 'updates' ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* REAL Network Sync Data */}
                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-blue-900/10 border-blue-900/30' : 'bg-blue-50 border-blue-100'}`}>
                            <div className="flex gap-3 items-center">
                                <div className="p-2 bg-blue-500 rounded-full text-white">
                                    <RefreshCw size={14} />
                                </div>
                                <div className="flex-1">
                                    <p className={`text-xs font-medium ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>Network Sync</p>
                                    <p className={`text-[10px] ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                                        {newConnectionCount > 0 ? `${newConnectionCount} new work connections this week` : 'No new work connections this week'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {sortedNotifications.length > 0 ? sortedNotifications.map(n => (
                            <div
                                key={n.id}
                                onClick={() => handleNotificationClick(n.id, n.is_read)}
                                className={`flex gap-3 items-start p-2 rounded-lg transition-all cursor-pointer ${!n.is_read ? (isDark ? 'bg-neutral-800/80 hover:bg-neutral-800 border-l-2 border-l-blue-500' : 'bg-white border hover:bg-neutral-50 shadow-sm border-l-blue-500') : 'opacity-60 hover:opacity-80 scale-[0.98]'}`}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        {!n.is_read && (
                                            <span className="bg-blue-500 text-[8px] px-1.5 py-0.5 rounded-full text-white font-bold tracking-wide shadow-sm animate-pulse">NEW</span>
                                        )}
                                        <span className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            {new Date(n.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                        <span dangerouslySetInnerHTML={{ __html: n.message }} />
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-xs text-neutral-500 py-8">No new updates found.</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {recLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-neutral-500" />
                            </div>
                        ) : (
                            <>
                                {/* COMPANIES */}
                                <div className="space-y-3">
                                    <h4 className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                        <Building2 size={12} /> Companies to Subscribe
                                    </h4>
                                    {recommendations.companies.length > 0 ? recommendations.companies.map(c => (
                                        <div key={c.id} className={`p-3 rounded-xl border transition-all hover:scale-[1.02] cursor-pointer group ${isDark ? 'bg-neutral-800/50 border-neutral-800 hover:bg-neutral-800' : 'bg-white border-neutral-200 hover:shadow-md'}`}>
                                            <div className="flex items-center gap-3 mb-3" onClick={() => router.push(`/professional/company/${c.id}`)}>
                                                <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center overflow-hidden border ${isDark ? 'bg-black border-neutral-700' : 'bg-white border-neutral-100'}`}>
                                                    {c.logoUrl ? (
                                                        <img src={c.logoUrl} alt="" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <Building2 size={18} className="text-neutral-500" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h5 className={`text-sm font-bold truncate ${isDark ? 'text-neutral-200' : 'text-black'}`}>{c.companyName}</h5>
                                                    <p className={`text-[10px] truncate ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>{c.industry || 'Company'}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleFollow(c.id, 'company'); }}
                                                className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                                            >
                                                Subscribe
                                            </button>
                                        </div>
                                    )) : <p className="text-xs text-neutral-500 italic">No companies found.</p>}
                                </div>

                                {/* PROFESSIONALS */}
                                <div className="space-y-3">
                                    <h4 className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                        <UserIcon size={12} /> People to Follow
                                    </h4>
                                    {recommendations.professionals.length > 0 ? recommendations.professionals.map(p => (
                                        <div key={p.id} className={`p-3 rounded-xl border transition-all hover:scale-[1.02] cursor-pointer group ${isDark ? 'bg-neutral-800/50 border-neutral-800 hover:bg-neutral-800' : 'bg-white border-neutral-200 hover:shadow-md'}`}>
                                            <div className="flex items-center gap-3 mb-3" onClick={() => router.push(`/professional/user/${p.id}`)}>
                                                <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center overflow-hidden ${isDark ? 'bg-neutral-700' : 'bg-neutral-100'}`}>
                                                    {p.profileImageUrl ? (
                                                        <img src={p.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <UserIcon size={18} className="text-neutral-500" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h5 className={`text-sm font-bold truncate ${isDark ? 'text-neutral-200' : 'text-black'}`}>{p.firstName} {p.lastName}</h5>
                                                    <p className={`text-[10px] truncate ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>{p.currentRole || 'Professional'}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleFollow(p.id, 'user'); }}
                                                className={`w-full py-2 rounded-lg text-xs font-bold transition-colors border flex items-center justify-center gap-2 ${isDark ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-300' : 'border-neutral-300 hover:bg-neutral-100 text-neutral-600'}`}
                                            >
                                                <UserPlus size={14} /> Follow
                                            </button>
                                        </div>
                                    )) : <p className="text-xs text-neutral-500 italic">No professionals found.</p>}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

