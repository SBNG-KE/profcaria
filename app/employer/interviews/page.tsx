"use client"

import React, { useState } from 'react';
import {
    Calendar, Clock, Video, Users, MapPin,
    ChevronLeft, ChevronRight, Plus, MoreHorizontal
} from 'lucide-react';

const InterviewCard = ({ interview }: { interview: any }) => (
    <div className="bg-[#0f172a]/50 border border-white/5 rounded-[32px] p-6 hover:border-violet-500/30 transition-all group">
        <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-violet-400">
                    <Video size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors">{interview.candidate}</h3>
                    <p className="text-xs text-slate-500 font-medium">{interview.position}</p>
                </div>
            </div>
            <button className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors">
                <MoreHorizontal size={20} />
            </button>
        </div>

        <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-slate-400">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><Calendar size={14} /></div>
                <span className="text-xs font-medium">{interview.date}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><Clock size={14} /></div>
                <span className="text-xs font-medium">{interview.time}</span>
            </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-white/5">
            <div className="flex -space-x-2">
                {[1, 2].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-[#050b14] flex items-center justify-center text-[10px] text-slate-500 font-bold">INT</div>
                ))}
                <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-[#050b14] flex items-center justify-center text-[8px] text-slate-600 font-bold">+1</div>
            </div>
            <button className="px-4 py-2 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-violet-500/20 transition-all">
                Join Call
            </button>
        </div>
    </div>
);

export default function InterviewsPage() {
    const interviews = [
        { id: 1, candidate: 'Alex Johnson', position: 'Senior Frontend Engineer', date: 'Dec 19, 2025', time: '10:00 AM - 11:00 AM' },
        { id: 2, candidate: 'Sarah Smith', position: 'Product Designer', date: 'Dec 20, 2025', time: '2:00 PM - 3:00 PM' },
        { id: 3, candidate: 'Michael Chen', position: 'Fullstack Developer', date: 'Dec 22, 2025', time: '11:30 AM - 12:30 PM' },
    ];

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="text-left">
                        <div className="flex items-center gap-2 text-violet-400 mb-2">
                            <Video size={16} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live Sessions</span>
                        </div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Interview Desk</h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium">Coordinate and conduct high-resolution video interviews.</p>
                    </div>

                    <button className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-violet-900/20 transition-all active:scale-95 flex items-center gap-2">
                        <Plus size={18} />
                        <span>Schedule New</span>
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {interviews.map(interview => (
                        <InterviewCard key={interview.id} interview={interview} />
                    ))}

                    {/* Calendar View Placeholder */}
                    <div className="md:col-span-2 lg:col-span-3 bg-[#0f172a]/20 border border-white/5 rounded-[40px] p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Calendar View</h3>
                            <div className="flex items-center gap-4 text-slate-500">
                                <button className="p-2 hover:bg-white/5 rounded-lg"><ChevronLeft size={20} /></button>
                                <span className="text-xs font-bold uppercase tracking-widest">December 2025</span>
                                <button className="p-2 hover:bg-white/5 rounded-lg"><ChevronRight size={20} /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="bg-[#050b14] p-4 text-[10px] font-black text-slate-600 uppercase text-center tracking-widest">{day}</div>
                            ))}
                            {Array.from({ length: 35 }).map((_, i) => (
                                <div key={i} className="bg-[#050b14]/50 h-32 p-4 border-t border-white/5 hover:bg-white/[0.02] transition-colors relative">
                                    <span className="text-[10px] font-mono text-slate-700">{i + 1}</span>
                                    {i === 18 && <div className="mt-2 p-2 bg-violet-500/20 border border-violet-500/30 rounded-lg text-violet-400 text-[8px] font-bold truncate">Interview with Alex</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
