"use client"

import React, { useState, useEffect } from 'react';
import {
    Cable, Building2, Briefcase, Clock, AlertTriangle,
    CheckCircle2, XCircle, X, ExternalLink
} from 'lucide-react';

interface Connection {
    id: string;
    applicationId: string;
    status: string;
    connectedAt: string;
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

const ConnectionCard = ({ connection, onRequestTermination }: { connection: Connection, onRequestTermination: (id: string) => void }) => {
    const [showConfirm, setShowConfirm] = useState(false);

    return (
        <div className="bg-[#0f172a]/50 border border-white/5 rounded-[32px] p-6 hover:border-emerald-500/30 transition-all group">
            <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                    {connection.company.logoUrl ? (
                        <img src={connection.company.logoUrl} alt={connection.company.name} className="w-full h-full object-cover" />
                    ) : (
                        <Building2 size={28} className="text-slate-600" />
                    )}
                </div>
                <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">
                        {connection.company.name}
                    </h3>
                    <div className="flex items-center gap-2 text-blue-400 text-xs font-bold mt-1">
                        <Briefcase size={12} />
                        <span>{connection.job.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">
                        <Clock size={10} />
                        <span>Connected {new Date(connection.connectedAt).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${connection.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            connection.status === 'pending_termination' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-slate-800 text-slate-400 border border-white/5'
                        }`}>
                        {connection.status === 'accepted' ? 'Active' :
                            connection.status === 'pending_termination' ? 'Pending Termination' : connection.status}
                    </span>
                </div>
            </div>

            {connection.status === 'accepted' && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    {!showConfirm ? (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border border-red-500/20"
                        >
                            Request Termination
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-amber-400 text-xs">
                                <AlertTriangle size={14} />
                                <span>The employer must approve this termination request.</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:bg-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        onRequestTermination(connection.applicationId);
                                        setShowConfirm(false);
                                    }}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                                >
                                    Confirm Request
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {connection.status === 'pending_termination' && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-amber-400 text-xs bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                        <Clock size={14} />
                        <span>Awaiting employer approval for termination...</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function ConnectPage() {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [viewMode, setViewMode] = useState<'current' | 'past'>('current');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        try {
            const res = await fetch('/api/professional/connections');
            if (res.ok) {
                const data = await res.json();
                setConnections(data.connections || []);
            } else {
                setError('Failed to load connections');
            }
        } catch (err) {
            console.error('Error fetching connections:', err);
            setError('Failed to load connections');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestTermination = async (applicationId: string) => {
        try {
            const res = await fetch('/api/professional/connections', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId, action: 'request_termination' })
            });

            if (res.ok) {
                // Update local state
                setConnections(prev => prev.map(c =>
                    c.applicationId === applicationId
                        ? { ...c, status: 'pending_termination' }
                        : c
                ));
            } else {
                alert('Failed to request termination');
            }
        } catch (err) {
            console.error('Error requesting termination:', err);
            alert('Failed to request termination');
        }
    };

    const activeConnections = connections.filter(c => c.status === 'accepted');
    const pendingTerminations = connections.filter(c => c.status === 'pending_termination');

    return (
        <div className="p-8">
            <div className="relative z-10 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="text-left">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <Cable size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Employment Network</span>
                        </div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Connections</h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">Your employment history and active connections.</p>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
                        <button
                            onClick={() => setViewMode('current')}
                            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'current' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Current
                        </button>
                        <button
                            onClick={() => setViewMode('past')}
                            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'past' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Past
                        </button>
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4 text-center">
                        <div className="mx-auto p-3 bg-emerald-500/20 text-emerald-400 w-fit rounded-xl">
                            <CheckCircle2 size={24} />
                        </div>
                        <h3 className="text-3xl font-black text-white">{activeConnections.length}</h3>
                        <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">Active Connections</p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4 text-center">
                        <div className="mx-auto p-3 bg-amber-500/20 text-amber-400 w-fit rounded-xl">
                            <Clock size={24} />
                        </div>
                        <h3 className="text-3xl font-black text-white">{pendingTerminations.length}</h3>
                        <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">Pending Terminations</p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4 text-center">
                        <div className="mx-auto p-3 bg-blue-500/20 text-blue-400 w-fit rounded-xl">
                            <Building2 size={24} />
                        </div>
                        <h3 className="text-3xl font-black text-white">{connections.length}</h3>
                        <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">Total Connections</p>
                    </div>
                </div>

                {/* Connection List */}
                <div className="space-y-4">
                    <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest">Your Connections</h2>

                    {isLoading ? (
                        <div className="bg-[#0f172a] border border-slate-800 rounded-[40px] p-12 text-center">
                            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-slate-500">Loading connections...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-[40px] p-12 text-center">
                            <XCircle size={48} className="text-red-400 mx-auto mb-4" />
                            <p className="text-red-400">{error}</p>
                        </div>
                    ) : connections.length === 0 ? (
                        <div className="bg-[#0f172a] border border-slate-800 rounded-[40px] p-12 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto">
                                <Cable size={32} className="text-slate-600" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-300">No Active Connections</h4>
                            <p className="text-slate-500 max-w-md mx-auto">
                                When an employer accepts your application, you'll see your employment connection here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {connections
                                .filter(c => {
                                    if (viewMode === 'current') return ['accepted', 'hired', 'pending_termination'].includes(c.status);
                                    if (viewMode === 'past') return ['terminated', 'rejected'].includes(c.status); // Include rejected if desired, but user said 'terminated'
                                    return false;
                                })
                                .map(connection => (
                                    <ConnectionCard
                                        key={connection.id}
                                        connection={connection}
                                        onRequestTermination={handleRequestTermination}
                                    />
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
