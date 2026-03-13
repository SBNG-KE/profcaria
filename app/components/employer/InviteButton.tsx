"use client"

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import InviteToJobModal from './InviteToJobModal';
import { useTheme } from '@/app/context/ThemeContext';

interface InviteButtonProps {
    professionalId: string;
    professionalName: string;
}

export default function InviteButton({ professionalId, professionalName }: InviteButtonProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-all shadow-sm"
            >
                <Sparkles size={16} />
                <span>Invite to Job</span>
            </button>

            <InviteToJobModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                professionalId={professionalId}
                professionalName={professionalName}
            />
        </>
    );
}
