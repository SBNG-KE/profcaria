"use client"

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Heart, MessageCircle, Clock, Repeat2, ArrowUpRight, ArrowDownRight, Eye } from 'lucide-react';

interface AnalyticsProps {
    isDark: boolean;
}

const ProfileAnalytics = ({ isDark }: AnalyticsProps) => {
    const [timeRange, setTimeRange] = useState('7d');
    const [stats, setStats] = useState<any>({ followers: 0, likes: 0, comments: 0, reposts: 0, views: 0, recentFollowers: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/professional/analytics?range=${timeRange}`);
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

    // Generate dynamic chart data based on time range
    const viewData = React.useMemo(() => {
        const data = [];
        const now = new Date();

        if (timeRange === '24h') {
            for (let i = 0; i < 24; i += 4) { // Every 4 hours
                const d = new Date(now);
                d.setHours(d.getHours() - (24 - i));
                data.push({ name: `${d.getHours()}:00`, views: 0 });
            }
        } else if (timeRange === '7d') {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                data.push({ name: days[d.getDay()], views: 0 });
            }
        } else if (timeRange === '1m') {
            for (let i = 4; i >= 0; i--) { // 5 weeks (approx)
                data.push({ name: `Week ${5 - i}`, views: 0 });
            }
        } else {
            // Months (3m, 6m, 12m)
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const count = timeRange === '3m' ? 3 : (timeRange === '6m' ? 6 : 12);
            for (let i = count - 1; i >= 0; i--) {
                const d = new Date(now);
                d.setMonth(d.getMonth() - i);
                data.push({ name: months[d.getMonth()], views: 0 });
            }
        }
        return data;
    }, [timeRange]);

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Followers" value={stats.followers} colorClass="text-purple-500" />
                <StatCard icon={Heart} label="Likes" value={stats.likes} colorClass="text-red-500" />
                <StatCard icon={MessageCircle} label="Comments" value={stats.comments} colorClass="text-blue-500" />
                <StatCard icon={Repeat2} label="Reposts" value={stats.reposts} colorClass="text-green-500" />
            </div>

            {/* Recent Followers */}
            {stats.recentFollowers && stats.recentFollowers.length > 0 && (
                <div className={`p-6 rounded-[2rem] border mt-6 ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>New Followers ({timeRange})</h3>
                    <div className="space-y-4">
                        {stats.recentFollowers.map((follower: any) => (
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

export default ProfileAnalytics;
