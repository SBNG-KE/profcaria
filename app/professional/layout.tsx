"use client"

import React from 'react';
import { NotificationProvider } from '@/app/context/NotificationContext';
import ProfessionalLayoutContent from './layout-content';

export default function ProfessionalLayout({ children }: { children: React.ReactNode }) {
    return (
        <NotificationProvider role="professional">
            <ProfessionalLayoutContent>
                {children}
            </ProfessionalLayoutContent>
        </NotificationProvider>
    );
}
