"use client"

import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Globe, TrendingUp, Users, Target, Map, Zap, ChevronDown, Calendar, Check, Eye, MousePointer, Clock, UserMinus } from 'lucide-react';

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
    // NEW Analytics
    reachStats?: {
        totalImpressions: number;
        uniqueViews: number;
        clickThroughRate: number;
    };
    geoReach?: { country: string; impressions: number; views: number; applications: number }[];
    completionStats?: {
        started: number;
        completed: number;
        completionRate: number;
        avgTimeToComplete: number;
    };
    hiringSpeed?: {
        avgTimeToFill: number;
        avgTimeToHire: number;
    };
    connectionTurnover?: {
        avgEmploymentDuration: number;
        disconnectionRate: number;
        turnoverByMonth: { month: string; disconnections: number }[];
    };
}

// Custom Dropdown Scroll Container (Matches layout-content.tsx dots style)
const DropdownScroll = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [showScrollbar, setShowScrollbar] = useState(false);

    const handleScroll = () => {
        const element = scrollRef.current;
        if (!element) return;
        const { scrollTop, scrollHeight, clientHeight } = element;

        const needsScroll = scrollHeight > clientHeight + 1;
        if (needsScroll !== showScrollbar) setShowScrollbar(needsScroll);

        if (needsScroll) {
            setScrollProgress(scrollTop / (scrollHeight - clientHeight));
        }
    };

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;
        const resizeObserver = new ResizeObserver(handleScroll);
        resizeObserver.observe(element);
        handleScroll();
        return () => resizeObserver.disconnect();
    }, [children]);

    return (
        <div className="relative w-full overflow-hidden">
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className={`overflow-y-auto scrollbar-hide ${className}`}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {children}
            </div>
            {showScrollbar && (
                <div className="absolute right-1 top-2 bottom-2 w-1 pointer-events-none z-50 flex flex-col justify-start">
                    <div
                        className="absolute right-0 w-full transition-all duration-75 ease-out flex flex-col gap-[2px] items-center"
                        style={{ top: `calc(${scrollProgress * 100}% - ${scrollProgress * 20}px)` }}
                    >
                        <div className="w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_4px_rgba(16,185,129,0.6)]"></div>
                        <div className="w-0.5 h-0.5 bg-emerald-500/80 rounded-full shadow-sm"></div>
                        <div className="w-0.5 h-0.5 bg-emerald-500/60 rounded-full shadow-sm"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Custom Dropdown Component
function CustomDropdown({ value, onChange, options, icon }: { value: string | number, onChange: (val: string | number) => void, options: { value: string | number, label: string }[], icon?: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedLabel = options.find(o => o.value == value)?.label || value;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-800/50 transition-colors group"
            >
                {icon}
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-widest min-w-[60px] text-left">
                    {selectedLabel}
                </span>
                <ChevronDown size={12} className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 left-0 w-48 bg-[#0f172a] border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <DropdownScroll className="max-h-[200px] p-1">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all text-left
                                    ${opt.value == value
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                                `}
                            >
                                {opt.label}
                                {opt.value == value && <Check size={12} />}
                            </button>
                        ))}
                    </DropdownScroll>
                </div>
            )}
        </div>
    );
}

export default function AnalyticsDashboard({ employerData }: { employerData: any }) {
    const [data, setData] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'7d' | 'custom'>('7d');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [applicantGrowth, setApplicantGrowth] = useState({ value: 0, improved: false });

    // Plan Limits
    const planLevel = employerData?.subscription?.plan_id || 'free';

    // Logic: Free = 1 year (Current), Basic = 3 years, Pro/Ent = Unlimited (Back to 2020)
    const currentYear = new Date().getFullYear();
    const startYear = (planLevel === 'enterprise' || planLevel === 'pro') ? 2020 : (planLevel === 'basic' ? currentYear - 2 : currentYear);
    const years = [];
    for (let y = currentYear; y >= startYear; y--) {
        years.push(y);
    }

    const months = [
        { value: 'all', label: 'All Months' },
        { value: '1', label: 'January' }, { value: '2', label: 'February' }, { value: '3', label: 'March' },
        { value: '4', label: 'April' }, { value: '5', label: 'May' }, { value: '6', label: 'June' },
        { value: '7', label: 'July' }, { value: '8', label: 'August' }, { value: '9', label: 'September' },
        { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }
    ];

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                let url = `/api/employer/analytics/dashboard?`;
                if (dateRange === '7d') {
                    url += `range=7d`;
                } else {
                    url += `range=custom&year=${selectedYear}&month=${selectedMonth}`;
                }

                const res = await fetch(url);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);

                    // Calculate applicant growth
                    if (json.trendData && json.trendData.length > 1) {
                        const trends = json.trendData;
                        const mid = Math.floor(trends.length / 2);
                        const firstHalf = trends.slice(0, mid).reduce((sum: number, item: any) => sum + item.count, 0);
                        const secondHalf = trends.slice(mid).reduce((sum: number, item: any) => sum + item.count, 0);

                        const prev = firstHalf || 1;
                        const percentChange = ((secondHalf - firstHalf) / prev) * 100;
                        setApplicantGrowth({
                            value: Math.round(Math.abs(percentChange)),
                            improved: percentChange >= 0
                        });
                    }
                }
            } catch (e) {
                console.error("Analytics fetch fail", e);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [dateRange, selectedYear, selectedMonth]);

    if (loading) return (
        <div className="p-20 flex flex-col items-center justify-center text-slate-500 space-y-4 animate-pulse">
            <Globe size={48} className="text-emerald-500/50 spin-slow" />
            <p className="text-xs font-black uppercase tracking-widest">Initialising...</p>
        </div>
    );

    if (!data) return null;

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* FILTERS */}
            <div className="flex flex-col md:flex-row justify-end items-center gap-4">

                {/* Custom Filters (Year/Month) */}
                <div className={`flex items-center gap-3 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 transition-all duration-300 ${dateRange === '7d' ? 'opacity-50 hover:opacity-100' : 'opacity-100 shadow-xl shadow-blue-500/10'}`}>

                    {/* Year Selector */}
                    <CustomDropdown
                        value={selectedYear}
                        onChange={(val) => {
                            setSelectedYear(Number(val));
                            setDateRange('custom');
                        }}
                        options={years.map(y => ({ value: y, label: y.toString() }))}
                        icon={<Calendar size={12} className="text-slate-400" />}
                    />

                    <div className="w-px h-8 bg-slate-700/50"></div>

                    {/* Month Selector */}
                    <CustomDropdown
                        value={selectedMonth}
                        onChange={(val) => {
                            setSelectedMonth(String(val));
                            setDateRange('custom');
                        }}
                        options={months}
                        icon={<Calendar size={12} className="text-slate-400" />}
                    />
                </div>

                {/* 7 Days Toggle */}
                <button
                    onClick={() => setDateRange('7d')}
                    className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 transform active:scale-95
                        ${dateRange === '7d'
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 hover:shadow-lg'}
                    `}
                >
                    <TrendingUp size={14} />
                    7 Days
                </button>
            </div>


            {/* 1. TOP STATS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[24px]">
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Users size={14} className="text-blue-500" /> Total Applicants
                    </div>
                    <div className="text-3xl font-black text-white">{data.stats.totalApplications}</div>
                    <div className={`text-[10px] mt-1 font-bold ${applicantGrowth.improved ? 'text-emerald-400' : 'text-red-400'}`}>
                        {applicantGrowth.improved ? '+' : '-'}{applicantGrowth.value}% vs previous period
                    </div>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

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
                                <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full 
                                            ${i === 0 ? 'bg-slate-600' :
                                                i === 1 ? 'bg-blue-500' :
                                                    i === 2 ? 'bg-purple-500' : 'bg-emerald-500'
                                            }`}
                                        />
                                        <span>{stage.name}</span>
                                    </div>
                                    <span className="text-white">{stage.value}</span>
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
                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6">
                    Application Velocity ({dateRange === '7d' ? 'Last 7 Days' : (selectedMonth === 'all' ? `Year ${selectedYear}` : `${selectedYear} - ${months.find(m => m.value === selectedMonth)?.label}`)})
                </h3>
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

            {/* 4. NEW: REACH STATS & HIRING SPEED ROW */}
            {(data.reachStats || data.hiringSpeed) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {/* Impressions */}
                    {data.reachStats && (
                        <>
                            <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[24px]">
                                <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Eye size={14} className="text-cyan-500" /> Total Impressions
                                </div>
                                <div className="text-3xl font-black text-white">{data.reachStats.totalImpressions.toLocaleString()}</div>
                                <div className="text-[10px] text-slate-500 mt-1 font-bold">Job cards viewed in feed</div>
                            </div>
                            <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[24px]">
                                <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <MousePointer size={14} className="text-blue-500" /> Unique Views
                                </div>
                                <div className="text-3xl font-black text-white">{data.reachStats.uniqueViews.toLocaleString()}</div>
                                <div className="text-[10px] text-blue-400 mt-1 font-bold">{data.reachStats.clickThroughRate}% CTR</div>
                            </div>
                        </>
                    )}
                    {/* Hiring Speed */}
                    {data.hiringSpeed && (
                        <>
                            <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[24px]">
                                <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Clock size={14} className="text-amber-500" /> Time to Fill
                                </div>
                                <div className="text-3xl font-black text-white">{data.hiringSpeed.avgTimeToFill}</div>
                                <div className="text-[10px] text-slate-500 mt-1 font-bold">Days (posting → hire)</div>
                            </div>
                            <div className="bg-[#0f172a] border border-slate-800 p-6 rounded-[24px]">
                                <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Clock size={14} className="text-orange-500" /> Time to Hire
                                </div>
                                <div className="text-3xl font-black text-white">{data.hiringSpeed.avgTimeToHire}</div>
                                <div className="text-[10px] text-slate-500 mt-1 font-bold">Days (apply → hire)</div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* 5. NEW: COMPLETION RATE & TURNOVER ROW */}
            {(data.completionStats || data.connectionTurnover) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    {/* Completion Rate Panel */}
                    {data.completionStats && data.completionStats.started > 0 && (
                        <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[32px]">
                            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                                <TrendingUp className="text-green-500" /> Application Completion
                            </h3>
                            <div className="flex items-center gap-8">
                                <div className="relative w-32 h-32">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="64" cy="64" r="56" fill="none" stroke="#1e293b" strokeWidth="12" />
                                        <circle
                                            cx="64" cy="64" r="56" fill="none"
                                            stroke="#10b981" strokeWidth="12"
                                            strokeDasharray={`${(data.completionStats.completionRate / 100) * 352} 352`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-3xl font-black text-white">{data.completionStats.completionRate}%</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Started</p>
                                        <p className="text-xl font-black text-white">{data.completionStats.started}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Completed</p>
                                        <p className="text-xl font-black text-emerald-400">{data.completionStats.completed}</p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-slate-500 text-[11px] mt-4">Tracks how many professionals who start your application form complete it.</p>
                        </div>
                    )}

                    {/* Turnover Panel */}
                    {data.connectionTurnover && data.connectionTurnover.disconnectionRate > 0 && (
                        <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[32px]">
                            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6 flex items-center gap-3">
                                <UserMinus className="text-red-500" /> Connection Turnover
                            </h3>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Disconnection Rate</p>
                                    <p className="text-2xl font-black text-red-400">{data.connectionTurnover.disconnectionRate}%</p>
                                </div>
                                <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Avg. Duration</p>
                                    <p className="text-2xl font-black text-white">{data.connectionTurnover.avgEmploymentDuration} days</p>
                                </div>
                            </div>
                            <p className="text-slate-500 text-[11px]">Tracks how quickly connections are terminated or resigned from your company.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
