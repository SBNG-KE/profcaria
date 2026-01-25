"use client"

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Eye, MousePointerClick, TrendingUp, ArrowUpRight, Calendar } from 'lucide-react';

interface AnalyticsProps {
    isDark: boolean;
    subscriberCount: number;
}

const EmployerAnalytics = ({ isDark, subscriberCount }: AnalyticsProps) => {
    const [timeRange, setTimeRange] = useState('7d');

    // Mock Data Generators for Subscribers Growth
    const generateSubscriberData = (range: string) => {
        const data = [];
        const count = range === '24h' ? 24 : range === '7d' ? 7 : range === '1m' ? 4 : 12;
        const labels = range === '24h' ? Array.from({ length: 24 }, (_, i) => `${i}:00`) :
            range === '7d' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] :
                range === '1m' ? ['Week 1', 'Week 2', 'Week 3', 'Week 4'] :
                    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 0; i < count; i++) {
            // Random growth data
            data.push({
                name: labels[i % labels.length],
                value: Math.floor(Math.random() * 50) + 10
            });
        }
        return data;
    };

    const analyticsData = generateSubscriberData(timeRange);

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
                    <TrendingUp size={20} /> Impact Analytics
                </h2>
                <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
                    {['7d', '1m', '3m', '6m', '12m'].map((range) => (
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

            {/* Main Graph: Subscriber Growth */}
            <div className={`p-6 rounded-[2rem] border min-h-[300px] ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>New Subscribers</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h3 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>
                                {analyticsData.reduce((a, b) => a + b.value, 0).toLocaleString()}
                            </h3>
                            <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-500">
                                <ArrowUpRight size={12} /> +{Math.floor(Math.random() * 20) + 5}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData}>
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
                            <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                                {analyticsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={isDark ? '#3b82f6' : '#2563eb'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Subscribers" value={subscriberCount.toLocaleString()} colorClass="text-blue-500" />
                <StatCard icon={Eye} label="Profile Views" value={(subscriberCount * 12 + 450).toLocaleString()} colorClass="text-purple-500" />
                <StatCard icon={MousePointerClick} label="Job Clicks" value={(subscriberCount * 3 + 120).toLocaleString()} colorClass="text-orange-500" />
                <StatCard icon={Calendar} label="Active Jobs" value="4" colorClass="text-emerald-500" />
            </div>
        </div>
    );
};

export default EmployerAnalytics;
