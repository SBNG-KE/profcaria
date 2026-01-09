"use client"

import React, { useState, useEffect } from 'react';
import { Briefcase, Calendar, MapPin } from 'lucide-react';

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
    const [filter, setFilter] = useState<'all' | 'current' | 'resigned' | 'involuntary' | 'mutual'>('all');
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

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const calculateDuration = (startDate: string, endDate?: string) => {
        // If start date is missing or invalid, return nothing
        if (!startDate) return '';

        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();

        if (isNaN(start.getTime()) || (endDate && isNaN(end.getTime()))) return '';

        let years = end.getFullYear() - start.getFullYear();
        let months = end.getMonth() - start.getMonth();
        let days = end.getDate() - start.getDate();

        if (days < 0) {
            months--;
            // Get days in previous month
            const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
            days += prevMonth.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        const parts = [];
        if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
        if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
        // Only show days if less than a month duration
        if (years === 0 && months === 0) {
            parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
        }

        return parts.join(' and ') || '0 days';
    };

    const isTerminated = (conn: Connection) => {
        return conn.status === 'terminated' || conn.status === 'involuntary' || conn.status === 'mutual' || !!conn.terminated_at;
    };

    const filteredConnections = connections.filter(conn => {
        if (filter === 'current') return !isTerminated(conn) && conn.status !== 'resigned';
        if (filter === 'resigned') return conn.status === 'resigned';
        if (filter === 'involuntary') return conn.status === 'involuntary' || (conn.status === 'terminated'); // Legacy support
        if (filter === 'mutual') return conn.status === 'mutual';
        return true;
    });

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-32">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-800">
                <div className="text-left">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-4 bg-blue-500/20 rounded-2xl text-blue-400">
                            <Briefcase size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase tracking-tight">Roles & Jobs</h1>
                            <p className="text-slate-400 text-sm mt-1">View your career history and current positions</p>
                        </div>
                    </div>
                </div>
                {/* Filter Buttons */}
                <div className="flex gap-3 flex-wrap">
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
                        Current ({connections.filter(c => !isTerminated(c)).length})
                    </button>
                    <button
                        onClick={() => setFilter('resigned')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === 'resigned'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        Resigned ({connections.filter(c => c.status === 'resigned').length})
                    </button>
                    <button
                        onClick={() => setFilter('involuntary')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === 'involuntary'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        Involuntary ({connections.filter(c => c.status === 'involuntary' || c.status === 'terminated').length})
                    </button>
                    <button
                        onClick={() => setFilter('mutual')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === 'mutual'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        Mutual ({connections.filter(c => c.status === 'mutual').length})
                    </button>
                </div >
            </header>

            {/* Jobs Grid */}
            {
                isLoading ? (
                    <div className="text-center py-20 text-slate-500 animate-pulse">Loading positions...</div>
                ) : filteredConnections.length === 0 ? (
                    <div className="text-center py-20">
                        <Briefcase size={64} className="mx-auto text-slate-700 mb-4" />
                        <p className="text-slate-500 text-lg">No {filter !== 'all' ? filter : ''} roles found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredConnections.map((connection) => {
                            const terminated = isTerminated(connection);
                            return (
                                <div
                                    key={connection.id}
                                    className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 transition-all flex flex-col h-full group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <h3 className="text-xl font-bold text-white line-clamp-1 group-hover:text-blue-400 transition-colors" title={connection.job?.title}>
                                                    {connection.job?.title || 'Position'}
                                                </h3>
                                            </div>
                                            <p className="text-slate-400 font-medium mb-1 line-clamp-1" title={connection.company?.name}>
                                                {connection.company?.name || 'Company'}
                                            </p>
                                        </div>
                                        <span
                                            className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${terminated
                                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                }`}
                                        >
                                            {connection.status === 'resigned' ? 'Resigned' :
                                                connection.status === 'mutual' ? 'Mutual Separation' :
                                                    connection.status === 'involuntary' || connection.status === 'terminated' ? 'Involuntary' : 'Current'}
                                        </span>
                                    </div>

                                    <div className="mt-auto space-y-3 pt-4 border-t border-slate-800/50">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Calendar size={14} className="text-blue-500/70" />
                                            <span>
                                                Started: {formatDate(connection.created_at)}
                                            </span>
                                        </div>

                                        {terminated && (
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Calendar size={14} className="text-red-500/70" />
                                                <span>
                                                    Ended: {formatDate(connection.terminated_at || new Date().toISOString())}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                            <span className={terminated ? 'text-slate-500' : 'text-emerald-500/80 font-medium'}>
                                                Duration: {calculateDuration(connection.created_at, connection.terminated_at)}
                                            </span>
                                        </div>

                                        {connection.job?.location_type && (
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <MapPin size={14} />
                                                <span className="capitalize">{connection.job.location_type}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            }
        </div >
    );
}
