"use client"

import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, Video, Users, Link2, Edit3, X, Plus, MoreHorizontal, ChevronLeft, ChevronRight, Check, User, ExternalLink
} from 'lucide-react';

interface Interview {
    id: string;
    applicationId: string;
    scheduledAt: string;
    meetingLink: string;
    notes: string;
    status: string;
    candidateName: string;
    jobTitle: string;
}

interface Application {
    id: string;
    user: { id: string; name: string };
    job: { id: string; title: string };
    status: string;
}

const InterviewCard = ({ interview, onEdit, onJoin }: { interview: Interview, onEdit: () => void, onJoin: () => void }) => {
    const scheduledDate = new Date(interview.scheduledAt);
    const formattedDate = scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const formattedTime = scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    return (
        <div className="bg-[#0f172a]/50 border border-white/5 rounded-[32px] p-6 hover:border-violet-500/30 transition-all group">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-violet-400">
                        <Video size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors">{interview.candidateName}</h3>
                        <p className="text-xs text-slate-500 font-medium">{interview.jobTitle}</p>
                    </div>
                </div>
                <button 
                    onClick={onEdit}
                    className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-violet-400 transition-colors"
                >
                    <Edit3 size={18} />
                </button>
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
                {interview.meetingLink && (
                    <div className="flex items-center gap-3 text-slate-400">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><Link2 size={14} /></div>
                        <span className="text-xs font-medium truncate max-w-[180px]">{interview.meetingLink}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    interview.status === 'scheduled' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                    interview.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    'bg-slate-800 text-slate-400'
                }`}>
                    {interview.status}
                </span>
                {interview.meetingLink && (
                    <button 
                        onClick={onJoin}
                        className="px-4 py-2 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-violet-500/20 transition-all flex items-center gap-2"
                    >
                        <ExternalLink size={12} />
                        Open Link
                    </button>
                )}
            </div>
        </div>
    );
};

export default function InterviewsPage() {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
    const [scheduleMode, setScheduleMode] = useState<'single' | 'multiple'>('single');
    const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        scheduledAt: '',
        meetingLink: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [interviewsRes, appsRes] = await Promise.all([
                fetch('/api/employer/interviews'),
                fetch('/api/employer/applications')
            ]);

            if (interviewsRes.ok) {
                const data = await interviewsRes.json();
                setInterviews(data.interviews || []);
            }

            if (appsRes.ok) {
                const data = await appsRes.json();
                // Filter to only show applications that don't already have interviews scheduled
                setApplications(data.applications || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openScheduleModal = () => {
        setEditingInterview(null);
        setFormData({ scheduledAt: '', meetingLink: '', notes: '' });
        setSelectedApplications([]);
        setScheduleMode('single');
        setShowScheduleModal(true);
    };

    const openEditModal = (interview: Interview) => {
        setEditingInterview(interview);
        const date = new Date(interview.scheduledAt);
        const localDateTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setFormData({
            scheduledAt: localDateTime,
            meetingLink: interview.meetingLink || '',
            notes: interview.notes || ''
        });
        setSelectedApplications([interview.applicationId]);
        setShowScheduleModal(true);
    };

    const handleApplicationToggle = (appId: string) => {
        if (scheduleMode === 'single') {
            setSelectedApplications([appId]);
        } else {
            setSelectedApplications(prev => 
                prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
            );
        }
    };

    const handleSubmit = async () => {
        if (selectedApplications.length === 0 || !formData.scheduledAt) return;
        setSubmitting(true);

        try {
            if (editingInterview) {
                // Update existing interview
                const res = await fetch('/api/employer/interviews', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        interviewId: editingInterview.id,
                        scheduledAt: formData.scheduledAt,
                        meetingLink: formData.meetingLink,
                        notes: formData.notes
                    })
                });
                if (res.ok) {
                    await fetchData();
                    setShowScheduleModal(false);
                }
            } else {
                // Create new interview(s)
                for (const appId of selectedApplications) {
                    await fetch('/api/employer/interviews', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            applicationId: appId,
                            scheduledAt: formData.scheduledAt,
                            meetingLink: formData.meetingLink,
                            notes: formData.notes
                        })
                    });
                }
                await fetchData();
                setShowScheduleModal(false);
            }
        } catch (error) {
            console.error('Error saving interview:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleJoinCall = (interview: Interview) => {
        if (interview.meetingLink) {
            window.open(interview.meetingLink, '_blank');
        }
    };

    // Get applications that can be scheduled (not already having an interview)
    const schedulableApps = applications.filter(app => 
        !interviews.some(i => i.applicationId === app.id) && 
        (app.status === 'pending' || app.status === 'interview_scheduled' || app.status === 'accepted')
    );

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
                        <p className="text-slate-500 mt-2 text-sm font-medium">Schedule and manage interviews with candidates.</p>
                    </div>

                    <button 
                        onClick={openScheduleModal}
                        className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-violet-900/20 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        <span>Schedule New</span>
                    </button>
                </header>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4">
                        <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
                        <p className="font-bold text-xs text-slate-500 uppercase tracking-widest">Loading interviews...</p>
                    </div>
                ) : interviews.length === 0 ? (
                    <div className="py-32 flex flex-col items-center justify-center text-slate-600 space-y-4 bg-[#0f172a]/30 border border-white/5 rounded-[40px]">
                        <Video size={64} className="opacity-20" />
                        <p className="font-bold text-sm uppercase tracking-widest">No interviews scheduled</p>
                        <p className="text-xs text-slate-500 max-w-md text-center">Click "Schedule New" to set up interviews with your candidates.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {interviews.map(interview => (
                            <InterviewCard 
                                key={interview.id} 
                                interview={interview}
                                onEdit={() => openEditModal(interview)}
                                onJoin={() => handleJoinCall(interview)}
                            />
                        ))}
                    </div>
                )}

                {/* Calendar View */}
                <div className="bg-[#0f172a]/20 border border-white/5 rounded-[40px] p-8">
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
                        {Array.from({ length: 35 }).map((_, i) => {
                            const dayInterviews = interviews.filter(interview => {
                                const date = new Date(interview.scheduledAt);
                                return date.getDate() === i + 1 && date.getMonth() === 11;
                            });
                            return (
                                <div key={i} className="bg-[#050b14]/50 h-32 p-4 border-t border-white/5 hover:bg-white/[0.02] transition-colors relative">
                                    <span className="text-[10px] font-mono text-slate-700">{i + 1}</span>
                                    {dayInterviews.slice(0, 2).map((interview, idx) => (
                                        <div key={interview.id} className="mt-1 p-2 bg-violet-500/20 border border-violet-500/30 rounded-lg text-violet-400 text-[8px] font-bold truncate">
                                            {interview.candidateName}
                                        </div>
                                    ))}
                                    {dayInterviews.length > 2 && (
                                        <div className="mt-1 text-[8px] text-violet-400 font-bold">+{dayInterviews.length - 2} more</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* Schedule/Edit Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowScheduleModal(false)}></div>
                    <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-700 rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                                    <Calendar size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                                        {editingInterview ? 'Edit Interview' : 'Schedule Interview'}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                                        {editingInterview ? 'Update interview details' : 'Set up a new interview session'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Mode Toggle - Only show for new interviews */}
                            {!editingInterview && (
                                <div className="space-y-3">
                                    <label className="text-sm font-black text-slate-300 uppercase tracking-wide">Schedule For</label>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                setScheduleMode('single');
                                                setSelectedApplications([]);
                                            }}
                                            className={`flex-1 p-4 rounded-xl border transition-all flex items-center justify-center gap-3 ${
                                                scheduleMode === 'single' 
                                                    ? 'bg-violet-600/10 border-violet-500 text-violet-400' 
                                                    : 'border-slate-800 text-slate-500 hover:border-slate-700'
                                            }`}
                                        >
                                            <User size={18} />
                                            <span className="text-xs font-black uppercase tracking-widest">One Person</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setScheduleMode('multiple');
                                                setSelectedApplications([]);
                                            }}
                                            className={`flex-1 p-4 rounded-xl border transition-all flex items-center justify-center gap-3 ${
                                                scheduleMode === 'multiple' 
                                                    ? 'bg-violet-600/10 border-violet-500 text-violet-400' 
                                                    : 'border-slate-800 text-slate-500 hover:border-slate-700'
                                            }`}
                                        >
                                            <Users size={18} />
                                            <span className="text-xs font-black uppercase tracking-widest">Multiple People</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Application Selection - Only show for new interviews */}
                            {!editingInterview && (
                                <div className="space-y-3">
                                    <label className="text-sm font-black text-slate-300 uppercase tracking-wide">
                                        Select Candidate{scheduleMode === 'multiple' ? 's' : ''}
                                    </label>
                                    {schedulableApps.length === 0 ? (
                                        <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl text-center">
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No candidates available to schedule</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                            {schedulableApps.map(app => (
                                                <button
                                                    key={app.id}
                                                    onClick={() => handleApplicationToggle(app.id)}
                                                    className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between ${
                                                        selectedApplications.includes(app.id)
                                                            ? 'bg-violet-600/10 border-violet-500 text-white'
                                                            : 'border-slate-800 text-slate-400 hover:border-slate-700'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 text-left">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                                                            <User size={18} />
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-bold block">{app.user.name}</span>
                                                            <span className="text-xs text-slate-500">{app.job.title}</span>
                                                        </div>
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                        selectedApplications.includes(app.id)
                                                            ? 'border-violet-500 bg-violet-500'
                                                            : 'border-slate-700'
                                                    }`}>
                                                        {selectedApplications.includes(app.id) && <Check size={12} className="text-white" />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Date & Time */}
                            <div className="space-y-3">
                                <label className="text-sm font-black text-slate-300 uppercase tracking-wide">Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={formData.scheduledAt}
                                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all font-medium"
                                />
                            </div>

                            {/* Meeting Link */}
                            <div className="space-y-3">
                                <label className="text-sm font-black text-slate-300 uppercase tracking-wide flex items-center gap-2">
                                    <Link2 size={16} />
                                    Meeting Link
                                </label>
                                <input
                                    type="url"
                                    value={formData.meetingLink}
                                    onChange={(e) => setFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
                                    placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all font-medium placeholder:text-slate-600"
                                />
                                <p className="text-[10px] text-slate-500 font-medium">Paste the meeting link from Zoom, Google Meet, Teams, or any other video call software</p>
                            </div>

                            {/* Notes */}
                            <div className="space-y-3">
                                <label className="text-sm font-black text-slate-300 uppercase tracking-wide">Notes (Optional)</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Any additional notes for the interview..."
                                    rows={3}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all font-medium placeholder:text-slate-600 resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-8 border-t border-white/5 flex gap-4">
                            <button
                                onClick={() => setShowScheduleModal(false)}
                                className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-700 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || (!editingInterview && selectedApplications.length === 0) || !formData.scheduledAt}
                                className="flex-1 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-violet-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Check size={16} />
                                        {editingInterview ? 'Save Changes' : `Schedule${scheduleMode === 'multiple' && selectedApplications.length > 1 ? ` (${selectedApplications.length})` : ''}`}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
