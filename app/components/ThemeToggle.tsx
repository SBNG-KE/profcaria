"use client"

import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
    theme: 'light' | 'dark';
    onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
    return (
        <button
            onClick={onToggle}
            className={`
        relative w-14 h-8 rounded-full transition-all duration-300 ease-in-out
        ${theme === 'dark'
                    ? 'bg-black border border-neutral-800 hover:border-neutral-700'
                    : 'bg-white border border-neutral-200 hover:border-neutral-300'
                }
        group overflow-hidden
      `}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            {/* Toggle Circle */}
            <div
                className={`
          absolute top-1 w-6 h-6 rounded-full 
          transition-all duration-300 ease-in-out
          flex items-center justify-center
          ${theme === 'dark'
                        ? 'left-1 bg-neutral-900 text-white'
                        : 'left-7 bg-black text-amber-500 shadow-md'
                    }
        `}
            >
                {theme === 'dark' ? (
                    <Moon size={14} className="transition-transform group-hover:rotate-12" />
                ) : (
                    <Sun size={14} className="transition-transform group-hover:rotate-45" />
                )}
            </div>

            {/* Background icons */}
            <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                <Sun
                    size={12}
                    className={`transition-opacity duration-300 ${theme === 'dark' ? 'opacity-30 text-neutral-500' : 'opacity-0'}`}
                />
                <Moon
                    size={12}
                    className={`transition-opacity duration-300 ${theme === 'light' ? 'opacity-30 text-neutral-400' : 'opacity-0'}`}
                />
            </div>
        </button>
    );
}
