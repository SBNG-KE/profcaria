"use client"

import React, { useRef, useEffect, useState } from 'react';
import { Video, Calendar, Clock, X, Building2, Link2, FileText, ExternalLink } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

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

const InterviewCard = ({ interview, onViewDetails, onJoinSession, isDark }: { interview: Interview, onViewDetails: () => void, onJoinSession: () => void, isDark: boolean }) => {
    const scheduledDate = new Date(interview.scheduledAt);
    const formattedDate = scheduledDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const formattedTime = scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const isPast = scheduledDate < new Date();

    return (
        <div className={`border rounded-[32px] p-6 transition-all group ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-neutral-200 shadow-sm'} ${isPast ? 'opacity-60' : ''} ${isDark ? 'hover:border-neutral-600' : 'hover:border-neutral-400'}`}>
            <div className="flex items-start gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br border overflow-hidden flex items-center justify-center shadow-lg shrink-0 ${isDark ? 'from-slate-700 to-slate-800 border-slate-700' : 'from-neutral-100 to-neutral-200 border-neutral-200'}`}>
                    {interview.companyLogo ? (
                        <img src={interview.companyLogo} alt={interview.companyName} className="w-full h-full object-cover" />
                    ) : (
                        <Building2 size={24} className={isDark ? 'text-slate-500' : 'text-neutral-400'} />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-bold truncate transition-colors ${isDark ? 'text-white group-hover:text-neutral-300' : 'text-black group-hover:text-neutral-600'}`}>{interview.jobTitle}</h3>
                    <p className={`text-sm font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{interview.companyName}</p>
                </div>
            </div>

            <div className="space-y-3 mb-6">
                <div className={`flex items-center gap-3 ${isDark ? 'text-slate-400' : 'text-neutral-500'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-black/5'}`}><Calendar size={14} /></div>
                    <span className="text-xs font-medium">{formattedDate}</span>
                </div>
                <div className={`flex items-center gap-3 ${isDark ? 'text-slate-400' : 'text-neutral-500'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-black/5'}`}><Clock size={14} /></div>
                    <span className="text-xs font-medium">{formattedTime}</span>
                </div>
            </div>

            <div className={`flex items-center justify-between pt-6 border-t gap-2 ${isDark ? 'border-white/5' : 'border-neutral-200'}`}>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${interview.status === 'scheduled' ? (isDark ? 'bg-white/10 text-white border border-white/20' : 'bg-black/5 text-black border border-black/10') :
                    interview.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        (isDark ? 'bg-slate-800 text-slate-400' : 'bg-neutral-100 text-neutral-500')
                    }`}>
                    {isPast ? 'Completed' : interview.status}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onViewDetails}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-black border-neutral-200'}`}
                    >
                        Details
                    </button>
                    {interview.meetingLink && !isPast && (
                        <button
                            onClick={onJoinSession}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${isDark ? 'bg-white/10 hover:bg-white text-white hover:text-black border-white/20' : 'bg-black/5 hover:bg-black text-black hover:text-white border-black/20'}`}
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
    const { theme } = useTheme();
    const isDark = theme === 'dark';
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
                        <h1 className={`text-4xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Interview Center</h1>
                        <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-neutral-500'}`}>View your scheduled interviews and join sessions.</p>
                    </div>
                </header>

                {/* Upcoming Interviews Summary Card */}
                <div className={`border p-6 rounded-2xl ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Upcoming Interviews</h3>
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-neutral-500'}`}>
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
                        <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-white/20 border-t-white' : 'border-black/20 border-t-black'}`}></div>
                        <p className={`font-bold text-xs uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-neutral-400'}`}>Loading interviews...</p>
                    </div>
                ) : interviews.length === 0 ? (
                    <div className={`border rounded-[40px] overflow-hidden ${isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                        <div className={`p-8 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-neutral-200'}`}>
                            <h2 className={`text-2xl font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-black'}`}>Your Interviews</h2>
                            <Clock className={isDark ? 'text-slate-500' : 'text-neutral-400'} />
                        </div>
                        <div className="p-12 text-center space-y-4">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? 'bg-slate-800/50' : 'bg-neutral-100'}`}>
                                <Video size={32} className={isDark ? 'text-slate-600' : 'text-neutral-400'} />
                            </div>
                            <h4 className={`text-lg font-bold ${isDark ? 'text-slate-300' : 'text-neutral-700'}`}>No Interview History</h4>
                            <p className={`max-w-md mx-auto ${isDark ? 'text-slate-500' : 'text-neutral-500'}`}>Your upcoming and completed interviews will appear here once they are scheduled by employers.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Upcoming Interviews */}
                        {upcomingInterviews.length > 0 && (
                            <div className="space-y-4">
                                <h2 className={`text-sm font-black uppercase tracking-widest flex items-center gap-3 ${isDark ? 'text-white' : 'text-black'}`}>
                                    <div className={`w-1.5 h-6 rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} />
                                    Upcoming
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {upcomingInterviews.map(interview => (
                                        <InterviewCard
                                            key={interview.id}
                                            interview={interview}
                                            isDark={isDark}
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
                                <h2 className={`text-sm font-black uppercase tracking-widest flex items-center gap-3 ${isDark ? 'text-slate-500' : 'text-neutral-400'}`}>
                                    <div className={`w-1.5 h-6 rounded-full ${isDark ? 'bg-slate-700' : 'bg-neutral-300'}`} />
                                    Past Interviews
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {pastInterviews.map(interview => (
                                        <InterviewCard
                                            key={interview.id}
                                            interview={interview}
                                            isDark={isDark}
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
                    <div className={`relative w-full max-w-2xl border rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 ${isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-neutral-200'}`}>
                        <div className={`p-8 border-b flex items-center justify-between ${isDark ? 'border-white/5' : 'border-neutral-200'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br border overflow-hidden flex items-center justify-center shadow-lg ${isDark ? 'from-slate-700 to-slate-800 border-slate-700' : 'from-neutral-100 to-neutral-200 border-neutral-200'}`}>
                                    {selectedInterview.companyLogo ? (
                                        <img src={selectedInterview.companyLogo} alt={selectedInterview.companyName} className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 size={28} className={isDark ? 'text-slate-500' : 'text-neutral-400'} />
                                    )}
                                </div>
                                <div className="text-left">
                                    <h3 className={`text-2xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>{selectedInterview.jobTitle}</h3>
                                    <p className={`text-sm font-bold ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{selectedInterview.companyName}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedInterview(null)} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-neutral-100 text-neutral-400'}`}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* Date & Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`border rounded-2xl p-5 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-neutral-50 border-neutral-200'}`}>
                                    <div className={`flex items-center gap-3 mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                        <Calendar size={18} />
                                        <span className="text-xs font-black uppercase tracking-widest">Date</span>
                                    </div>
                                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                        {new Date(selectedInterview.scheduledAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className={`border rounded-2xl p-5 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-neutral-50 border-neutral-200'}`}>
                                    <div className={`flex items-center gap-3 mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                        <Clock size={18} />
                                        <span className="text-xs font-black uppercase tracking-widest">Time</span>
                                    </div>
                                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                        {new Date(selectedInterview.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                    </p>
                                </div>
                            </div>

                            {/* Meeting Link */}
                            <div className={`border rounded-2xl p-5 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-neutral-50 border-neutral-200'}`}>
                                <div className={`flex items-center gap-3 mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                    <Link2 size={18} />
                                    <span className="text-xs font-black uppercase tracking-widest">Meeting Link</span>
                                </div>
                                {selectedInterview.meetingLink ? (
                                    <div className="flex items-center gap-3">
                                        <p className={`text-sm font-medium truncate flex-1 ${isDark ? 'text-slate-300' : 'text-neutral-600'}`}>{selectedInterview.meetingLink}</p>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(selectedInterview.meetingLink)}
                                            className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-white hover:text-neutral-300' : 'text-black hover:text-neutral-600'}`}
                                        >
                                            Copy
                                        </button>
                                    </div>
                                ) : (
                                    <p className={`text-sm italic ${isDark ? 'text-slate-500' : 'text-neutral-400'}`}>Meeting link will be shared by the employer</p>
                                )}
                            </div>

                            {/* Notes */}
                            {selectedInterview.notes && (
                                <div className={`border rounded-2xl p-5 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-neutral-50 border-neutral-200'}`}>
                                    <div className={`flex items-center gap-3 mb-2 ${isDark ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                        <FileText size={18} />
                                        <span className="text-xs font-black uppercase tracking-widest">Notes from Employer</span>
                                    </div>
                                    <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-neutral-600'}`}>{selectedInterview.notes}</p>
                                </div>
                            )}

                            {/* Status */}
                            <div className={`flex items-center justify-between p-5 border rounded-2xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                                <div className="flex items-center gap-3">
                                    <Video size={20} className={isDark ? 'text-neutral-300' : 'text-neutral-600'} />
                                    <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-neutral-600'}`}>Interview Status</span>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedInterview.status === 'scheduled' ? (isDark ? 'bg-white/10 text-white border border-white/20' : 'bg-black/5 text-black border border-black/10') :
                                    selectedInterview.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                        (isDark ? 'bg-slate-800 text-slate-400' : 'bg-neutral-100 text-neutral-500')
                                    }`}>
                                    {selectedInterview.status}
                                </span>
                            </div>
                        </div>

                        <div className={`p-8 border-t flex gap-4 ${isDark ? 'border-white/5' : 'border-neutral-200'}`}>
                            <button
                                onClick={() => setSelectedInterview(null)}
                                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-neutral-100 text-black hover:bg-neutral-200'}`}
                            >
                                Close
                            </button>
                            {selectedInterview.meetingLink && (
                                <button
                                    onClick={() => handleJoinMeeting(selectedInterview)}
                                    className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 ${isDark ? 'bg-white text-black hover:bg-neutral-200 shadow-white/20' : 'bg-black text-white hover:bg-neutral-800 shadow-black/20'}`}
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
                    <div className={`relative w-full max-w-md border rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 ${isDark ? 'bg-[#0f172a] border-slate-700' : 'bg-white border-neutral-200'}`}>
                        <div className={`p-8 border-b flex items-center justify-between ${isDark ? 'border-white/5' : 'border-neutral-200'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-black/5 border-black/10 text-black'}`}>
                                    <Video size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className={`text-xl font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Join Interview</h3>
                                    <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-neutral-400'}`}>Confirm before joining</p>
                                </div>
                            </div>
                            <button onClick={() => setShowJoinConfirm(false)} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-neutral-100 text-neutral-400'}`}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className={`border rounded-2xl p-5 space-y-4 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-neutral-50 border-neutral-200'}`}>
                                <div className="flex items-center gap-3">
                                    <Building2 size={18} className={isDark ? 'text-neutral-300' : 'text-neutral-500'} />
                                    <div>
                                        <p className={`text-[10px] uppercase tracking-widest font-bold ${isDark ? 'text-slate-500' : 'text-neutral-400'}`}>Company</p>
                                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{interviewToJoin.companyName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <FileText size={18} className={isDark ? 'text-neutral-300' : 'text-neutral-500'} />
                                    <div>
                                        <p className={`text-[10px] uppercase tracking-widest font-bold ${isDark ? 'text-slate-500' : 'text-neutral-400'}`}>Position</p>
                                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{interviewToJoin.jobTitle}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar size={18} className={isDark ? 'text-neutral-300' : 'text-neutral-500'} />
                                    <div>
                                        <p className={`text-[10px] uppercase tracking-widest font-bold ${isDark ? 'text-slate-500' : 'text-neutral-400'}`}>Date & Time</p>
                                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                            {new Date(interviewToJoin.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(interviewToJoin.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-4 border rounded-2xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                                <p className={`text-xs text-center ${isDark ? 'text-slate-400' : 'text-neutral-500'}`}>
                                    You'll be redirected to <span className="font-bold">{new URL(interviewToJoin.meetingLink).hostname}</span>
                                </p>
                            </div>
                        </div>

                        <div className={`p-8 border-t flex gap-4 ${isDark ? 'border-white/5' : 'border-neutral-200'}`}>
                            <button
                                onClick={() => setShowJoinConfirm(false)}
                                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-neutral-100 text-black hover:bg-neutral-200'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleJoinMeeting(interviewToJoin)}
                                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 ${isDark ? 'bg-white text-black hover:bg-neutral-200 shadow-white/20' : 'bg-black text-white hover:bg-neutral-800 shadow-black/20'}`}
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
