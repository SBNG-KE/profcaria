"use client"

import React, { useState, useEffect } from 'react';
import {
    Users, Search, User, X, ExternalLink, Shield, Briefcase, Clock,
    CheckCircle2, XCircle, AlertTriangle, Building2, Cable
} from 'lucide-react';

interface Connection {
    id: string;
    applicationId: string;
    userId: string;
    status: string;
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

const ConnectionCard = ({ connection, onViewProfile, onTerminate }: { 
    connection: Connection, 
    onViewProfile: () => void,
    onTerminate: () => void 
}) => {
    const [showConfirm, setShowConfirm] = useState(false);

    return (
        <div className="bg-[#0f172a]/50 border border-white/5 rounded-[32px] p-6 hover:border-emerald-500/30 transition-all group">
            <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                    {connection.professional.profileImageUrl ? (
                        <img src={connection.professional.profileImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <User size={28} />
                    )}
                </div>

                <div className="flex-1 text-left">
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">
                        {connection.professional.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">
                        {connection.professional.role || 'Professional'}
                    </p>
                    <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                        <Briefcase size={12} />
                        <span>{connection.job.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                        <Clock size={10} />
                        <span>Connected {new Date(connection.connectedAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        connection.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        connection.status === 'pending_termination' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-800 text-slate-400 border border-white/5'
                    }`}>
                        {connection.status === 'accepted' ? 'Active' : 
                         connection.status === 'pending_termination' ? 'Termination Requested' : connection.status}
                    </span>
                </div>
            </div>

            {/* Access List Preview */}
            {connection.accessList.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-3">
                        <Shield size={12} />
                        <span>Shared Documents</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {connection.accessList.map(doc => (
                            <span key={doc} className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-[10px] font-bold uppercase">
                                {doc}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-white/5 flex gap-3">
                <button
                    onClick={onViewProfile}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                    <ExternalLink size={14} />
                    View Profile
                </button>

                {connection.status === 'accepted' && !showConfirm && (
                    <button
                        onClick={() => setShowConfirm(true)}
                        className="py-3 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-red-500/20"
                    >
                        Terminate
                    </button>
                )}

                {connection.status === 'pending_termination' && (
                    <button
                        onClick={onTerminate}
                        className="py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                        Approve Termination
                    </button>
                )}
            </div>

            {showConfirm && (
                <div className="mt-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-red-400 text-xs">
                        <AlertTriangle size={14} />
                        <span>Are you sure you want to terminate this connection?</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:bg-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                onTerminate();
                                setShowConfirm(false);
                            }}
                            className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function ConnectionsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [connections, setConnections] = useState<Connection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [activeDocument, setActiveDocument] = useState<string | null>(null);

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

    const handleViewProfile = async (connection: Connection) => {
        setSelectedConnection(connection);
        setIsLoadingProfile(true);
        setProfileData(null);
        setActiveDocument(null);

        try {
            const res = await fetch(`/api/employer/applications/${connection.applicationId}/profile`);
            if (res.ok) {
                const data = await res.json();
                setProfileData(data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const handleTerminate = async (applicationId: string) => {
        try {
            const res = await fetch('/api/employer/connections', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId, action: 'terminate' })
            });

            if (res.ok) {
                // Remove from list
                setConnections(prev => prev.filter(c => c.applicationId !== applicationId));
            } else {
                alert('Failed to terminate connection');
            }
        } catch (error) {
            console.error('Error terminating connection:', error);
            alert('Failed to terminate connection');
        }
    };

    const getDocumentContent = (docType: string) => {
        const doc = profileData?.sharedDocuments.find(d => d.type === docType);
        return doc?.content || '';
    };

    const filteredConnections = connections.filter(c =>
        c.professional.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.job.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeConnections = filteredConnections.filter(c => c.status === 'accepted');
    const pendingTerminations = filteredConnections.filter(c => c.status === 'pending_termination');

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="text-left">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <Cable size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Employee Network</span>
                        </div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Connections</h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">Manage your connected employees and their shared profiles.</p>
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4 text-center">
                        <div className="mx-auto p-3 bg-emerald-500/20 text-emerald-400 w-fit rounded-xl">
                            <CheckCircle2 size={24} />
                        </div>
                        <h3 className="text-3xl font-black text-white">{activeConnections.length}</h3>
                        <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">Active Employees</p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4 text-center">
                        <div className="mx-auto p-3 bg-amber-500/20 text-amber-400 w-fit rounded-xl">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-3xl font-black text-white">{pendingTerminations.length}</h3>
                        <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">Pending Terminations</p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-4 text-center">
                        <div className="mx-auto p-3 bg-blue-500/20 text-blue-400 w-fit rounded-xl">
                            <Users size={24} />
                        </div>
                        <h3 className="text-3xl font-black text-white">{connections.length}</h3>
                        <p className="text-slate-500 text-xs uppercase font-bold tracking-widest">Total Connections</p>
                    </div>
                </div>

                {/* Search */}
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search connections..."
                            className="w-full bg-[#0f172a]/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Connections Grid */}
                {isLoading ? (
                    <div className="bg-[#0f172a] border border-slate-800 rounded-[40px] p-12 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-500">Loading connections...</p>
                    </div>
                ) : filteredConnections.length === 0 ? (
                    <div className="bg-[#0f172a] border border-slate-800 rounded-[40px] p-12 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto">
                            <Users size={32} className="text-slate-600" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-300">No Connections Yet</h4>
                        <p className="text-slate-500 max-w-md mx-auto">
                            When you accept applications, connected professionals will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredConnections.map(connection => (
                            <ConnectionCard
                                key={connection.id}
                                connection={connection}
                                onViewProfile={() => handleViewProfile(connection)}
                                onTerminate={() => handleTerminate(connection.applicationId)}
                            />
                        ))}
                    </div>
                )}

                {/* Profile Modal */}
                {selectedConnection && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => { setSelectedConnection(null); setActiveDocument(null); }}></div>
                        <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0f172a] border border-slate-700 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
                            
                            {/* Modal Header */}
                            <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center overflow-hidden">
                                        {selectedConnection.professional.profileImageUrl ? (
                                            <img src={selectedConnection.professional.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={32} className="text-emerald-400" />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                                            {selectedConnection.professional.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                                            {selectedConnection.professional.role || 'Professional'}
                                        </p>
                                        <p className="text-xs text-blue-400 mt-1">{selectedConnection.job.title}</p>
                                    </div>
                                </div>
                                <button onClick={() => { setSelectedConnection(null); setActiveDocument(null); }} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                                    <X size={28} />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto">
                                {isLoadingProfile ? (
                                    <div className="p-12 text-center">
                                        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                        <p className="text-slate-500">Loading profile data...</p>
                                    </div>
                                ) : profileData ? (
                                    <div className="p-8">
                                        {/* Access Badge */}
                                        <div className="flex items-center gap-2 text-emerald-400 mb-6 bg-emerald-500/10 w-fit px-4 py-2 rounded-full border border-emerald-500/20">
                                            <Shield size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Shared Vault Access</span>
                                        </div>

                                        {/* Document Cards */}
                                        {!activeDocument ? (
                                            <div className="grid grid-cols-2 gap-6">
                                                {profileData.accessList.map(docType => (
                                                    <button
                                                        key={docType}
                                                        onClick={() => setActiveDocument(docType)}
                                                        className="p-6 rounded-3xl bg-[#050b14] border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group text-left"
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-bold text-slate-300 group-hover:text-emerald-400 transition-colors uppercase">{docType}</span>
                                                            <ExternalLink size={16} className="text-slate-600 group-hover:text-emerald-400" />
                                                        </div>
                                                        <p className="text-xs text-slate-600 mt-2">Click to view</p>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <button
                                                    onClick={() => setActiveDocument(null)}
                                                    className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm font-bold transition-colors"
                                                >
                                                    ← Back to Documents
                                                </button>
                                                
                                                <div className="bg-[#050b14] border border-white/5 rounded-3xl p-6">
                                                    <h4 className="text-lg font-black text-white uppercase tracking-tight mb-4 pb-4 border-b border-white/5">
                                                        {activeDocument}
                                                    </h4>
                                                    {/* Render HTML content exactly as saved */}
                                                    <div 
                                                        className="prose prose-invert max-w-none text-slate-300
                                                            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-4
                                                            [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mb-3
                                                            [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white [&_h3]:mb-2
                                                            [&_p]:mb-4 [&_p]:leading-relaxed
                                                            [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4
                                                            [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4
                                                            [&_li]:mb-2
                                                            [&_a]:text-blue-400 [&_a]:underline
                                                            [&_strong]:font-bold [&_strong]:text-white
                                                            [&_em]:italic
                                                            [&_u]:underline
                                                            [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-4
                                                            [&_br]:block [&_br]:mb-2
                                                        "
                                                        style={{ whiteSpace: 'pre-wrap' }}
                                                        dangerouslySetInnerHTML={{ __html: getDocumentContent(activeDocument) }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {profileData.accessList.length === 0 && (
                                            <div className="text-center p-8 bg-slate-900/50 rounded-3xl border border-slate-800">
                                                <Shield size={32} className="text-slate-600 mx-auto mb-4" />
                                                <p className="text-slate-500">No documents shared for this connection.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-slate-500">
                                        Failed to load profile data.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
