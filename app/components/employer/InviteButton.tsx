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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-lg transition-all 
                ${isDark ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
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
