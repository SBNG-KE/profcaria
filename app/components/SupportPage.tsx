"use client";

import React, { useState } from 'react';
import { MessageSquare, Bug, Lightbulb, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

export default function SupportPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [type, setType] = useState<'issue' | 'feature'>('issue');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);
        setStatus('idle');

        try {
            const res = await fetch('/api/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, message })
            });

            if (res.ok) {
                setStatus('success');
                setMessage('');
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

    return (
        <div className="min-h-full p-4 md:p-8 flex flex-col items-center justify-center max-w-3xl mx-auto w-full">
            <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">

                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className={`text-3xl md:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                        How can we help?
                    </h1>
                    <p className={`text-sm md:text-base max-w-lg mx-auto ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Your feedback drives our innovation. Whether it's a bug or a brilliant idea, we want to hear it.
                    </p>
                </div>

                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setType('issue')}
                        className={`p-6 rounded-2xl border transition-all duration-300 group relative overflow-hidden ${type === 'issue'
                            ? (isDark ? 'bg-white/10 border-white/30 shadow-xl' : 'bg-black/5 border-black/20 shadow-xl')
                            : (isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/50' : 'bg-white border-neutral-200 hover:border-neutral-300')
                            }`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-300 ${type === 'issue' ? 'opacity-100' : 'opacity-0'} ${isDark ? 'from-white/5 to-transparent' : 'from-black/5 to-transparent'}`} />
                        <div className="relative flex flex-col items-center gap-3">
                            <Bug size={32} className={`transition-colors duration-300 ${type === 'issue' ? (isDark ? 'text-white' : 'text-black') : (isDark ? 'text-neutral-500 group-hover:text-white' : 'text-neutral-400 group-hover:text-black')}`} />
                            <span className={`font-black uppercase tracking-widest text-xs ${type === 'issue' ? (isDark ? 'text-white' : 'text-black') : (isDark ? 'text-neutral-400 group-hover:text-white' : 'text-neutral-500 group-hover:text-black')}`}>
                                Report Issue
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={() => setType('feature')}
                        className={`p-6 rounded-2xl border transition-all duration-300 group relative overflow-hidden ${type === 'feature'
                            ? (isDark ? 'bg-white/10 border-white/30 shadow-xl' : 'bg-black/5 border-black/20 shadow-xl')
                            : (isDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/50' : 'bg-white border-neutral-200 hover:border-neutral-300')
                            }`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-300 ${type === 'feature' ? 'opacity-100' : 'opacity-0'} ${isDark ? 'from-white/5 to-transparent' : 'from-black/5 to-transparent'}`} />
                        <div className="relative flex flex-col items-center gap-3">
                            <Lightbulb size={32} className={`transition-colors duration-300 ${type === 'feature' ? (isDark ? 'text-white' : 'text-black') : (isDark ? 'text-neutral-500 group-hover:text-white' : 'text-neutral-400 group-hover:text-black')}`} />
                            <span className={`font-black uppercase tracking-widest text-xs ${type === 'feature' ? (isDark ? 'text-white' : 'text-black') : (isDark ? 'text-neutral-400 group-hover:text-white' : 'text-neutral-500 group-hover:text-black')}`}>
                                Request Feature
                            </span>
                        </div>
                    </button>
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative group">
                        <div className={`absolute -inset-0.5 rounded-2xl blur opacity-30 transition duration-500 group-hover:opacity-75 ${isDark ? 'bg-white' : 'bg-black'}`}></div>
                        <div className="relative">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={type === 'issue' ? "Describe the issue you're facing..." : "Tell us about your feature idea..."}
                                className={`w-full h-48 border rounded-2xl p-6 text-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all resize-none font-medium ${isDark ? 'bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-600 focus:ring-white/20' : 'bg-white border-neutral-200 text-black placeholder:text-neutral-400 focus:ring-black/20'}`}
                                style={{
                                    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <div className={`absolute top-4 right-4 p-2 rounded-lg border backdrop-blur-sm pointer-events-none ${isDark ? 'bg-neutral-900/50 border-t-white/10 border-white/5' : 'bg-white/50 border-neutral-200'}`}>
                                <MessageSquare size={16} className={isDark ? 'text-neutral-500' : 'text-neutral-400'} />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting || !message.trim()}
                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group ${isDark
                            ? 'bg-white hover:bg-neutral-200 text-black shadow-white/20'
                            : 'bg-black hover:bg-neutral-800 text-white shadow-black/20'
                            }`}
                    >
                        {isSubmitting ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <>
                                <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                                <span>Send {type === 'issue' ? 'Report' : 'Request'}</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Status Messages */}
                {status === 'success' && (
                    <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 animate-in fade-in slide-in-from-bottom-2">
                        <CheckCircle size={20} className="shrink-0" />
                        <span className="font-bold text-sm">Message sent successfully! We'll review it shortly.</span>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 animate-in fade-in slide-in-from-bottom-2">
                        <AlertCircle size={20} className="shrink-0" />
                        <span className="font-bold text-sm">Something went wrong. Please try again later.</span>
                    </div>
                )}
            </div>
        </div>
    );
}
