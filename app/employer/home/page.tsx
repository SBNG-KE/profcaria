"use client"

import React, { useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase, FileText, Calendar, Send, Users, Database, Plus, ChevronRight,
  TrendingUp, UserCheck, MessageSquare, Clock
} from 'lucide-react';

// --- Components ---
const ActionCard = ({ icon: Icon, title, subtitle, color = "emerald", isActive = false, onClick }: any) => {
  const colorStyles = {
    blue: "from-blue-600/20 to-blue-900/20 border-blue-500/30 text-blue-400",
    emerald: "from-emerald-600/20 to-emerald-900/20 border-emerald-500/30 text-emerald-400",
    violet: "from-violet-600/20 to-violet-900/20 border-violet-500/30 text-violet-400",
    amber: "from-amber-600/20 to-amber-900/20 border-amber-500/30 text-amber-400",
  };
  return (
    <button onClick={onClick} className={`relative group flex flex-col items-start justify-between p-6 h-44 w-full rounded-3xl border bg-gradient-to-br transition-all duration-500 ${isActive ? 'scale-[1.02] shadow-2xl ring-1 ring-offset-1 ring-offset-[#050b14] ring-emerald-500/50' : 'hover:scale-[1.02] hover:shadow-2xl hover:border-emerald-500/50'} ${colorStyles[color as keyof typeof colorStyles]}`}>
      <div className={`p-3 rounded-2xl bg-[#050b14]/80 shadow-inner text-current border border-white/5 transition-transform duration-500 group-hover:rotate-12`}><Icon size={28} /></div>
      <div className="text-left">
        <h3 className="text-lg font-bold text-slate-100 group-hover:text-white transition-colors">{title}</h3>
        <p className="text-xs text-slate-500 font-medium group-hover:text-slate-400">{subtitle}</p>
      </div>
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="p-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
          <Plus size={14} className="text-slate-400" />
        </div>
      </div>
    </button>
  );
};

const StatCard = ({ label, value, trend, icon: Icon }: any) => (
  <div className="bg-[#0f172a]/50 border border-slate-800 p-5 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-all group">
    <div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black text-white">{value}</span>
        {trend && <span className="text-[10px] font-bold text-emerald-400">{trend}</span>}
      </div>
    </div>
    <div className="p-3 bg-slate-800/50 rounded-xl text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-all">
      <Icon size={20} />
    </div>
  </div>
);

export default function EmployerHome() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [employerData, setEmployerData] = useState<any>(null);
  const [stats, setStats] = useState<any>({ totalJobs: 0, totalApplications: 0, shortlisted: 0, responseRate: '0%', avgTime: '---' });
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [notifRes, meRes, statsRes] = await Promise.all([
          fetch('/api/shared/notifications'),
          fetch('/api/auth/me'),
          fetch('/api/employer/stats')
        ]);

        if (notifRes.ok) {
          const data = await notifRes.json();
          setNotifications(data.notifications.slice(0, 5));
        }
        if (meRes.ok) {
          const data = await meRes.json();
          setEmployerData(data);
        }
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data.stats);
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
    <div className="p-8 h-full flex flex-col">
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
            <button className="px-5 py-2.5 bg-slate-800/50 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700/50 transition-all active:scale-95">Analytics</button>
            <button
              onClick={() => router.push('/employer/jobs/create')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus size={16} />
              <span>Post New Job</span>
            </button>
          </div>
        </header>

        {/* Quick Stats (Static for now as requested to focus on flow) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Jobs" value={stats.totalJobs} icon={Briefcase} />
          <StatCard label="Applications" value={stats.totalApplications} icon={Users} />
          <StatCard label="Shortlisted" value={stats.shortlisted} icon={UserCheck} />
          <StatCard label="Response Rate" value={stats.responseRate} icon={MessageSquare} />
        </div>

        {/* Main Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <ActionCard
            icon={Briefcase}
            title="Job Management"
            subtitle="Create & Manage Postings"
            color="emerald"
            onClick={() => router.push('/employer/jobs')}
          />
          <ActionCard
            icon={FileText}
            title="Applications"
            subtitle="Review Candidates & Status"
            color="blue"
            onClick={() => router.push('/employer/applications')}
          />
          <ActionCard
            icon={Calendar}
            title="Interview Desk"
            subtitle="Schedule & Feedback"
            color="violet"
            onClick={() => router.push('/employer/interviews')}
          />
          <ActionCard
            icon={Users}
            title="Talent Network"
            subtitle="Browse Connections"
            color="amber"
            onClick={() => router.push('/employer/connections')}
          />
          <ActionCard
            icon={Send}
            title="Outbound"
            subtitle="Broadcast Notifications"
            color="emerald"
            onClick={() => router.push('/employer/messages')}
          />
          <ActionCard
            icon={Database}
            title="Vault Backup"
            subtitle="Export Data Architecture"
            color="blue"
            onClick={() => router.push('/employer/backups')}
          />
        </div>

        {/* Bottom Section: Recent Activity / Feed */}
        <div className="bg-[#0f172a]/30 border border-slate-800/50 rounded-[32px] overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-800/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              Recent Activity
            </h3>
            <button className="text-[10px] font-bold text-slate-500 hover:text-emerald-400 transition-colors uppercase tracking-widest flex items-center gap-1">
              View All <ChevronRight size={12} />
            </button>
          </div>
          <div className="p-8">
            {loading ? (
              <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : notifications.length === 0 ? (
              <p className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center py-10">No recent activity found</p>
            ) : (
              <div className="space-y-6">
                {notifications.map((notif) => (
                  <div key={notif.id} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all group">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex-shrink-0 flex items-center justify-center text-slate-500">
                      {notif.type === 'application' ? <Briefcase size={20} /> : <Calendar size={20} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors capitalize">{notif.type} Link Established</h4>
                        <span className="text-[10px] text-slate-500 font-mono">{new Date(notif.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
