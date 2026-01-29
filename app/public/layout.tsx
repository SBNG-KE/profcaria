import React from 'react';
import { NotificationProvider } from '@/app/context/NotificationContext'; // Reusing context if needed, or omit
import PublicLayoutContent from './layout-content';

export const metadata = {
    title: 'Profcaria - Public Profile',
    description: 'View public profile on Profcaria',
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <NotificationProvider role="public">
            <PublicLayoutContent>
                {children}
            </PublicLayoutContent>
        </NotificationProvider>
    );
}
