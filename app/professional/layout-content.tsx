"use client"

import React, { useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    Home, Search, Bell, Settings, ChevronLeft, ChevronRight,
    Briefcase, UserCircle, Cable, Plus, Power, Menu, X, HelpCircle
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

export default function ProfessionalLayoutContent({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false); // Default to closed (mobile first)
    const [userData, setUserData] = useState<any>(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [jobStats, setJobStats] = useState({ totalJobs: 0, currentJob: 'None' });
    const pathname = usePathname();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropSource, setCropSource] = useState<File | string | null>(null);

    // Consume Context
    const { unreadCount } = useNotificationContext();

    // Initialize sidebar state based on screen size
    useEffect(() => {
        if (window.innerWidth >= 768) {
            setSidebarOpen(true);
        }
    }, []);

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
                setJobStats({ totalJobs, currentJob });
            } catch (error) {
                console.error("Error fetching job stats", error);
            }
        };
        fetchJobStats();
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
        // Keep main modal open so we return to it on cancel
    };

    const handleEditCurrent = () => {
        if (userData?.profile?.profileImageUrl) {
            setCropSource(userData.profile.profileImageUrl);
            // Keep main modal open so we return to it on cancel
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

    const NavItem = React.memo(({ id, href, icon: Icon, label, badgeCount }: any) => (
        <button
            onClick={() => router.push(href)}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative shrink-0 ${activeTab === id ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'} ${!sidebarOpen ? 'justify-center' : ''}`}
        >
            <div className="relative">
                <Icon size={22} className={activeTab === id ? 'animate-pulse' : ''} />
                {(badgeCount > 0 || (id === 'notifications' && unreadCount > 0)) && (
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
                ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0 md:w-24'}
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
                        className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 shadow-2xl border border-slate-700 transition-all duration-300 hover:scale-105 active:scale-95 ${sidebarOpen ? 'w-40 aspect-square mb-6' : 'w-12 h-12 mb-6'}`}
                    >
                        {userData?.profile?.profileImageUrl ? (
                            <img src={userData.profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-600">
                                <UserCircle size={sidebarOpen ? 40 : 24} />
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

                    <NavItem id="notifications" href="/professional/notifications" icon={Bell} label="Notifications" />
                    <NavItem id="settings" href="/professional/settings" icon={Settings} label="Settings" />
                    <NavItem id="support" href="/professional/support" icon={HelpCircle} label="Support" />
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
                    <div className="w-full flex-1 min-h-0 relative">{children}</div>
                ) : (
                    <ScrollableContainer className="w-full relative">
                        {children}
                    </ScrollableContainer>
                )}
            </main>

            {/* PROFILE IMAGE VIEW/EDIT MODAL */}
            {isImageModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsImageModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl aspect-square bg-[#0f172a] border border-slate-700/50 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col group">

                        {/* Image Area */}
                        <div className="flex-1 relative bg-slate-900/50 overflow-hidden">
                            {userData?.profile?.profileImageUrl ? (
                                <img
                                    src={userData.profile.profileImageUrl}
                                    alt="Profile Large"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-600">
                                    <UserCircle size={100} />
                                    <p className="font-bold uppercase tracking-widest text-sm text-slate-500">No profile photo</p>
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
                                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 hover:shadow-blue-500/30 ring-1 ring-white/10"
                                >
                                    {isUploading ? 'Uploading...' : userData?.profile?.profileImageUrl ? 'Replace Photo' : 'Upload Photo'}
                                </button>

                                {userData?.profile?.profileImageUrl && (
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
