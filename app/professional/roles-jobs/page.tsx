"use client"

import React, { useState, useEffect } from 'react';
import { Briefcase, Calendar, MapPin, DollarSign } from 'lucide-react';

interface Connection {
    id: string;
    job?: {
        title: string;
        location_type?: string;
    };
    company?: {
        name: string;
    };
    status: string;
    created_at: string;
    terminated_at?: string;
}

export default function RolesJobsPage() {
    const [connections, setConnections] = useState<Connection[]>([]);
    const [filter, setFilter] = useState<'all' | 'current' | 'past'>('all');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchConnections = async () => {
            try {
                const res = await fetch('/api/professional/connections');
                if (res.ok) {
                    const data = await res.json();
                    setConnections(data.connections || []);
                }
            } catch (error) {
                console.error("Error fetching connections", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConnections();
    }, []);

    const filteredConnections = connections.filter(conn => {
        if (filter === 'current') return !conn.terminated_at;
        if (filter === 'past') return !!conn.terminated_at;
        return true;
    });

    return (
        <div className="p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-4 bg-blue-500/20 rounded-2xl text-blue-400">
                            <Briefcase size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase tracking-tight">Role & Jobs</h1>
                            <p className="text-slate-400 text-sm mt-1">View all your current and past roles</p>
                        </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === 'all'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            All ({connections.length})
                        </button>
                        <button
                            onClick={() => setFilter('current')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === 'current'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            Current ({connections.filter(c => !c.terminated_at).length})
                        </button>
                        <button
                            onClick={() => setFilter('past')}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === 'past'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            Past ({connections.filter(c => !!c.terminated_at).length})
                        </button>
                    </div>
                </div>

                {/* Jobs List */}
                {isLoading ? (
                    <div className="text-center py-20 text-slate-500">Loading...</div>
                ) : filteredConnections.length === 0 ? (
                    <div className="text-center py-20">
                        <Briefcase size={64} className="mx-auto text-slate-700 mb-4" />
                        <p className="text-slate-500 text-lg">No {filter !== 'all' ? filter : ''} roles found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredConnections.map((connection) => (
                            <div
                                key={connection.id}
                                className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-white">
                                                {connection.job?.title || 'Position'}
                                            </h3>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold ${connection.terminated_at
                                                        ? 'bg-slate-700 text-slate-400'
                                                        : 'bg-emerald-500/20 text-emerald-400'
                                                    }`}
                                            >
                                                {connection.terminated_at ? 'Past' : 'Current'}
                                            </span>
                                        </div>

                                        <p className="text-slate-400 font-medium mb-4">
                                            {connection.company?.name || 'Company'}
                                        </p>

                                        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} />
                                                <span>
                                                    Started: {new Date(connection.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {connection.terminated_at && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={16} />
                                                    <span>
                                                        Ended: {new Date(connection.terminated_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                            {connection.job?.location_type && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={16} />
                                                    <span className="capitalize">{connection.job.location_type}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
