import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface SlideOverPanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    isDark?: boolean;
    className?: string; // Allow custom width overrides
}

export default function SlideOverPanel({ isOpen, onClose, title, children, isDark = false, className = '' }: SlideOverPanelProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setVisible(false), 300); // Wait for animation
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!visible && !isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-start">
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Panel - Sliding from LEFT */}
            <div
                className={`relative w-full h-full shadow-2xl transform transition-transform duration-300 ease-in-out ${className || 'max-w-md'} ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isDark ? 'bg-neutral-900 border-r border-neutral-800' : 'bg-white border-r border-neutral-200'}`}
            >
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{title}</h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto h-[calc(100vh-80px)]">
                    {children}
                </div>
            </div>
        </div>
    );
}
