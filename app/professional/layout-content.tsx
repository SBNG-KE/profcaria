"use client"

import React, { useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    Home, Search, Bell, Settings, ChevronLeft, ChevronRight,
    Briefcase, UserCircle, Cable, Plus, Power, Menu, X, HelpCircle, Rss, Users, MessageCircle, Shield, BadgeCheck, Trophy, Sparkles
} from 'lucide-react';
import ImageCropper from '@/app/components/ImageCropper';
import { useNotificationContext } from '@/app/context/NotificationContext';
import { useTheme } from '@/app/context/ThemeContext';
import AlertsSidebar from '@/app/components/professional/AlertsSidebar';
import ThemeToggle from '@/app/components/ThemeToggle';
import GlobalSearch from '@/app/components/shared/GlobalSearch';

export default function ProfessionalLayoutContent({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showAlertsMobile, setShowAlertsMobile] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [jobStats, setJobStats] = useState({ totalJobs: 0, currentJob: 'None' });
    const [followBackCount, setFollowBackCount] = useState(0);
    const pathname = usePathname();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropSource, setCropSource] = useState<File | string | null>(null);

    // Theme
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

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
                const [connectionsRes, followBackRes] = await Promise.all([
                    fetch('/api/professional/connections'),
                    fetch('/api/professional/follow/count'),
                ]);

                let totalJobs = 0;

                if (connectionsRes.ok) {
                    const data = await connectionsRes.json();
                    const connections = data.connections || [];
                    totalJobs = connections.length;
                }
                setJobStats({ totalJobs, currentJob: 'None' });

                if (followBackRes.ok) {
                    const fbData = await followBackRes.json();
                    setFollowBackCount(fbData.count || 0);
                }
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
    };

    const handleEditCurrent = () => {
        if (userData?.profile?.profileImageUrl) {
            setCropSource(userData.profile.profileImageUrl);
        }
    };

    const handleCropSave = async (blob: Blob) => {
        setIsUploading(true);
        setCropSource(null);

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
    const showBackButton = pathname !== '/professional/feed';

    const [hasNewPosts, setHasNewPosts] = useState(false);

    // Simulate checking for new posts
    useEffect(() => {
        const checkNewPosts = () => {
            // In a real app, this would check a timestamp or count from the server
            // For now, we'll simulate "new posts" appearing occasionally
            if (Math.random() > 0.7) {
                setHasNewPosts(true);
            }
        };

        const interval = setInterval(checkNewPosts, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const handleFeedClick = () => {
        if (hasNewPosts) {
            setHasNewPosts(false);
            if (pathname === '/professional/feed') {
                window.location.reload(); // Force reload if already on feed
            } else {
                router.push('/professional/feed');
            }
        } else {
            router.push('/professional/feed');
        }
    };

    // Compact NavItem
    const NavItem = React.memo(({ id, href, icon: Icon, label, badgeCount, comingSoon, hasUpdate, onClick }: { id: string; href: string; icon: React.ElementType; label: string; badgeCount?: number; comingSoon?: boolean, hasUpdate?: boolean, onClick?: () => void }) => (
        <button
            onClick={() => {
                if (onClick) onClick();
                else if (!comingSoon) router.push(href);
            }}
            className={`
                w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 group relative
                ${activeTab === id
                    ? (isDark ? 'bg-white/10 text-white' : 'bg-black/10 text-black')
                    : (isDark ? 'text-neutral-400 hover:bg-white/5 hover:text-white' : 'text-neutral-500 hover:bg-black/5 hover:text-black')}
                ${!sidebarOpen ? 'justify-center' : ''}
                ${comingSoon ? 'cursor-default opacity-70' : ''}
            `}
        >
            <div className="relative">
                <Icon size={18} />
                {comingSoon && (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 text-[6px] font-bold text-white">✨</span>
                )}
                {(badgeCount && badgeCount > 0) || (id === 'notifications' && unreadCount > 0) ? (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                        {id === 'notifications' ? unreadCount : badgeCount}
                    </span>
                ) : hasUpdate ? (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-blue-500 ring-2 ring-white dark:ring-black"></span>
                ) : null}
            </div>
            {sidebarOpen && (
                <span className="font-medium text-xs flex items-center gap-2 flex-1">
                    {label}
                    {comingSoon && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold uppercase">Soon</span>}
                    {hasUpdate && <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-bold uppercase">New</span>}
                </span>
            )}
        </button>
    ));

    return (
        <div className={`professional-scope flex h-screen font-sans overflow-hidden transition-colors duration-300 ${isDark ? 'bg-black text-neutral-200 selection:bg-white/30' : 'bg-neutral-50 text-neutral-900 selection:bg-black/20'}`}>

            {/* SIDEBAR BACKDROP (Mobile) */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR - COMPACT */}
            <aside className={`
                fixed md:relative inset-y-0 left-0 h-full
                flex flex-col border-r transition-all duration-300 ease-in-out z-[100]
                ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}
                ${sidebarOpen ? 'translate-x-0 w-56' : '-translate-x-full md:translate-x-0 md:w-16'}
            `}>
                {/* Toggle Button */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={`absolute -right-3 top-6 z-40 rounded-full p-1 hidden md:flex border ${isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white' : 'bg-white border-neutral-200 text-neutral-400 hover:text-black shadow-sm'}`}
                >
                    {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
                </button>

                {/* Mobile Close */}
                <button
                    onClick={() => setSidebarOpen(false)}
                    className={`absolute right-3 top-3 p-1.5 rounded-full md:hidden ${isDark ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-neutral-100 text-neutral-400 hover:text-black'}`}
                >
                    <X size={14} />
                </button>

                {/* Profile Section - COMPACT */}
                <div className="flex flex-col items-center pt-6 px-3 shrink-0">
                    <button
                        onClick={() => setIsImageModalOpen(true)}
                        className={`
                            group relative overflow-hidden rounded-xl shadow-lg border transition-all duration-300 hover:scale-105
                            ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-200'}
                            ${sidebarOpen ? 'w-16 h-16 mb-3' : 'w-10 h-10 mb-3'}
                        `}
                    >
                        {userData?.profile?.profileImageUrl ? (
                            <img src={userData.profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className={`absolute inset-0 flex items-center justify-center ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                <UserCircle size={sidebarOpen ? 28 : 20} />
                            </div>
                        )}
                    </button>
                    {sidebarOpen && (
                        <div className="w-full text-center mb-4">
                            <h2 className="text-sm font-bold truncate">
                                {userData?.profile?.firstName ? `${userData.profile.firstName} ${userData.profile.lastName === 'null' ? '' : userData.profile.lastName}` : '...'}
                            </h2>
                            <p className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{userData?.profile?.role || '---'}</p>
                        </div>
                    )}
                </div>

                {/* Navigation - COMPACT */}
                <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 px-2 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Menu</div>
                    <NavItem id="feed" href="/professional/feed" icon={Rss} label="Feed" hasUpdate={hasNewPosts} onClick={handleFeedClick} />
                    <NavItem id="home" href="/professional/profile" icon={Home} label="Profile" />
                    <NavItem id="find" href="/professional/find" icon={Search} label="Find Work" />
                    <NavItem id="roles-jobs" href="/professional/roles-jobs" icon={Briefcase} label="My Jobs" />
                    <NavItem id="employment" href="/professional/employment" icon={Cable} label="Employment" />
                    <NavItem id="vault" href="/professional/vault" icon={Shield} label="Career Vault" />
                    <NavItem id="verification" href="/professional/verification" icon={BadgeCheck} label="Verification" />
                    <NavItem id="career-score" href="/professional/career-score" icon={Trophy} label="Career Score" />
                    <NavItem id="invites" href="/professional/invites" icon={Sparkles} label="Job Invites" />
                    <NavItem id="connections" href="/professional/connections" icon={Users} label="Connections" badgeCount={followBackCount} />
                    <NavItem id="communities" href="#" icon={MessageCircle} label="Communities" comingSoon={true} />

                    <div className={`text-[10px] font-bold uppercase tracking-wider mt-4 mb-2 px-2 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Account</div>
                    <NavItem id="notifications" href="/professional/notifications" icon={Bell} label="Notifications" />
                    <NavItem id="settings" href="/professional/settings" icon={Settings} label="Settings" />
                    <NavItem id="support" href="/professional/support" icon={HelpCircle} label="Support" />
                </div>

                {/* Logout - COMPACT */}
                <div className={`p-3 border-t shrink-0 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                    <button
                        onClick={async () => {
                            await fetch('/api/auth/logout', { method: 'POST' });
                            router.push('/');
                        }}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 group text-red-500 hover:bg-red-500/10 ${!sidebarOpen ? 'justify-center' : ''}`}
                    >
                        <Power size={18} />
                        {sidebarOpen && <span className="font-bold text-[10px] uppercase tracking-wider">Log Out</span>}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 relative flex flex-col h-full overflow-hidden">
                {/* Top Bar - Desktop & Mobile */}
                <div className={`w-full px-4 py-3 z-50 shrink-0 flex items-center justify-between`}> {/* Removed mobile-only hidden class for entire bar, managed visibility inside */}

                    {/* LEFT SIDE */}
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu */}
                        <div className={`md:hidden flex items-center gap-2 p-1 pr-3 rounded-full ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-neutral-200 shadow-sm'}`}>
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className={`p-1.5 rounded-full ${isDark ? 'bg-neutral-800 text-neutral-400' : 'bg-neutral-100 text-neutral-500'}`}
                            >
                                <Menu size={14} />
                            </button>
                            <span className="font-bold text-xs">Profcaria</span>
                        </div>

                        {/* Desktop Back */}
                        {showBackButton && (
                            <button
                                onClick={() => router.back()}
                                className={`hidden md:flex items-center gap-2 transition-colors group ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'}`}
                            >
                                <div className={`p-1.5 rounded-full ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                    <ChevronLeft size={14} />
                                </div>
                                <span className="text-xs font-medium">Back</span>
                            </button>
                        )}
                    </div>

                    {/* RIGHT SIDE - THEME TOGGLE (GLOBAL) */}
                    <div className="flex items-center gap-2 md:gap-4">
                        <GlobalSearch />
                        <ThemeToggle theme={theme} onToggle={toggleTheme} />

                        {/* Mobile Only Alerts Icon (Triggers Dropdown) */}
                        <div className="flex lg:hidden relative items-center">
                            <button
                                onClick={() => setShowAlertsMobile(!showAlertsMobile)}
                                className={`p-2 rounded-full transition-colors ${isDark ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-white text-black shadow-sm border border-neutral-200 hover:bg-neutral-50'}`}
                            >
                                <Bell size={16} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-red-500 ring-2 ring-white dark:ring-black"></span>
                                )}
                            </button>

                            {/* Dropdown */}
                            {showAlertsMobile && (
                                <>
                                    <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setShowAlertsMobile(false)}></div>
                                    <div className={`absolute top-12 right-0 w-80 max-h-[70vh] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                        <div className="flex-1 overflow-y-auto p-4 scroller">
                                            <AlertsSidebar />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main + Right Panel Container */}
                <div className="flex-1 flex min-h-0 overflow-hidden">
                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {children}
                    </div>

                    {/* Right Panel - Always visible on desktop */}
                    <aside className={`hidden lg:flex flex-col w-64 shrink-0 border-l p-4 overflow-y-auto ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <AlertsSidebar />
                    </aside>
                </div>
            </main>

            {/* PROFILE IMAGE MODAL */}
            {isImageModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsImageModalOpen(false)}></div>
                    <div className={`relative w-full max-w-md aspect-square rounded-3xl shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-neutral-200'}`}>
                        <button
                            onClick={() => setIsImageModalOpen(false)}
                            className={`absolute top-3 right-3 z-20 p-2 rounded-full ${isDark ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-neutral-100 text-neutral-500 hover:text-black'}`}
                        >
                            <X size={18} />
                        </button>
                        <div className={`flex-1 relative overflow-hidden ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                            {userData?.profile?.profileImageUrl ? (
                                <img src={userData.profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                    <UserCircle size={60} />
                                    <p className="text-xs font-medium">No photo</p>
                                </div>
                            )}
                        </div>
                        <div className={`p-4 flex items-center gap-2 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className={`flex-1 px-4 py-2.5 font-bold text-xs uppercase tracking-wider rounded-lg disabled:opacity-50 ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                            >
                                {isUploading ? 'Uploading...' : userData?.profile?.profileImageUrl ? 'Replace' : 'Upload'}
                            </button>
                            {userData?.profile?.profileImageUrl && (
                                <>
                                    <button onClick={handleEditCurrent} className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider rounded-lg ${isDark ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-black'}`}>
                                        Edit
                                    </button>
                                    <button onClick={handleImageDelete} className="px-4 py-2.5 bg-red-500/10 text-red-500 font-bold text-xs uppercase tracking-wider rounded-lg">
                                        Remove
                                    </button>
                                </>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                    </div>
                </div>
            )}

            {/* CROPPER */}
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
