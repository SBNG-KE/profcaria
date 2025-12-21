"use client"

import React, { useRef, useEffect, useState } from 'react';
import { Video, Calendar, Clock, X, Building2, Link2, FileText, ExternalLink } from 'lucide-react';

interface Interview {
    id: string;
    scheduledAt: string;
    meetingLink: string;
    notes: string;
    status: string;
    jobTitle: string;
    companyName: string;
    companyLogo?: string;
}

const InterviewCard = ({ interview, onViewDetails, onJoinSession }: { interview: Interview, onViewDetails: () => void, onJoinSession: () => void }) => {
    const scheduledDate = new Date(interview.scheduledAt);
    const formattedDate = scheduledDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const formattedTime = scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const isPast = scheduledDate < new Date();

    return (
        <div className={`bg-slate-900/50 border rounded-[32px] p-6 hover:border-blue-500/30 transition-all group ${isPast ? 'border-slate-800 opacity-60' : 'border-slate-800'}`}>
            <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shadow-lg shrink-0">
                    {interview.companyLogo ? (
                        <img src={interview.companyLogo} alt={interview.companyName} className="w-full h-full object-cover" />
                    ) : (
                        <Building2 size={24} className="text-slate-500" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">{interview.jobTitle}</h3>
                    <p className="text-sm text-blue-400 font-medium">{interview.companyName}</p>
                </div>
            </div>

            <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-slate-400">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><Calendar size={14} /></div>
                    <span className="text-xs font-medium">{formattedDate}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><Clock size={14} /></div>
                    <span className="text-xs font-medium">{formattedTime}</span>
                </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/5 gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    interview.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    interview.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    'bg-slate-800 text-slate-400'
                }`}>
                    {isPast ? 'Completed' : interview.status}
                </span>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onViewDetails}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-700 transition-all"
                    >
                        Details
                    </button>
                    {interview.meetingLink && !isPast && (
                        <button 
                            onClick={onJoinSession}
                            className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-blue-500/20 transition-all"
                        >
                            Join Session
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function InterviewPage() {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
    const [showJoinConfirm, setShowJoinConfirm] = useState(false);
    const [interviewToJoin, setInterviewToJoin] = useState<Interview | null>(null);

    useEffect(() => {
        const fetchInterviews = async () => {
            try {
                const res = await fetch('/api/professional/interviews');
                if (res.ok) {
                    const data = await res.json();
                    setInterviews(data.interviews || []);
                }
            } catch (error) {
                console.error('Error fetching interviews:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchInterviews();
    }, []);

    const upcomingInterviews = interviews.filter(i => new Date(i.scheduledAt) >= new Date());
    const pastInterviews = interviews.filter(i => new Date(i.scheduledAt) < new Date());

    const handleJoinMeeting = (interview: Interview) => {
        if (interview.meetingLink) {
            window.open(interview.meetingLink, '_blank');
            setShowJoinConfirm(false);
            setInterviewToJoin(null);
        }
    };

    const openJoinConfirmation = (interview: Interview) => {
        setInterviewToJoin(interview);
        setShowJoinConfirm(true);
    };

    return (
        <div className="p-8">
            <div className="relative z-10 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tight">Interview Center</h1>
                        <p className="text-slate-400 mt-2">View your scheduled interviews and join sessions.</p>
                    </div>
                </header>

                {/* Upcoming Interviews Summary Card */}
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Upcoming Interviews</h3>
                            <p className="text-slate-400 text-sm">
                                {loading ? 'Loading...' : 
                                    upcomingInterviews.length === 0 ? 'No interviews scheduled. Keep applying!' :
                                    `You have ${upcomingInterviews.length} interview${upcomingInterviews.length > 1 ? 's' : ''} scheduled`
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        <p className="font-bold text-xs text-slate-500 uppercase tracking-widest">Loading interviews...</p>
                    </div>
                ) : interviews.length === 0 ? (
                    <div className="bg-[#0f172a] border border-slate-800 rounded-[40px] overflow-hidden">
                        <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Your Interviews</h2>
                            <Clock className="text-slate-500" />
                        </div>
                        <div className="p-12 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Video size={32} className="text-slate-600" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-300">No Interview History</h4>
                            <p className="text-slate-500 max-w-md mx-auto">Your upcoming and completed interviews will appear here once they are scheduled by employers.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Upcoming Interviews */}
                        {upcomingInterviews.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                                    Upcoming
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {upcomingInterviews.map(interview => (
                                        <InterviewCard 
                                            key={interview.id} 
                                            interview={interview}
                                            onViewDetails={() => setSelectedInterview(interview)}
                                            onJoinSession={() => openJoinConfirmation(interview)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Past Interviews */}
                        {pastInterviews.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-slate-700 rounded-full" />
                                    Past Interviews
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {pastInterviews.map(interview => (
                                        <InterviewCard 
                                            key={interview.id} 
                                            interview={interview}
                                            onViewDetails={() => setSelectedInterview(interview)}
                                            onJoinSession={() => openJoinConfirmation(interview)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Interview Details Modal */}
            {selectedInterview && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedInterview(null)}></div>
                    <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-700 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shadow-lg">
                                    {selectedInterview.companyLogo ? (
                                        <img src={selectedInterview.companyLogo} alt={selectedInterview.companyName} className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 size={28} className="text-slate-500" />
                                    )}
                                </div>
                                <div className="text-left">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">{selectedInterview.jobTitle}</h3>
                                    <p className="text-sm text-blue-400 font-bold">{selectedInterview.companyName}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedInterview(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* Date & Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                                    <div className="flex items-center gap-3 text-blue-400 mb-2">
                                        <Calendar size={18} />
                                        <span className="text-xs font-black uppercase tracking-widest">Date</span>
                                    </div>
                                    <p className="text-lg font-bold text-white">
                                        {new Date(selectedInterview.scheduledAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                                    <div className="flex items-center gap-3 text-blue-400 mb-2">
                                        <Clock size={18} />
                                        <span className="text-xs font-black uppercase tracking-widest">Time</span>
                                    </div>
                                    <p className="text-lg font-bold text-white">
                                        {new Date(selectedInterview.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                    </p>
                                </div>
                            </div>

                            {/* Meeting Link */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                                <div className="flex items-center gap-3 text-blue-400 mb-2">
                                    <Link2 size={18} />
                                    <span className="text-xs font-black uppercase tracking-widest">Meeting Link</span>
                                </div>
                                {selectedInterview.meetingLink ? (
                                    <div className="flex items-center gap-3">
                                        <p className="text-sm text-slate-300 font-medium truncate flex-1">{selectedInterview.meetingLink}</p>
                                        <button 
                                            onClick={() => navigator.clipboard.writeText(selectedInterview.meetingLink)}
                                            className="text-xs text-blue-400 hover:text-blue-300 font-bold uppercase tracking-widest"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 italic">Meeting link will be shared by the employer</p>
                                )}
                            </div>

                            {/* Notes */}
                            {selectedInterview.notes && (
                                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                                    <div className="flex items-center gap-3 text-blue-400 mb-2">
                                        <FileText size={18} />
                                        <span className="text-xs font-black uppercase tracking-widest">Notes from Employer</span>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed">{selectedInterview.notes}</p>
                                </div>
                            )}

                            {/* Status */}
                            <div className="flex items-center justify-between p-5 bg-blue-600/5 border border-blue-500/10 rounded-2xl">
                                <div className="flex items-center gap-3">
                                    <Video size={20} className="text-blue-400" />
                                    <span className="text-sm font-bold text-slate-300">Interview Status</span>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    selectedInterview.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    selectedInterview.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    'bg-slate-800 text-slate-400'
                                }`}>
                                    {selectedInterview.status}
                                </span>
                            </div>
                        </div>

                        <div className="p-8 border-t border-white/5 flex gap-4">
                            <button
                                onClick={() => setSelectedInterview(null)}
                                className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-700 transition-all"
                            >
                                Close
                            </button>
                            {selectedInterview.meetingLink && (
                                <button
                                    onClick={() => handleJoinMeeting(selectedInterview)}
                                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <ExternalLink size={16} />
                                    Join Meeting
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Join Session Confirmation Modal */}
            {showJoinConfirm && interviewToJoin && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowJoinConfirm(false)}></div>
                    <div className="relative w-full max-w-md bg-[#0f172a] border border-slate-700 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                    <Video size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Join Interview</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Confirm before joining</p>
                                </div>
                            </div>
                            <button onClick={() => setShowJoinConfirm(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Building2 size={18} className="text-blue-400" />
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Company</p>
                                        <p className="text-sm font-bold text-white">{interviewToJoin.companyName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <FileText size={18} className="text-blue-400" />
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Position</p>
                                        <p className="text-sm font-bold text-white">{interviewToJoin.jobTitle}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar size={18} className="text-blue-400" />
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Date & Time</p>
                                        <p className="text-sm font-bold text-white">
                                            {new Date(interviewToJoin.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(interviewToJoin.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-600/5 border border-blue-500/10 rounded-2xl">
                                <p className="text-xs text-slate-400 text-center">
                                    You'll be redirected to <span className="text-blue-400 font-bold">{new URL(interviewToJoin.meetingLink).hostname}</span>
                                </p>
                            </div>
                        </div>

                        <div className="p-8 border-t border-white/5 flex gap-4">
                            <button
                                onClick={() => setShowJoinConfirm(false)}
                                className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-700 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleJoinMeeting(interviewToJoin)}
                                className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <ExternalLink size={16} />
                                Join Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
