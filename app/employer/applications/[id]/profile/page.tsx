"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ChevronLeft, UserCircle, Briefcase, Mail, FileText,
    Calendar, Shield, Lock, ExternalLink, Download, ChevronRight
} from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize';

interface ProfileData {
    profile: {
        id: string;
        firstName: string;
        lastName: string;
        role: string;
        profileImageUrl?: string;
        email: string;
    };
    sharedDocuments: {
        type: string;
        content: string;
        lastUpdated: string;
    }[];
    accessList: string[];
}

export default function EmployerProfileViewPage() {
    const { id } = useParams();
    const router = useRouter();
    const [data, setData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`/api/employer/applications/${id}/profile`);
                if (res.ok) {
                    const profileData = await res.json();
                    setData(profileData);
                    if (profileData.sharedDocuments.length > 0) {
                        setActiveTab(profileData.sharedDocuments[0].type);
                    }
                }
            } catch (error) {
                console.error("Error fetching profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#050b14]">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
    );

    if (!data) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#050b14] space-y-4">
            <Lock size={48} className="text-red-500 opacity-20" />
            <p className="font-bold text-slate-500 uppercase tracking-widest text-center">Unauthorized or Profile Missing</p>
            <button onClick={() => router.back()} className="text-emerald-500 font-bold hover:underline uppercase text-xs">Go Back</button>
        </div>
    );

    const activeDoc = data.sharedDocuments.find(d => d.type === activeTab);

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 pb-32">
            <header className="flex items-center justify-between border-b border-slate-800 pb-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-all font-bold uppercase text-[10px] tracking-widest"
                >
                    <ChevronLeft size={16} /> Back to Applications
                </button>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                        <Shield size={12} /> Access Verified
                    </span>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Sidebar: Profile Info */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-[#0f172a] border border-slate-800 rounded-[40px] p-8 text-center space-y-6 shadow-2xl overflow-hidden relative group">
                        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                        <div className="w-32 h-32 rounded-[40px] bg-slate-800 border-2 border-slate-700 mx-auto overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105">
                            {data.profile.profileImageUrl ? (
                                <img src={data.profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600"><UserCircle size={64} /></div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">{data.profile.firstName} {data.profile.lastName}</h1>
                            <p className="text-emerald-400 font-black uppercase tracking-widest text-[10px]">{data.profile.role}</p>
                        </div>
                        <div className="pt-6 border-t border-slate-800 space-y-4 text-left">
                            <div className="flex items-center gap-4 text-slate-400">
                                <div className="p-2 bg-slate-900 rounded-xl"><Mail size={16} /></div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Digital Index</p>
                                    <p className="text-xs font-mono truncate max-w-[150px]">{data.profile.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-slate-400">
                                <div className="p-2 bg-slate-900 rounded-xl"><Briefcase size={16} /></div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Experience</p>
                                    <p className="text-xs font-bold text-slate-300">Verified Candidate</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[32px] p-6 space-y-4">
                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={14} /> Shared Artifacts
                        </h4>
                        <div className="flex flex-col gap-2">
                            {data.sharedDocuments.map((doc) => (
                                <button
                                    key={doc.type}
                                    onClick={() => setActiveTab(doc.type)}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${activeTab === doc.type ? 'bg-emerald-500/10 border-emerald-500/30 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                                >
                                    <span className="text-xs font-bold uppercase tracking-widest">{doc.type}</span>
                                    <ChevronRight size={14} className={activeTab === doc.type ? 'translate-x-1' : ''} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main: Content Rendering */}
                <div className="lg:col-span-8 flex flex-col space-y-6">
                    {activeDoc ? (
                        <div className="flex flex-col min-h-[700px]" >
                            <div className="py-6 border-b border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{activeDoc.type}</h3>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Updated {new Date(activeDoc.lastUpdated).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-all"><Download size={18} /></button>
                                    <button className="p-2.5 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-all"><ExternalLink size={18} /></button>
                                </div>
                            </div>
                            <div className="flex-1 py-10 text-left w-full max-w-none">
                                <div
                                    className="prose prose-invert prose-emerald max-w-none text-slate-300 font-medium leading-relaxed
                                        [&_h1]:text-white [&_h1]:font-black [&_h1]:uppercase [&_h1]:tracking-tight
                                        [&_p]:break-words [&_pre]:whitespace-pre-wrap [&_pre]:break-words
                                    "
                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeDoc.content) }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-[40px] flex flex-col items-center justify-center text-slate-700 space-y-4">
                            <FileText size={48} className="opacity-20" />
                            <p className="font-bold text-xs uppercase tracking-widest">No shared documents selected</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
