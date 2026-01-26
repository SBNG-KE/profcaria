"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/app/context/ThemeContext';
import {
  Briefcase, Plus, ChevronRight,
  TrendingUp, MessageSquare, Calendar, Activity, BarChart2
} from 'lucide-react';
import AnalyticsDashboard from './AnalyticsDashboard';

export default function EmployerHome() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [notifications, setNotifications] = useState<any[]>([]);
  const [employerData, setEmployerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'activity' | 'analytics'>('activity');

  const [limits, setLimits] = useState<any>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [notifRes, meRes, limitsRes] = await Promise.all([
          fetch('/api/shared/notifications'),
          fetch('/api/auth/me'),
          fetch('/api/employer/limits')
        ]);

        if (notifRes.ok) {
          const data = await notifRes.json();
          setNotifications(data.notifications.slice(0, 10));
        }
        if (meRes.ok) {
          const data = await meRes.json();
          setEmployerData(data);
        }
        if (limitsRes.ok) {
          const data = await limitsRes.json();
          setLimits(data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const isLimitReached = limits && limits.limits.jobs < 9999 && (limits.usage?.jobs >= limits.limits.jobs);

  return (
    <div className={`p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-32 min-h-screen ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Header Section */}
      <header className={`flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
        <div className="text-left">
          <div className={`flex items-center gap-2 mb-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
            <TrendingUp size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              {viewMode === 'activity' ? 'Live Workspace' : 'Strategic Insights'}
            </span>
          </div>
          <h1 className={`text-4xl font-black uppercase tracking-tighter leading-none ${isDark ? 'text-white' : 'text-black'}`}>
            {employerData?.profile?.companyName ? `${employerData.profile.companyName} HQ` : 'Command Center'}
          </h1>
        </div>

        <div className="flex items-center gap-3 group relative">
          <button
            onClick={() => !isLimitReached && router.push('/employer/jobs/create')}
            disabled={isLimitReached}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 ${isLimitReached
              ? (isDark ? 'bg-neutral-800 text-neutral-500' : 'bg-neutral-200 text-neutral-400') + ' cursor-not-allowed shadow-none'
              : (isDark ? 'bg-white hover:bg-neutral-200 text-black' : 'bg-black hover:bg-neutral-800 text-white') + ' shadow-lg'
              }`}
          >
            <Plus size={16} />
            <span>{isLimitReached ? 'Job Limit Reached' : 'Post New Job'}</span>
          </button>
          {isLimitReached && (
            <div className={`absolute top-full mt-2 right-0 w-64 p-3 text-[10px] rounded-xl shadow-xl z-20 hidden group-hover:block border ${isDark ? 'bg-neutral-800 text-neutral-300 border-neutral-700' : 'bg-white text-neutral-600 border-neutral-200'}`}>
              You have reached the job posting limit for your current plan. Please upgrade to post more.
            </div>
          )}
        </div>
      </header >

      {/* MODE TOGGLE */}
      < div className="flex justify-center" >
        <div className={`p-1 rounded-2xl border inline-flex ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
          <button
            onClick={() => setViewMode('activity')}
            className={`px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === 'activity'
              ? (isDark ? 'bg-neutral-800 text-white shadow-lg' : 'bg-white text-black shadow-md')
              : (isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-500 hover:text-neutral-700')
              }`}
          >
            <Activity size={14} /> Activity Feed
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === 'analytics'
              ? (isDark ? 'bg-neutral-800 text-white shadow-lg' : 'bg-white text-black shadow-md')
              : (isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-500 hover:text-neutral-700')
              }`}
          >
            <BarChart2 size={14} /> Analytics
          </button>
        </div>
      </div >

      {viewMode === 'analytics' ? (
        <AnalyticsDashboard employerData={employerData} isDark={isDark} />
      ) : (
        <div className={`border rounded-[32px] overflow-hidden ${isDark ? 'bg-neutral-900/30 border-neutral-800/50' : 'bg-neutral-50 border-neutral-200'}`}>
          {/* Existing Activity Feed Content */}
          <div className={`px-8 py-6 border-b flex items-center justify-between ${isDark ? 'border-neutral-800/50' : 'border-neutral-200'}`}>
            <h3 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-3 ${isDark ? 'text-white' : 'text-black'}`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? 'bg-white' : 'bg-black'}`}></div>
              Recent Activity
            </h3>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
              Latest 10
            </span>
          </div>
          <div className="p-8">
            {loading ? (
              <div className="flex justify-center p-8"><div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${isDark ? 'border-white' : 'border-black'}`}></div></div>
            ) : notifications.length === 0 ? (
              <p className={`text-xs font-bold uppercase tracking-widest text-center py-10 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No recent activity found</p>
            ) : (
              <div className="space-y-4">
                {notifications.map((notif) => {
                  const getActivityRoute = () => {
                    if (notif.type === 'application') return '/employer/applications';
                    if (notif.type === 'message') return '/employer/notifications';
                    if (notif.type === 'interview') return '/employer/interviews';
                    return '/employer/notifications';
                  };

                  return (
                    <button
                      key={notif.id}
                      onClick={() => router.push(getActivityRoute())}
                      className={`w-full flex items-start gap-4 p-5 rounded-2xl border border-transparent transition-all group cursor-pointer text-left ${isDark ? 'hover:bg-neutral-800/50 hover:border-neutral-700' : 'hover:bg-white hover:border-neutral-200 hover:shadow-sm'}`}
                    >
                      <div className={`w-12 h-12 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-500 group-hover:text-white group-hover:border-neutral-600' : 'bg-neutral-100 border-neutral-200 text-neutral-500 group-hover:text-black group-hover:border-neutral-300'}`}>
                        {notif.type === 'application' ? <Briefcase size={20} /> : notif.type === 'message' ? <MessageSquare size={20} /> : <Calendar size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`text-sm font-bold transition-colors capitalize ${isDark ? 'text-white group-hover:text-neutral-200' : 'text-black group-hover:text-neutral-700'}`}>{notif.type} Update</h4>
                          <span className={`text-[10px] font-mono ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{new Date(notif.created_at).toLocaleString()}</span>
                        </div>
                        <p className={`text-xs line-clamp-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{notif.message}</p>
                      </div>
                      <ChevronRight size={16} className={`transition-all mt-4 shrink-0 ${isDark ? 'text-neutral-700 group-hover:text-white' : 'text-neutral-300 group-hover:text-black'} group-hover:translate-x-1`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )
      }

    </div >
  );
}
