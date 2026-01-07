"use client"

import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Globe, TrendingUp, Users, Target, Map, Zap } from 'lucide-react';

interface Metrics {
    stats: {
        totalJobs: number;
        activeJobs: number;
        totalApplications: number;
        interviewRate: number;
    };
    geoHeatmap: { name: string; value: number }[];
    funnelData: { name: string; value: number }[];
    trendData: { date: string; count: number }[];
}

export default function AnalyticsDashboard() {
    const [data, setData] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/employer/analytics/dashboard');
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (e) {
                console.error("Analytics fetch fail", e);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return (
        <div className="p-20 flex flex-col items-center justify-center text-slate-500 space-y-4 animate-pulse">
            <Globe size={48} className="text-emerald-500/50 spin-slow" />
            <p className="text-xs font-black uppercase tracking-widest">Initialising War Room...</p>
        </div>
    );

    if (!data) return null;

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">

            {/* 1. TOP STATS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[24px]">
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Users size={14} className="text-blue-500" /> Total Applicants
                    </div>
                    <div className="text-3xl font-black text-white">{data.stats.totalApplications}</div>
                    <div className="text-[10px] text-emerald-400 mt-1 font-bold">+12% vs last week</div>
                </div>
                <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[24px]">
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Target size={14} className="text-emerald-500" /> Active Jobs
                    </div>
                    <div className="text-3xl font-black text-white">{data.stats.activeJobs}</div>
                    <div className="text-[10px] text-slate-500 mt-1 font-bold">out of {data.stats.totalJobs} total</div>
                </div>
                <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[24px]">
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                        <TrendingUp size={14} className="text-purple-500" /> Conversion Rate
                    </div>
                    <div className="text-3xl font-black text-white">{data.stats.interviewRate}%</div>
                    <div className="text-[10px] text-slate-500 mt-1 font-bold">Application to Hire</div>
                </div>
                <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[24px]">
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Map size={14} className="text-yellow-500" /> Top Region
                    </div>
                    <div className="text-2xl font-black text-white truncate">
                        {data.geoHeatmap[0]?.name || 'N/A'}
                    </div>
                    <div className="text-[10px] text-yellow-500 mt-1 font-bold">
                        {data.geoHeatmap[0]?.value || 0} Candidates
                    </div>
                </div>
            </div>

            {/* 2. THE WAR ROOM MAP & TRENDS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* GEOGRAPHIC HEATMAP (Simple Bar for MVP, Map Visual Planned) */}
                <div className="lg:col-span-2 bg-[#0f172a] border border-slate-800 p-8 rounded-[32px] min-h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <Globe className="text-blue-500" /> Talent Radar
                        </h3>
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-widest">
                            Live Data
                        </span>
                    </div>

                    <div className="h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                        {data.geoHeatmap.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <Globe size={24} className="mb-2 opacity-50" />
                                <span className="text-xs uppercase font-bold tracking-widest">No Location Data Yet</span>
                            </div>
                        ) : (
                            data.geoHeatmap.map((item, index) => {
                                const maxVal = data.geoHeatmap[0]?.value || 1;
                                const percent = (item.value / maxVal) * 100;

                                return (
                                    <div key={item.name} className="relative group">
                                        {/* Background Bar */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-blue-500/10 rounded-r-xl transition-all duration-1000 ease-out"
                                            style={{ width: `${percent}%` }}
                                        />

                                        {/* Content Row */}
                                        <div className="relative flex items-center justify-between p-3 pl-4 z-10">
                                            <div className="flex items-center gap-4">
                                                <span className={`
                                                    text-xs font-black w-6 h-6 flex items-center justify-center rounded-full
                                                    ${index === 0 ? 'bg-yellow-500 text-black' :
                                                        index === 1 ? 'bg-slate-700 text-white' :
                                                            index === 2 ? 'bg-slate-700 text-slate-400' : 'text-slate-600'}
                                                `}>
                                                    {index + 1}
                                                </span>
                                                <span className="text-sm font-bold text-slate-200">
                                                    {item.name || 'Unknown Region'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-white">{item.value}</span>
                                                <Users size={12} className="text-slate-500" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* PIPELINE FUNNEL */}
                <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[32px]">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-8">Pipeline Health</h3>
                    <div className="space-y-6">
                        {data.funnelData.map((stage, i) => (
                            <div key={stage.name} className="relative">
                                <div className="flex justify-between text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                                    <span>{stage.name}</span>
                                    <span>{stage.value}</span>
                                </div>
                                <div className="w-full bg-slate-800/50 rounded-full h-3 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${i === 0 ? 'bg-slate-600' :
                                            i === 1 ? 'bg-blue-500' :
                                                i === 2 ? 'bg-purple-500' : 'bg-emerald-500'
                                            }`}
                                        style={{ width: `${(stage.value / Math.max(1, data.funnelData[0].value)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                        <div className="flex items-start gap-3">
                            <Zap className="text-yellow-400 shrink-0 mt-0.5" size={16} />
                            <div>
                                <h4 className="text-white font-bold text-xs uppercase tracking-wide">Insight</h4>
                                <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                                    You have a strong conversion to ensure quality hires. Consider increasing top-of-funnel traffic by boosting your "Worldwide" jobs in <strong>{data.geoHeatmap[0]?.name || 'Target Regions'}</strong>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. APPLICATION TRENDS */}
            <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[32px] h-[350px]">
                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6">Application Velocity (7 Days)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trendData}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                        <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
