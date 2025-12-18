"use client"

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    Home, Search, FileText, Bell, Settings, ChevronLeft, ChevronRight,
    Briefcase, Users, MessageSquare, Zap, Database, Send, Calendar
} from 'lucide-react';

// --- Scroll Helpers ---
const ScrollableContainer = ({ children, className = "" }: { children: ReactNode, className?: string }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [showScrollbar, setShowScrollbar] = useState(false);

    const handleScroll = () => {
        const element = scrollRef.current;
        if (!element) return;
        const { scrollTop, scrollHeight, clientHeight } = element;
        if (scrollHeight <= clientHeight) {
            setShowScrollbar(false);
            return;
        }
        setShowScrollbar(true);
        const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
        setScrollProgress(scrollPercentage);
    };

    useEffect(() => {
        handleScroll();
        window.addEventListener('resize', handleScroll);
        return () => window.removeEventListener('resize', handleScroll);
    }, [children]);

    return (
        <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className={`flex-1 overflow-y-auto scrollbar-hide ${className}`}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {children}
            </div>
            {showScrollbar && (
                <div className="absolute right-1 top-2 bottom-2 w-1 pointer-events-none z-50">
                    <div
                        className="absolute right-0 w-full transition-all duration-75 ease-out flex flex-col gap-[2px] items-center"
                        style={{ top: `calc(${scrollProgress * 100}% - ${scrollProgress * 24}px)` }}
                    >
                        <div className="w-1 h-1 bg-emerald-500/50 rounded-full shadow-sm"></div>
                        <div className="w-1 h-1 bg-emerald-500/70 rounded-full shadow-sm"></div>
                        <div className="w-1 h-1 bg-emerald-500/90 rounded-full shadow-sm"></div>
                        <div className="w-1 h-1 bg-emerald-500/50 rounded-full shadow-sm"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();
    const router = useRouter();
    const [employerData, setEmployerData] = useState<any>(null);

    const activeTab = pathname.split('/').pop() || 'home';

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setEmployerData(data);
                }
            } catch (error) {
                console.error("Layout fetch me error", error);
            }
        };
        fetchMe();
    }, []);

    const NavItem = ({ id, href, icon: Icon, label, badgeCount }: any) => (
        <button
            onClick={() => router.push(href)}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative shrink-0 ${activeTab === id ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'} ${!sidebarOpen ? 'justify-center' : ''}`}
        >
            <div className="relative">
                <Icon size={22} className={activeTab === id ? 'animate-pulse' : ''} />
                {badgeCount && <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-[#0f172a]">{badgeCount}</span>}
            </div>
            {sidebarOpen && <span className="font-medium text-sm transition-all">{label}</span>}
        </button>
    );

    return (
        <div className="flex h-screen bg-[#050b14] text-slate-200 font-sans overflow-hidden selection:bg-emerald-500/30">

            {/* SIDEBAR */}
            <aside className={`relative flex flex-col border-r border-slate-800 bg-[#0f172a]/80 backdrop-blur-xl transition-all duration-300 ease-in-out z-30 ${sidebarOpen ? 'w-72' : 'w-24'}`}>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute -right-3 top-8 z-40 bg-slate-800 border border-slate-600 rounded-full p-1.5 text-slate-300 hover:text-white shadow-xl">
                    {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </button>

                <div className="flex flex-col items-center pt-8 px-4 shrink-0">
                    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 shadow-2xl border border-emerald-700/50 transition-all duration-300 ${sidebarOpen ? 'w-full aspect-square mb-4' : 'w-14 h-14 mb-6'}`}>
                        {employerData?.profile?.logoUrl ? (
                            <img src={employerData.profile.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-600"><span className="text-xs tracking-widest uppercase font-bold">Logo</span></div>
                        )}
                    </div>
                    {sidebarOpen && (
                        <div className="w-full animate-in fade-in duration-300 space-y-4 mb-6">
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-white tracking-tight leading-tight">
                                    {employerData?.profile?.companyName || 'Loading...'}
                                </h2>
                                <p className="text-xs text-emerald-400 font-medium">Enterprise Workspace</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 w-full">
                                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                                    <span className="text-2xl font-bold text-emerald-400">12</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Active</span>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                                    <span className="text-2xl font-bold text-blue-400">48</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Apps</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <ScrollableContainer className="px-4 space-y-2 pb-4">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 mt-2 px-2">Management</div>
                    <NavItem id="home" href="/employer/home" icon={Home} label="Dashboard" />
                    <NavItem id="jobs" href="/employer/jobs" icon={Briefcase} label="Post Jobs" />
                    <NavItem id="applications" href="/employer/applications" icon={FileText} label="Applications" badgeCount={12} />
                    <NavItem id="interviews" href="/employer/interviews" icon={Calendar} label="Interviews" />

                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 mt-6 px-2">Network</div>
                    <NavItem id="connections" href="/employer/connections" icon={Users} label="Connections" />
                    <NavItem id="messages" href="/employer/messages" icon={Send} label="Notifications" />

                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 mt-6 px-2">System</div>
                    <NavItem id="backups" href="/employer/backups" icon={Database} label="Backups" />
                </ScrollableContainer>

                <div className="p-4 border-t border-slate-800 bg-[#0f172a] shrink-0">
                    <NavItem id="settings" href="/employer/settings" icon={Settings} label="Settings" />
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 relative flex flex-col h-full overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none z-0"></div>
                {children}
            </main>
        </div>
    );
}
