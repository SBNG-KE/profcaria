"use client"

import React, { useState, useEffect } from 'react';
import {
    Users, Search, User, X, ExternalLink, Shield, Briefcase, Clock,
    CheckCircle2, XCircle, AlertTriangle, Building2, Cable, FileText, Share2, ChevronLeft, ChevronRight, Mail, Calendar, UserCircle, MoreHorizontal, MessageSquare
} from 'lucide-react';
import VerificationBadge from '@/app/components/VerificationBadge';

import EmployerProfileViewModal from '../components/EmployerProfileViewModal';

interface Connection {
    id: string;
    applicationId: string;
    userId: string;
    status: string;
    terminationType?: string;
    terminationReason?: string | null;
    connectionFileUrl?: string;
    connectedAt: string;
    job: {
        id: string;
        title: string;
    };
    professional: {
        id: string;
        firstName: string;
        lastName: string;
        name: string;
        role: string;
        profileImageUrl: string | null;
        email?: string | null;
        phone?: string | null;
        badgeType?: string;
    };
    accessList: string[];
}

interface ProfileData {
    profile: {
        id: string;
        firstName: string;
        lastName: string;
        role: string;
        profileImageUrl: string | null;
    };
    sharedDocuments: {
        type: string;
        content: string;
        lastUpdated: string;
    }[];
    accessList: string[];
}

const ConnectionCard = ({ connection, onViewProfile, onTerminate, onDisapprove, onConnect, onApproveResignation, onApproveMutual }: {
    connection: Connection,
    onViewProfile: () => void,
    onTerminate: () => void,
    onDisapprove: () => void,
    onConnect: () => void,
    onApproveResignation: () => void,
    onApproveMutual: () => void
}) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [copied, setCopied] = useState(false);
    const terminated = ['terminated', 'rejected', 'declined', 'resigned'].includes(connection.status);

    const handleShareReason = async () => {
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
        <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 rounded-[32px] p-6 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all group">
            <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-100 dark:border-white/10 flex items-center justify-center text-neutral-400 dark:text-neutral-600 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                    {connection.professional.profileImageUrl ? (
                        <img src={connection.professional.profileImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <User size={28} />
                    )}
                </div>

                <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-black dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight flex items-center gap-2">
                        {connection.professional.name}
                        <VerificationBadge tier={connection.professional.badgeType} size={16} />
                    </h3>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-widest mb-2">
                        {connection.professional.role || 'Professional'}
                    </p>
                    <div className="flex items-center gap-2 text-neutral-400 text-xs font-bold">
                        <Briefcase size={12} />
                        <span>{connection.job.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                        <Clock size={10} />
                        <span>Employed {new Date(connection.connectedAt).toLocaleDateString()}</span>
                    </div>

                    {/* View File Link */}
                    {connection.connectionFileUrl && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(connection.connectionFileUrl, '_blank');
                            }}
                            className="flex items-center gap-2 text-white text-[10px] font-bold uppercase tracking-widest mt-2 cursor-pointer hover:text-neutral-300 transition-colors bg-transparent border-none p-0"
                        >
                            <FileText size={10} />
                            <span>Attached Document</span>
                        </button>
                    )}
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${connection.status === 'accepted' ? 'bg-neutral-700 text-white border border-neutral-600' :
                        connection.status === 'pending_termination' ? 'bg-neutral-800 text-neutral-300 border border-neutral-700' :
                            'bg-neutral-800 text-neutral-400 border border-white/5'
                        }`}>
                        {['accepted', 'hired', 'employed', 'offered'].includes(connection.status) ? 'Active' :
                            connection.status === 'pending_termination' ? 'Termination Requested' :
                                connection.status === 'resigned' ? 'Resigned' :
                                    connection.terminationType === 'involuntary' ? 'Terminated' :
                                        connection.status}
                    </span>

                    {/* Small File Icon Top Right if exists */}
                    {connection.connectionFileUrl && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                window.open(connection.connectionFileUrl, '_blank');
                            }}
                            className="p-2 bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-full transition-all cursor-pointer"
                            title="View Attached Document"
                        >
                            <FileText size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* Access List Preview */}
            {connection.accessList.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-neutral-400 text-[10px] font-black uppercase tracking-widest mb-3">
                        <Shield size={12} />
                        <span>Shared Documents</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {connection.accessList.map(doc => (
                            <span key={doc} className="px-3 py-1 bg-neutral-800 text-neutral-400 rounded-lg text-[10px] font-bold uppercase">
                                {doc}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Share Reason Button for Terminated Connections */}
            {terminated && connection.terminationReason && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleShareReason();
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${copied ? 'bg-neutral-700 border-neutral-600 text-white' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'}`}
                    >
                        <Share2 size={10} className={sharing ? "animate-spin" : ""} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                            {copied ? 'Copied!' : sharing ? 'Generating...' : 'Share Reason'}
                        </span>
                    </button>
                </div>
            )}

            {/* Actions ... (Keep existing layout but maybe hide some if Terminated?) */}
            {/* Logic in existing code: connection.status !== 'terminated' && ... for Profile */}

            <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                <button
                    onClick={onViewProfile}
                    className="flex-1 py-3 bg-neutral-700 hover:bg-neutral-600 text-white border border-neutral-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                    <ExternalLink size={14} />
                    Profile
                </button>

                {connection.status === 'pending_resignation' && (
                    <div className="flex-1 flex gap-2">
                        <button
                            onClick={onApproveResignation}
                            className="flex-1 py-3 bg-white hover:bg-neutral-100 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                            Approve Resignation
                        </button>
                    </div>
                )}

                {connection.status === 'pending_termination' && (
                    <div className="flex-1 flex gap-2">
                        <button
                            onClick={onApproveMutual}
                            className="flex-1 py-3 bg-white hover:bg-neutral-100 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                            Approve Mutual End
                        </button>
                        <button
                            onClick={onDisapprove}
                            className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-white/5"
                        >
                            Decline
                        </button>
                    </div>
                )}

                {/* Involuntary Termination Option for Active Employees */}
                {['accepted', 'hired', 'employed', 'offered'].includes(connection.status) && !showConfirm && (
                    <button
                        onClick={() => setShowConfirm(true)}
                        className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-neutral-700"
                    >
                        <XCircle size={14} />
                    </button>
                )}
            </div>

            {showConfirm && (
                <div className="mt-3 p-4 bg-neutral-800 border border-neutral-700 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-neutral-400 text-xs">
                        <AlertTriangle size={14} />
                        <span>Are you sure you want to terminate this connection?</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="flex-1 py-2 bg-neutral-800 text-neutral-300 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:bg-neutral-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onTerminate();
                                setShowConfirm(false);
                            }}
                            className="flex-1 py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ... (interfaces remain same, adding Contract interface if needed, but managing locally for now or extending Connection)
// We need to fetch contracts separately or assume they are attached to connection.
// For now, let's fetch contracts on mount as well.

export default function ConnectionsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'employed' | 'resigned' | 'involuntary' | 'mutual'>('all');
    const [connections, setConnections] = useState<Connection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [activeDocument, setActiveDocument] = useState<string | null>(null);
    const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

    // Action State
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState<'involuntary' | null>(null);
    const [reason, setReason] = useState('');

    // Contact/Contract State (Partial restore if needed by UI, simplistic for now to fix errors)
    const [contactConnection, setContactConnection] = useState<Connection | null>(null);
    const [contractConnection, setContractConnection] = useState<Connection | null>(null);
    const [contractFile, setContractFile] = useState<File | null>(null);
    const [contractValue, setContractValue] = useState('');
    const [isUploadingContract, setIsUploadingContract] = useState(false);

    useEffect(() => {
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        try {
            const res = await fetch('/api/employer/connections');
            if (res.ok) {
                const data = await res.json();
                setConnections(data.connections || []);
            }
        } catch (error) {
            console.error('Error fetching connections:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (applicationId: string, action: string, reasonText?: string) => {
        try {
            const res = await fetch('/api/employer/connections', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId, action, reason: reasonText })
            });
            if (res.ok) fetchConnections();
        } catch (error) { console.error(error); }
    };

    const handleViewProfile = (connection: Connection) => {
        setViewingProfileId(connection.applicationId);
    };

    const handleUploadContract = async (e: React.FormEvent) => {
        e.preventDefault();
        // Placeholder implementation to fix lint errors if used
        if (!contractFile || !contractConnection) return;
        setIsUploadingContract(true);
        // ... Logic would go here
        setIsUploadingContract(false);
    };

    const filteredConnections = connections.filter(c => {
        const matchesSearch = (c.professional?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.job?.title || '').toLowerCase().includes(searchTerm.toLowerCase());

        let matchesFilter = true;

        if (filter === 'employed') {
            matchesFilter = ['accepted', 'hired', 'employed', 'offered'].includes(c.status);
        } else if (filter === 'resigned') {
            matchesFilter = c.status === 'resigned' || c.terminationType === 'resignation';
        } else if (filter === 'involuntary') {
            // Fallback for generic 'terminated' if type is missing, assume involuntary for filtering purposes if not resignation/mutual
            matchesFilter = c.terminationType === 'involuntary' || (c.status === 'terminated' && (!c.terminationType || c.terminationType === 'involuntary'));
        } else if (filter === 'mutual') {
            matchesFilter = c.terminationType === 'mutual';
        }

        return matchesSearch && matchesFilter;
    });

    const ITEMS_PER_PAGE = 100;
    const [currentPage, setCurrentPage] = useState(1);

    // Reset page when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, searchTerm]);

    const totalPages = Math.ceil(filteredConnections.length / ITEMS_PER_PAGE);
    const paginatedConnections = filteredConnections.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    // "activeConnections" var definition is unused in previous file? No wait, it was there.
    // Actually the return renders all filtered.

    // There was a definition: const activeConnections = ...
    // and const pendingTerminations = ...
    // Let's keep them but make them safer.

    const activeStats = connections.filter(c => ['accepted', 'hired', 'employed'].includes(c.status));
    const pendingStats = connections.filter(c => ['pending_termination', 'pending_resignation'].includes(c.status));

    return (
        <div className="p-8 h-full flex flex-col pb-32">
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header & Stats (Keep simplified/same as before) */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="text-left">
                        <div className="flex items-center gap-2 text-neutral-400 mb-2"><Cable size={16} /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Employee Network</span></div>
                        <h1 className="text-3xl font-black text-black dark:text-white uppercase tracking-tighter">My Connections</h1>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-1 text-sm">Manage your professional network and candidates.</p>
                    </div>
                </header>

                {/* Filter Buttons */}
                <div className="flex gap-3 flex-wrap">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === 'all'
                            ? 'bg-white text-black shadow-lg'
                            : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                            }`}
                    >
                        All ({connections.length})
                    </button>
                    <button
                        onClick={() => setFilter('employed')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === 'employed'
                            ? 'bg-white text-black shadow-lg'
                            : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                            }`}
                    >
                        Employed ({connections.filter(c => ['accepted', 'hired', 'employed'].includes(c.status)).length})
                    </button>
                    <button
                        onClick={() => setFilter('resigned')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === 'resigned'
                            ? 'bg-white text-black shadow-lg'
                            : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                            }`}
                    >
                        Resigned ({connections.filter(c => c.status === 'resigned' || c.terminationType === 'resignation').length})
                    </button>
                    <button
                        onClick={() => setFilter('involuntary')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === 'involuntary'
                            ? 'bg-white text-black shadow-lg'
                            : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                            }`}
                    >
                        Involuntary ({connections.filter(c => c.terminationType === 'involuntary' || (c.status === 'terminated' && (!c.terminationType || c.terminationType === 'involuntary'))).length})
                    </button>
                    <button
                        onClick={() => setFilter('mutual')}
                        className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === 'mutual'
                            ? 'bg-white text-black shadow-lg'
                            : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                            }`}
                    >
                        Mutual ({connections.filter(c => c.terminationType === 'mutual').length})
                    </button>
                </div>

                {/* Connections Grid with Contract Button */}
                {/* ... Search ... */}
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative group flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 transition-colors group-focus-within:text-black dark:group-focus-within:text-white" size={18} />
                        <input type="text" placeholder="Search connections..." className="w-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-black dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-200 dark:focus:ring-neutral-800 transition-all font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {paginatedConnections.map(connection => (
                        <ConnectionCard
                            key={connection.id}
                            connection={connection}
                            onViewProfile={() => handleViewProfile(connection)}
                            onTerminate={() => {
                                setSelectedConnection(connection);
                                setActionType('involuntary');
                                setReason('');
                                setShowActionModal(true);
                            }}
                            onDisapprove={() => handleAction(connection.applicationId, 'disapprove')}
                            onConnect={() => setContactConnection(connection)}
                            onApproveResignation={() => handleAction(connection.applicationId, 'approve_resignation')}
                            onApproveMutual={() => handleAction(connection.applicationId, 'approve_mutual_termination')}
                        />
                    ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 pt-6">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={16} /> Previous</button>
                        <span className="text-neutral-400 text-sm">Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span></span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed">Next <ChevronRight size={16} /></button>
                    </div>
                )}
            </div>

            {/* Involuntary Termination Modal */}
            {showActionModal && selectedConnection && actionType === 'involuntary' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowActionModal(false)}></div>
                    <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center gap-3 text-neutral-400 mb-4">
                            <AlertTriangle size={24} />
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">
                                Involuntary Termination
                            </h3>
                        </div>

                        <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
                            You are terminating <b>{selectedConnection.professional.name}</b>. This action is irreversible.
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-100 dark:border-white/5 space-y-1">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                                    <Mail size={12} /> Email
                                </div>
                                <p className="text-xs font-bold text-black dark:text-neutral-200 truncate" title={selectedConnection.professional.email || 'Not available'}>
                                    {selectedConnection.professional.email || 'Not available'}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-black/40 border border-neutral-100 dark:border-white/5 space-y-1">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                                    <Calendar size={12} /> Connected
                                </div>
                                <p className="text-xs font-bold text-black dark:text-neutral-200">
                                    {new Date(selectedConnection.connectedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                                    Reason (Required & Encrypted)
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Please specify the reason for termination..."
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-neutral-500 min-h-[120px] resize-none placeholder:text-neutral-600"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowActionModal(false)}
                                    className="flex-1 py-3 bg-neutral-800 text-neutral-400 rounded-xl text-xs font-bold uppercase hover:bg-neutral-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (reason.trim()) {
                                            handleAction(selectedConnection.applicationId, 'involuntary_terminate', reason);
                                            setShowActionModal(false);
                                        }
                                    }}
                                    disabled={!reason.trim()}
                                    className="flex-1 py-3 bg-neutral-600 hover:bg-neutral-500 text-white rounded-xl text-xs font-bold uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirm Termination
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Modal */}
            {contactConnection && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setContactConnection(null)}></div>
                    <div className="relative w-full max-w-sm bg-neutral-900 border border-neutral-700 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6">Contact Info</h3>

                        <div className="space-y-4">
                            <div className="p-4 bg-neutral-900/50 rounded-xl border border-neutral-800">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Email</label>
                                <p className="text-white font-medium select-all">{contactConnection.professional.email || 'Not available'}</p>
                            </div>
                            <div className="p-4 bg-neutral-900/50 rounded-xl border border-neutral-800">
                                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">Phone</label>
                                <p className="text-white font-medium select-all">{contactConnection.professional.phone || 'Not available'}</p>
                            </div>
                        </div>

                        <button onClick={() => setContactConnection(null)} className="w-full mt-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all">
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Contract Modal */}
            {contractConnection && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setContractConnection(null)}></div>
                    <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Upload Contract</h3>
                        <p className="text-neutral-400 text-xs mb-6">Upload a signed contract for <b>{contractConnection.professional.name}</b>.</p>

                        <form onSubmit={handleUploadContract} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Contract Value (e.g. $100k/yr)</label>
                                <input
                                    type="text"
                                    value={contractValue}
                                    onChange={e => setContractValue(e.target.value)}
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-neutral-500"
                                    placeholder="$..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Contract File (PDF/DOCX)</label>
                                <input
                                    type="file"
                                    onChange={e => setContractFile(e.target.files?.[0] || null)}
                                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-neutral-700 file:text-white hover:file:bg-neutral-600"
                                    accept=".pdf,.doc,.docx"
                                    required
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setContractConnection(null)} className="flex-1 py-3 bg-neutral-800 text-neutral-400 rounded-xl text-xs font-bold uppercase">Cancel</button>
                                <button type="submit" disabled={isUploadingContract} className="flex-1 py-3 bg-white hover:bg-neutral-100 text-black rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2">
                                    {isUploadingContract ? 'Uploading...' : 'Upload & Activate'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}




            {/* Profile Modal (Reused) - Only show when NOT in action mode */}
            {/* The previous modal logic (selectedConnection && !showActionModal) is replaced/superseded by the new viewingProfileId modal for profile viewing actions.
                selectedConnection is likely only used for termination actions now which have their own modal. 
                If selectedConnection ends up in a state where showActionModal is false, we might show the old modal, but user flow doesn't seem to trigger that for 'Profile' anymore.
            */}

            {/* NEW PROFILE VIEW MODAL */}
            {viewingProfileId && (
                <EmployerProfileViewModal
                    applicationId={viewingProfileId}
                    onClose={() => setViewingProfileId(null)}
                />
            )}

        </div>
    );
}
