"use client"

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ChevronLeft, Building2, Calendar, MapPin,
    Send, CheckCircle2, AlertCircle, Info, Shield, Check
} from 'lucide-react';

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
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
    );

    if (!job) return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
            <AlertCircle size={48} className="text-red-500 opacity-50" />
            <p className="font-bold text-slate-500 uppercase tracking-widest">Job post no longer available</p>
            <button onClick={() => router.back()} className="text-blue-500 font-bold hover:underline uppercase text-xs">Go Back</button>
        </div>
    );

    if (submitted) return (
        <div className="p-8 max-w-2xl mx-auto py-32 text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/20">
                <CheckCircle2 size={48} className="text-emerald-500" />
            </div>
            <div className="space-y-4">
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Application Sent!</h1>
                <p className="text-slate-400 leading-relaxed">
                    Your encrypted application has been delivered to <span className="text-blue-400 font-bold">{job.company.name}</span>.
                    The employer now has access to your professional profile. You'll be notified if they request an interview.
                </p>
            </div>
            <button
                onClick={() => router.push('/professional/home')}
                className="px-10 py-4 bg-slate-900 border border-slate-700 hover:border-blue-500/50 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
            >
                Return to Dashboard
            </button>
        </div>
    );

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-12 pb-32">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-500 hover:text-white transition-all font-bold uppercase text-[10px] tracking-widest"
            >
                <ChevronLeft size={16} /> Back to Search
            </button>

            <header className="flex flex-col md:flex-row md:items-start justify-between gap-8 border-b border-slate-800 pb-12">
                <div className="space-y-6 text-left">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-700 shadow-2xl flex items-center justify-center overflow-hidden">
                        {job.company.logoUrl ? (
                            <img src={job.company.logoUrl} alt={job.company.name} className="w-full h-full object-cover" />
                        ) : (
                            <Building2 size={32} className="text-slate-500" />
                        )}
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-5xl font-black text-white leading-none uppercase tracking-tighter">{job.title}</h1>
                        <div className="flex flex-wrap items-center gap-6 text-slate-500 text-xs font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-2 text-blue-400"><Building2 size={16} /> {job.company.name}</span>
                            <span className="flex items-center gap-2">
                                <MapPin size={16} />
                                {job.location_type ? job.location_type.charAt(0).toUpperCase() + job.location_type.slice(1) : 'Remote'}
                                {job.location && <span className="text-slate-400"> — {job.location}</span>}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-left">
                {/* JOB DESCRIPTION */}
                <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                        Description
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>

                    <div className="p-6 bg-blue-600/5 border border-blue-500/10 rounded-3xl space-y-4">
                        <div className="flex items-center gap-3 text-blue-400">
                            <Info size={18} />
                            <h4 className="text-xs font-black uppercase tracking-widest">Secure Info</h4>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase">
                            Your application is encrypted using AES-256 and PQC Concept validation.
                            Only authorized recruitment officers from this entity can decrypt your data.
                        </p>
                    </div>
                </div>

                {/* APPLICATION FORM */}
                <div className="lg:col-span-2 order-1 lg:order-2">
                    <form onSubmit={handleSubmit} className="bg-[#0f172a] border border-slate-800 rounded-[40px] p-10 space-y-8 shadow-2xl">
                        <div className="space-y-2 border-b border-slate-800 pb-6 mb-8">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Application Questionnaire</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase">Please answer the following questions to help us evaluate your fit.</p>
                        </div>

                        {job.formSchema.map((field) => (
                            <div key={field.id} className="space-y-3">
                                <label className="text-sm font-black text-slate-300 uppercase tracking-wide flex items-baseline gap-2">
                                    {field.label}
                                    {field.required && <span className="text-red-500 text-xs">*</span>}
                                </label>

                                {field.type === 'text' && (
                                    <input
                                        type="text"
                                        required={field.required}
                                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium"
                                    />
                                )}

                                {field.type === 'number' && (
                                    <input
                                        type="number"
                                        required={field.required}
                                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium"
                                    />
                                )}

                                {field.type === 'radio' && field.options && (
                                    <div className="grid grid-cols-1 gap-2">
                                        {field.options.map((opt, i) => (
                                            <label key={i} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${formData[field.id] === opt ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                                                <input
                                                    type="radio"
                                                    name={field.id}
                                                    required={field.required}
                                                    onChange={() => handleInputChange(field.id, opt)}
                                                    className="hidden"
                                                />
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData[field.id] === opt ? 'border-blue-500' : 'border-slate-700'}`}>
                                                    {formData[field.id] === opt && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-widest">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {field.type === 'checkbox' && field.options && (
                                    <div className="grid grid-cols-1 gap-2">
                                        {field.options.map((opt, i) => (
                                            <label key={i} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${formData[field.id]?.includes(opt) ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => handleCheckboxChange(field.id, opt, e.target.checked)}
                                                    className="hidden"
                                                />
                                                <div className={`w-4 h-4 border-2 rounded ${formData[field.id]?.includes(opt) ? 'border-blue-500 bg-blue-500' : 'border-slate-700'}`} />
                                                <span className="text-xs font-bold uppercase tracking-widest">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* PROFILE ACCESS INFO - Auto-applied from home settings */}
                        <div className="space-y-4 pt-8 border-t border-slate-800">
                            <div className="flex items-center gap-3">
                                <Shield size={20} className="text-emerald-400" />
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">Profile Access</h3>
                            </div>
                            <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                                <p className="text-xs text-slate-400 mb-3">The following cards will be shared (managed in Home &gt; Manage Permissions):</p>
                                <div className="flex flex-wrap gap-2">
                                    {accessList.length === 0 ? (
                                        <span className="text-xs text-slate-500 italic">No cards selected - go to Home to manage permissions</span>
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
                            className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-2xl shadow-blue-600/30 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 mt-8"
                        >
                            <Send size={18} />
                            {submitting ? 'Encrypting & Sending...' : 'Submit Secured Application'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
