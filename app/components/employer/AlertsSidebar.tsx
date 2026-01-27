"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, UserPlus, Building2, User as UserIcon, Loader2, Link, Zap } from 'lucide-react';
import { useNotificationContext } from '@/app/context/NotificationContext';
import { useTheme } from '@/app/context/ThemeContext';

export default function EmployerAlertsSidebar() {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { notifications, markAsRead } = useNotificationContext();
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [recLoading, setRecLoading] = useState(true);

    // Fetch Candidate Recommendations (Growth Engine adaptation for Employer)
    // We might not have a dedicated endpoint yet, so we'll simulate or use a generic one if available.
    // Assuming /api/employer/recommendations exists or similar. 
    // If not, we'll placeholder it for now as "Coming Soon" or fetch generic.

    // Actually, let's fetch /api/professional/recommendations but filtered? No, permissions.
    // Let's rely on notifications for now and a placeholder suggestion.

    useEffect(() => {
        // Mock fetch for "Candidates matching your jobs"
        // In real app, this would hit /api/employer/suggestions
        setTimeout(() => {
            setRecLoading(false);
            setSuggestions([
                { id: '1', name: 'Software Engineer', count: 12 },
                { id: '2', name: 'Product Manager', count: 5 }
            ]);
        }, 1000);
    }, []);

    // Helper: Sort notifications by date
    const sortedNotifications = notifications
        .filter(n => !n.is_read)
        .slice(0, 5);

    return (
        <div className="flex flex-col h-full">
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Alerts</h3>

            {/* Real Notifications */}
            {sortedNotifications.length > 0 ? (
                <div className="mb-6 space-y-3">
                    {sortedNotifications.map(n => (
                        <div key={n.id} className="flex gap-3 items-start">
                            <div className={`mt-0.5 min-w-[6px] h-1.5 rounded-full ${isDark ? 'bg-amber-500' : 'bg-amber-600'}`}></div>
                            <div>
                                <p className={`text-xs leading-snug ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                    <span dangerouslySetInnerHTML={{ __html: n.message }} />
                                </p>
                                <span className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                    {new Date(n.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mb-6 py-4 text-center">
                    <p className={`text-xs ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No new alerts</p>
                </div>
            )}

            <hr className={`border-t my-2 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`} />

            {/* Recommendations */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>Suggested Candidates</h4>

                {recLoading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className={`animate-spin ${isDark ? 'text-neutral-700' : 'text-neutral-300'}`} size={16} />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Placeholder for "Candidates matching X" */}
                        {suggestions.map(s => (
                            <div key={s.id} className={`p-3 rounded-xl border ${isDark ? 'bg-neutral-800/30 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Zap size={12} className="text-amber-500 fill-current" />
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Top Match</span>
                                </div>
                                <h5 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{s.name}</h5>
                                <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{s.count} new candidates</p>
                                <button className={`mt-3 w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}`}>
                                    Subscribe to List
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
