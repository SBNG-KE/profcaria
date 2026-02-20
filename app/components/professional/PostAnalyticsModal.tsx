'use client';

import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, Repeat2, Clock, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-md rounded-3xl shadow-xl overflow-hidden ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white'}`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-100'}`}>
                    <h2 className="text-xl font-black">Post Analytics</h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Grid of Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Likes */}
                                <div className={`p-5 rounded-2xl flex flex-col gap-2 ${isDark ? 'bg-neutral-800/50' : 'bg-neutral-50'}`}>
                                    <div className="flex items-center gap-2 text-rose-500">
                                        <Heart size={18} />
                                        <span className="text-sm font-bold uppercase tracking-widest">Likes</span>
                                    </div>
                                    <div className="text-3xl font-black">{stats.likes}</div>
                                </div>

                                {/* Comments */}
                                <div className={`p-5 rounded-2xl flex flex-col gap-2 ${isDark ? 'bg-neutral-800/50' : 'bg-neutral-50'}`}>
                                    <div className="flex items-center gap-2 text-blue-500">
                                        <MessageCircle size={18} />
                                        <span className="text-sm font-bold uppercase tracking-widest">Comments</span>
                                    </div>
                                    <div className="text-3xl font-black">{stats.comments}</div>
                                </div>

                                {/* Reposts */}
                                <div className={`p-5 rounded-2xl flex flex-col gap-2 ${isDark ? 'bg-neutral-800/50' : 'bg-neutral-50'}`}>
                                    <div className="flex items-center gap-2 text-green-500">
                                        <Repeat2 size={18} />
                                        <span className="text-sm font-bold uppercase tracking-widest">Reposts</span>
                                    </div>
                                    <div className="text-3xl font-black">{stats.reposts}</div>
                                </div>

                                {/* Dwell Time */}
                                <div className={`p-5 rounded-2xl flex flex-col gap-2 ${isDark ? 'bg-neutral-800/50' : 'bg-neutral-50'}`}>
                                    <div className="flex items-center gap-2 text-orange-500">
                                        <Clock size={18} />
                                        <span className="text-sm font-bold uppercase tracking-widest">Views &gt;3s</span>
                                    </div>
                                    <div className="text-3xl font-black">{stats.dwell}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
