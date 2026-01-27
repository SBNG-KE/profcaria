"use client"

import React, { useState } from 'react';
import {
    Briefcase, GraduationCap, Award, BadgeCheck, Link2, Plus, PenLine, Trash2, X,
    Linkedin, Github, Twitter, Globe
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import SlideOverPanel from '@/app/components/ui/SlideOverPanel';

interface ProfileInfoSectionProps {
    isDark?: boolean;
    readOnly?: boolean;
    // Data
    employmentHistory: any[];
    education: any[];
    skills: any[];
    certifications: any[];
    awards: any[];
    otherProfiles: any[];
    // Handlers (optional in readOnly)
    onAdd?: (section: string) => void;
    onEdit?: (section: string, item: any) => void;
    onDelete?: (section: string, id: string) => void;
}

export default function ProfileInfoSection({
    isDark: propIsDark,
    readOnly = false,
    employmentHistory,
    education,
    skills,
    certifications,
    awards,
    otherProfiles,
    onAdd,
    onEdit,
    onDelete
}: ProfileInfoSectionProps) {
    const { theme } = useTheme();
    const isDark = propIsDark ?? (theme === 'dark');

    const getProfileIcon = (platform: string) => {
        const p = platform?.toLowerCase() || '';
        if (p.includes('linkedin')) return <Linkedin size={18} />;
        if (p.includes('github')) return <Github size={18} />;
        if (p.includes('twitter') || p.includes('x.com') || p.includes('x')) return <Twitter size={18} />;
        return <Globe size={18} />;
    };

    const SectionHeader = ({ title, icon: Icon, sectionKey }: { title: string, icon: any, sectionKey: string }) => (
        <div className="flex items-center justify-between mb-6">
            <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                <Icon size={20} /> {title}
            </h3>
            {!readOnly && onAdd && (
                <button
                    onClick={() => onAdd(sectionKey)}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-100 text-neutral-500'}`}
                >
                    <Plus size={20} />
                </button>
            )}
        </div>
    );

    const EditActions = ({ section, item }: { section: string, item: any }) => {
        if (readOnly) return null;
        return (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                    <button onClick={() => onEdit(section, item)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-neutral-700 text-neutral-400' : 'hover:bg-neutral-200 text-neutral-500'}`}>
                        <PenLine size={14} />
                    </button>
                )}
                {onDelete && (
                    <button onClick={() => onDelete(section, item.id)} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-500'}`}>
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Experience */}
            <div className={`p-5 md:p-8 rounded-[32px] md:rounded-[40px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <SectionHeader title="Experience" icon={Briefcase} sectionKey="employment" />
                <div className="space-y-8">
                    {employmentHistory.length === 0 ? (
                        <p className={`text-sm italic ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No experience added yet.</p>
                    ) : (
                        employmentHistory.map((job) => (
                            <div key={job.id} className="group relative pl-8 border-l-2 border-neutral-200 dark:border-neutral-800 last:border-0 pb-8 last:pb-0">
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 ${isDark ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-neutral-300'}`}></div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>{job.title}</h4>
                                        <p className={`font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{job.company}</p>
                                        <p className={`text-xs uppercase tracking-wider font-bold mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                            {new Date(job.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} — {job.isCurrent ? 'Present' : new Date(job.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                        </p>
                                        {job.description && (
                                            <p className={`mt-3 text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{job.description}</p>
                                        )}
                                    </div>
                                    <EditActions section="employment" item={job} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Education */}
            <div className={`p-5 md:p-8 rounded-[32px] md:rounded-[40px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <SectionHeader title="Education" icon={GraduationCap} sectionKey="education" />
                <div className="space-y-6">
                    {education.length === 0 ? (
                        <p className={`text-sm italic ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No education added yet.</p>
                    ) : (
                        education.map((edu) => (
                            <div key={edu.id} className="group flex justify-between items-start">
                                <div>
                                    <h4 className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{edu.school}</h4>
                                    <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</p>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                        {new Date(edu.startDate).getFullYear()} - {edu.isCurrent ? 'Present' : new Date(edu.endDate).getFullYear()}
                                    </p>
                                </div>
                                <EditActions section="education" item={edu} />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Skills */}
            <div className={`p-5 md:p-8 rounded-[32px] md:rounded-[40px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <SectionHeader title="Skills" icon={BadgeCheck} sectionKey="skills" />
                <div className="flex flex-wrap gap-2">
                    {skills.length === 0 ? (
                        <p className={`text-sm italic ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No skills added yet.</p>
                    ) : (
                        skills.map((skill) => (
                            <div key={skill.id} className={`group flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-50 border-neutral-200 text-black'}`}>
                                <span>{skill.name}</span>
                                {!readOnly && onDelete && (
                                    <button onClick={() => onDelete('skills', skill.id)} className={`hidden group-hover:block ml-1 ${isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-400 hover:text-black'}`}>
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Certifications & Awards Grid represented as one row if desired, or stacked layout. Keeping stacked for simplicity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Certifications */}
                <div className={`p-5 md:p-8 rounded-[32px] md:rounded-[40px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <SectionHeader title="Certifications" icon={Award} sectionKey="certifications" />
                    <div className="space-y-4">
                        {certifications.length === 0 ? (
                            <p className={`text-sm italic ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No certifications added yet.</p>
                        ) : (
                            certifications.map((cert) => (
                                <div key={cert.id} className="group flex justify-between items-start">
                                    <div>
                                        <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-black'}`}>{cert.name}</h4>
                                        <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{cert.issuer}</p>
                                        <p className={`text-[10px] mt-0.5 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{new Date(cert.issueDate).getFullYear()}</p>
                                    </div>
                                    <EditActions section="certifications" item={cert} />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Awards */}
                <div className={`p-5 md:p-8 rounded-[32px] md:rounded-[40px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                    <SectionHeader title="Honors & Awards" icon={Award} sectionKey="awards" />
                    <div className="space-y-4">
                        {awards.length === 0 ? (
                            <p className={`text-sm italic ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No awards added yet.</p>
                        ) : (
                            awards.map((award) => (
                                <div key={award.id} className="group flex justify-between items-start">
                                    <div>
                                        <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-black'}`}>{award.title}</h4>
                                        <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{award.issuer}</p>
                                        <p className={`text-[10px] mt-0.5 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>{new Date(award.date).getFullYear()}</p>
                                    </div>
                                    <EditActions section="awards" item={award} />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Other Profiles */}
            <div className={`p-5 md:p-8 rounded-[32px] md:rounded-[40px] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <SectionHeader title="Other Profiles" icon={Link2} sectionKey="other_profiles" />
                <div className="flex flex-wrap gap-4">
                    {otherProfiles.length === 0 ? (
                        <p className={`text-sm italic ${isDark ? 'text-neutral-600' : 'text-neutral-400'}`}>No other profiles linked.</p>
                    ) : (
                        otherProfiles.map((prof) => (
                            <div key={prof.id} className="group relative">
                                <a
                                    href={prof.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all ${isDark ? 'bg-neutral-800/50 border-neutral-800 hover:bg-neutral-800 text-white' : 'bg-white border-neutral-200 hover:bg-neutral-50 text-black shadow-sm'}`}
                                >
                                    <div className={`p-1.5 rounded-lg ${isDark ? 'bg-neutral-700/50 text-neutral-300' : 'bg-neutral-100 text-neutral-600'}`}>
                                        {getProfileIcon(prof.network || prof.url)}
                                    </div>
                                    <div className="text-left pr-6">
                                        <p className="text-xs font-bold uppercase tracking-wider">{prof.network || 'Website'}</p>
                                    </div>
                                </a>
                                <div className="absolute -top-2 -right-2">
                                    <EditActions section="other_profiles" item={prof} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
