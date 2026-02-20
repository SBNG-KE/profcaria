"use client";

import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '../context/ThemeContext';

export default function ContactPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
        <div className={`min-h-screen font-sans selection:bg-neutral-500/30 transition-colors duration-300 ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>

            {/* Navigation Header */}
            <nav className={`fixed top-0 left-0 right-0 z-50 border-b transition-colors duration-300 ${isDark ? 'bg-black/50 border-neutral-800' : 'bg-white/50 border-neutral-200'} backdrop-blur-xl`}>
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <h1 className={`text-xl md:text-2xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>
                            PROFCARIA
                        </h1>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/documentation" className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'}`}>
                            Documentation
                        </Link>
                        <Link href="/pricing" className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'}`}>
                            Pricing
                        </Link>
                        <span className={`text-[10px] font-black uppercase tracking-widest cursor-default ${isDark ? 'text-white' : 'text-black'}`}>
                            Contact Us
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className={`hidden md:flex items-center gap-2 text-sm font-bold transition-colors ${isDark ? 'text-neutral-500 hover:text-white' : 'text-neutral-400 hover:text-black'}`}
                        >
                            <ArrowLeft size={16} />
                            Back
                        </Link>
                        <Link
                            href="/auth"
                            className={`px-6 py-2.5 rounded-full text-sm font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg ${isDark ? 'bg-white text-black hover:bg-neutral-200 shadow-white/5' : 'bg-black text-white hover:bg-neutral-800 shadow-black/5'}`}
                        >
                            Join Now
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 md:p-8 pt-24">
                <div className="w-full max-w-xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">

                    {/* Header */}
                    <div className="text-center space-y-3">
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                            Contact Us
                        </h1>
                        <p className={`text-sm md:text-base max-w-lg mx-auto ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            Have a question or want to get in touch? Send us a message and we'll get back to you.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Input */}
                        <div className="relative group">
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Your email address"
                                    required
                                    className={`w-full border rounded-2xl px-6 py-4 text-base focus:outline-none focus:ring-2 transition-all font-medium ${isDark
                                        ? 'bg-neutral-900 border-neutral-800 text-white focus:ring-white/20 placeholder:text-neutral-600'
                                        : 'bg-neutral-50 border-neutral-200 text-black focus:ring-black/10 placeholder:text-neutral-400'}`}
                                />
                                <div className={`absolute top-1/2 -translate-y-1/2 right-4 p-2 rounded-lg border pointer-events-none ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                                    <Mail size={16} className={isDark ? "text-neutral-500" : "text-neutral-400"} />
                                </div>
                            </div>
                        </div>

                        {/* Message Textarea */}
                        <div className="relative group">
                            <div className="relative">
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Write your message here..."
                                    required
                                    className={`w-full h-48 border rounded-2xl p-6 text-lg focus:outline-none focus:ring-2 transition-all resize-none font-medium ${isDark
                                        ? 'bg-neutral-900 border-neutral-800 text-white focus:ring-white/20 placeholder:text-neutral-600'
                                        : 'bg-neutral-50 border-neutral-200 text-black focus:ring-black/10 placeholder:text-neutral-400'}`}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !message.trim() || !email.trim()}
                            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group ${isDark
                                ? 'bg-white text-black hover:bg-neutral-200'
                                : 'bg-black text-white hover:bg-neutral-800'}`}
                        >
                            {isSubmitting ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                                    <span>Send Message</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Status Messages */}
                    {status === 'success' && (
                        <div className={`flex items-center gap-3 p-4 border rounded-xl animate-in fade-in slide-in-from-bottom-2 ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                            <CheckCircle size={20} className="shrink-0" />
                            <span className="font-bold text-sm">Message sent successfully! We'll get back to you soon.</span>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className={`flex items-center gap-3 p-4 border rounded-xl animate-in fade-in slide-in-from-bottom-2 ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                            <AlertCircle size={20} className="shrink-0" />
                            <span className="font-bold text-sm">Something went wrong. Please try again later.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
