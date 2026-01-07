"use client"

import React, { useState, useRef, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    Home, Search, FileText, Bell, Settings, ChevronLeft, ChevronRight,
    Briefcase, UserCircle, Video, Cable, Plus, Power
} from 'lucide-react';
import ImageCropper from '@/app/components/ImageCropper';

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
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                        <div className="w-1 h-1 bg-blue-500/80 rounded-full shadow-sm"></div>
                        <div className="w-1 h-1 bg-blue-500/60 rounded-full shadow-sm"></div>
                        <div className="w-1 h-1 bg-blue-500/40 rounded-full shadow-sm"></div>
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function ProfessionalLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [jobStats, setJobStats] = useState({ totalJobs: 0, currentJob: 'None' });
    const pathname = usePathname();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [cropSource, setCropSource] = useState<File | string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    setUserData(data);
                }
            } catch (error) {
                console.error("Error fetching user", error);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        const fetchJobStats = async () => {
            try {
                // Fetch all applications to count total jobs connected
                const [connectionsRes, appsRes] = await Promise.all([
                    fetch('/api/professional/connections'),
                    fetch('/api/professional/applications')
                ]);

                let totalJobs = 0;
                let currentJob = 'None';

                if (connectionsRes.ok) {
                    const data = await connectionsRes.json();
                    const connections = data.connections || [];
                    totalJobs = connections.length;
                    // Current job is the most recent accepted connection
                    if (connections.length > 0) {
                        currentJob = connections[0].job?.title || connections[0].company?.name || 'Connected';
                    }
                }

                // Also count applications for total jobs interacted with
                if (appsRes.ok) {
                    const data = await appsRes.json();
                    const apps = data.applications || [];
                    // Total jobs = connections only (Roles)
                    // totalJobs remains as connections.length
                }

                setJobStats({ totalJobs, currentJob });
            } catch (error) {
                console.error("Error fetching job stats", error);
            }
        };
        fetchJobStats();
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setCropSource(e.target.files[0]);
        // Close main modal to focus on cropper
        setIsImageModalOpen(false);
    };

    const handleEditCurrent = () => {
        if (userData?.profile?.profileImageUrl) {
            setCropSource(userData.profile.profileImageUrl);
            setIsImageModalOpen(false);
        }
    };

    const handleCropSave = async (blob: Blob) => {
        setIsUploading(true);
        setCropSource(null); // Close cropper

        const formData = new FormData();
        formData.append('file', blob, 'profile-image.jpg');

        try {
            const res = await fetch(`/api/professional/profile/image?filename=profile.jpg`, {
                method: 'POST',
                body: blob
            });
            if (res.ok) {
                const { url } = await res.json();
                setUserData((prev: any) => ({
                    ...prev,
                    profile: { ...prev.profile, profileImageUrl: url }
                }));
            }
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageDelete = useCallback(async () => {
        if (!confirm("Are you sure you want to remove your profile photo?")) return;
        try {
            const res = await fetch('/api/professional/profile/image', { method: 'DELETE' });
            if (res.ok) {
                setUserData((prev: any) => ({
                    ...prev,
                    profile: { ...prev.profile, profileImageUrl: null }
                }));
            }
        } catch (error) {
            console.error("Delete failed", error);
        }
    }, []);

    const activeTab = pathname.split('/').pop() || 'home';
    const showBackButton = pathname !== '/professional/home';


    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUnread = async () => {
            // ... notification logic
            try {
                const res = await fetch('/api/shared/notifications');
                if (res.ok) {
                    const data = await res.json();
                    const count = data.notifications.filter((n: any) => !n.is_read).length;
                    setUnreadCount(count);
                }
            } catch (err) { console.error(err); }
        };
        fetchUnread();
        const interval = setInterval(fetchUnread, 2000);
        return () => clearInterval(interval);
    }, []);

    const NavItem = React.memo(({ id, href, icon: Icon, label, badgeCount }: any) => (
        <button
            onClick={() => router.push(href)}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative shrink-0 ${activeTab === id ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'} ${!sidebarOpen ? 'justify-center' : ''}`}
        >
            <div className="relative">
                <Icon size={22} className={activeTab === id ? 'animate-pulse' : ''} />
                {(badgeCount || (id === 'notifications' && unreadCount > 0)) && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white border-2 border-[#0f172a] animate-bounce shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                        {id === 'notifications' ? unreadCount : badgeCount}
                    </span>
                )}
            </div>
            {sidebarOpen && <span className="font-medium text-sm transition-all">{label}</span>}
        </button>
    ));

    return (
        <div className="flex h-screen bg-[#050b14] text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30 theme-professional">

            {/* SIDEBAR */}
            <aside className={`relative flex flex-col border-r border-slate-800 bg-[#0f172a]/80 backdrop-blur-xl transition-all duration-300 ease-in-out z-30 ${sidebarOpen ? 'w-72' : 'w-24'}`}>
                {/* ... existing sidebar content ... */}
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute -right-3 top-8 z-40 bg-slate-800 border border-slate-600 rounded-full p-1.5 text-slate-300 hover:text-white shadow-xl">
                    {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </button>

                <div className="flex flex-col items-center pt-8 px-4 shrink-0">
                    <button
                        onClick={() => setIsImageModalOpen(true)}
                        className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 shadow-2xl border border-slate-700 transition-all duration-300 hover:scale-105 active:scale-95 ${sidebarOpen ? 'w-32 aspect-square mb-4' : 'w-12 h-12 mb-6'}`}
                    >
                        {userData?.profile?.profileImageUrl ? (
                            <img src={userData.profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-600">
                                <UserCircle size={sidebarOpen ? 48 : 24} />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Plus className="text-white" size={sidebarOpen ? 24 : 16} />
                        </div>
                    </button>
                    {sidebarOpen && (
                        <div className="w-full animate-in fade-in duration-300 space-y-4 mb-6">
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-white tracking-tight">
                                    {userData?.profile?.firstName ? `${userData.profile.firstName} ${userData.profile.lastName}` : 'Loading...'}
                                </h2>
                                <p className="text-xs text-blue-400 font-medium">{userData?.profile?.role || '---'}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-2 w-full">
                                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                                    <span className="text-2xl font-bold text-blue-400">{jobStats.totalJobs}</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total Jobs</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <ScrollableContainer className="px-4 space-y-2 pb-4">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 mt-2 px-2">Menu</div>
                    <NavItem id="home" href="/professional/home" icon={Home} label="Home" />
                    <NavItem id="find" href="/professional/find" icon={Search} label="Find Work" />
                    <NavItem id="roles-jobs" href="/professional/roles-jobs" icon={Briefcase} label="Role & Jobs" />
                    <NavItem id="connect" href="/professional/connect" icon={Cable} label="Connections" />

                    <NavItem id="notifications" href="/professional/notifications" icon={Bell} label="Notifications" badgeCount={unreadCount} />
                    <NavItem id="settings" href="/professional/settings" icon={Settings} label="Settings" />
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
            <main className="flex-1 relative flex flex-col h-full overflow-hidden">
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

            {/* PROFILE IMAGE VIEW/EDIT MODAL */}
            {isImageModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsImageModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl aspect-square bg-[#0f172a] border border-slate-700 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col items-center justify-center group">
                        {userData?.profile?.profileImageUrl ? (
                            <img
                                src={userData.profile.profileImageUrl}
                                alt="Profile Large"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-slate-600">
                                <UserCircle size={120} />
                                <p className="font-bold uppercase tracking-widest text-sm text-slate-400">No profile photo</p>
                            </div>
                        )}

                        <div className="absolute bottom-8 left-8 right-8 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex-1 py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                            >
                                {isUploading ? 'Uploading...' : userData?.profile?.profileImageUrl ? 'Replace Photo' : 'Add Photo'}
                            </button>

                            {userData?.profile?.profileImageUrl && (
                                <button
                                    onClick={handleEditCurrent}
                                    className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl active:scale-95"
                                >
                                    Edit
                                </button>
                            )}

                            {userData?.profile?.profileImageUrl && (
                                <button
                                    onClick={handleImageDelete}
                                    className="px-6 py-4 bg-red-600/10 border border-red-500/20 text-red-500 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-red-500/20 transition-all active:scale-95"
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
