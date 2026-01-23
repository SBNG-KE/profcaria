"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase, Plus, ChevronRight,
  TrendingUp, MessageSquare, Calendar, Activity, BarChart2
} from 'lucide-react';
import AnalyticsDashboard from './AnalyticsDashboard';

export default function EmployerHome() {
  const router = useRouter();
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-32">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-800">
        <div className="text-left">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <TrendingUp size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              {viewMode === 'activity' ? 'Live Workspace' : 'Strategic Insights'}
            </span>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
            {employerData?.profile?.companyName ? `${employerData.profile.companyName} HQ` : 'Command Center'}
          </h1>
        </div>

        <div className="flex items-center gap-3 group relative">
          <button
            onClick={() => !isLimitReached && router.push('/employer/jobs/create')}
            disabled={isLimitReached}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2 ${isLimitReached
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
              : 'bg-white hover:bg-slate-100 text-black shadow-lg'
              }`}
          >
            <Plus size={16} />
            <span>{isLimitReached ? 'Job Limit Reached' : 'Post New Job'}</span>
          </button>
          {isLimitReached && (
            <div className="absolute top-full mt-2 right-0 w-64 p-3 bg-slate-800 text-slate-300 text-[10px] rounded-xl shadow-xl z-20 hidden group-hover:block border border-slate-700">
              You have reached the job posting limit for your current plan. Please upgrade to post more.
            </div>
          )}
        </div>
      </header >

      {/* MODE TOGGLE */}
      < div className="flex justify-center" >
        <div className="bg-[#0f172a] p-1 rounded-2xl border border-slate-800 inline-flex">
          <button
            onClick={() => setViewMode('activity')}
            className={`px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === 'activity'
              ? 'bg-slate-800 text-white shadow-lg'
              : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <Activity size={14} /> Activity Feed
          </button>
          <button
            onClick={() => setViewMode('analytics')}
            className={`px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === 'analytics'
              ? 'bg-slate-800 text-white shadow-lg'
              : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <BarChart2 size={14} /> Analytics
          </button>
        </div>
      </div >

      {viewMode === 'analytics' ? (
        <AnalyticsDashboard employerData={employerData} />
      ) : (
        <div className="bg-[#0f172a]/30 border border-slate-800/50 rounded-[32px] overflow-hidden">
          {/* Existing Activity Feed Content */}
          <div className="px-8 py-6 border-b border-slate-800/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              Recent Activity
            </h3>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              Latest 10
            </span>
          </div>
          <div className="p-8">
            {loading ? (
              <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>
            ) : notifications.length === 0 ? (
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center py-10">No recent activity found</p>
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
                      className="w-full flex items-start gap-4 p-5 rounded-2xl hover:bg-slate-800/50 border border-transparent hover:border-slate-700 transition-all group cursor-pointer text-left"
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center text-slate-500 group-hover:text-white group-hover:border-slate-600 transition-colors">
                        {notif.type === 'application' ? <Briefcase size={20} /> : notif.type === 'message' ? <MessageSquare size={20} /> : <Calendar size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-bold text-white group-hover:text-slate-200 transition-colors capitalize">{notif.type} Update</h4>
                          <span className="text-[10px] text-slate-500 font-mono">{new Date(notif.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{notif.message}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all mt-4 shrink-0" />
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
