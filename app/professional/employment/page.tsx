"use client"

import React, { useState, useEffect } from 'react';
import {
    Cable, Building2, Briefcase, Clock, AlertTriangle,
    CheckCircle2, XCircle, X, ExternalLink, FileText, Plus, Pencil, Share2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface Connection {
    id: string;
    applicationId: string;
    status: string;
    created_at: string;
    terminated_at?: string;
    terminationType?: string; // Add
    terminationReason?: string | null;
    connectionFileUrl?: string; // Add
    job: {
        id: string;
        title: string;
    };
    company: {
        id: string;
        name: string;
        logoUrl: string | null;
    };
}

const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const ConnectionCard = ({
    connection,
    onResign,
    onMutual,
    onCancel,
    onManageFile,
    isDark
}: {
    connection: Connection,
    onResign: () => void,
    onMutual: () => void,
    onCancel: () => void,
    onManageFile: (action: 'upload' | 'view' | 'remove') => void,
    isDark: boolean
}) => {
    const terminated = ['terminated', 'rejected', 'declined', 'resigned'].includes(connection.status);
    const active = ['accepted', 'hired', 'employed', 'offered'].includes(connection.status);
    const [sharing, setSharing] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        if (sharing || copied) return;
        setSharing(true);
        try {
            const res = await fetch('/api/documents/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'connection',
                    id: connection.applicationId
                })
            });
            if (res.ok) {
                const { link } = await res.json();
                await navigator.clipboard.writeText(link);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } else {
                alert('Failed to generate share link.');
            }
        } catch (err) {
            console.error(err);
            alert('Error sharing reason.');
        } finally {
            setSharing(false);
        }
    };

    return (
        <div className={`border rounded-[32px] p-6 transition-all group flex flex-col h-full ${isDark ? 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700' : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'}`}>
            <div className="flex items-start gap-4 flex-1">
                <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center overflow-hidden shrink-0 ${isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-200'}`}>
                    {connection.company.logoUrl ? (
                        <img src={connection.company.logoUrl} alt={connection.company.name} className="w-full h-full object-cover" />
                    ) : (
                        <Building2 size={28} className={isDark ? 'text-neutral-600' : 'text-neutral-400'} />
                    )}
                </div>
                <div className="flex-1 text-left">
                    <h3 className={`text-lg font-bold group-hover:text-emerald-500 transition-colors uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                        {connection.company.name}
                    </h3>
                    <div className={`flex items-center gap-2 text-xs font-bold mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        <Briefcase size={12} />
                        <span>{connection.job.title}</span>
                    </div>
                    <div className="space-y-1 mt-2">
                        <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            <Clock size={10} />
                            <span>Employed {formatDate(connection.created_at)}</span>
                        </div>
                        {terminated && (
                            <div className="flex flex-col gap-2">
                                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                    <Clock size={10} className="text-red-500/50" />
                                    <span>Ended {formatDate(connection.terminated_at || new Date().toISOString())}</span>
                                </div>
                                {connection.terminationReason && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleShare();
                                        }}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${copied ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : (isDark ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' : 'bg-black/5 hover:bg-black/10 text-black border-black/10')}`}
                                    >
                                        <Share2 size={10} className={sharing ? "animate-spin" : ""} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">
                                            {copied ? 'Copied!' : sharing ? 'Generating...' : 'Share Reason'}
                                        </span>
                                    </button>
                                )}
                            </div>
                        )}
                        {/* File Attachment Indicator */}
                        {connection.connectionFileUrl && (
                            <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-bold uppercase tracking-widest mt-1 cursor-pointer hover:text-emerald-400" onClick={() => onManageFile('view')}>
                                <FileText size={10} />
                                <span>Attached Document</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        connection.status === 'pending_resignation' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                            connection.status === 'pending_termination' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                                (isDark ? 'bg-neutral-800 text-neutral-400 border border-neutral-700' : 'bg-neutral-100 text-neutral-500 border border-neutral-200')
                        }`}>
                        {active ? 'Active' :
                            connection.status === 'pending_resignation' ? 'Resignation Pending' :
                                connection.status === 'pending_termination' ? 'Mutual End Pending' :
                                    connection.status.replace(/_/g, ' ')}
                    </span>

                    {/* File Attachment Indicator for Active - View Only if exists */}
                    {active && connection.connectionFileUrl && (
                        <button onClick={() => onManageFile('view')} className={`p-2 rounded-full transition-all ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-black'}`} title="View Document">
                            <FileText size={14} />
                        </button>
                    )}
                    {/* Terminated View Only handled by click on status or generic */}
                    {terminated && connection.connectionFileUrl && (
                        <button onClick={() => onManageFile('view')} className={`p-2 rounded-full transition-all ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-black'}`} title="View Document">
                            <FileText size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Active Actions */}
            {active && (
                <div className={`mt-6 pt-4 border-t flex gap-2 ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                    <button
                        onClick={onResign}
                        className="flex-1 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-red-500/20 hover:border-red-500"
                    >
                        Resign
                    </button>
                    <button
                        onClick={onMutual}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-500 hover:text-black'}`}
                    >
                        Mutual End
                    </button>
                </div>
            )}

            {/* Pending States status messages */}
            {connection.status === 'pending_resignation' && (
                <div className={`mt-4 pt-4 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                    <div className="flex items-center gap-2 text-amber-500 text-xs bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                        <Clock size={14} />
                        <span>Resignation submitted. Awaiting employer approval.</span>
                    </div>
                </div>
            )}
            {connection.status === 'pending_termination' && (
                <div className={`mt-4 pt-4 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                    <div className="flex items-center gap-2 text-indigo-500 text-xs bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                        <Clock size={14} />
                        <span>Mutual separation requested. Awaiting employer approval.</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function ConnectPage() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [connections, setConnections] = useState<Connection[]>([]);
    const [viewMode, setViewMode] = useState<'current' | 'past'>('current');
    const [isLoading, setIsLoading] = useState(true);

    // Action Modal State
    const [pastFilter, setPastFilter] = useState<'all' | 'resigned' | 'involuntary' | 'mutual'>('all'); // Add sub-filter
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
    const [actionType, setActionType] = useState<'resign' | 'mutual' | 'upload_file' | null>(null);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 100;

    useEffect(() => {
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        try {
            const res = await fetch('/api/professional/connections');
            if (res.ok) {
                const data = await res.json();
                setConnections(data.connections || []);
            }
        } catch (err) {
            console.error('Error fetching connections:', err);
        } finally {
            setIsLoading(false);
        }
    };


    const handleActionSubmit = async () => {
        if (!selectedConnection || !actionType) return;
        setIsSubmitting(true);
        const apiAction = actionType === 'resign' ? 'request_resignation' : 'request_mutual_termination';

        try {
            const res = await fetch('/api/professional/connections', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: selectedConnection.applicationId, action: apiAction, reason })
            });

            if (res.ok) {
                const data = await res.json();
                // Determine new status based on action
                const newStatus = actionType === 'resign' ? 'pending_resignation' : 'pending_termination';

                setConnections(prev => prev.map(c =>
                    c.applicationId === selectedConnection.applicationId
                        ? { ...c, status: newStatus, connectionFileUrl: data.fileUrl } // Update with generated file URL
                        : c
                ));
                setSelectedConnection(null);
                setActionType(null);
                setReason('');
            } else {
                alert('Failed to submit request');
            }
        } catch (err) {
            console.error('Error submitting request:', err);
            alert('Failed to submit request');
        } finally {
            setIsSubmitting(false);
        }
    };

    const activeConnections = connections.filter(c => ['accepted', 'hired', 'employed', 'offered'].includes(c.status));
    const pendingTerminations = connections.filter(c => ['pending_termination', 'pending_resignation'].includes(c.status));

    return (
        <div className="p-8">
            <div className="relative z-10 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="text-left">
                        <div className={`flex items-center gap-2 mb-2 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            <Cable size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Employment Network</span>
                        </div>
                        <h1 className={`text-4xl font-black uppercase tracking-tighter leading-none ${isDark ? 'text-white' : 'text-black'}`}>Employment</h1>
                        <p className={`mt-2 text-sm font-medium ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Your employment history and active connections.</p>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex flex-col items-end gap-4">
                        <div className={`flex p-1 rounded-xl border shrink-0 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'}`}>
                            <button
                                onClick={() => setViewMode('current')}
                                className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'current' ? (isDark ? 'bg-white text-black shadow-lg' : 'bg-black text-white shadow-lg') : (isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-500 hover:text-black')}`}
                            >
                                Current
                            </button>
                            <button
                                onClick={() => setViewMode('past')}
                                className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'past' ? (isDark ? 'bg-white text-black shadow-lg' : 'bg-black text-white shadow-lg') : (isDark ? 'text-neutral-500 hover:text-neutral-300' : 'text-neutral-500 hover:text-black')}`}
                            >
                                Past
                            </button>
                        </div>

                        {/* Sub-Filters for Past Connections */}
                        {viewMode === 'past' && (
                            <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                                <button onClick={() => setPastFilter('all')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${pastFilter === 'all' ? 'bg-neutral-800 text-white border-neutral-700' : 'text-neutral-500 border-transparent hover:text-neutral-300'}`}>All</button>
                                <button onClick={() => setPastFilter('resigned')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${pastFilter === 'resigned' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'text-neutral-500 border-transparent hover:text-neutral-300'}`}>Resigned</button>
                                <button onClick={() => setPastFilter('involuntary')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${pastFilter === 'involuntary' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'text-neutral-500 border-transparent hover:text-neutral-300'}`}>Involuntary</button>
                                <button onClick={() => setPastFilter('mutual')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${pastFilter === 'mutual' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'text-neutral-500 border-transparent hover:text-neutral-300'}`}>Mutual</button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`p-6 rounded-2xl space-y-4 text-center border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <div className={`mx-auto p-3 w-fit rounded-xl ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>
                            <CheckCircle2 size={24} />
                        </div>
                        <h3 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{activeConnections.length}</h3>
                        <p className={`text-xs uppercase font-bold tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Active Connections</p>
                    </div>

                    <div className={`p-6 rounded-2xl space-y-4 text-center border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <div className={`mx-auto p-3 w-fit rounded-xl ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>
                            <Clock size={24} />
                        </div>
                        <h3 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{pendingTerminations.length}</h3>
                        <p className={`text-xs uppercase font-bold tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Pending Actions</p>
                    </div>

                    <div className={`p-6 rounded-2xl space-y-4 text-center border ${isDark ? 'bg-neutral-900/50 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                        <div className={`mx-auto p-3 w-fit rounded-xl ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>
                            <Building2 size={24} />
                        </div>
                        <h3 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{connections.length}</h3>
                        <p className={`text-xs uppercase font-bold tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Total Connections</p>
                    </div>
                </div>

                {/* Connection List */}
                <div className="space-y-4">
                    <h2 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>Your Connections</h2>

                    {isLoading ? (
                        <div className={`rounded-[40px] p-12 text-center border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                            <div className={`animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-4 ${isDark ? 'border-white' : 'border-black'}`}></div>
                            <p className={isDark ? 'text-neutral-500' : 'text-neutral-500'}>Loading connections...</p>
                        </div>
                    ) : connections.length === 0 ? (
                        <div className={`rounded-[40px] p-12 text-center space-y-4 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${isDark ? 'bg-neutral-800/50' : 'bg-neutral-100'}`}>
                                <Cable size={32} className={isDark ? 'text-neutral-600' : 'text-neutral-400'} />
                            </div>
                            <h4 className={`text-lg font-bold ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>No Active Connections</h4>
                            <p className={`max-w-md mx-auto ${isDark ? 'text-neutral-500' : 'text-neutral-500'}`}>
                                When an employer accepts your application, you'll see your employment connection here.
                            </p>
                        </div>
                    ) : (
                        (() => {
                            const filteredConns = connections.filter(c => {
                                if (viewMode === 'current') return ['accepted', 'hired', 'employed', 'offered', 'pending_termination', 'pending_resignation'].includes(c.status);
                                if (viewMode === 'past') {
                                    const isPast = ['terminated', 'rejected', 'declined', 'resigned'].includes(c.status);
                                    if (!isPast) return false;
                                    if (pastFilter === 'all') return true;
                                    if (pastFilter === 'resigned') return c.status === 'resigned' || c.terminationType === 'resignation';
                                    if (pastFilter === 'involuntary') return c.terminationType === 'involuntary' || (c.status === 'terminated' && (!c.terminationType || c.terminationType === 'involuntary'));
                                    if (pastFilter === 'mutual') return c.terminationType === 'mutual';
                                    return false;
                                }
                                return false;
                            });
                            const totalPages = Math.ceil(filteredConns.length / ITEMS_PER_PAGE);
                            const paginatedConns = filteredConns.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
                            return (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {paginatedConns.map(connection => (
                                            <ConnectionCard
                                                key={connection.id}
                                                connection={connection}
                                                onResign={() => { setSelectedConnection(connection); setActionType('resign'); setReason(''); }}
                                                onMutual={() => { setSelectedConnection(connection); setActionType('mutual'); setReason(''); }}
                                                onCancel={() => { }}
                                                onManageFile={(action) => {
                                                    if (action === 'view') { if (connection.connectionFileUrl) window.open(connection.connectionFileUrl, '_blank'); }
                                                }}
                                                isDark={isDark}
                                            />
                                        ))}
                                    </div>
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-center gap-4 pt-6">
                                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={16} /> Previous</button>
                                            <span className="text-neutral-400 text-sm">Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span></span>
                                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed">Next <ChevronRight size={16} /></button>
                                        </div>
                                    )}
                                </>
                            );
                        })()
                    )}
                </div>
            </div>

            {/* Action Modal (Resign / Mutual) */}
            {selectedConnection && (actionType === 'resign' || actionType === 'mutual') && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={() => { setSelectedConnection(null); setActionType(null); }}
                    />
                    <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center gap-3 text-white mb-6">
                            {actionType === 'resign' ? (
                                <div className="p-3 bg-red-500/20 text-red-400 rounded-xl">
                                    <XCircle size={24} />
                                </div>
                            ) : (
                                <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
                                    <Building2 size={24} />
                                </div>
                            )}
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">
                                    {actionType === 'resign' ? 'Resign from Role' : 'Mutual Separation'}
                                </h3>
                                <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">
                                    {selectedConnection.company.name}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                                    Reason (Required)
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-500 min-h-[120px] resize-none placeholder:text-neutral-600"
                                    placeholder={actionType === 'resign'
                                        ? "Please explain why you are resigning..."
                                        : "Please explain why you are requesting a mutual separation..."}
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => { setSelectedConnection(null); setActionType(null); }}
                                    className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleActionSubmit}
                                    disabled={!reason.trim() || isSubmitting}
                                    className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-white ${!reason.trim() || isSubmitting
                                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                                        : actionType === 'resign'
                                            ? 'bg-red-600 hover:bg-red-500'
                                            : 'bg-emerald-600 hover:bg-emerald-500'
                                        }`}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
