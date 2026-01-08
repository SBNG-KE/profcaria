"use client"

import React from 'react';
import { NotificationProvider } from '@/app/context/NotificationContext';
import EmployerLayoutContent from './layout-content';

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
    return (
        <NotificationProvider role="employer">
            <EmployerLayoutContent>
                {children}
            </EmployerLayoutContent>
        </NotificationProvider>
    );
}
