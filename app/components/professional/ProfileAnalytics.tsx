"use client"

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Heart, MessageCircle, Clock, Repeat2, ArrowUpRight, ArrowDownRight, Eye } from 'lucide-react';

interface AnalyticsProps {
    isDark: boolean;
}

const ProfileAnalytics = ({ isDark }: AnalyticsProps) => {
    const [timeRange, setTimeRange] = useState('7d');

    // Mock Data Generators
    const generateViewData = (range: string) => {
        const data = [];
        const count = range === '24h' ? 24 : range === '7d' ? 7 : range === '1m' ? 4 : 12; // Simplified
        const labels = range === '24h' ? Array.from({ length: 24 }, (_, i) => `${i}:00`) :
            range === '7d' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
                range === '1m' ? ['Week 1', 'Week 2', 'Week 3', 'Week 4'] :
                    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 0; i < count; i++) {
            data.push({
                name: labels[i % labels.length],
                views: Math.abs(Math.sin(i + 1) * 1000) % 90 + 10 // Deterministic mock data
            });
        }
        return data;
    };

    const viewData = generateViewData(timeRange);

    const StatCard = ({ icon: Icon, label, value, colorClass }: any) => (
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-neutral-800/50 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'} ${colorClass}`}>
                    <Icon size={18} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{label}</span>
            </div>
            <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{value}</p>
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
                                {viewData.reduce((a, b) => a + b.views, 0).toLocaleString()}
                            </h3>
                            <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-500">
                                <ArrowUpRight size={12} /> +12%
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Heart} label="Likes" value="842" colorClass="text-red-500" />
                <StatCard icon={MessageCircle} label="Comments" value="126" colorClass="text-blue-500" />
                <StatCard icon={Clock} label="Dwell > 3s" value="1.2k" colorClass="text-orange-500" />
                <StatCard icon={Repeat2} label="Reposts" value="45" colorClass="text-green-500" />
            </div>
        </div>
    );
};

export default ProfileAnalytics;
