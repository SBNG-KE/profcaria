'use client';

import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, Repeat2, Clock, Eye, Activity, TrendingUp } from 'lucide-react';

interface PostAnalyticsModalProps {
    postId: string;
    isOpen: boolean;
    onClose: () => void;
    isDark: boolean;
}

export default function PostAnalyticsModal({ postId, isOpen, onClose, isDark }: PostAnalyticsModalProps) {
    const [stats, setStats] = useState({ likes: 0, comments: 0, reposts: 0, views: 0, dwell: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/professional/posts/${postId}/analytics`);
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch post analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [isOpen, postId]);

    if (!isOpen) return null;

    const StatCard = ({ icon: Icon, label, value, colorClass, borderClass, bgClass }: any) => (
        <div className={`relative overflow-hidden group p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 ${isDark ? `bg-neutral-900/50 ${borderClass} shadow-lg shadow-black/20` : `bg-white ${borderClass} shadow-xl shadow-neutral-200/50`}`}>
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-3xl opacity-20 ${bgClass} transition-opacity duration-300 group-hover:opacity-40`} />
            <div className="relative z-10 flex flex-col gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-neutral-800' : 'bg-neutral-50'} ${colorClass}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <h3 className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-black'}`}>{value}</h3>
                    <p className={`text-xs font-bold uppercase tracking-widest ${colorClass}`}>{label}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            ></div>
            <div
                className={`relative w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border animate-in slide-in-from-bottom-8 duration-300 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-white/50 bg-opacity-90 backdrop-blur-3xl'}`}
            >
                {/* Header */}
                <div className="relative p-8 pb-6">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-500/10 to-transparent opacity-50 dark:from-blue-500/5" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'}`}>
                                <Activity size={28} />
                            </div>
                            <div>
                                <h2 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Post Performance</h2>
                                <p className={`text-sm font-medium flex items-center gap-1.5 mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    <TrendingUp size={14} /> Real-time engagement metrics
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-3 rounded-full transition-all self-end sm:self-auto ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-black'}`}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 pb-8">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-64 gap-4">
                            <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                            <p className={`text-sm font-bold uppercase tracking-widest animate-pulse ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Loading Data...</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Grid of Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard
                                    icon={Eye}
                                    label="Imperessions"
                                    value={stats.views || 0}
                                    colorClass="text-purple-500"
                                    borderClass={isDark ? "border-purple-500/20" : "border-purple-100"}
                                    bgClass="bg-purple-500"
                                />
                                <StatCard
                                    icon={Heart}
                                    label="Likes"
                                    value={stats.likes}
                                    colorClass="text-rose-500"
                                    borderClass={isDark ? "border-rose-500/20" : "border-rose-100"}
                                    bgClass="bg-rose-500"
                                />
                                <StatCard
                                    icon={MessageCircle}
                                    label="Comments"
                                    value={stats.comments}
                                    colorClass="text-blue-500"
                                    borderClass={isDark ? "border-blue-500/20" : "border-blue-100"}
                                    bgClass="bg-blue-500"
                                />
                                <StatCard
                                    icon={Repeat2}
                                    label="Reposts"
                                    value={stats.reposts}
                                    colorClass="text-green-500"
                                    borderClass={isDark ? "border-green-500/20" : "border-green-100"}
                                    bgClass="bg-green-500"
                                />
                            </div>

                            {/* Dwell Time Highlight */}
                            <div className={`relative overflow-hidden rounded-3xl border p-8 ${isDark ? 'bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20' : 'bg-gradient-to-br from-orange-50 to-white border-orange-100 shadow-xl shadow-orange-100/50'}`}>
                                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl" />
                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-orange-500">
                                            <div className="p-2 rounded-xl bg-orange-500/10"><Clock size={20} /></div>
                                            <span className="font-bold uppercase tracking-widest text-xs">Deep Engagement</span>
                                        </div>
                                        <h4 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>Meaningful Views</h4>
                                        <p className={`text-sm font-medium mr-8 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                            The number of times this post was read or focused on for more than 3 seconds.
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-orange-600">
                                            {stats.dwell}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
