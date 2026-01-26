"use client"

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Heart, MessageCircle, Clock, Repeat2, ArrowUpRight, ArrowDownRight, Eye } from 'lucide-react';

interface AnalyticsProps {
    isDark: boolean;
}

const ProfileAnalytics = ({ isDark }: AnalyticsProps) => {
    const [timeRange, setTimeRange] = useState('7d');
    const [stats, setStats] = useState({ followers: 0, likes: 0, comments: 0, reposts: 0, views: 0, dwell: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/professional/analytics');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    // Placeholder data for the graph (since historical view tracking is not yet implemented)
    // "Real" data means showing 0 until we have actual history.
    const viewData = Array.from({ length: 7 }, (_, i) => ({
        name: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        views: 0
    }));

    const StatCard = ({ icon: Icon, label, value, colorClass }: any) => (
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-800/50 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'} ${colorClass}`}>
                    <Icon size={18} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{label}</span>
            </div>
            <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{loading ? '-' : value}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header + Filter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                    <Users size={20} /> Analytics
                </h2>
                <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
                    {['24h', '7d', '1m', '3m', '6m', '12m'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${timeRange === range ? (isDark ? 'bg-neutral-800 text-white shadow-sm' : 'bg-white text-black shadow-sm') : (isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black')}`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Views Graph */}
            <div className={`p-6 rounded-[2rem] border min-h-[300px] ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Profile Views</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h3 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>
                                {stats.views}
                            </h3>
                            <span className="flex items-center gap-0.5 text-xs font-bold text-gray-500">
                                No Data
                            </span>
                        </div>
                    </div>
                </div>

                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={viewData}>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDark ? '#525252' : '#a3a3a3', fontSize: 10, fontWeight: 600 }}
                                dy={10}
                            />
                            <Tooltip
                                cursor={{ fill: isDark ? '#262626' : '#f5f5f5' }}
                                contentStyle={{
                                    backgroundColor: isDark ? '#171717' : '#ffffff',
                                    borderColor: isDark ? '#262626' : '#e5e5e5',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    color: isDark ? '#ffffff' : '#000000'
                                }}
                            />
                            <Bar dataKey="views" radius={[4, 4, 4, 4]}>
                                {viewData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={isDark ? '#3b82f6' : '#2563eb'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Interaction Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard icon={Users} label="Followers" value={stats.followers} colorClass="text-purple-500" />
                <StatCard icon={Heart} label="Likes" value={stats.likes} colorClass="text-red-500" />
                <StatCard icon={MessageCircle} label="Comments" value={stats.comments} colorClass="text-blue-500" />
                <StatCard icon={Clock} label="Dwell > 3s" value={stats.dwell} colorClass="text-orange-500" />
                <StatCard icon={Repeat2} label="Reposts" value={stats.reposts} colorClass="text-green-500" />
            </div>
        </div>
    );
};

export default ProfileAnalytics;
