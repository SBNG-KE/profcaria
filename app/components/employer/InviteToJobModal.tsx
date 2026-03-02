"use client"

import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, CheckCircle2, Loader2, Briefcase } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface Job {
    id: string;
    title: string;
    location: string;
    isActive: boolean;
}

interface InviteToJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    professionalId: string;
    professionalName: string;
}

export default function InviteToJobModal({ isOpen, onClose, professionalId, professionalName }: InviteToJobModalProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [jobs, setJobs] = useState<Job[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [selectedJobId, setSelectedJobId] = useState<string>('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen && jobs.length === 0) {
            const fetchJobs = async () => {
                try {
                    setLoadingJobs(true);
                    const res = await fetch('/api/employer/jobs');
                    if (res.ok) {
                        const data = await res.json();
                        // Only active jobs
                        const activeJobs = (data.jobs || []).filter((j: Job) => j.isActive);
                        setJobs(activeJobs);
                        if (activeJobs.length > 0) {
                            setSelectedJobId(activeJobs[0].id);
                        }
                    }
                } catch (err) {
                    console.error('Failed to load jobs', err);
                    setError('Failed to load your jobs');
                } finally {
                    setLoadingJobs(false);
                }
            };
            fetchJobs();
        }
    }, [isOpen]);

    const handleInvite = async () => {
        if (!selectedJobId) return;

        setSending(true);
        setError('');

        try {
            const res = await fetch(`/api/employer/jobs/${selectedJobId}/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ professionalId, message })
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    setMessage('');
                }, 2000);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to send invite');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`relative w-full max-w-lg rounded-2xl shadow-xl overflow-hidden ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white'}`}>

                {/* Header */}
                <div className={`px-6 py-4 flex items-center justify-between border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                    <div className="flex items-center gap-2">
                        <Sparkles size={20} className="text-amber-500" />
                        <h2 className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                            Invite {professionalName}
                        </h2>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}>
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center animate-in zoom-in duration-300">
                            <CheckCircle2 size={48} className="text-emerald-500 mb-4" />
                            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Invite Sent!</h3>
                            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                They can accept this invite to instantly apply to the role without a long form.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                Invite this professional directly to one of your active roles. High-quality invites get 3x more responses.
                            </p>

                            {error && (
                                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <div>
                                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Select Job Role</label>
                                {loadingJobs ? (
                                    <div className={`w-full p-3 rounded-xl border flex items-center gap-2 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`}>
                                        <Loader2 size={16} className="animate-spin text-neutral-400" />
                                        <span className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Loading active jobs...</span>
                                    </div>
                                ) : jobs.length === 0 ? (
                                    <div className={`p-4 rounded-xl border border-dashed flex items-center gap-3 ${isDark ? 'border-neutral-700 bg-neutral-800/50' : 'border-neutral-300 bg-neutral-50'}`}>
                                        <Briefcase size={20} className={isDark ? 'text-neutral-500' : 'text-neutral-400'} />
                                        <div>
                                            <p className={`text-sm font-bold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>No active jobs found</p>
                                            <p className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>You need to post a job before you can send an invite.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <select
                                        value={selectedJobId}
                                        onChange={(e) => setSelectedJobId(e.target.value)}
                                        className={`w-full p-3 rounded-xl border appearance-none text-sm outline-none transition-all ${isDark ? 'bg-neutral-800 border-neutral-700 text-white focus:border-neutral-600 focus:bg-neutral-700' : 'bg-white border-neutral-200 text-black focus:border-neutral-400 focus:bg-neutral-50'}`}
                                    >
                                        {jobs.map(job => (
                                            <option key={job.id} value={job.id}>
                                                {job.title} {job.location && `- ${job.location}`}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    Personalized Message <span className="opacity-60">(Optional)</span>
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="e.g. Hi there! We're impressed by your career score and verification graph. We think you'd be a perfect fit for this role."
                                    rows={4}
                                    className={`w-full p-3 rounded-xl border text-sm outline-none transition-all resize-none ${isDark ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500 focus:border-neutral-600 focus:bg-neutral-700' : 'bg-white border-neutral-200 text-black placeholder-neutral-400 focus:border-neutral-400 focus:bg-neutral-50'}`}
                                    maxLength={500}
                                />
                                <div className="flex justify-end mt-1">
                                    <span className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                        {message.length} / 500
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className={`px-6 py-4 flex items-center justify-end gap-3 border-t ${isDark ? 'border-neutral-800 bg-neutral-900/50' : 'border-neutral-200 bg-neutral-50/50'}`}>
                        <button
                            onClick={onClose}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isDark ? 'text-neutral-400 hover:bg-neutral-800 hover:text-white' : 'text-neutral-600 hover:bg-neutral-200/50 hover:text-black'}`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleInvite}
                            disabled={sending || jobs.length === 0 || !selectedJobId}
                            className="px-5 py-2 rounded-lg text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
                        >
                            {sending && <Loader2 size={16} className="animate-spin" />}
                            {sending ? 'Sending...' : 'Send Invite'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
