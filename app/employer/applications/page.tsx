"use client"

import React, { useState } from 'react';
import {
    FileText, Search, Filter, MoreVertical,
    User, CheckCircle2, XCircle, Clock, ExternalLink, Shield
} from 'lucide-react';
import Image from 'next/image';

const ApplicationRow = ({ app, onAccept, onReject, onView }: { app: any, onAccept: () => void, onReject: () => void, onView: () => void }) => (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
        <td className="py-5 px-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-slate-500 overflow-hidden relative">
                    <User size={20} />
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div>
                    <span className="text-sm font-bold text-white block">{app.candidate}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{app.role}</span>
                </div>
            </div>
        </td>
        <td className="py-5 px-6">
            <div className="flex flex-col">
                <span className="text-xs text-slate-300 font-medium">{app.jobTitle}</span>
                <span className="text-[10px] text-slate-500">{app.department}</span>
            </div>
        </td>
        <td className="py-5 px-6">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${app.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    app.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-slate-800 text-slate-400 border border-white/5'
                }`}>
                {app.status}
            </span>
        </td>
        <td className="py-5 px-6">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <Clock size={12} />
                {app.appliedDate}
            </div>
        </td>
        <td className="py-5 px-6 text-right">
            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onView}
                    className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
                    title="View Profile"
                >
                    <ExternalLink size={16} />
                </button>
                {app.status === 'Pending' && (
                    <>
                        <button
                            onClick={onAccept}
                            className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all"
                            title="Accept"
                        >
                            <CheckCircle2 size={16} />
                        </button>
                        <button
                            onClick={onReject}
                            className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                            title="Reject"
                        >
                            <XCircle size={16} />
                        </button>
                    </>
                )}
            </div>
        </td>
    </tr>
);

export default function ApplicationsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedApplicant, setSelectedApplicant] = useState<any>(null);

    const dummyApps = [
        { id: 1, candidate: 'Alex Johnson', role: 'Frontend Engineer', jobTitle: 'Senior Frontend Engineer', department: 'Engineering', status: 'Pending', appliedDate: '2H AGO' },
        { id: 2, candidate: 'Sarah Smith', role: 'UI/UX Designer', jobTitle: 'Product Designer', department: 'Design', status: 'Accepted', appliedDate: '1D AGO' },
        { id: 3, candidate: 'Michael Chen', role: 'System Architect', jobTitle: 'Fullstack Developer', department: 'Engineering', status: 'Pending', appliedDate: '3D AGO' },
        { id: 4, candidate: 'Emma Wilson', role: 'Marketing Specialist', jobTitle: 'Marketing Lead', department: 'Growth', status: 'Rejected', appliedDate: '1W AGO' },
    ];

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="text-left">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                            <FileText size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Applicant Tracking</span>
                        </div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Job Applications</h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">Review talent submissions and manage secure profile access.</p>
                    </div>
                </header>

                {/* Toolbar */}
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search applicants or roles..."
                            className="w-full bg-[#0f172a]/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Applications Table */}
                <div className="bg-[#0f172a]/30 border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.02] border-b border-white/5">
                                <tr>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Candidate</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Position</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Timeline</th>
                                    <th className="py-5 px-6 text-right"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {dummyApps.map(app => (
                                    <ApplicationRow
                                        key={app.id}
                                        app={app}
                                        onAccept={() => { }}
                                        onReject={() => { }}
                                        onView={() => setSelectedApplicant(app)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Profile Modal Placeholder */}
                {selectedApplicant && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedApplicant(null)}></div>
                        <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-700 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95">
                            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                        <User size={32} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-2xl font-black text-white uppercase tracking-tight">{selectedApplicant.candidate}</h3>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{selectedApplicant.role}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedApplicant(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                                    <XCircle size={28} />
                                </button>
                            </div>

                            <div className="p-8 bg-slate-900/30">
                                <div className="flex items-center gap-2 text-emerald-400 mb-6 bg-emerald-500/10 w-fit px-4 py-2 rounded-full border border-emerald-500/20">
                                    <Shield size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Shared Secret Vault Access Granted</span>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Dummy Cards */}
                                    {['RESUME', 'CERTIFICATES', 'PORTFOLIO'].map(card => (
                                        <div key={card} className="p-6 rounded-3xl bg-[#050b14] border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-slate-300 group-hover:text-blue-400 transition-colors">{card}</span>
                                                <ExternalLink size={16} className="text-slate-600 group-hover:text-blue-400" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
