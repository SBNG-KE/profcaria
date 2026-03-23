"use client"

import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// --- MODERN INPUT COMPONENT (Reused for consistency) ---
interface ModernInputProps {
    type?: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    multiline?: boolean;
    theme: 'light' | 'dark';
}

const ModernInput = ({
    type = "text",
    placeholder,
    value,
    onChange,
    multiline = false,
    theme
}: ModernInputProps) => {
    const isDark = theme === 'dark';

    return (
        <div className="relative group">
            {multiline ? (
                <textarea
                    value={value}
                    onChange={onChange}
                    rows={6}
                    className={`
                        w-full bg-transparent border-b-2 py-3 px-4 text-sm outline-none transition-all duration-300 resize-none
                        ${isDark
                            ? 'border-neutral-800 text-white placeholder-neutral-600 focus:border-white'
                            : 'border-neutral-200 text-black placeholder-neutral-400 focus:border-black'
                        }
                    `}
                    placeholder={placeholder}
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    className={`
                        w-full bg-transparent border-b-2 py-3 px-4 text-sm outline-none transition-all duration-300
                        ${isDark
                            ? 'border-neutral-800 text-white placeholder-neutral-600 focus:border-white'
                            : 'border-neutral-200 text-black placeholder-neutral-400 focus:border-black'
                        }
                    `}
                    placeholder={placeholder}
                />
            )}
        </div>
    );
};

export default function HangingContactCard({
    isOpen,
    onClose
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSubmit = async () => {
        if (!message.trim() || !email.trim()) return;
        setIsSubmitting(true);
        setStatus('idle');

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, message })
            });

            if (res.ok) {
                setStatus('success');
                setMessage('');
                setEmail('');
                setTimeout(() => {
                    onClose();
                    setStatus('idle');
                }, 2000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error(error);
            setStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-center items-start pt-24 pointer-events-none">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md pointer-events-auto" onClick={onClose} />

            {/* CARD - Enhanced Glassmorphism */}
            <div
                className={`
                    relative pointer-events-auto mt-8 
                    w-[95vw] md:w-[90vw] max-w-[500px]
                    mx-auto
                    rounded-[2rem] p-6 md:p-8 overflow-hidden
                    transform transition-all duration-500 origin-top
                    ${isDark
                        ? 'glass-card border-neutral-700/50 glow-white'
                        : 'glass-card-light border-neutral-200'}
                `}
                style={{
                    animation: 'swing 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                }}
            >
                {/* --- CONTENT --- */}
                <div className="flex flex-col gap-6">

                    {/* TITLE */}
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-black tracking-tight font-pixel uppercase">
                            Contact Us
                        </h2>
                        <p className={`text-xs font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            Have a question? We'll get back to you shortly.
                        </p>
                    </div>

                    {/* FORM */}
                    <div className="space-y-4 mt-4">
                        <ModernInput
                            theme={theme}
                            placeholder="Your Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        <ModernInput
                            theme={theme}
                            placeholder="How can we help?"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            multiline
                        />
                    </div>

                    {/* STATUS MESSAGES */}
                    {status === 'success' && (
                        <div className={`flex items-center gap-3 p-3 rounded-xl animate-in fade-in slide-in-from-bottom-2 ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                            <CheckCircle size={16} />
                            <span className="font-bold text-xs">Message sent! Closing...</span>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className={`flex items-center gap-3 p-3 rounded-xl animate-in fade-in slide-in-from-bottom-2 ${isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
                            <AlertCircle size={16} />
                            <span className="font-bold text-xs">Failed to send message.</span>
                        </div>
                    )}

                    {/* SUBMIT BUTTON */}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !email || !message}
                        className={`
                            w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 font-pixel
                            ${isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-black text-white hover:bg-neutral-800'}
                            ${(isSubmitting || !email || !message) ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Sending...</span>
                            </>
                        ) : (
                            <span>Send Message</span>
                        )}
                    </button>

                </div>
            </div>
        </div>
    );
}
