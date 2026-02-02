"use client"

import React, { useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    Home, FileText, Bell, Settings, ChevronLeft, ChevronRight,
    Briefcase, Users, Building2, Plus, Power, Menu, X, HelpCircle, Rss, UsersRound
} from 'lucide-react';
import ImageCropper from '@/app/components/ImageCropper';
import { useNotificationContext } from '@/app/context/NotificationContext';
import { useTheme } from '@/app/context/ThemeContext';
import EmployerAlertsSidebar from '@/app/components/employer/AlertsSidebar';
import ThemeToggle from '@/app/components/ThemeToggle';
import GlobalSearch from '@/app/components/shared/GlobalSearch';

export default function EmployerLayoutContent({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showAlertsMobile, setShowAlertsMobile] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const [employerData, setEmployerData] = useState<any>(null);
    const [applicationCount, setApplicationCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropSource, setCropSource] = useState<File | string | null>(null);
    const [currentPlan, setCurrentPlan] = useState<string | null>(null);

    // Theme
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    // Consume Context
    const { unreadCount, applications } = useNotificationContext();

    // Fetch current billing plan
    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const res = await fetch('/api/employer/billing');
                if (res.ok) {
                    const data = await res.json();
                    setCurrentPlan(data.plan || 'free');
                }
            } catch (error) {
                console.error('Error fetching plan:', error);
            }
        };
        fetchPlan();
    }, []);

    // Initialize sidebar state
    useEffect(() => {
        if (window.innerWidth >= 768) {
            setSidebarOpen(true);
        }
    }, []);

    const activeTab = pathname.split('/').pop() || 'feed';
    const showBackButton = pathname !== '/employer/feed' && !pathname.endsWith('/view');

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

    useEffect(() => {
        if (applications) {
            const activeApps = applications.filter((app: any) => app.status === 'pending') || [];
            setApplicationCount(activeApps.length);
        }
    }, [applications]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setCropSource(e.target.files[0]);
    }

    const handleEditCurrent = () => {
        if (employerData?.profile?.logoUrl) {
            setCropSource(employerData.profile.logoUrl);
        }
    };

    const handleCropSave = async (blob: Blob) => {
        setIsUploading(true);
        setCropSource(null);

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

    // Compact NavItem - Theme aware
    const NavItem = React.memo(({ id, href, icon: Icon, label, badgeCount, comingSoon }: { id: string; href: string; icon: React.ElementType; label: string; badgeCount?: number; comingSoon?: boolean }) => (
        <button
            onClick={() => !comingSoon && router.push(href)}
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
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-[6px] font-bold text-white">✨</span>
                )}
                {(badgeCount && badgeCount > 0) || (id === 'notifications' && unreadCount > 0) ? (
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                        {id === 'notifications' ? unreadCount : badgeCount}
                    </span>
                ) : null}
            </div>
            {sidebarOpen && (
                <span className="font-medium text-xs flex items-center gap-2">
                    {label}
                    {comingSoon && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 font-bold uppercase">Soon</span>}
                </span>
            )}
        </button>
    ));

    return (
        <div className={`employer-scope flex h-screen font-sans overflow-hidden transition-colors duration-300 ${isDark ? 'bg-black text-neutral-200 selection:bg-white/30' : 'bg-neutral-50 text-neutral-900 selection:bg-black/20'}`}>

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

                {/* Logo Section - COMPACT */}
                <div className="flex flex-col items-center pt-6 px-3 shrink-0">
                    <button
                        onClick={() => setIsImageModalOpen(true)}
                        className={`
                            group relative overflow-hidden rounded-xl shadow-lg border transition-all duration-300 hover:scale-105
                            ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-200'}
                            ${sidebarOpen ? 'w-16 h-16 mb-3' : 'w-10 h-10 mb-3'}
                        `}
                    >
                        {employerData?.profile?.logoUrl ? (
                            <img src={employerData.profile.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                        ) : (
                            <div className={`absolute inset-0 flex items-center justify-center ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                <Building2 size={sidebarOpen ? 28 : 20} />
                            </div>
                        )}
                    </button>
                    {sidebarOpen && (
                        <div className="w-full text-center mb-4">
                            <h2 className="text-sm font-bold truncate">
                                {employerData?.profile?.companyName || '...'}
                            </h2>
                            <p className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                {currentPlan ? `${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan` : '---'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Navigation - COMPACT */}
                <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 px-2 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Main</div>
                    <NavItem id="feed" href="/employer/feed" icon={Rss} label="Feed" />
                    <NavItem id="home" href="/employer/home" icon={Home} label="Dashboard" />
                    <NavItem id="profile" href="/employer/profile" icon={Building2} label="Profile" />

                    <div className={`text-[10px] font-bold uppercase tracking-wider mt-4 mb-2 px-2 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Network</div>
                    <NavItem id="jobs" href="/employer/jobs" icon={Briefcase} label="Jobs" badgeCount={applicationCount} />
                    <NavItem id="connections" href="/employer/connections" icon={Users} label="Connections" />
                    <NavItem id="communities" href="#" icon={UsersRound} label="Communities" comingSoon={true} />

                    <div className={`text-[10px] font-bold uppercase tracking-wider mt-4 mb-2 px-2 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>Account</div>
                    <NavItem id="notifications" href="/employer/notifications" icon={Bell} label="Notifications" />
                    <NavItem id="settings" href="/employer/settings" icon={Settings} label="Settings" />
                    <NavItem id="support" href="/employer/support" icon={HelpCircle} label="Support" />
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

            {/* MAIN CONTENT */}
            <main className="flex-1 relative flex flex-col h-full overflow-hidden">
                {/* Top Bar - Desktop & Mobile */}
                <div className={`w-full px-4 py-3 z-50 shrink-0 flex items-center justify-between`}>
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
                                            <EmployerAlertsSidebar />
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
                        <EmployerAlertsSidebar />
                    </aside>
                </div>
            </main>

            {/* LOGO IMAGE MODAL */}
            {isImageModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsImageModalOpen(false)}></div>
                    <div className={`relative w-full max-w-md aspect-square rounded-3xl shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white border border-neutral-200'}`}>

                        {/* Close Button */}
                        <button
                            onClick={() => setIsImageModalOpen(false)}
                            className={`absolute top-4 right-4 z-20 p-2 rounded-full ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-black'}`}
                        >
                            <X size={18} />
                        </button>

                        <div className={`flex-1 relative overflow-hidden ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                            {employerData?.profile?.logoUrl ? (
                                <img
                                    src={employerData.profile.logoUrl}
                                    alt="Company Logo"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                    <Building2 size={60} />
                                    <p className="font-medium text-sm">No company logo</p>
                                </div>
                            )}
                        </div>

                        {/* Controls */}
                        <div className={`p-4 flex items-center gap-3 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}
                            >
                                {isUploading ? 'Uploading...' : employerData?.profile?.logoUrl ? 'Replace' : 'Upload'}
                            </button>

                            {employerData?.profile?.logoUrl && (
                                <>
                                    <button
                                        onClick={handleEditCurrent}
                                        className={`px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${isDark ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-neutral-100 text-black hover:bg-neutral-200'}`}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={handleImageDelete}
                                        className="px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                                    >
                                        Remove
                                    </button>
                                </>
                            )}
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
