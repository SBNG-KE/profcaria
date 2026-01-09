"use client"

import React, { useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    Home, FileText, Bell, Settings, ChevronLeft, ChevronRight,
    Briefcase, Users, Building2, Plus, Power, Menu, X
} from 'lucide-react';
import ImageCropper from '@/app/components/ImageCropper';
import { useNotificationContext } from '@/app/context/NotificationContext';

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

export default function EmployerLayoutContent({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false); // Default to closed
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const [employerData, setEmployerData] = useState<any>(null);
    const [applicationCount, setApplicationCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropSource, setCropSource] = useState<File | string | null>(null);

    // Consume Context
    const { unreadCount } = useNotificationContext();

    // Initialize sidebar state
    useEffect(() => {
        if (window.innerWidth >= 768) {
            setSidebarOpen(true);
        }
    }, []);

    const activeTab = pathname.split('/').pop() || 'home';
    const showBackButton = pathname !== '/employer/home' && !pathname.endsWith('/view');

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

    // Auto-close sidebar on mobile when navigating
    useEffect(() => {
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    }, [pathname]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setCropSource(e.target.files[0]);
        // setIsImageModalOpen(false); // Keep modal open behind cropper
    }

    const handleEditCurrent = () => {
        if (employerData?.profile?.logoUrl) {
            setCropSource(employerData.profile.logoUrl);
            // setIsImageModalOpen(false); // Keep modal open behind cropper
        }
    };

    const handleCropSave = async (blob: Blob) => {
        setIsUploading(true);
        setCropSource(null);

        const formData = new FormData();
        formData.append('file', blob, 'logo.jpg');

        try {
            const res = await fetch(`/api/employer/profile/image?filename=logo.jpg`, {
                method: 'POST',
                body: blob
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
    };

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

    // Applications polling logic moved here?
    // Actually, EmployerLayout also polled for `applications` to set `applicationCount`.
    // The previous code:
    // const appRes = await fetch('/api/employer/applications');
    // const activeApps = data.applications?.filter((app: any) => app.status === 'pending') || [];
    // setApplicationCount(activeApps.length);

    // This data is NOT in `useNotificationContext` yet! 
    // Wait, I added `applications` to context, but did NOT calculate `activeApps`.
    // `applications` in context is the full list. I can calculate locally.
    const { applications } = useNotificationContext();

    useEffect(() => {
        if (applications) {
            const activeApps = applications.filter((app: any) => app.status === 'pending') || [];
            setApplicationCount(activeApps.length);
        }
    }, [applications]);


    const NavItem = React.memo(({ id, href, icon: Icon, label, badgeCount }: any) => (
        <button
            onClick={() => router.push(href)}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative shrink-0 ${activeTab === id ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'} ${!sidebarOpen ? 'justify-center' : ''}`}
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



            {/* SIDEBAR BACKDROP (Mobile) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99] md:hidden animate-in fade-in duration-200"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`
                fixed md:relative inset-y-0 left-0 h-full
                flex flex-col border-r border-slate-800 bg-[#0f172a]/95 backdrop-blur-xl transition-all duration-300 ease-in-out z-[100]
                ${sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'}
            `}>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute -right-3 top-8 z-40 bg-slate-800 border border-slate-600 rounded-full p-1.5 text-slate-300 hover:text-white shadow-xl hidden md:flex"
                >
                    {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </button>

                {/* Mobile Close Button inside Sidebar */}
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute right-4 top-3 p-1.5 bg-slate-800/50 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors md:hidden border border-slate-700/50"
                >
                    <X size={16} />
                </button>

                <div className="flex flex-col items-center pt-8 px-4 shrink-0">
                    <button
                        onClick={() => setIsImageModalOpen(true)}
                        className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 shadow-2xl border border-emerald-700/50 transition-all duration-300 hover:scale-105 active:scale-95 ${sidebarOpen ? 'w-40 aspect-square mb-6' : 'w-12 h-12 mb-6'}`}
                    >
                        {employerData?.profile?.logoUrl ? (
                            <img src={employerData.profile.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-600">
                                <Building2 size={sidebarOpen ? 32 : 20} />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Plus className="text-white" size={sidebarOpen ? 24 : 16} />
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
                    <NavItem id="settings" href="/employer/settings" icon={Settings} label="Settings" />
                </ScrollableContainer>

                <div className="p-4 border-t border-slate-800 bg-[#0f172a] shrink-0">
                    <button
                        onClick={async () => {
                            await fetch('/api/auth/logout', { method: 'POST' });
                            router.push('/auth');
                        }}
                        className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative shrink-0 text-red-500 hover:bg-red-500/10 ${!sidebarOpen ? 'justify-center' : ''}`}
                    >
                        <Power size={22} />
                        {sidebarOpen && <span className="font-bold text-xs uppercase tracking-wider transition-all">Log Out</span>}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 relative h-full overflow-hidden flex flex-col">
                <div className={`w-full px-4 md:px-8 pt-6 pb-2 z-50 shrink-0 flex items-center justify-between sticky top-0 ${!showBackButton ? 'md:hidden' : ''}`}>
                    {/* MOBILE MENU ISLAND (In Flow) */}
                    <div className="md:hidden flex items-center gap-3 p-1.5 pr-4 bg-[#0f172a]/90 backdrop-blur-xl border border-slate-700/50 rounded-full shadow-lg">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 bg-slate-800 rounded-full text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition-all"
                        >
                            <Menu size={16} />
                        </button>
                        <span className="font-bold text-white text-sm tracking-tight pl-1">Profcaria</span>
                    </div>

                    {/* DESKTOP BACK BUTTON */}
                    {showBackButton && (
                        <button
                            onClick={() => router.back()}
                            className="hidden md:flex items-center gap-2 text-slate-400 hover:text-white transition-colors group w-fit"
                        >
                            <div className="p-2 rounded-full bg-slate-800/50 group-hover:bg-slate-800 transition-colors">
                                <ChevronLeft size={16} />
                            </div>
                            <span className="text-sm font-medium">Back</span>
                        </button>
                    )}
                </div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none z-0"></div>
                {pathname.includes('/notifications') || pathname.includes('/messages') ? (
                    <div className="w-full flex-1 min-h-0 relative z-10">{children}</div>
                ) : (
                    <ScrollableContainer className="w-full relative z-10">
                        {children}
                    </ScrollableContainer>
                )}
            </main>

            {/* LOGO IMAGE VIEW/EDIT MODAL - Polished Version */}
            {isImageModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsImageModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl aspect-square bg-[#0f172a] border border-slate-700/50 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col group">

                        {/* Image Area */}
                        <div className="flex-1 relative bg-slate-900/50 overflow-hidden">
                            {employerData?.profile?.logoUrl ? (
                                <img
                                    src={employerData.profile.logoUrl}
                                    alt="Company Logo Large"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-600">
                                    <Building2 size={100} />
                                    <p className="font-bold uppercase tracking-widest text-sm text-slate-500">No company logo</p>
                                </div>
                            )}
                            {/* Overlay Gradient for Text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-80"></div>
                        </div>

                        {/* Controls Bottom Bar */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 flex items-center justify-between gap-6 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/90 to-transparent">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50 hover:shadow-emerald-500/30 ring-1 ring-white/10"
                                >
                                    {isUploading ? 'Uploading...' : employerData?.profile?.logoUrl ? 'Replace Logo' : 'Upload Logo'}
                                </button>

                                {employerData?.profile?.logoUrl && (
                                    <>
                                        <button
                                            onClick={handleEditCurrent}
                                            className="px-6 py-4 bg-slate-800/80 hover:bg-slate-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg active:scale-95 backdrop-blur-sm border border-slate-700"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={handleImageDelete}
                                            className="px-6 py-4 bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-red-500/20 transition-all active:scale-95 backdrop-blur-sm"
                                        >
                                            Remove
                                        </button>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={() => setIsImageModalOpen(false)}
                                className="px-6 py-4 text-slate-400 hover:text-white font-black uppercase tracking-widest text-xs transition-colors"
                            >
                                Close
                            </button>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
                </div>
            )}

            {/* CROPPER OVERLAY */}
            {cropSource && (
                <ImageCropper
                    imageOrUrl={cropSource}
                    onCrop={handleCropSave}
                    onCancel={() => setCropSource(null)}
                />
            )}
        </div>
    );
}
