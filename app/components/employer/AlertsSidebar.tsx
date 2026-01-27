"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, TrendingUp, Activity, BarChart2, Bell } from 'lucide-react';
import { useNotificationContext } from '@/app/context/NotificationContext';
import { useTheme } from '@/app/context/ThemeContext';

export default function EmployerAlertsSidebar() {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { notifications } = useNotificationContext();

    // Real Data State
    const [stats, setStats] = useState({ newFollowers: 0, growthPercent: 0 }); // growthPercent can be calculated or just show raw new followers for now.
    const [industryActivity, setIndustryActivity] = useState<any[]>([]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/employer/analytics');
                if (res.ok) {
                    const data = await res.json();

                    // Growth Calculation
                    // If we have total `subscribers` and `newSubscribersThisWeek`.
                    // Growth % = (new / (total - new)) * 100? Or just show the count. 
                    // Let's explicitly show the count as requested.
                    const newFollowers = data.newSubscribersThisWeek || 0;
                    const total = data.subscribers || 0;
                    const prevTotal = total - newFollowers;
                    const percent = prevTotal > 0 ? Math.round((newFollowers / prevTotal) * 100) : (newFollowers > 0 ? 100 : 0);

                    setStats({ newFollowers, growthPercent: percent });
                    setIndustryActivity(data.industryActivity || []);
                }
            } catch (err) {
                console.error("Error fetching analytics", err);
            }
        };
        fetchAnalytics();
    }, []);

    // Filter notifications (Real alerts from system)
    const sortedNotifications = notifications.slice(0, 5);

    return (
        <div className="flex flex-col h-full">
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-6 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Insights & Alerts</h3>

            {/* GROWTH CARD */}
            <div className={`p-4 rounded-xl mb-6 relative overflow-hidden group border ${isDark ? 'bg-gradient-to-br from-neutral-800 to-neutral-900 border-neutral-800' : 'bg-gradient-to-br from-white to-neutral-50 border-neutral-200'}`}>
                {/* Background Glow */}
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={14} className="text-emerald-500" />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Weekly Growth</span>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{stats.newFollowers}</span>
                        <span className="text-xs font-bold text-emerald-500 mb-1.5">{stats.growthPercent > 0 ? `+${stats.growthPercent}%` : '0%'}</span>
                    </div>
                    <p className={`text-[10px] mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Total new followers this week</p>
                </div>
            </div>

            {/* INDUSTRY ACTIVITY */}
            <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                <Activity size={12} /> Industry Activity
                {/* AI Label */}
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">AI</span>
            </h4>

            <div className="space-y-3 mb-6">
                {industryActivity.length > 0 ? industryActivity.map(item => (
                    <div key={item.id} className={`p-3 rounded-xl border ${isDark ? 'bg-neutral-800/30 border-neutral-800' : 'bg-white border-neutral-100'}`}>
                        <p className={`text-xs ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                            <span className="font-bold">{item.company}</span> {item.action}
                        </p>
                        <p className={`text-[10px] mt-1 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                            {new Date(item.time).toLocaleDateString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                )) : (
                    <p className={`text-xs italic ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No significant activity detected.</p>
                )}
            </div>

            <hr className={`border-t my-2 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`} />

            {/* SYSTEM ALERTS */}
            <div className="flex-1 overflow-y-auto mt-2" style={{ scrollbarWidth: 'none' }}>
                <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    <Bell size={12} /> System Alerts
                </h4>

                {sortedNotifications.length > 0 ? sortedNotifications.map(n => (
                    <div key={n.id} className="flex gap-3 items-start mb-3 ">
                        <div className={`mt-0.5 min-w-[6px] h-1.5 rounded-full ${isDark ? 'bg-amber-500' : 'bg-amber-600'}`}></div>
                        <div>
                            <p className={`text-xs leading-snug ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                <span dangerouslySetInnerHTML={{ __html: n.message }} />
                            </p>
                            <span className={`text-[10px] ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                {new Date(n.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                )) : (
                    <p className={`text-xs italic ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No system alerts</p>
                )}
            </div>
        </div>
    );
}

