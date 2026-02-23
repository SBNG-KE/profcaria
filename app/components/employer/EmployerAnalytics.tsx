"use client"

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Heart, MessageCircle, Clock, Repeat2, ArrowUpRight, Eye } from 'lucide-react';

interface AnalyticsProps {
    isDark: boolean;
}

const EmployerAnalytics = ({ isDark }: AnalyticsProps) => {
    const [timeRange, setTimeRange] = useState('7d');
    const [stats, setStats] = useState<any>({ subscribers: 0, likes: 0, comments: 0, reposts: 0, views: 0, viewDates: [], recentSubscribers: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/employer/analytics?range=${timeRange}`);
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
    }, [timeRange]);

    // Generate dynamic chart data based on time range and actual viewDates
    const viewData = React.useMemo(() => {
        const data = [];
        const now = new Date();
        const dates = (stats.viewDates || []).map((d: string) => new Date(d));

        if (timeRange === '24h') {
            for (let i = 0; i < 24; i += 4) { // Every 4 hours
                const bucketStart = new Date(now);
                bucketStart.setHours(now.getHours() - (24 - i), 0, 0, 0);
                const bucketEnd = new Date(bucketStart);
                bucketEnd.setHours(bucketStart.getHours() + 4);

                const count = dates.filter((d: Date) => d >= bucketStart && d < bucketEnd).length;
                data.push({ name: `${bucketStart.getHours()}:00`, views: count });
            }
        } else if (timeRange === '7d') {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 6; i >= 0; i--) {
                const bucketStart = new Date(now);
                bucketStart.setDate(now.getDate() - i);
                bucketStart.setHours(0, 0, 0, 0);
                const bucketEnd = new Date(bucketStart);
                bucketEnd.setDate(bucketStart.getDate() + 1);

                const count = dates.filter((d: Date) => d >= bucketStart && d < bucketEnd).length;
                data.push({ name: days[bucketStart.getDay()], views: count });
            }
        } else if (timeRange === '1m') {
            for (let i = 4; i >= 0; i--) { // 5 weeks (approx)
                const bucketEnd = new Date(now);
                bucketEnd.setDate(now.getDate() - (i * 7));
                const bucketStart = new Date(bucketEnd);
                bucketStart.setDate(bucketEnd.getDate() - 7);

                const count = dates.filter((d: Date) => d >= bucketStart && d < bucketEnd).length;
                data.push({ name: `Week ${5 - i}`, views: count });
            }
        } else {
            // Months (3m, 6m, 12m)
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const countMonths = timeRange === '3m' ? 3 : (timeRange === '6m' ? 6 : 12);
            for (let i = countMonths - 1; i >= 0; i--) {
                const bucketStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const bucketEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

                const count = dates.filter((d: Date) => d >= bucketStart && d < bucketEnd).length;
                data.push({ name: months[bucketStart.getMonth()], views: count });
            }
        }
        return data;
    }, [timeRange, stats.viewDates]);

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
                            {stats.views === 0 && (
                                <span className="flex items-center gap-0.5 text-xs font-bold text-gray-500">
                                    No Data
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="h-[240px] w-full mt-2 -ml-4 pr-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={viewData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isDark ? '#3b82f6' : '#2563eb'} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={isDark ? '#3b82f6' : '#2563eb'} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#262626' : '#e5e5e5'} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDark ? '#525252' : '#a3a3a3', fontSize: 10, fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDark ? '#525252' : '#a3a3a3', fontSize: 10, fontWeight: 600 }}
                                dx={-10}
                            />
                            <Tooltip
                                cursor={{ stroke: isDark ? '#3f3f46' : '#e4e4e7', strokeWidth: 1, strokeDasharray: '3 3' }}
                                contentStyle={{
                                    backgroundColor: isDark ? '#171717' : '#ffffff',
                                    borderColor: isDark ? '#262626' : '#e5e5e5',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    color: isDark ? '#ffffff' : '#000000',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
                                }}
                                itemStyle={{
                                    color: isDark ? '#3b82f6' : '#2563eb',
                                    fontWeight: '900'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="views"
                                stroke={isDark ? '#3b82f6' : '#2563eb'}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorViews)"
                                activeDot={{ r: 5, fill: isDark ? '#3b82f6' : '#2563eb', stroke: isDark ? '#171717' : '#ffffff', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Interaction Stats */}
            <div className="grid grid-cols-1 gap-4">
                <StatCard icon={Users} label="Subscribers" value={stats.subscribers} colorClass="text-purple-500" />
            </div>

            {/* Recent Subscribers */}
            {stats.recentSubscribers && stats.recentSubscribers.length > 0 && (
                <div className={`p-6 rounded-[2rem] border mt-6 ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>New Subscribers ({timeRange})</h3>
                    <div className="space-y-4">
                        {stats.recentSubscribers.map((follower: any) => (
                            <div key={`${follower.id}-${follower.time}`} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-neutral-200 overflow-hidden flex-shrink-0">
                                    {follower.image ? (
                                        <img src={follower.image} alt={follower.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center text-lg font-bold ${isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-neutral-100 text-neutral-400'}`}>
                                            {follower.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-grow">
                                    <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-black'}`}>{follower.name}</p>
                                    <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{follower.role}</p>
                                </div>
                                <div className={`text-xs font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                    {new Date(follower.time).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployerAnalytics;
