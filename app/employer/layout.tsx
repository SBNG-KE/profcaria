"use client"

import React, { useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    Home, FileText, Bell, Settings, ChevronLeft, ChevronRight,
    Briefcase, Users, Database, Calendar, Building2, Plus, Shield
} from 'lucide-react';

// --- Scroll Helpers ---
const ScrollableContainer = ({ children, className = "" }: { children: ReactNode, className?: string }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [showScrollbar, setShowScrollbar] = useState(false);

    const handleScroll = () => {
        const element = scrollRef.current;
        if (!element) return;
        const { scrollTop, scrollHeight, clientHeight } = element;

        const needsScroll = scrollHeight > clientHeight + 1;
        if (needsScroll !== showScrollbar) {
            setShowScrollbar(needsScroll);
        }

        if (needsScroll) {
            const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
            setScrollProgress(scrollPercentage);
        }
    };

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        const resizeObserver = new ResizeObserver(() => {
            handleScroll();
        });

        resizeObserver.observe(element);
        handleScroll();
        window.addEventListener('resize', handleScroll);
        return () => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    useEffect(() => {
        handleScroll();
    }, [children]);

    return (
        <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col w-full h-full">
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className={`flex-1 overflow-y-auto scrollbar-hide ${className}`}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <div ref={contentRef}>
                    {children}
                </div>
            </div>
            {showScrollbar && (
                <div className="absolute right-1.5 top-4 bottom-4 w-1.5 pointer-events-none z-50 flex flex-col justify-start">
                    <div
                        className="absolute right-0 w-full transition-all duration-75 ease-out flex flex-col gap-[3px] items-center"
                        style={{ top: `calc(${scrollProgress * 100}% - ${scrollProgress * 40}px)` }}
                    >
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                        <div className="w-1 h-1 bg-emerald-500/80 rounded-full shadow-sm"></div>
                        <div className="w-1 h-1 bg-emerald-500/60 rounded-full shadow-sm"></div>
                        <div className="w-1 h-1 bg-emerald-500/40 rounded-full shadow-sm"></div>
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const [employerData, setEmployerData] = useState<any>(null);
    const [applicationCount, setApplicationCount] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeTab = pathname.split('/').pop() || 'home';
    const showBackButton = pathname !== '/employer/home';

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

    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setIsUploading(true);

        try {
            const res = await fetch(`/api/employer/profile/image?filename=${file.name}`, {
                method: 'POST',
                body: file
            });
            if (res.ok) {
                const { url } = await res.json();
                setEmployerData((prev: any) => ({
                    ...prev,
                    profile: { ...prev.profile, logoUrl: url }
                }));
            }
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsUploading(false);
        }
    }, []);

    const handleImageDelete = useCallback(async () => {
        if (!confirm("Are you sure you want to remove your company logo?")) return;
        try {
            const res = await fetch('/api/employer/profile/image', { method: 'DELETE' });
            if (res.ok) {
                setEmployerData((prev: any) => ({
                    ...prev,
                    profile: { ...prev.profile, logoUrl: null }
                }));
            }
        } catch (error) {
            console.error("Delete failed", error);
        }
    }, []);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                // Fetch notifications count
                const notifRes = await fetch('/api/shared/notifications');
                if (notifRes.ok) {
                    const data = await notifRes.json();
                    const count = data.notifications.filter((n: any) => !n.is_read).length;
                    setUnreadCount(count); // If 0, it will display 0 in blue (handled in NavItem)
                }

                // Fetch applications count
                const appRes = await fetch('/api/employer/applications');
                if (appRes.ok) {
                    const data = await appRes.json();
                    // Only count applications that are 'pending' (unread/actionable)
                    const activeApps = data.applications?.filter((app: any) => app.status === 'pending') || [];
                    setApplicationCount(activeApps.length);
                }
            } catch (err) { console.error(err); }
        };
        fetchCounts();
        const interval = setInterval(fetchCounts, 30000); // 30s poll to reduce load
        return () => clearInterval(interval);
    }, []);

    const NavItem = React.memo(({ id, href, icon: Icon, label, badgeCount }: any) => (
        <button
            onClick={() => router.push(href)}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative shrink-0 ${activeTab === id || (id === 'home' && activeTab === 'notifications') ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'} ${!sidebarOpen ? 'justify-center' : ''}`}
        >
            <div className="relative">
                <Icon size={22} className={activeTab === id ? 'animate-pulse' : ''} />
                {badgeCount > 0 && (
                    <span className={`absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full text-[10px] font-bold text-white border-2 border-[#0f172a] shadow-lg ${id === 'notifications'
                        ? (badgeCount > 0 ? 'bg-red-500 shadow-red-500/50' : 'bg-blue-500 shadow-blue-500/50')
                        : 'bg-emerald-500 shadow-emerald-500/50'
                        }`}>
                        {badgeCount}
                    </span>
                )}
            </div>
            {sidebarOpen && <span className="font-medium text-xs transition-all">{label}</span>}
        </button>
    ));

    return (
        <div className="flex h-screen bg-[#050b14] text-slate-200 font-sans overflow-hidden selection:bg-emerald-500/30 theme-employer">

            {/* SIDEBAR */}
            <aside className={`relative flex flex-col border-r border-slate-800 bg-[#0f172a]/80 backdrop-blur-xl transition-all duration-300 ease-in-out z-30 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute -right-3 top-8 z-40 bg-slate-800 border border-slate-600 rounded-full p-1.5 text-slate-300 hover:text-white shadow-xl">
                    {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </button>

                <div className="flex flex-col items-center pt-8 px-4 shrink-0">
                    <button
                        onClick={() => setIsImageModalOpen(true)}
                        className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 shadow-2xl border border-emerald-700/50 transition-all duration-300 hover:scale-105 active:scale-95 ${sidebarOpen ? 'w-full aspect-square mb-4' : 'w-14 h-14 mb-6'}`}
                    >
                        {employerData?.profile?.logoUrl ? (
                            <img src={employerData.profile.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-600">
                                <Building2 size={sidebarOpen ? 32 : 20} />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Plus className="text-white" size={sidebarOpen ? 32 : 16} />
                        </div>
                    </button>
                    {sidebarOpen && (
                        <div className="w-full animate-in fade-in duration-300 mb-6">
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-white tracking-tight leading-tight">
                                    {employerData?.profile?.companyName || 'Loading...'}
                                </h2>
                                <p className="text-xs text-emerald-400 font-medium">Enterprise Workspace</p>
                            </div>
                        </div>
                    )}
                </div>

                <ScrollableContainer className="px-4 space-y-2 pb-4">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 mt-2 px-2">Management</div>
                    <NavItem id="home" href="/employer/home" icon={Home} label="Dashboard" />
                    <NavItem id="jobs" href="/employer/jobs" icon={Briefcase} label="Jobs" />

                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 mt-6 px-2">Network</div>
                    <NavItem id="connections" href="/employer/connections" icon={Users} label="Connections" />

                    <NavItem id="notifications" href="/employer/notifications" icon={Bell} label="Notifications" badgeCount={unreadCount} />
                </ScrollableContainer>

                <div className="p-4 border-t border-slate-800 bg-[#0f172a] shrink-0">
                    <NavItem id="settings" href="/employer/settings" icon={Settings} label="Settings" />
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 relative h-full overflow-hidden flex flex-col">
                {showBackButton && (
                    <div className="absolute top-6 left-8 z-50">
                        <button
                            onClick={() => router.back()}
                            className="bg-slate-900/50 hover:bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-white p-2.5 rounded-xl backdrop-blur-md transition-all active:scale-95 shadow-lg group flex items-center gap-2"
                        >
                            <ChevronLeft size={18} />
                            <span className="text-xs font-bold uppercase tracking-widest max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">Back</span>
                        </button>
                    </div>
                )}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none z-0"></div>
                {pathname.includes('/notifications') || pathname.includes('/messages') ? (
                    <div className="w-full h-full relative z-10">{children}</div>
                ) : (
                    <ScrollableContainer className="w-full relative z-10">
                        {children}
                    </ScrollableContainer>
                )}
            </main>

            {/* LOGO IMAGE VIEW/EDIT MODAL */}
            {isImageModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsImageModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl aspect-square bg-[#0f172a] border border-slate-700 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col items-center justify-center group">
                        {employerData?.profile?.logoUrl ? (
                            <img
                                src={employerData.profile.logoUrl}
                                alt="Company Logo Large"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-slate-600">
                                <Building2 size={120} />
                                <p className="font-bold uppercase tracking-widest text-sm text-slate-400">No company logo</p>
                            </div>
                        )}

                        <div className="absolute bottom-8 left-8 right-8 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex-1 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                            >
                                {isUploading ? 'Uploading...' : employerData?.profile?.logoUrl ? 'Edit Logo' : 'Add Logo'}
                            </button>
                            {employerData?.profile?.logoUrl && (
                                <button
                                    onClick={handleImageDelete}
                                    className="flex-1 py-4 bg-red-600/10 border border-red-500/20 text-red-500 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-red-500/20 transition-all active:scale-95"
                                >
                                    Remove
                                </button>
                            )}
                            <button
                                onClick={() => setIsImageModalOpen(false)}
                                className="px-6 py-4 bg-slate-800 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-700 transition-all active:scale-95"
                            >
                                Close
                            </button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
