"use client"

import React from 'react';
import { Bell } from 'lucide-react';
import { useNotificationContext } from '@/app/context/NotificationContext';
import { useTheme } from '@/app/context/ThemeContext';

export default function EmployerAlertsSidebar() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { notifications, markAsRead } = useNotificationContext();

    const handleAlertClick = (id: string, isRead: boolean) => {
        if (!isRead) {
            markAsRead(id);
        }
    };

    // Show latest 5 notifications
    const sortedNotifications = notifications.slice(0, 5);

    return (
        <div className="flex flex-col h-full">
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-6 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Insights & Alerts</h3>

            {/* SYSTEM ALERTS */}
            <div className="flex-1 overflow-y-auto mt-2" style={{ scrollbarWidth: 'none' }}>
                <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    <Bell size={12} /> System Alerts
                </h4>

                {sortedNotifications.length > 0 ? sortedNotifications.map(n => (
                    <div
                        key={n.id}
                        onClick={() => handleAlertClick(n.id, n.is_read)}
                        className={`flex gap-3 items-start mb-3 p-2 rounded-lg transition-all cursor-pointer ${!n.is_read
                                ? isDark
                                    ? 'bg-neutral-800/60 hover:bg-neutral-800 border-l-2 border-l-amber-500'
                                    : 'bg-white hover:bg-neutral-50 shadow-sm border-l-2 border-l-amber-500'
                                : 'opacity-50 hover:opacity-70'
                            }`}
                    >
                        {!n.is_read && (
                            <div className={`mt-1.5 min-w-[6px] h-1.5 rounded-full shrink-0 ${isDark ? 'bg-amber-500' : 'bg-amber-600'}`}></div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                {!n.is_read && (
                                    <span className="bg-amber-500 text-[7px] px-1.5 py-0.5 rounded-full text-white font-bold uppercase tracking-wider">New</span>
                                )}
                                <span className={`text-[10px] ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                    {new Date(n.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className={`text-xs leading-snug ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                <span dangerouslySetInnerHTML={{ __html: n.message }} />
                            </p>
                        </div>
                    </div>
                )) : (
                    <p className={`text-xs italic ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No system alerts</p>
                )}
            </div>
        </div>
    );
}
