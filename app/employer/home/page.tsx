"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase, Plus, ChevronRight,
  TrendingUp, MessageSquare, Calendar
} from 'lucide-react';

export default function EmployerHome() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [employerData, setEmployerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [notifRes, meRes] = await Promise.all([
          fetch('/api/shared/notifications'),
          fetch('/api/auth/me')
        ]);

        if (notifRes.ok) {
          const data = await notifRes.json();
          setNotifications(data.notifications.slice(0, 3));
        }
        if (meRes.ok) {
          const data = await meRes.json();
          setEmployerData(data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-8 pb-32">
      <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="text-left">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <TrendingUp size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Workspace</span>
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
              {employerData?.profile?.companyName ? `${employerData.profile.companyName} HQ` : 'Command Center'}
            </h1>
            <p className="text-slate-500 mt-2 text-sm font-medium">Welcome back. Your recruitment machine is running efficiently.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/employer/jobs/create')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Post New Job</span>
            </button>
          </div>
        </header>

        {/* Recent Activity / Feed */}
        <div className="bg-[#0f172a]/30 border border-slate-800/50 rounded-[32px] overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-800/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              Recent Activity
            </h3>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              Latest 3
            </span>
          </div>
          <div className="p-8">
            {loading ? (
              <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
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
                      className="w-full flex items-start gap-4 p-5 rounded-2xl hover:bg-emerald-500/5 border border-transparent hover:border-emerald-500/20 transition-all group cursor-pointer text-left"
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center text-slate-500 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
                        {notif.type === 'application' ? <Briefcase size={20} /> : notif.type === 'message' ? <MessageSquare size={20} /> : <Calendar size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors capitalize">{notif.type} Update</h4>
                          <span className="text-[10px] text-slate-500 font-mono">{new Date(notif.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-1">{notif.message}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-700 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all mt-4 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
