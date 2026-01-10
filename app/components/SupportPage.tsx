"use client";

import React, { useState } from 'react';
import { MessageSquare, Bug, Lightbulb, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function SupportPage() {
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
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                        How can we help?
                    </h1>
                    <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
                        Your feedback drives our innovation. Whether it's a bug or a brilliant idea, we want to hear it.
                    </p>
                </div>

                {/* Type Selection */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setType('issue')}
                        className={`p-6 rounded-2xl border transition-all duration-300 group relative overflow-hidden ${type === 'issue'
                                ? 'bg-red-500/10 border-red-500/50 shadow-xl shadow-red-500/10'
                                : 'bg-[#0f172a] border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                            }`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent transition-opacity duration-300 ${type === 'issue' ? 'opacity-100' : 'opacity-0'}`} />
                        <div className="relative flex flex-col items-center gap-3">
                            <Bug size={32} className={`transition-colors duration-300 ${type === 'issue' ? 'text-red-400' : 'text-slate-500 group-hover:text-red-400'}`} />
                            <span className={`font-black uppercase tracking-widest text-xs ${type === 'issue' ? 'text-red-100' : 'text-slate-400 group-hover:text-white'}`}>
                                Report Issue
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={() => setType('feature')}
                        className={`p-6 rounded-2xl border transition-all duration-300 group relative overflow-hidden ${type === 'feature'
                                ? 'bg-amber-500/10 border-amber-500/50 shadow-xl shadow-amber-500/10'
                                : 'bg-[#0f172a] border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                            }`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent transition-opacity duration-300 ${type === 'feature' ? 'opacity-100' : 'opacity-0'}`} />
                        <div className="relative flex flex-col items-center gap-3">
                            <Lightbulb size={32} className={`transition-colors duration-300 ${type === 'feature' ? 'text-amber-400' : 'text-slate-500 group-hover:text-amber-400'}`} />
                            <span className={`font-black uppercase tracking-widest text-xs ${type === 'feature' ? 'text-amber-100' : 'text-slate-400 group-hover:text-white'}`}>
                                Request Feature
                            </span>
                        </div>
                    </button>
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative group">
                        <div className={`absolute -inset-0.5 rounded-2xl blur opacity-30 transition duration-500 group-hover:opacity-75 ${type === 'issue' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                        <div className="relative">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={type === 'issue' ? "Describe the issue you're facing..." : "Tell us about your feature idea..."}
                                className="w-full h-48 bg-[#0f172a] border border-slate-700 text-white rounded-2xl p-6 text-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all resize-none placeholder:text-slate-600 font-medium"
                                style={{
                                    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)'
                                }}
                            />
                            <div className={`absolute top-4 right-4 p-2 rounded-lg bg-slate-900/50 border border-t-white/10 border-white/5 backdrop-blur-sm pointer-events-none`}>
                                <MessageSquare size={16} className="text-slate-500" />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting || !message.trim()}
                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group ${type === 'issue'
                                ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-red-600/20'
                                : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-amber-600/20'
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
