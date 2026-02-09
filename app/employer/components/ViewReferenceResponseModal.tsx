'use client';

import { useState, useEffect } from 'react';
import { X, Check, Clock, Eye, AlertCircle, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface ReferenceResponse {
    id: string;
    professionalName: string;
    targetCompanyName: string;
    questions: { id: string; label: string }[];
    status: 'pending' | 'sent' | 'viewed' | 'responded' | 'declined';
    response: Record<string, string> | null;
    respondedAt: string | null;
    createdAt: string;
}

interface ViewReferenceResponseModalProps {
    isOpen: boolean;
    onClose: () => void;
    referenceId: string;
}

export default function ViewReferenceResponseModal({
    isOpen,
    onClose,
    referenceId
}: ViewReferenceResponseModalProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [reference, setReference] = useState<ReferenceResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !referenceId) return;

        setLoading(true);
        fetch(`/api/employer/references/${referenceId}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setReference(data);
                }
            })
            .catch(err => {
                console.error('Error fetching reference:', err);
                setError('Failed to load reference');
            })
            .finally(() => setLoading(false));
    }, [isOpen, referenceId]);

    if (!isOpen) return null;

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'responded':
                return { icon: <Check size={14} />, label: 'Responded', color: isDark ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' : 'text-emerald-600 bg-emerald-50 border-emerald-200' };
            case 'viewed':
                return { icon: <Eye size={14} />, label: 'Viewed', color: isDark ? 'text-blue-400 bg-blue-500/20 border-blue-500/30' : 'text-blue-600 bg-blue-50 border-blue-200' };
            case 'sent':
                return { icon: <Clock size={14} />, label: 'Sent', color: isDark ? 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' : 'text-yellow-600 bg-yellow-50 border-yellow-200' };
            case 'pending':
                return { icon: <Clock size={14} />, label: 'Pending', color: isDark ? 'text-neutral-400 bg-neutral-500/20 border-neutral-500/30' : 'text-neutral-600 bg-neutral-50 border-neutral-200' };
            case 'declined':
                return { icon: <X size={14} />, label: 'Declined', color: isDark ? 'text-red-400 bg-red-500/20 border-red-500/30' : 'text-red-600 bg-red-50 border-red-200' };
            default:
                return { icon: <Clock size={14} />, label: status, color: isDark ? 'text-neutral-400 bg-neutral-500/20 border-neutral-500/30' : 'text-neutral-600 bg-neutral-50 border-neutral-200' };
        }
    };

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
                        <div>
                            <h2 className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                                Reference Response
                            </h2>
                            {reference && (
                                <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                    from {reference.targetCompanyName}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                <span className={isDark ? 'text-neutral-400' : 'text-neutral-600'}>Loading...</span>
                            </div>
                        </div>
                    ) : error ? (
                        <div className={`p-6 rounded-2xl text-center ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                            <AlertCircle size={32} className="mx-auto mb-3 text-red-500" />
                            <p className={isDark ? 'text-red-400' : 'text-red-600'}>{error}</p>
                        </div>
                    ) : reference ? (
                        <div className="space-y-6">
                            {/* Status Badge */}
                            {(() => {
                                const statusInfo = getStatusInfo(reference.status);
                                return (
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest ${statusInfo.color}`}>
                                        {statusInfo.icon}
                                        <span>{statusInfo.label}</span>
                                    </div>
                                );
                            })()}

                            {/* Meta Info */}
                            <div className={`flex flex-wrap gap-4 text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                                <div className="flex items-center gap-2">
                                    <Building2 size={14} />
                                    <span>{reference.targetCompanyName}</span>
                                </div>
                                {reference.respondedAt && (
                                    <div>
                                        Responded: {new Date(reference.respondedAt).toLocaleDateString()}
                                    </div>
                                )}
                            </div>

                            {/* Responses */}
                            {reference.status === 'responded' && reference.response ? (
                                <div className="space-y-4">
                                    <h3 className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                        Reference Responses
                                    </h3>
                                    {reference.questions.map((q) => (
                                        <div key={q.id} className={`p-4 rounded-xl border ${isDark ? 'bg-neutral-800/50 border-neutral-700' : 'bg-neutral-50 border-neutral-200'}`}>
                                            <p className={`text-sm font-medium mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>{q.label}</p>
                                            <p className={`text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                                                {reference.response?.[q.id] || <span className={isDark ? 'text-neutral-500' : 'text-neutral-400'}>Not answered</span>}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={`p-8 rounded-2xl text-center ${isDark ? 'bg-neutral-800/50' : 'bg-neutral-50'}`}>
                                    <Clock size={32} className={`mx-auto mb-3 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`} />
                                    <p className={`font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
                                        Awaiting Response
                                    </p>
                                    <p className={`text-sm mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                        {reference.targetCompanyName} has not yet responded to this request
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
