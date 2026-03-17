'use client';

import { useState } from 'react';
import { X, Send, Check, Building2, AlertCircle } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

// Reference questions (must match API)
const REFERENCE_QUESTIONS = [
    { id: 'work_quality', label: 'How would you rate the quality of their work?' },
    { id: 'reliability', label: 'Was this person reliable and punctual?' },
    { id: 'teamwork', label: 'How well did they work with others?' },
    { id: 'communication', label: 'How would you rate their communication skills?' },
    { id: 'problem_solving', label: 'How effective were they at solving problems?' },
    { id: 'leadership', label: 'Did they show leadership qualities?' },
    { id: 'adaptability', label: 'How well did they adapt to changes?' },
    { id: 'rehire', label: 'Would you rehire this person?' },
    { id: 'reason_left', label: 'Why did they leave your organization?' },
    { id: 'strengths', label: 'What are their greatest strengths?' },
    { id: 'improvements', label: 'What areas could they improve?' },
    { id: 'recommendation', label: 'Would you recommend them for this role?' }
];

interface ReferenceRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    applicationId: string;
    employment: {
        id: string;
        companyId: string;
        companyName: string;
        companyLogo: string | null;
        companyEmail: string | null;
        jobTitle: string;
    };
}

export default function ReferenceRequestModal({
    isOpen,
    onClose,
    applicationId,
    employment
}: ReferenceRequestModalProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([
        'work_quality', 'reliability', 'teamwork', 'rehire' // Default selections
    ]);
    const [customMessage, setCustomMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleQuestion = (questionId: string) => {
        setSelectedQuestions(prev =>
            prev.includes(questionId)
                ? prev.filter(id => id !== questionId)
                : [...prev, questionId]
        );
    };

    const handleSend = async () => {
        if (!employment.companyEmail) {
            setError('No email available for this company');
            return;
        }

        if (selectedQuestions.length === 0) {
            setError('Please select at least one question');
            return;
        }

        setSending(true);
        setError(null);

        try {
            const response = await fetch('/api/employer/references/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId,
                    targetEmploymentId: employment.id,
                    targetCompanyId: employment.companyId,
                    targetCompanyEmail: employment.companyEmail,
                    questionIds: selectedQuestions,
                    customMessage: customMessage.trim() || null
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send request');
            }

            setSent(true);
            setTimeout(() => {
                onClose();
                setSent(false);
                setSelectedQuestions(['work_quality', 'reliability', 'teamwork', 'rehire']);
                setCustomMessage('');
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[32px] ${isDark ? 'bg-neutral-900' : 'bg-white'} shadow-2xl animate-in fade-in zoom-in-95 duration-300`}>

                {/* Header */}
                <div className={`p-6 sm:p-8 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center overflow-hidden border ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-200'}`}>
                                {employment.companyLogo ? (
                                    <img src={employment.companyLogo} alt={employment.companyName} className="w-full h-full object-cover" />
                                ) : (
                                    <Building2 size={24} className={isDark ? 'text-neutral-500' : 'text-neutral-400'} />
                                )}
                            </div>
                            <div>
                                <h2 className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                                    Request Reference
                                </h2>
                                <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                    from {employment.companyName}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Success State */}
                {sent ? (
                    <div className="p-10 flex flex-col items-center justify-center text-center">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-[#3B5998]/20' : 'bg-[#3B5998]/5'}`}>
                            <Check size={40} className="text-[#3B5998]" />
                        </div>
                        <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Request Sent!</h3>
                        <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            {employment.companyName} will receive your reference request at {employment.companyEmail}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Content */}
                        <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(90vh-200px)]">

                            {/* Email Notice */}
                            {!employment.companyEmail ? (
                                <div className={`p-4 rounded-xl border flex items-start gap-3 mb-6 ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                                    <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                                    <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                        No email address is available for this company. Reference request cannot be sent.
                                    </p>
                                </div>
                            ) : (
                                <div className={`p-4 rounded-xl border flex items-start gap-3 mb-6 ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
                                    <Send size={20} className={`shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                    <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>
                                        Your request will be sent to <strong>{employment.companyEmail}</strong>
                                    </p>
                                </div>
                            )}

                            {/* Question Selection */}
                            <div className="mb-6">
                                <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    Select Questions ({selectedQuestions.length} selected)
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {REFERENCE_QUESTIONS.map((q) => (
                                        <button
                                            key={q.id}
                                            onClick={() => toggleQuestion(q.id)}
                                            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${selectedQuestions.includes(q.id)
                                                    ? (isDark
                                                        ? 'bg-white text-black border-white'
                                                        : 'bg-black text-white border-black')
                                                    : (isDark
                                                        ? 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600 text-white'
                                                        : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300 text-black')
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${selectedQuestions.includes(q.id)
                                                    ? (isDark ? 'bg-black' : 'bg-white')
                                                    : (isDark ? 'bg-neutral-700' : 'bg-neutral-200')
                                                }`}>
                                                {selectedQuestions.includes(q.id) && (
                                                    <Check size={14} className={isDark ? 'text-white' : 'text-black'} />
                                                )}
                                            </div>
                                            <span className="text-sm font-medium">{q.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Message */}
                            <div>
                                <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    Custom Message (Optional)
                                </h3>
                                <textarea
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    placeholder="Add a personal note to the reference request..."
                                    rows={3}
                                    className={`w-full p-4 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 ${isDark
                                            ? 'bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:ring-neutral-500'
                                            : 'bg-neutral-50 border-neutral-200 text-black placeholder:text-neutral-400 focus:ring-neutral-400'
                                        }`}
                                    maxLength={500}
                                />
                                <p className={`text-[10px] mt-2 ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>
                                    {customMessage.length}/500 characters
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className={`mt-4 p-4 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                                    <AlertCircle size={20} className="text-red-500" />
                                    <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className={`p-6 sm:p-8 border-t flex items-center justify-between gap-4 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                            <button
                                onClick={onClose}
                                className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors ${isDark
                                        ? 'text-neutral-400 hover:text-white'
                                        : 'text-neutral-500 hover:text-black'
                                    }`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={sending || !employment.companyEmail || selectedQuestions.length === 0}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDark
                                        ? 'bg-white text-black hover:bg-neutral-200'
                                        : 'bg-black text-white hover:bg-neutral-800'
                                    }`}
                            >
                                {sending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Send Request
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
