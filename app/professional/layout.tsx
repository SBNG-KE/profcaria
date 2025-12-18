"use client"

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
    Home, Search, FileText, Bell, Settings, ChevronLeft, ChevronRight,
    Briefcase, UserCircle, Video, Cable, Plus
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
                        <div className="w-1 h-1 bg-slate-500/50 rounded-full shadow-sm"></div>
                        <div className="w-1 h-1 bg-slate-500/70 rounded-full shadow-sm"></div>
                        <div className="w-1 h-1 bg-slate-500/90 rounded-full shadow-sm"></div>
                        <div className="w-1 h-1 bg-slate-500/50 rounded-full shadow-sm"></div>
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
    const pathname = usePathname();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setIsUploading(true);

        try {
            const res = await fetch(`/api/professional/profile/image?filename=${file.name}`, {
                method: 'POST',
                body: file
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

    const handleImageDelete = async () => {
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
    };

    const activeTab = pathname.split('/').pop() || 'home';

    const NavItem = ({ id, href, icon: Icon, label, badgeCount }: any) => (
        <button
            onClick={() => router.push(href)}
            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group relative shrink-0 ${activeTab === id ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'} ${!sidebarOpen ? 'justify-center' : ''}`}
        >
            <div className="relative">
                <Icon size={22} className={activeTab === id ? 'animate-pulse' : ''} />
                {badgeCount && <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-[#0f172a]">{badgeCount}</span>}
            </div>
            {sidebarOpen && <span className="font-medium text-sm transition-all">{label}</span>}
        </button>
    );

    return (
        <div className="flex h-screen bg-[#050b14] text-slate-200 font-sans overflow-hidden selection:bg-blue-500/30">

            {/* SIDEBAR */}
            <aside className={`relative flex flex-col border-r border-slate-800 bg-[#0f172a]/80 backdrop-blur-xl transition-all duration-300 ease-in-out z-30 ${sidebarOpen ? 'w-72' : 'w-24'}`}>
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute -right-3 top-8 z-40 bg-slate-800 border border-slate-600 rounded-full p-1.5 text-slate-300 hover:text-white shadow-xl">
                    {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </button>

                <div className="flex flex-col items-center pt-8 px-4 shrink-0">
                    <button
                        onClick={() => setIsImageModalOpen(true)}
                        className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 shadow-2xl border border-slate-700 transition-all duration-300 hover:scale-105 active:scale-95 ${sidebarOpen ? 'w-full aspect-square mb-4' : 'w-14 h-14 mb-6'}`}
                    >
                        {userData?.profile?.profileImageUrl ? (
                            <img src={userData.profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-slate-600">
                                <UserCircle size={sidebarOpen ? 48 : 24} />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Plus className="text-white" size={sidebarOpen ? 32 : 16} />
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

                            <div className="grid grid-cols-2 gap-2 w-full">
                                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                                    <span className="text-2xl font-bold text-emerald-400">3</span>
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Jobs</span>
                                </div>
                                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 flex flex-col items-center">
                                    <Briefcase size={20} className="text-blue-400 mb-1" />
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Current</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <ScrollableContainer className="px-4 space-y-2 pb-4">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 mt-2 px-2">Menu</div>
                    <NavItem id="home" href="/professional/home" icon={Home} label="Home" />
                    <NavItem id="find" href="/professional/find" icon={Search} label="Find Jobs" />
                    <NavItem id="notifications" href="/professional/notifications" icon={Bell} label="Notifications" badgeCount={3} />
                </ScrollableContainer>

                <div className="p-4 border-t border-slate-800 bg-[#0f172a] shrink-0">
                    <NavItem id="settings" href="/professional/settings" icon={Settings} label="Settings" />
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 relative flex flex-col h-full overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none z-0"></div>
                {children}
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
                                {isUploading ? 'Uploading...' : userData?.profile?.profileImageUrl ? 'Edit Photo' : 'Add Photo'}
                            </button>
                            {userData?.profile?.profileImageUrl && (
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
