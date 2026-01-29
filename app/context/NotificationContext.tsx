"use client"

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

type Notification = {
    id: string;
    message: string;
    is_read: boolean;
    created_at: string;
    application_id?: string;
    type?: string;
    [key: string]: any;
};

type Application = {
    id: string;
    status: string;
    [key: string]: any;
};

interface NotificationContextType {
    notifications: Notification[];
    applications: Application[]; // Also serves as "channels"
    unreadCount: number;
    loading: boolean;
    refresh: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({
    children,
    role
}: {
    children: React.ReactNode,
    role: 'professional' | 'employer' | 'public'
}) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [applications, setApplications] = useState<Application[]>([]); // For conversations list
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();

    // Refs for polling control
    const mountedRef = useRef(true);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const slowPollingRef = useRef<NodeJS.Timeout | null>(null);

    // Endpoints
    const NOTIFICATION_ENDPOINT = '/api/shared/notifications';
    const APP_ENDPOINT = role === 'professional'
        ? '/api/professional/applications'
        : '/api/employer/applications';

    const fetchNotifications = useCallback(async () => {
        if (role === 'public') return; // No notifications for public
        try {
            const res = await fetch(`${NOTIFICATION_ENDPOINT}?t=${Date.now()}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                const newNotifs = data.notifications || [];
                setNotifications(newNotifs);

                // Smart Refresh for Applications
                // If the latest notification is NEW and of type 'invite'/'application', refresh apps immediately.
                if (newNotifs.length > 0) {
                    const latest = newNotifs[0];
                    // We need a ref to track if we've processed this ID already to avoid loops if we didn't have a ref before
                    // But here we can just use a simple check against state if appropriate, but state update is async.
                    // Let's use a module-level variable or just verify if the list implies we need it.
                    // Simplest: If latest is unread and type is invite, and we suspect we might be stale.

                    // Better: Just check if it's different from what we had? 
                    // We don't have access to 'prev' notifications easily inside this callbacks without dependency issues.
                    // But we can check if the type warrants a refresh.
                    if (!latest.is_read && ['invite', 'application', 'job'].includes(latest.type)) {
                        // To avoid spamming every 2.5s while it remains unread and top:
                        // We could rely on the "Slow Poll" to catch it eventually, BUT user wants it "NOW".
                        // Let's trigger fetchApplications(), but maybe throttle it?
                        // Actually, fetchApplications is cheap enough if it's just once per "new" event.
                        // But we can't easily distinguish "new" event here from "polling same data".

                        // Let's use a weak check: if the application list is empty OR random chance? No.
                        // Let's rely on the client component to call 'refresh()' for chat actions.
                        // For INVITES, the user is passive.

                        // Hack: Trigger fetchApplications() always if there is an unread invite? 
                        // It basically upgrades the poll rate to 2.5s for apps IF there is a pending invite.
                        // This is acceptable behavior: "High Alert Mode".
                        fetchApplications();
                    }
                }
            }
        } catch (error) {
            console.error("Context: Error fetching notifications", error);
        }
    }, [NOTIFICATION_ENDPOINT]);

    const fetchApplications = useCallback(async () => {
        if (role === 'public') return; // No applications for public
        try {
            const res = await fetch(`${APP_ENDPOINT}?t=${Date.now()}`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setApplications(data.applications || []);
            }
        } catch (error) {
            console.error("Context: Error fetching applications", error);
        }
    }, [APP_ENDPOINT]);

    // Initial Load
    useEffect(() => {
        mountedRef.current = true;
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchNotifications(), fetchApplications()]);
            setLoading(false);
        };
        init();

        return () => {
            mountedRef.current = false;
        };
    }, [fetchNotifications, fetchApplications]);

    // Fast Polling Loop (Notifications/Messages) - 2.5s
    useEffect(() => {
        const pollFast = async () => {
            if (!mountedRef.current) return;
            await fetchNotifications();
            if (mountedRef.current) {
                pollingRef.current = setTimeout(pollFast, 2500);
            }
        };

        // Start loop
        pollingRef.current = setTimeout(pollFast, 2500);

        return () => {
            if (pollingRef.current) clearTimeout(pollingRef.current);
        };
    }, [fetchNotifications]);

    // Slow Polling Loop (Applications/Channels list) - 30s
    useEffect(() => {
        const pollSlow = async () => {
            if (!mountedRef.current) return;
            await fetchApplications();
            if (mountedRef.current) {
                slowPollingRef.current = setTimeout(pollSlow, 30000);
            }
        };

        // Start loop
        slowPollingRef.current = setTimeout(pollSlow, 30000);

        return () => {
            if (slowPollingRef.current) clearTimeout(slowPollingRef.current);
        };
    }, [fetchApplications]);

    const refresh = async () => {
        // Instant manual refresh
        await Promise.all([fetchNotifications(), fetchApplications()]);
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch(NOTIFICATION_ENDPOINT, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id })
            });
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error("Error marking read", error);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            applications,
            unreadCount,
            loading,
            refresh,
            markAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotificationContext() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return context;
}
