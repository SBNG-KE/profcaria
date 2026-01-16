"use client";

import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
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
        <div className="min-h-screen bg-[#050b14] text-slate-200 font-sans selection:bg-blue-500/30">
            {/* Background Glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-emerald-600/5 blur-[100px] rounded-full" />
                <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[30%] bg-blue-900/10 blur-[150px] rounded-full" />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">

                    {/* Back Link */}
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={16} />
                        Back to Home
                    </Link>

                    {/* Header */}
                    <div className="text-center space-y-3">
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                            Contact Us
                        </h1>
                        <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
                            Have a question or want to get in touch? Send us a message and we'll get back to you.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Input */}
                        <div className="relative group">
                            <div className="absolute -inset-0.5 rounded-2xl blur opacity-20 transition duration-500 group-hover:opacity-50 bg-blue-500"></div>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Your email address"
                                    required
                                    className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-2xl px-6 py-4 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600 font-medium"
                                    style={{
                                        boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)'
                                    }}
                                />
                                <div className="absolute top-1/2 -translate-y-1/2 right-4 p-2 rounded-lg bg-slate-900/50 border border-t-white/10 border-white/5 backdrop-blur-sm pointer-events-none">
                                    <Mail size={16} className="text-slate-500" />
                                </div>
                            </div>
                        </div>

                        {/* Message Textarea */}
                        <div className="relative group">
                            <div className="absolute -inset-0.5 rounded-2xl blur opacity-20 transition duration-500 group-hover:opacity-50 bg-blue-500"></div>
                            <div className="relative">
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Write your message here..."
                                    required
                                    className="w-full h-48 bg-[#0f172a] border border-slate-700 text-white rounded-2xl p-6 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none placeholder:text-slate-600 font-medium"
                                    style={{
                                        boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !message.trim() || !email.trim()}
                            className="w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-blue-600/20"
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
                        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 animate-in fade-in slide-in-from-bottom-2">
                            <CheckCircle size={20} className="shrink-0" />
                            <span className="font-bold text-sm">Message sent successfully! We'll get back to you soon.</span>
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
        </div>
    );
}
