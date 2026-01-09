"use client"

import React from 'react';
import { NotificationProvider } from '@/app/context/NotificationContext';
import ProfessionalLayoutContent from './layout-content';

export default function ProfessionalLayout({ children }: { children: React.ReactNode }) {
    // Track Activity
    React.useEffect(() => {
        const updateActivity = () => {
            if (document.visibilityState === 'visible') {
                fetch('/api/auth/activity', { method: 'POST' }).catch(() => { });
            }
        };

        // Initial call
        updateActivity();

        // Interval (every 5 mins)
        const interval = setInterval(updateActivity, 5 * 60 * 1000);

        // Also update on visibility change (user comes back to tab)
        document.addEventListener('visibilitychange', updateActivity);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', updateActivity);
        };
    }, []);

    return (
        <NotificationProvider role="professional">
            <ProfessionalLayoutContent>
                {children}
            </ProfessionalLayoutContent>
        </NotificationProvider>
    );
}
