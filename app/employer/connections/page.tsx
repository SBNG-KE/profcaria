"use client"

import React, { useState } from 'react';
import {
    Users, Search, Filter, User, Mail, Link2,
    MoreHorizontal, ArrowUpRight, MessageSquare
} from 'lucide-react';

const ConnectionCard = ({ contact }: { contact: any }) => (
    <div className="bg-[#0f172a]/50 border border-white/5 rounded-[32px] p-6 hover:border-amber-500/30 transition-all group flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-[24px] bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 mb-4 group-hover:scale-110 transition-transform relative overflow-hidden">
            <User size={40} />
            <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors uppercase tracking-tight">{contact.name}</h3>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">{contact.role}</p>

        <div className="flex items-center gap-2 mb-6">
            <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest rounded-full border border-amber-500/20">
                1st Degree
            </span>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full">
            <button className="flex items-center justify-center gap-2 py-3 bg-slate-800/50 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
                <Mail size={14} /> Email
            </button>
            <button className="flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-amber-900/20">
                <MessageSquare size={14} /> Chat
            </button>
        </div>
    </div>
);

export default function ConnectionsPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const contacts = [
        { id: 1, name: 'Alex Johnson', role: 'Software Engineer', degree: '1st' },
        { id: 2, name: 'Sarah Smith', role: 'Product Designer', degree: '1st' },
        { id: 3, name: 'Michael Chen', role: 'Backend Developer', degree: '1st' },
        { id: 4, name: 'Emma Wilson', role: 'Marketing Lead', degree: '1st' },
        { id: 5, name: 'David Brown', role: 'DevOps Lead', degree: '2nd' },
        { id: 6, name: 'Lisa Ray', role: 'HR Manager', degree: '1st' },
    ];

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="text-left">
                        <div className="flex items-center gap-2 text-amber-400 mb-2">
                            <Link2 size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Network Node</span>
                        </div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Connections</h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">Your private network of professionals and industry leaders.</p>
                    </div>
                </header>

                {/* Search / Filters */}
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search your network..."
                            className="w-full bg-[#0f172a]/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="px-6 py-3 bg-slate-900 border border-white/5 text-slate-400 hover:text-white rounded-2xl flex items-center gap-2 text-xs font-bold transition-all"><Filter size={16} /> Industry</button>
                    <button className="px-6 py-3 bg-slate-900 border border-white/5 text-slate-400 hover:text-white rounded-2xl flex items-center gap-2 text-xs font-bold transition-all"><Filter size={16} /> Region</button>
                </div>

                {/* Connections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {contacts.map(contact => (
                        <ConnectionCard key={contact.id} contact={contact} />
                    ))}

                    {/* Empty State / Discover */}
                    <button className="border-2 border-dashed border-slate-800 rounded-[32px] p-6 flex flex-col items-center justify-center gap-4 text-slate-600 hover:border-amber-500/30 hover:text-amber-500/50 transition-all group">
                        <div className="p-4 rounded-full bg-slate-900 border border-slate-800 group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-all">
                            <ArrowUpRight size={32} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em]">Discover Talent</span>
                    </button>
                </div>

            </div>
        </div>
    );
}
