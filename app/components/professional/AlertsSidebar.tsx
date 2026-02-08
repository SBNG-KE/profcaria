"use client"

import React from 'react';
import Link from 'next/link';
import { UserPlus, ArrowRight } from 'lucide-react';
import { useNotificationContext } from '@/app/context/NotificationContext';
import { useTheme } from '@/app/context/ThemeContext';

export default function AlertsSidebar() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { notifications, markAsRead } = useNotificationContext();


    const handleNotificationClick = (id: string, isRead: boolean) => {
        if (!isRead) {
            markAsRead(id);
        }
        // In future: navigate to relevant page if notification has link
    };

    // Sort notifications
    const sortedNotifications = notifications.slice(0, 10);

    return (
        <div className="flex flex-col h-full">
            {/* Header Redundant Link Removed */}
            <div className={`p-1 rounded-xl mb-4 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <span className={`block py-2 px-4 text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>
                    Updates
                </span>
            </div>

            <div
                className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Find New Connections CTA */}
                    <Link
                        href="/professional/connections"
                        className={`block p-3 rounded-xl border transition-all hover:scale-[1.02] ${isDark ? 'bg-blue-900/10 border-blue-900/30 hover:border-blue-700/40' : 'bg-blue-50 border-blue-100 hover:border-blue-200'}`}
                    >
                        <div className="flex gap-3 items-center">
                            <div className="p-2 bg-blue-500 rounded-full text-white">
                                <UserPlus size={14} />
                            </div>
                            <div className="flex-1">
                                <p className={`text-xs font-medium ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>Find New Connections</p>
                                <p className={`text-[10px] ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                                    Discover people and companies to follow
                                </p>
                            </div>
                            <ArrowRight size={14} className={isDark ? 'text-blue-400' : 'text-blue-500'} />
                        </div>
                    </Link>

                    {/* Notifications */}
                    {sortedNotifications.length > 0 ? sortedNotifications.map(n => (
                        <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n.id, n.is_read)}
                            className={`flex gap-3 items-start p-2 rounded-lg transition-all cursor-pointer ${!n.is_read ? (isDark ? 'bg-neutral-800/80 hover:bg-neutral-800 border-l-2 border-l-blue-500' : 'bg-white border hover:bg-neutral-50 shadow-sm border-l-blue-500') : 'opacity-60 hover:opacity-80 scale-[0.98]'}`}
                        >
                            <div className="flex-1">
                                {n.senderName ? (
                                    <div className="flex items-start gap-2">
                                        {n.senderImage ? (
                                            <img src={n.senderImage} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                                <span className="text-[10px] font-bold text-blue-500">{n.senderName[0]}</span>
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className={`text-[10px] font-bold truncate ${isDark ? 'text-white' : 'text-black'}`}>{n.senderName}</p>
                                            <p className={`text-[9px] ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>{n.senderRole || 'Professional'}</p>
                                        </div>
                                        {!n.is_read && (
                                            <span className="bg-blue-500 text-[6px] px-1 py-0.5 rounded text-white font-bold ml-auto">NEW</span>
                                        )}
                                        <span className={`text-[9px] ml-1 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                            {new Date(n.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mb-1">
                                        {!n.is_read && (
                                            <span className="bg-blue-500 text-[8px] px-1.5 py-0.5 rounded-full text-white font-bold tracking-wide shadow-sm animate-pulse">NEW</span>
                                        )}
                                        <span className={`text-[10px] ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                            {new Date(n.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                                <p className={`text-xs leading-relaxed ${isDark ? 'text-neutral-200' : 'text-neutral-900'}`}>
                                    <span dangerouslySetInnerHTML={{ __html: n.message }} />
                                </p>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-xs text-neutral-600 py-8">No new updates found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
