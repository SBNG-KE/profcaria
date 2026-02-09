'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '@/app/context/ThemeContext';
import { Building2, Check, Send, AlertCircle, User, Clock, X } from 'lucide-react';

interface Question {
    id: string;
    label: string;
}

interface ReferenceRequest {
    id: string;
    professionalName: string;
    requestingCompanyName: string;
    targetCompanyName: string;
    questions: Question[];
    customMessage: string | null;
    status: string;
    response: Record<string, string> | null;
    respondedAt: string | null;
    createdAt: string;
}

export default function ReferenceResponsePage() {
    const params = useParams();
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [request, setRequest] = useState<ReferenceRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [responses, setResponses] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [declining, setDeclining] = useState(false);
    const [declined, setDeclined] = useState(false);

    const requestId = params.id as string;

    useEffect(() => {
        if (!requestId) return;

        fetch(`/api/employer/references/${requestId}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setRequest(data);
                    // If already responded, load the responses
                    if (data.response) {
                        setResponses(data.response);
                        setSubmitted(true);
                    }
                }
            })
            .catch(err => {
                console.error('Error fetching reference:', err);
                setError('Failed to load reference request');
            })
            .finally(() => setLoading(false));
    }, [requestId]);

    const handleSubmit = async () => {
        // Check if at least one question is answered
        const answeredCount = Object.values(responses).filter(v => v.trim()).length;
        if (answeredCount === 0) {
            setError('Please answer at least one question');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`/api/employer/references/${requestId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ responses })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to submit response');
            }

            setSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDecline = async () => {
        if (!confirm('Are you sure you want to decline this reference request? This action cannot be undone.')) {
            return;
        }

        setDeclining(true);
        setError(null);

        try {
            const res = await fetch(`/api/employer/references/${requestId}`, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to decline request');
            }

            setDeclined(true);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setDeclining(false);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black' : 'bg-neutral-50'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span className={isDark ? 'text-white' : 'text-black'}>Loading reference request...</span>
                </div>
            </div>
        );
    }

    if (error && !request) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-black' : 'bg-neutral-50'}`}>
                <div className={`max-w-md p-8 rounded-3xl text-center ${isDark ? 'bg-neutral-900' : 'bg-white'} shadow-xl`}>
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${isDark ? 'bg-red-500/20' : 'bg-red-50'}`}>
                        <AlertCircle size={32} className="text-red-500" />
                    </div>
                    <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Reference Not Found</h1>
                    <p className={`mb-6 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{error}</p>
                    <button
                        onClick={() => router.push('/employer')}
                        className={`px-6 py-3 rounded-xl font-bold ${isDark ? 'bg-white text-black' : 'bg-black text-white'}`}
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!request) return null;

    // Already declined view
    if (declined || request.status === 'declined') {
        return (
            <div className={`min-h-screen py-12 px-4 ${isDark ? 'bg-black' : 'bg-neutral-50'}`}>
                <div className={`max-w-2xl mx-auto p-8 sm:p-12 rounded-[32px] ${isDark ? 'bg-neutral-900' : 'bg-white'} shadow-xl`}>
                    <div className="text-center">
                        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                            <X size={40} className={isDark ? 'text-neutral-400' : 'text-neutral-500'} />
                        </div>
                        <h1 className={`text-2xl sm:text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                            Request Declined
                        </h1>
                        <p className={`${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            You have declined to provide a reference for {request.professionalName}.
                            {request.requestingCompanyName} has been notified.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Already submitted view
    if (submitted || request.status === 'responded') {
        return (
            <div className={`min-h-screen py-12 px-4 ${isDark ? 'bg-black' : 'bg-neutral-50'}`}>
                <div className={`max-w-2xl mx-auto p-8 sm:p-12 rounded-[32px] ${isDark ? 'bg-neutral-900' : 'bg-white'} shadow-xl`}>
                    <div className="text-center mb-8">
                        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}>
                            <Check size={40} className="text-emerald-500" />
                        </div>
                        <h1 className={`text-2xl sm:text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                            Reference Submitted
                        </h1>
                        <p className={`${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            Thank you for providing a reference for {request.professionalName}
                        </p>
                    </div>

                    <div className={`p-6 rounded-2xl border mb-6 ${isDark ? 'bg-neutral-800/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200'}`}>
                        <h2 className={`text-sm font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            Your Responses
                        </h2>
                        <div className="space-y-4">
                            {request.questions.map(q => (
                                <div key={q.id}>
                                    <p className={`text-sm font-medium mb-1 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>{q.label}</p>
                                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                        {responses[q.id] || request.response?.[q.id] || 'Not answered'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className={`text-center text-sm ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        {request.requestingCompanyName} has been notified of your response.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen py-8 sm:py-12 px-4 ${isDark ? 'bg-black' : 'bg-neutral-50'}`}>
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className={`p-6 sm:p-8 rounded-t-[32px] ${isDark ? 'bg-neutral-900' : 'bg-white'}`}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                            <User size={28} className={isDark ? 'text-neutral-400' : 'text-neutral-500'} />
                        </div>
                        <div>
                            <h1 className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>
                                Reference Request
                            </h1>
                            <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                for {request.professionalName}
                            </p>
                        </div>
                    </div>

                    <div className={`flex flex-wrap gap-4 text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        <div className="flex items-center gap-2">
                            <Building2 size={14} />
                            <span>Requested by <strong className={isDark ? 'text-neutral-300' : 'text-neutral-700'}>{request.requestingCompanyName}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Custom Message */}
                {request.customMessage && (
                    <div className={`px-6 sm:px-8 py-4 border-t ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-100'}`}>
                        <div className={`p-4 rounded-xl border-l-4 ${isDark ? 'bg-blue-500/10 border-blue-500' : 'bg-blue-50 border-blue-500'}`}>
                            <p className={`text-sm font-medium mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Message from {request.requestingCompanyName}:</p>
                            <p className={`text-sm ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>"{request.customMessage}"</p>
                        </div>
                    </div>
                )}

                {/* Questions */}
                <div className={`p-6 sm:p-8 border-t ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-100'}`}>
                    <h2 className={`text-sm font-bold uppercase tracking-widest mb-6 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Please Answer the Following Questions
                    </h2>

                    <div className="space-y-6">
                        {request.questions.map((q, index) => (
                            <div key={q.id}>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                                    {index + 1}. {q.label}
                                </label>
                                <textarea
                                    value={responses[q.id] || ''}
                                    onChange={(e) => setResponses({ ...responses, [q.id]: e.target.value })}
                                    placeholder="Your answer..."
                                    rows={3}
                                    className={`w-full p-4 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 ${isDark
                                        ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:ring-neutral-500'
                                        : 'bg-neutral-50 border-neutral-200 text-black placeholder:text-neutral-400 focus:ring-neutral-400'
                                        }`}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className={`mt-6 p-4 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                            <AlertCircle size={20} className="text-red-500" />
                            <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`p-6 sm:p-8 rounded-b-[32px] border-t flex items-center justify-between gap-4 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-100'}`}>
                    <button
                        onClick={handleDecline}
                        disabled={declining || submitting}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDark
                                ? 'border border-neutral-700 text-neutral-400 hover:text-red-400 hover:border-red-500/50'
                                : 'border border-neutral-200 text-neutral-600 hover:text-red-600 hover:border-red-200'
                            }`}
                    >
                        {declining ? (
                            <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Declining...</>
                        ) : (
                            <><X size={16} />I prefer not to respond</>
                        )}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || declining}
                        className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDark
                            ? 'bg-white text-black hover:bg-neutral-200'
                            : 'bg-black text-white hover:bg-neutral-800'
                            }`}
                    >
                        {submitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send size={16} />
                                Submit Reference
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
