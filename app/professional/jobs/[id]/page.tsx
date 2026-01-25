"use client"

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ChevronLeft, Building2, Calendar, MapPin,
    Send, CheckCircle2, AlertCircle, Info, Shield, Check
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import FollowButton from '@/app/components/network/FollowButton';

interface FormField {
    id: string;
    type: 'text' | 'number' | 'radio' | 'checkbox';
    label: string;
    options?: string[];
    required: boolean;
}

interface Job {
    id: string;
    title: string;
    description: string;
    location?: string;
    location_type?: string;
    formSchema: FormField[];
    company: {
        id: string;
        name: string;
        logoUrl?: string;
    };
}

export default function JobApplyPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const router = useRouter();
    const { id } = useParams();
    const [job, setJob] = useState<Job | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [availableCards, setAvailableCards] = useState<string[]>([]);
    const [accessList, setAccessList] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchJobData = async () => {
            try {
                const [jobRes, cardRes, accessRes] = await Promise.all([
                    fetch(`/api/professional/jobs/${id}`),
                    fetch('/api/professional/cards'),
                    fetch('/api/documents?type=access_control')
                ]);

                if (jobRes.ok) {
                    const data = await jobRes.json();
                    setJob(data);
                }
                if (cardRes.ok) {
                    const data = await cardRes.json();
                    if (data.cards) {
                        setAvailableCards(data.cards);
                    }
                }
                // Load saved permissions from home page access control
                if (accessRes.ok) {
                    const data = await accessRes.json();
                    if (data.content) {
                        try {
                            const savedPermissions = JSON.parse(data.content);
                            setAccessList(savedPermissions);
                        } catch (e) {
                            console.error("Error parsing access control", e);
                            // Fallback to RESUME only
                            setAccessList(['RESUME']);
                        }
                    } else {
                        // Default to RESUME if no permissions saved
                        setAccessList(['RESUME']);
                    }
                } else {
                    setAccessList(['RESUME']);
                }
            } catch (error) {
                console.error("Error fetching job data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchJobData();
    }, [id]);

    const handleInputChange = (fieldId: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleCheckboxChange = (fieldId: string, option: string, checked: boolean) => {
        const currentOptions = formData[fieldId] || [];
        const newOptions = checked
            ? [...currentOptions, option]
            : currentOptions.filter((o: string) => o !== option);
        setFormData(prev => ({ ...prev, [fieldId]: newOptions }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`/api/professional/jobs/${id}/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ formData, accessList })
            });
            if (res.ok) {
                setSubmitted(true);
            } else {
                alert("Submission failed. Please check your network connection.");
            }
        } catch (error) {
            console.error("Submit error", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-white/20 border-t-white' : 'border-black/20 border-t-black'}`}></div>
        </div>
    );

    if (!job) return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
            <AlertCircle size={48} className="text-red-500 opacity-50" />
            <p className={`font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-neutral-500'}`}>Job post no longer available</p>
            <button onClick={() => router.back()} className={`font-bold hover:underline uppercase text-xs ${isDark ? 'text-white' : 'text-black'}`}>Go Back</button>
        </div>
    );

    if (submitted) return (
        <div className="p-8 max-w-2xl mx-auto py-32 text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/20">
                <CheckCircle2 size={48} className="text-emerald-500" />
            </div>
            <div className="space-y-4">
                <h1 className={`text-4xl font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>Application Sent!</h1>
                <p className={isDark ? 'text-slate-400 leading-relaxed' : 'text-neutral-600 leading-relaxed'}>
                    Your encrypted application has been delivered to <span className="font-bold">{job.company.name}</span>.
                    The employer now has access to your professional profile. You'll be notified if they request an interview.
                </p>
            </div>
            <button
                onClick={() => router.push('/professional/feed')}
                className={`px-10 py-4 border rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 ${isDark ? 'bg-slate-900 border-slate-700 hover:border-white/50 text-white' : 'bg-white border-neutral-200 hover:border-black/50 text-black'}`}
            >
                Return to Dashboard
            </button>
        </div>
    );

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-12 pb-32">

            <header className={`flex flex-col md:flex-row md:items-start justify-between gap-8 border-b pb-12 ${isDark ? 'border-slate-800' : 'border-neutral-200'}`}>
                <div className="space-y-6 text-left">
                    <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br border-2 shadow-2xl flex items-center justify-center overflow-hidden ${isDark ? 'from-slate-700 to-slate-800 border-slate-700' : 'from-neutral-100 to-neutral-200 border-neutral-200'}`}>
                        {job.company.logoUrl ? (
                            <img src={job.company.logoUrl} alt={job.company.name} className="w-full h-full object-cover" />
                        ) : (
                            <Building2 size={32} className={isDark ? 'text-slate-500' : 'text-neutral-400'} />
                        )}
                    </div>
                    <div className="space-y-2">
                        <h1 className={`text-5xl font-black leading-none uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>{job.title}</h1>
                        <div className={`flex flex-wrap items-center gap-6 text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-neutral-500'}`}>
                            <span className={`flex items-center gap-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                <Building2 size={16} /> {job.company.name}
                                <FollowButton targetId={job.company.id} type="company" size="sm" variant="ghost" className="ml-2" />
                            </span>
                            <span className="flex items-center gap-2">
                                <MapPin size={16} />
                                {job.location_type ? job.location_type.charAt(0).toUpperCase() + job.location_type.slice(1) : 'Remote'}
                                {job.location && <span className={isDark ? 'text-slate-400' : 'text-neutral-400'}> — {job.location}</span>}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-12 text-left">
                {/* APPLICATION FORM - First on mobile */}
                <div className="lg:w-2/3 order-1">
                    <form onSubmit={handleSubmit} className={`border rounded-[40px] p-10 space-y-8 shadow-2xl ${isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-neutral-200'}`}>
                        <div className={`space-y-2 border-b pb-6 mb-8 ${isDark ? 'border-slate-800' : 'border-neutral-200'}`}>
                            <h3 className={`text-2xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Application Questionnaire</h3>
                            <p className={`text-xs font-bold uppercase ${isDark ? 'text-slate-500' : 'text-neutral-500'}`}>Please answer the following questions to help us evaluate your fit.</p>
                        </div>

                        {job.formSchema.map((field) => (
                            <div key={field.id} className="space-y-3">
                                <label className={`text-sm font-black uppercase tracking-wide flex items-baseline gap-2 ${isDark ? 'text-slate-300' : 'text-neutral-700'}`}>
                                    {field.label}
                                    {field.required && <span className="text-red-500 text-xs">*</span>}
                                </label>

                                {field.type === 'text' && (
                                    <input
                                        type="text"
                                        required={field.required}
                                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                                        className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all font-medium ${isDark ? 'bg-slate-900 border-slate-800 text-white focus:ring-white/20' : 'bg-neutral-50 border-neutral-200 text-black focus:ring-black/10'}`}
                                    />
                                )}

                                {field.type === 'number' && (
                                    <input
                                        type="number"
                                        required={field.required}
                                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                                        className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all font-medium ${isDark ? 'bg-slate-900 border-slate-800 text-white focus:ring-white/20' : 'bg-neutral-50 border-neutral-200 text-black focus:ring-black/10'}`}
                                    />
                                )}

                                {field.type === 'radio' && field.options && (
                                    <div className="grid grid-cols-1 gap-2">
                                        {field.options.map((opt, i) => (
                                            <label key={i} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${formData[field.id] === opt ? (isDark ? 'bg-white/10 border-white text-white' : 'bg-black/5 border-black text-black') : (isDark ? 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700' : 'bg-neutral-50 border-neutral-200 text-neutral-500 hover:border-neutral-300')}`}>
                                                <input
                                                    type="radio"
                                                    name={field.id}
                                                    required={field.required}
                                                    onChange={() => handleInputChange(field.id, opt)}
                                                    className="hidden"
                                                />
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData[field.id] === opt ? (isDark ? 'border-white' : 'border-black') : (isDark ? 'border-slate-700' : 'border-neutral-300')}`}>
                                                    {formData[field.id] === opt && <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} />}
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-widest">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {field.type === 'checkbox' && field.options && (
                                    <div className="grid grid-cols-1 gap-2">
                                        {field.options.map((opt, i) => (
                                            <label key={i} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${formData[field.id]?.includes(opt) ? (isDark ? 'bg-white/10 border-white text-white' : 'bg-black/5 border-black text-black') : (isDark ? 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700' : 'bg-neutral-50 border-neutral-200 text-neutral-500 hover:border-neutral-300')}`}>
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => handleCheckboxChange(field.id, opt, e.target.checked)}
                                                    className="hidden"
                                                />
                                                <div className={`w-4 h-4 border-2 rounded ${formData[field.id]?.includes(opt) ? (isDark ? 'border-white bg-white' : 'border-black bg-black') : (isDark ? 'border-slate-700' : 'border-neutral-300')}`} />
                                                <span className="text-xs font-bold uppercase tracking-widest">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* PROFILE ACCESS INFO - Auto-applied from home settings */}
                        <div className={`space-y-4 pt-8 border-t ${isDark ? 'border-slate-800' : 'border-neutral-200'}`}>
                            <div className="flex items-center gap-3">
                                <Shield size={20} className="text-emerald-400" />
                                <h3 className={`text-lg font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Profile Access</h3>
                            </div>
                            <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                                <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-neutral-500'}`}>The following cards will be shared (managed in Home &gt; Manage Permissions):</p>
                                <div className="flex flex-wrap gap-2">
                                    {accessList.length === 0 ? (
                                        <span className={`text-xs italic ${isDark ? 'text-slate-500' : 'text-neutral-400'}`}>No cards selected - go to Home to manage permissions</span>
                                    ) : (
                                        accessList.map((card) => (
                                            <span key={card} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                {card}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 mt-8 ${isDark ? 'bg-white text-black hover:bg-neutral-200 shadow-white/20' : 'bg-black text-white hover:bg-neutral-800 shadow-black/20'}`}
                        >
                            <Send size={18} />
                            {submitting ? 'Encrypting & Sending...' : 'Submit Secured Application'}
                        </button>
                    </form>
                </div>

                {/* JOB DESCRIPTION - Second on mobile, sidebar on desktop */}
                <div className="lg:w-1/3 space-y-6 order-2">
                    <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-3 ${isDark ? 'text-white' : 'text-black'}`}>
                        <div className={`w-1.5 h-6 rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} />
                        Description
                    </h3>
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-slate-400' : 'text-neutral-600'}`}>{job.description}</p>

                    <div className={`p-6 border rounded-3xl space-y-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                        <div className={`flex items-center gap-3 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                            <Info size={18} />
                            <h4 className="text-xs font-black uppercase tracking-widest">Secure Info</h4>
                        </div>
                        <p className={`text-[10px] leading-relaxed font-bold uppercase ${isDark ? 'text-slate-500' : 'text-neutral-500'}`}>
                            Your application is protected with End-to-End Encryption.
                            Only authorized recruitment officers from this entity can view your data.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

