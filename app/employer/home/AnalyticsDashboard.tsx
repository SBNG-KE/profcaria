"use client"

import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Globe, TrendingUp, Users, Target, Map, Zap, ChevronDown, Calendar, Check, Eye, MousePointer, Clock, UserMinus, AlertTriangle } from 'lucide-react';

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
    slaStats?: {
        responseRate: number;
        avgResponseDays: number;
        pendingCount: number;
        reviewedCount: number;
    };
}

// Custom Dropdown Scroll Container (Matches layout-content.tsx dots style)
const DropdownScroll = ({ children, className = "", isDark }: { children: React.ReactNode, className?: string, isDark: boolean }) => {
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
                        <div className={`w-1 h-1 rounded-full shadow-[0_0_4px_rgba(255,255,255,0.6)] ${isDark ? 'bg-white' : 'bg-black'}`}></div>
                        <div className={`w-0.5 h-0.5 rounded-full shadow-sm ${isDark ? 'bg-white/80' : 'bg-black/80'}`}></div>
                        <div className={`w-0.5 h-0.5 rounded-full shadow-sm ${isDark ? 'bg-white/60' : 'bg-black/60'}`}></div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Custom Dropdown Component
function CustomDropdown({ value, onChange, options, icon, isDark }: { value: string | number, onChange: (val: string | number) => void, options: { value: string | number, label: string }[], icon?: React.ReactNode, isDark: boolean }) {
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
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors group border ${isDark ? 'hover:bg-neutral-800/50 border-transparent text-neutral-200' : 'bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-700'}`}
            >
                {icon}
                <span className="text-[11px] font-bold uppercase tracking-widest min-w-[60px] text-left">
                    {selectedLabel}
                </span>
                <ChevronDown size={12} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`} />
            </button>

            {isOpen && (
                <div className={`absolute top-full mt-2 left-0 w-48 border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                    <DropdownScroll className="max-h-[200px] p-1" isDark={isDark}>
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all text-left
                                    ${opt.value == value
                                        ? (isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-black')
                                        : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-500 hover:text-black hover:bg-neutral-50')}
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

export default function AnalyticsDashboard({ employerData, isDark }: { employerData: any, isDark: boolean }) {
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
        <div className={`p-20 flex flex-col items-center justify-center space-y-4 animate-pulse ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
            <Globe size={48} className={`spin-slow ${isDark ? 'text-neutral-600' : 'text-neutral-300'}`} />
            <p className="text-xs font-black uppercase tracking-widest">Initialising...</p>
        </div>
    );

    if (!data) return null;

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* FILTERS */}
            <div className="flex flex-col md:flex-row justify-end items-center gap-4">

                {/* Custom Filters (Year/Month) */}
                <div className={`flex items-center gap-3 p-1.5 rounded-2xl border transition-all duration-300 ${dateRange === '7d' ? 'opacity-50 hover:opacity-100' : 'opacity-100 shadow-xl'} ${isDark ? 'bg-neutral-900/80 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>

                    {/* Year Selector */}
                    <CustomDropdown
                        value={selectedYear}
                        onChange={(val) => {
                            setSelectedYear(Number(val));
                            setDateRange('custom');
                        }}
                        options={years.map(y => ({ value: y, label: y.toString() }))}
                        icon={<Calendar size={12} className={isDark ? "text-neutral-400" : "text-neutral-500"} />}
                        isDark={isDark}
                    />

                    <div className={`w-px h-8 ${isDark ? 'bg-neutral-700/50' : 'bg-neutral-300'}`}></div>

                    {/* Month Selector */}
                    <CustomDropdown
                        value={selectedMonth}
                        onChange={(val) => {
                            setSelectedMonth(String(val));
                            setDateRange('custom');
                        }}
                        options={months}
                        icon={<Calendar size={12} className={isDark ? "text-neutral-400" : "text-neutral-500"} />}
                        isDark={isDark}
                    />
                </div>

                {/* 7 Days Toggle */}
                <button
                    onClick={() => setDateRange('7d')}
                    className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 transform active:scale-95
                        ${dateRange === '7d'
                            ? (isDark ? 'bg-white text-black shadow-lg' : 'bg-black text-white shadow-lg')
                            : (isDark ? 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700' : 'bg-white text-neutral-500 hover:text-black hover:bg-neutral-50 hover:shadow-lg')}
                    `}
                >
                    <TrendingUp size={14} />
                    7 Days
                </button>
            </div>


            {/* 1. TOP STATS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: 'Total Applicants', val: data.stats.totalApplications, icon: Users, sub: `${applicantGrowth.improved ? '+' : '-'}${applicantGrowth.value}% vs previous`, subColor: applicantGrowth.improved ? (isDark ? 'text-neutral-300' : 'text-neutral-600') : (isDark ? 'text-neutral-500' : 'text-neutral-400') },
                    { label: 'Active Jobs', val: data.stats.activeJobs, icon: Target, sub: `out of ${data.stats.totalJobs} total` },
                    { label: 'Conversion Rate', val: `${data.stats.interviewRate}%`, icon: TrendingUp, sub: 'Application to Hire' },
                    { label: 'Top Region', val: data.geoHeatmap[0]?.name || 'N/A', icon: Map, sub: `${data.geoHeatmap[0]?.value || 0} Candidates` }
                ].map((stat, i) => (
                    <div key={i} className={`border p-6 rounded-[24px] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                        <div className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            <stat.icon size={14} className={isDark ? 'text-neutral-400' : 'text-neutral-500'} /> {stat.label}
                        </div>
                        <div className={`text-3xl font-black truncate ${isDark ? 'text-white' : 'text-black'}`}>{stat.val}</div>
                        <div className={`text-[10px] mt-1 font-bold ${stat.subColor || (isDark ? 'text-neutral-500' : 'text-neutral-400')}`}>
                            {stat.sub}
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. THE WAR ROOM MAP & TRENDS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

                {/* GEOGRAPHIC HEATMAP (Simple Bar for MVP, Map Visual Planned) */}
                <div className={`lg:col-span-2 border p-8 rounded-[32px] min-h-[400px] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-8">
                        <h3 className={`text-lg font-black uppercase tracking-tight flex items-center gap-3 ${isDark ? 'text-white' : 'text-black'}`}>
                            <Globe className={isDark ? 'text-neutral-400' : 'text-neutral-500'} /> Talent Radar
                        </h3>
                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest ${isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-600'}`}>
                            Live Data
                        </span>
                    </div>

                    <div className="h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                        {data.geoHeatmap.length === 0 ? (
                            <div className={`flex flex-col items-center justify-center h-full ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
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
                                            className={`absolute top-0 left-0 h-full rounded-r-xl transition-all duration-1000 ease-out ${isDark ? 'bg-neutral-700/30' : 'bg-neutral-100'}`}
                                            style={{ width: `${percent}%` }}
                                        />

                                        {/* Content Row */}
                                        <div className="relative flex items-center justify-between p-3 pl-4 z-10">
                                            <div className="flex items-center gap-4">
                                                <span className={`
                                                    text-xs font-black w-6 h-6 flex items-center justify-center rounded-full
                                                    ${index === 0 ? (isDark ? 'bg-white text-black' : 'bg-black text-white') :
                                                        index === 1 ? (isDark ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-black') :
                                                            index === 2 ? (isDark ? 'bg-neutral-700 text-neutral-400' : 'bg-neutral-200 text-neutral-500') : (isDark ? 'text-neutral-600' : 'text-neutral-400')}
                                                `}>
                                                    {index + 1}
                                                </span>
                                                <span className={`text-sm font-bold ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                                                    {item.name || 'Unknown Region'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-black'}`}>{item.value}</span>
                                                <Users size={12} className={isDark ? 'text-neutral-500' : 'text-neutral-400'} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* PIPELINE FUNNEL */}
                <div className={`border p-8 rounded-[32px] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <h3 className={`text-lg font-black uppercase tracking-tight mb-8 ${isDark ? 'text-white' : 'text-black'}`}>Pipeline Health</h3>
                    <div className="space-y-4">
                        {data.funnelData.map((stage, i) => {
                            // Color mapping for each stage
                            const colorClass = isDark ? (
                                stage.name === 'Applied' ? 'bg-neutral-500' :
                                    stage.name === 'Rejected' ? 'bg-neutral-600' :
                                        stage.name === 'Pending' ? 'bg-neutral-400' :
                                            stage.name === 'Shortlisted' ? 'bg-neutral-500' :
                                                stage.name === 'Declined' ? 'bg-neutral-600' :
                                                    stage.name === 'Employed' ? 'bg-white' : 'bg-neutral-500'
                            ) : (
                                stage.name === 'Applied' ? 'bg-neutral-400' :
                                    stage.name === 'Rejected' ? 'bg-neutral-300' :
                                        stage.name === 'Pending' ? 'bg-neutral-500' :
                                            stage.name === 'Shortlisted' ? 'bg-neutral-400' :
                                                stage.name === 'Declined' ? 'bg-neutral-300' :
                                                    stage.name === 'Employed' ? 'bg-black' : 'bg-neutral-400'
                            );

                            return (
                                <div key={stage.name} className="relative">
                                    <div className={`flex justify-between items-center text-xs font-bold mb-1.5 uppercase tracking-wide ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${colorClass}`} />
                                            <span>{stage.name}</span>
                                        </div>
                                        <span className={isDark ? 'text-white' : 'text-black'}>{stage.value}</span>
                                    </div>
                                    <div className={`w-full rounded-full h-2.5 overflow-hidden ${isDark ? 'bg-neutral-800/50' : 'bg-neutral-100'}`}>
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${colorClass}`}
                                            style={{ width: `${(stage.value / Math.max(1, data.funnelData[0].value)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className={`mt-10 p-4 rounded-xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                        <div className="flex items-start gap-3">
                            <Zap className="shrink-0 mt-0.5" size={16} color={isDark ? '#94a3b8' : '#737373'} />
                            <div>
                                <h4 className={`font-bold text-xs uppercase tracking-wide ${isDark ? 'text-white' : 'text-black'}`}>Insight</h4>
                                <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                                    You have a strong conversion to ensure quality hires. Consider increasing top-of-funnel traffic by boosting your "Worldwide" jobs in <strong>{data.geoHeatmap[0]?.name || 'Target Regions'}</strong>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. APPLICATION TRENDS */}
            <div className={`border p-8 rounded-[32px] h-[350px] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <h3 className={`text-lg font-black uppercase tracking-tight mb-6 ${isDark ? 'text-white' : 'text-black'}`}>
                    Application Velocity ({dateRange === '7d' ? 'Last 7 Days' : (selectedMonth === 'all' ? `Year ${selectedYear}` : `${selectedYear} - ${months.find(m => m.value === selectedMonth)?.label}`)})
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trendData}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isDark ? "#ffffff" : "#000000"} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={isDark ? "#ffffff" : "#000000"} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#64748b' : '#a3a3a3', fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: isDark ? '#171717' : '#ffffff', border: isDark ? '1px solid #262626' : '1px solid #e5e5e5', borderRadius: '12px', color: isDark ? '#fff' : '#000' }} />
                        <Area type="monotone" dataKey="count" stroke={isDark ? "#ffffff" : "#000000"} strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* 4. NEW: REACH STATS & HIRING SPEED ROW */}
            {(data.reachStats || data.hiringSpeed) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {/* Impressions */}
                    {data.reachStats && (
                        <>
                            <div className={`border p-6 rounded-[24px] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                    <Eye size={14} className={isDark ? 'text-neutral-400' : 'text-neutral-500'} /> Total Impressions
                                </div>
                                <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{data.reachStats.totalImpressions.toLocaleString()}</div>
                                <div className={`text-[10px] mt-1 font-bold ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Job cards viewed in feed</div>
                            </div>
                            <div className={`border p-6 rounded-[24px] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                    <MousePointer size={14} className={isDark ? 'text-neutral-400' : 'text-neutral-500'} /> Unique Views
                                </div>
                                <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{data.reachStats.uniqueViews.toLocaleString()}</div>
                                <div className={`text-[10px] mt-1 font-bold ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{data.reachStats.clickThroughRate}% CTR</div>
                            </div>
                        </>
                    )}
                    {/* Hiring Speed */}
                    {data.hiringSpeed && (
                        <>
                            <div className={`border p-6 rounded-[24px] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                    <Clock size={14} className={isDark ? 'text-neutral-400' : 'text-neutral-500'} /> Time to Fill
                                </div>
                                <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{data.hiringSpeed.avgTimeToFill}</div>
                                <div className={`text-[10px] mt-1 font-bold ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Days (posting → hire)</div>
                            </div>
                            <div className={`border p-6 rounded-[24px] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                    <Clock size={14} className={isDark ? 'text-neutral-400' : 'text-neutral-500'} /> Time to Hire
                                </div>
                                <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{data.hiringSpeed.avgTimeToHire}</div>
                                <div className={`text-[10px] mt-1 font-bold ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Days (apply → hire)</div>
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
                        <div className={`border p-8 rounded-[32px] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                            <h3 className={`text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-3 ${isDark ? 'text-white' : 'text-black'}`}>
                                <TrendingUp className={isDark ? 'text-neutral-400' : 'text-neutral-500'} /> Application Completion
                            </h3>
                            <div className="flex items-center gap-8">
                                <div className="relative w-32 h-32">
                                    <svg className="w-full h-full -rotate-90">
                                        <circle cx="64" cy="64" r="56" fill="none" stroke={isDark ? '#262626' : '#e5e5e5'} strokeWidth="12" />
                                        <circle
                                            cx="64" cy="64" r="56" fill="none"
                                            stroke={isDark ? '#ffffff' : '#000000'} strokeWidth="12"
                                            strokeDasharray={`${(data.completionStats.completionRate / 100) * 352} 352`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{data.completionStats.completionRate}%</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Started</p>
                                        <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{data.completionStats.started}</p>
                                    </div>
                                    <div>
                                        <p className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Completed</p>
                                        <p className={`text-xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{data.completionStats.completed}</p>
                                    </div>
                                </div>
                            </div>
                            <p className={`text-[11px] mt-4 ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Tracks how many professionals who start your application form complete it.</p>
                        </div>
                    )}

                    {/* Turnover Panel */}
                    {data.connectionTurnover && data.connectionTurnover.disconnectionRate > 0 && (
                        <div className={`border p-8 rounded-[32px] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                            <h3 className={`text-lg font-black uppercase tracking-tight mb-6 flex items-center gap-3 ${isDark ? 'text-white' : 'text-black'}`}>
                                <UserMinus className={isDark ? 'text-neutral-400' : 'text-neutral-500'} /> Connection Turnover
                            </h3>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className={`p-4 rounded-xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                                    <p className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Disconnection Rate</p>
                                    <p className={`text-2xl font-black ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{data.connectionTurnover.disconnectionRate}%</p>
                                </div>
                                <div className={`p-4 rounded-xl border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                                    <p className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Avg. Duration</p>
                                    <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{data.connectionTurnover.avgEmploymentDuration} days</p>
                                </div>
                            </div>
                            <p className={`text-[11px] ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Tracks how quickly connections are terminated or resigned from your company.</p>
                        </div>
                    )}
                </div>
            )}

            {/* 6. NEW: SLA / RESPONSE RATE PANEL */}
            {data.slaStats && (
                <div className={`border p-8 rounded-[32px] ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className={`text-lg font-black uppercase tracking-tight flex items-center gap-3 ${isDark ? 'text-white' : 'text-black'}`}>
                            <Clock className={isDark ? 'text-neutral-400' : 'text-neutral-500'} /> Response Rate SLA
                        </h3>
                        {data.slaStats.pendingCount > 0 && (
                            <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-200'}`}>
                                <AlertTriangle size={14} className={isDark ? 'text-neutral-400' : 'text-neutral-500'} />
                                <span className={`text-xs font-bold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>{data.slaStats.pendingCount} Pending</span>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className={`p-4 rounded-xl border text-center ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                            <p className={`text-[10px] uppercase font-bold tracking-widest mb-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Response Rate</p>
                            <p className={`text-3xl font-black ${data.slaStats.responseRate >= 90 ? (isDark ? 'text-white' : 'text-black') : data.slaStats.responseRate >= 70 ? (isDark ? 'text-neutral-300' : 'text-neutral-600') : (isDark ? 'text-neutral-500' : 'text-neutral-400')}`}>
                                {data.slaStats.responseRate}%
                            </p>
                        </div>
                        <div className={`p-4 rounded-xl border text-center ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                            <p className={`text-[10px] uppercase font-bold tracking-widest mb-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Avg Response Time</p>
                            <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{data.slaStats.avgResponseDays}</p>
                            <p className={`text-[10px] font-bold ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>days</p>
                        </div>
                        <div className={`p-4 rounded-xl border text-center ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                            <p className={`text-[10px] uppercase font-bold tracking-widest mb-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Reviewed</p>
                            <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{data.slaStats.reviewedCount}</p>
                        </div>
                        <div className={`p-4 rounded-xl border text-center ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                            <p className={`text-[10px] uppercase font-bold tracking-widest mb-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Pending</p>
                            <p className={`text-3xl font-black ${data.slaStats.pendingCount > 5 ? (isDark ? 'text-neutral-300' : 'text-neutral-600') : (isDark ? 'text-neutral-400' : 'text-neutral-400')}`}>
                                {data.slaStats.pendingCount}
                            </p>
                        </div>
                    </div>
                    {data.slaStats.pendingCount > 5 && (
                        <div className={`mt-4 p-3 border rounded-xl ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-200'}`}>
                            <p className={`text-xs text-center font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                ⚠️ You have candidates waiting for your response. Review them before posting new jobs.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
