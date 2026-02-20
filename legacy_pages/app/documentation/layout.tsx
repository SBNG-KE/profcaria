"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Book,
    Shield,
    Briefcase,
    User,
    Menu,
    X,
    ChevronRight,
    Home,
    FileText,
    Lock,
    ArrowLeft
} from 'lucide-react';

export default function DocumentationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const navigation = [
        { name: 'Getting Started', href: '/documentation', icon: Home },
        { name: 'For Professionals', href: '/documentation/professional', icon: User },
        { name: 'For Employers', href: '/documentation/employer', icon: Briefcase },
        { name: 'Legal', href: '/documentation/legal', icon: FileText },
        { name: 'Security & Privacy Vault', href: '/documentation/privacy-vault', icon: Shield },
    ];

    return (
        <div className="min-h-screen bg-[#050b14] text-slate-200 font-sans selection:bg-blue-500/30">
            {/* Navigation Header */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050b14]/50 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 tracking-tight">
                            PROFCARIA
                        </h1>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/documentation" className="text-[10px] font-black uppercase tracking-widest text-white transition-colors">
                            Documentation
                        </Link>
                        <Link href="/pricing" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                            Pricing
                        </Link>
                        <Link href="/contact" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                            Contact Us
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="hidden md:flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </Link>
                        <Link
                            href="/auth"
                            className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-white/5"
                        >
                            Join Now
                        </Link>
                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={toggleSidebar}
                            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
                        >
                            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            <div className="flex pt-20">
                {/* Sidebar */}
                <aside
                    className={`
            fixed top-20 left-0 bottom-0 z-40 w-72 bg-[#050b14] border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-[calc(100vh-5rem)] lg:sticky lg:top-20 overflow-y-auto
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
                >
                    <div className="p-8">
                        <Link href="/" className="block mb-10">
                            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
                                PROFCARIA
                            </h1>
                            <span className="text-xs font-bold text-blue-500 uppercase tracking-[0.2em] ml-0.5">Documentation</span>
                        </Link>

                        <nav className="space-y-2">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                      ${isActive
                                                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-lg shadow-blue-900/10'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                            }
                    `}
                                    >
                                        <item.icon size={18} className={isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-white'} />
                                        <span className="text-sm font-bold tracking-wide">{item.name}</span>
                                        {isActive && <ChevronRight size={14} className="ml-auto text-blue-400" />}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="mt-10 pt-10 border-t border-white/5">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-4">Resources</h3>
                            <div className="space-y-4">
                                <a href="mailto:support@profcaria.com" className="block text-sm text-slate-400 hover:text-white transition-colors">
                                    Contact Support
                                </a>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Overlay for mobile sidebar */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 w-full min-h-[calc(100vh-5rem)] relative">
                    <div className="max-w-4xl mx-auto px-6 py-12">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
