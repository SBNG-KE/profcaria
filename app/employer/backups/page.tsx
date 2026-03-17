"use client"

import React, { useState } from 'react';
import {
    Database, Download, FileSpreadsheet, Search, Filter,
    ArrowUpDown, ChevronLeft, ChevronRight, Share2, Printer
} from 'lucide-react';

const TableRow = ({ data }: { data: any }) => (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
        <td className="py-4 px-6">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#3B5998]/10 border border-[#3B5998]/20 flex items-center justify-center text-[#6B8CD5] font-bold text-xs">
                    {data.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-slate-200">{data.name}</span>
            </div>
        </td>
        <td className="py-4 px-6 text-sm text-slate-400">{data.role}</td>
        <td className="py-4 px-6">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${data.status === 'Active' ? 'bg-[#3B5998]/10 text-[#6B8CD5] border border-[#3B5998]/20' :
                    data.status === 'Shortlisted' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-slate-800 text-slate-500'
                }`}>
                {data.status}
            </span>
        </td>
        <td className="py-4 px-6 text-sm text-slate-400 font-mono">{data.date}</td>
        <td className="py-4 px-6 text-right">
            <button className="text-slate-500 hover:text-white transition-colors">
                <Share2 size={16} />
            </button>
        </td>
    </tr>
);

export default function BackupsPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const dummyData = [
        { name: 'Alex Johnson', role: 'Frontend Engineer', status: 'Active', date: '2025-12-01' },
        { name: 'Sarah Smith', role: 'Product Manager', status: 'Shortlisted', date: '2025-12-05' },
        { name: 'Michael Chen', role: 'Backend Developer', status: 'Active', date: '2025-12-10' },
        { name: 'Emma Wilson', role: 'UI/UX Designer', status: 'Shortlisted', date: '2025-12-12' },
        { name: 'David Brown', role: 'DevOps Engineer', status: 'Pending', date: '2025-12-15' },
    ];

    return (
        <div className="p-8 h-full flex flex-col bg-[#050b14]">
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="text-left">
                        <div className="flex items-center gap-2 text-[#6B8CD5] mb-2">
                            <Database size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Data Vault</span>
                        </div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Excel Architecture</h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">Modern backup system with high-fidelity data exports.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="p-2.5 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700/50 transition-all"><Printer size={18} /></button>
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-[#3B5998] hover:bg-[#3B5998] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#3B5998]/20 transition-all active:scale-95">
                            <Download size={16} />
                            <span>Export XLSX</span>
                        </button>
                    </div>
                </header>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-[#0f172a]/50 border border-white/5 rounded-2xl backdrop-blur-md">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search data records..."
                            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3B5998]/50 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-700/50 uppercase tracking-widest"><Filter size={14} /> Filter</button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-700/50 uppercase tracking-widest"><ArrowUpDown size={14} /> Sort</button>
                    </div>
                </div>

                {/* Table Area */}
                <div className="bg-[#0f172a]/30 border border-white/5 rounded-[32px] overflow-hidden flex-1 shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.02] border-b border-white/5">
                                <tr>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Candidate</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Position</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Applied Date</th>
                                    <th className="py-5 px-6 text-right"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {dummyData.map((row, idx) => (
                                    <TableRow key={idx} data={row} />
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-6 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Showing 5 of 124 records</span>
                        <div className="flex items-center gap-2">
                            <button className="p-2 bg-slate-800/50 text-slate-600 cursor-not-allowed rounded-lg"><ChevronLeft size={16} /></button>
                            <button className="p-2 bg-slate-800/50 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>

                {/* Legend / Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-[#3B5998]/5 border border-[#3B5998]/10 rounded-[24px]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-[#3B5998]/20 rounded-lg text-[#6B8CD5]"><FileSpreadsheet size={20} /></div>
                            <h4 className="text-sm font-bold text-white uppercase tracking-tight">Structured Exports</h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">All backups are exported in 64-bit precision XLSX format with recursive relational data mapping.</p>
                    </div>
                    {/* ... more info cards if needed ... */}
                </div>

            </div>
        </div>
    );
}
