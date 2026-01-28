"use client"

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyableTextProps {
    text: string | null;
    label?: string;
    icon?: React.ReactNode;
    isLink?: boolean;
    displayText?: string;
    className?: string;
}

export default function CopyableText({ text, label, icon, isLink, displayText, className }: CopyableTextProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!text) return;

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy class', err);
        }
    };

    if (!text) return <span className="text-neutral-400 italic">Not provided</span>;

    return (
        <div className={`space-y-1 ${className || ''}`}>
            {label && <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">{label}</label>}
            <div className="group flex items-center gap-2 relative">
                <div className="flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300 truncate">
                    {icon && <span className="text-neutral-400">{icon}</span>}
                    {isLink ? (
                        <a href={text} target="_blank" rel="noopener noreferrer" className="hover:underline truncate text-blue-600 dark:text-blue-400">
                            {displayText || text}
                        </a>
                    ) : (
                        <span className="truncate">{displayText || text}</span>
                    )}
                </div>
                <button
                    onClick={handleCopy}
                    className="opacity-50 hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    title="Copy"
                >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
            </div>
        </div>
    );
}
