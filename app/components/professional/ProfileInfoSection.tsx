"use client"

import React, { useState } from 'react';
import {
    Briefcase, GraduationCap, Award, BadgeCheck, Link2, Plus, PenLine, Trash2, X,
    Linkedin, Github, Twitter, Globe, ChevronLeft, ChevronRight
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
    onAdd?: (section: string, prefillData?: any, isVerifiedStack?: boolean) => void;
    onEdit?: (section: string, item: any, isVerifiedStack?: boolean) => void;
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
    // const isDark = propIsDark ?? (theme === 'dark'); // styling is now handled by CSS

    const [activeCompanyIndex, setActiveCompanyIndex] = useState(0);

    const groupedExperience = employmentHistory.reduce((acc: any, job: any) => {
        const companyName = job.company?.trim() || 'Unknown Company';
        if (!acc[companyName]) acc[companyName] = [];
        acc[companyName].push(job);
        return acc;
    }, {});

    const sortedCompanies = Object.entries(groupedExperience).sort((a: any, b: any) => {
        const aMostRecent = Math.max(...a[1].map((j: any) => new Date(j.startDate || 0).getTime()));
        const bMostRecent = Math.max(...b[1].map((j: any) => new Date(j.startDate || 0).getTime()));
        return bMostRecent - aMostRecent;
    });

    // Make sure index is in bounds when data changes
    React.useEffect(() => {
        if (activeCompanyIndex >= sortedCompanies.length && sortedCompanies.length > 0) {
            setActiveCompanyIndex(sortedCompanies.length - 1);
        }
    }, [sortedCompanies.length, activeCompanyIndex]);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    };

    const formatYear = (dateString: string) => {
        if (!dateString) return 'N/A';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return 'N/A';
        return d.getFullYear();
    };

    const getProfileIcon = (platform: string) => {
        const p = platform?.toLowerCase() || '';
        if (p.includes('linkedin')) return <Linkedin size={18} />;
        if (p.includes('github')) return <Github size={18} />;
        if (p.includes('twitter') || p.includes('x.com') || p.includes('x')) return <Twitter size={18} />;
        return <Globe size={18} />;
    };

    const SectionHeader = ({ title, icon: Icon, sectionKey }: { title: string, icon: any, sectionKey: string }) => (
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-black dark:text-white">
                <Icon size={20} /> {title}
            </h3>
            {!readOnly && onAdd && (
                <button
                    onClick={() => onAdd(sectionKey)}
                    className="p-2 rounded-lg transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                >
                    <Plus size={20} />
                </button>
            )}
        </div>
    );

    const EditActions = ({ section, item, canEdit = true, isVerifiedStack = false }: { section: string, item: any, canEdit?: boolean, isVerifiedStack?: boolean }) => {
        if (readOnly) return null;

        // Disable edit/delete for verified items or when canEdit is false
        if (!canEdit || item.source === 'automatic') {
            return (
                <div className="flex items-center gap-2" title="Verified entry cannot be edited">
                    <BadgeCheck size={16} className="text-blue-500" />
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2 transition-opacity">
                {onEdit && (
                    <button onClick={() => onEdit(section, item, isVerifiedStack)} className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-400 hover:text-black dark:text-neutral-500 dark:hover:text-white transition-colors">
                        <PenLine size={16} />
                    </button>
                )}
                {onDelete && (
                    <button onClick={() => onDelete(section, item.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 transition-colors">
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Experience */}
            <div className="p-5 md:p-8 rounded-[32px] md:rounded-[40px] border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors relative">
                <SectionHeader title="Experience" icon={Briefcase} sectionKey="employment" />

                {sortedCompanies.length === 0 ? (
                    <p className="text-sm italic text-neutral-400 dark:text-neutral-600">No experience added yet.</p>
                ) : (
                    <div className="space-y-6">
                        {/* Carousel Header (Company Info & Nav) */}
                        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h4 className="text-xl font-black text-black dark:text-white truncate lg:text-2xl pr-4">
                                {sortedCompanies[activeCompanyIndex][0]}
                            </h4>
                            {sortedCompanies.length > 1 && (
                                <div className="flex items-center gap-2 shrink-0 bg-neutral-100 dark:bg-neutral-800 rounded-full p-1 border border-neutral-200 dark:border-neutral-700">
                                    <button
                                        onClick={() => setActiveCompanyIndex(prev => Math.max(0, prev - 1))}
                                        disabled={activeCompanyIndex === 0}
                                        className="p-1.5 rounded-full hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors text-black dark:text-white disabled:shadow-none"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-xs font-bold text-neutral-500 min-w-[32px] text-center shrink-0">
                                        {activeCompanyIndex + 1} / {sortedCompanies.length}
                                    </span>
                                    <button
                                        onClick={() => setActiveCompanyIndex(prev => Math.min(sortedCompanies.length - 1, prev + 1))}
                                        disabled={activeCompanyIndex === sortedCompanies.length - 1}
                                        className="p-1.5 rounded-full hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-30 transition-colors text-black dark:text-white disabled:shadow-none"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Roles List for Current Company */}
                        <div className="space-y-8 relative">
                            {(() => {
                                const currentCompanyRoles = (sortedCompanies[activeCompanyIndex][1] as any[]).sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime());
                                const isVerifiedStack = currentCompanyRoles.some((r: any) => r.source === 'automatic');
                                const canAdd = !isVerifiedStack || currentCompanyRoles[0].isCurrent;

                                return (
                                    <>
                                        {currentCompanyRoles.map((job, index) => {
                                            const canEdit = !isVerifiedStack || (index === 0 && job.isCurrent && job.source !== 'automatic');
                                            return (
                                                <div key={job.id} className="group relative pl-8 border-l-2 border-neutral-200 dark:border-neutral-800 last:border-0 pb-8 last:pb-0">
                                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"></div>
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <h5 className="text-lg font-bold text-black dark:text-white">{job.title}</h5>
                                                            <p className="text-xs uppercase tracking-wider font-bold mt-1 text-neutral-400 dark:text-neutral-500">
                                                                {formatDate(job.startDate)} — {job.isCurrent ? 'Present' : formatDate(job.endDate)}
                                                            </p>
                                                            {job.description && (
                                                                <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-neutral-500 dark:text-neutral-400">{job.description}</p>
                                                            )}
                                                        </div>
                                                        <EditActions section="employment" item={job} canEdit={canEdit} isVerifiedStack={isVerifiedStack} />
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {!readOnly && onAdd && canAdd && (
                                            <div className="pt-2">
                                                <button
                                                    onClick={() => onAdd('employment', { company: sortedCompanies[activeCompanyIndex][0] }, isVerifiedStack)}
                                                    className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                                >
                                                    <Plus size={16} /> Add role at {sortedCompanies[activeCompanyIndex][0]}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>

            {/* Education */}
            <div className="p-5 md:p-8 rounded-[32px] md:rounded-[40px] border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
                <SectionHeader title="Education" icon={GraduationCap} sectionKey="education" />
                <div className="space-y-6">
                    {education.length === 0 ? (
                        <p className="text-sm italic text-neutral-400 dark:text-neutral-600">No education added yet.</p>
                    ) : (
                        education.map((edu) => (
                            <div key={edu.id} className="group flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-black dark:text-white">{edu.school}</h4>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</p>
                                    <p className="text-xs mt-1 text-neutral-400 dark:text-neutral-500">
                                        {formatYear(edu.startDate)} - {edu.isCurrent ? 'Present' : formatYear(edu.endDate)}
                                    </p>
                                </div>
                                <EditActions section="education" item={edu} />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Skills */}
            <div className="p-5 md:p-8 rounded-[32px] md:rounded-[40px] border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
                <SectionHeader title="Skills" icon={BadgeCheck} sectionKey="skills" />
                <div className="flex flex-wrap gap-2">
                    {skills.length === 0 ? (
                        <p className="text-sm italic text-neutral-400 dark:text-neutral-600">No skills added yet.</p>
                    ) : (
                        skills.map((skill) => (
                            <div key={skill.id} className="group flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-black dark:text-white">
                                <span>{skill.name}</span>
                                {!readOnly && onDelete && (
                                    <button onClick={() => onDelete('skills', skill.id)} className="hidden group-hover:block ml-1 text-neutral-400 hover:text-black dark:hover:text-white">
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Certifications & Awards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Certifications */}
                <div className="p-5 md:p-8 rounded-[32px] md:rounded-[40px] border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
                    <SectionHeader title="Certifications" icon={Award} sectionKey="certifications" />
                    <div className="space-y-4">
                        {certifications.length === 0 ? (
                            <p className="text-sm italic text-neutral-400 dark:text-neutral-600">No certifications added yet.</p>
                        ) : (
                            certifications.map((cert) => (
                                <div key={cert.id} className="group flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-sm text-black dark:text-white">{cert.name}</h4>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400">{cert.issuer}</p>
                                        <p className="text-[10px] mt-0.5 text-neutral-400 dark:text-neutral-500">{formatYear(cert.issueDate)}</p>
                                    </div>
                                    <EditActions section="certifications" item={cert} />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Awards */}
                <div className="p-5 md:p-8 rounded-[32px] md:rounded-[40px] border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
                    <SectionHeader title="Honors & Awards" icon={Award} sectionKey="awards" />
                    <div className="space-y-4">
                        {awards.length === 0 ? (
                            <p className="text-sm italic text-neutral-400 dark:text-neutral-600">No awards added yet.</p>
                        ) : (
                            awards.map((award) => (
                                <div key={award.id} className="group flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-sm text-black dark:text-white">{award.title}</h4>
                                        <p className="text-xs text-neutral-600 dark:text-neutral-400">{award.issuer}</p>
                                        <p className="text-[10px] mt-0.5 text-neutral-400 dark:text-neutral-500">{formatYear(award.date)}</p>
                                    </div>
                                    <EditActions section="awards" item={award} />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Other Profiles */}
            <div className="p-5 md:p-8 rounded-[32px] md:rounded-[40px] border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
                <SectionHeader title="Other Profiles" icon={Link2} sectionKey="other_profiles" />
                <div className="flex flex-wrap gap-4">
                    {otherProfiles.length === 0 ? (
                        <p className="text-sm italic text-neutral-400 dark:text-neutral-600">No other profiles linked.</p>
                    ) : (
                        otherProfiles.map((prof) => (
                            <div key={prof.id} className="group relative">
                                <a
                                    href={prof.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-5 py-3 rounded-xl border transition-all bg-white dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-black dark:text-white shadow-sm"
                                >
                                    <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-700/50 text-neutral-600 dark:text-neutral-300">
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
