import React from 'react';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { User, MapPin, Briefcase, GraduationCap, Link2, Download, Building2, Calendar, Award, Globe, Mail } from 'lucide-react';
import FollowButton from '@/app/components/network/FollowButton';

export const dynamic = 'force-dynamic';

export default async function ViewCandidatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: user, error } = await supabaseAdmin
        .schema('professional')
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !user) {
        notFound();
    }

    // Decrypt basic info
    const firstName = decryptData(user.enc_first_name as string);
    const lastName = decryptData(user.enc_last_name as string);
    const fullName = `${firstName} ${lastName}`.trim();
    const profileImage = decryptData(user.enc_profile_image_url as string);
    const headline = decryptData(user.enc_headline as string);
    const bio = decryptData(user.enc_bio as string);
    const cvUrl = decryptData(user.enc_cv_url as string);
    const role = user.primary_role;
    const location = decryptData(user.enc_location as string) || decryptData(user.enc_city as string); // Fallback

    // Fetch Sections
    const { data: employment } = await supabaseAdmin
        .schema('professional')
        .from('employment_history')
        .select('*')
        .eq('user_id', id)
        .order('start_date', { ascending: false });

    const { data: education } = await supabaseAdmin
        .schema('professional')
        .from('education_history')
        .select('*')
        .eq('user_id', id)
        .order('start_date', { ascending: false });

    const { data: skills } = await supabaseAdmin
        .schema('professional')
        .from('skills')
        .select('*')
        .eq('user_id', id);

    const { data: otherProfiles } = await supabaseAdmin
        .schema('professional')
        .from('other_profiles')
        .select('*')
        .eq('user_id', id);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 pb-20">
            {/* Header / Cover */}
            <div className="h-48 bg-neutral-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-black opacity-80" />
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-20">
                {/* Profile Card */}
                <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-40 h-40 rounded-full border-4 border-white dark:border-neutral-900 overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                {profileImage ? (
                                    <img src={profileImage} alt={fullName} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={64} className="text-neutral-400" />
                                )}
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="flex-1 text-center sm:text-left space-y-2 pb-2">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{fullName}</h1>
                            <p className="text-lg font-medium text-blue-600 dark:text-blue-400">{headline || role || 'Professional'}</p>

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-gray-500 dark:text-neutral-400 mt-2">
                                {location && (
                                    <div className="flex items-center gap-1">
                                        <MapPin size={16} />
                                        <span>{location}</span>
                                    </div>
                                )}
                                {role && (
                                    <div className="flex items-center gap-1">
                                        <Briefcase size={16} />
                                        <span>{role}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 min-w-[140px]">
                            {/* Follow Button can go here if we want employers to follow users? Maybe 'Save' candidate? */}
                            {/* For now, maybe just generic props or download CV */}
                            {cvUrl && (
                                <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                                    <Download size={18} />
                                    <span>Download CV</span>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-neutral-200 dark:bg-neutral-800 my-8" />

                    {/* About Section */}
                    {bio && (
                        <div className="space-y-4 mb-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">About</h2>
                            <p className="whitespace-pre-wrap text-gray-600 dark:text-neutral-300 leading-relaxed">
                                {bio}
                            </p>
                        </div>
                    )}

                    {/* Skills */}
                    {(skills && skills.length > 0) && (
                        <div className="space-y-4 mb-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Award size={20} /> Skills
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {skills.map((skill: any) => (
                                    <span key={skill.id} className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-full text-sm font-medium">
                                        {decryptData(skill.enc_skill_name as string)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* Employment History */}
                    {(employment && employment.length > 0) && (
                        <div className="space-y-6 mb-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Briefcase size={20} /> Experience
                            </h2>
                            <div className="space-y-6">
                                {employment.map((job: any) => (
                                    <div key={job.id} className="flex gap-4">
                                        <div className="mt-1">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                <Building2 size={20} />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{decryptData(job.enc_job_title as string)}</h3>
                                            <p className="text-gray-700 dark:text-neutral-300 font-medium">{decryptData(job.enc_company as string)}</p>
                                            <p className="text-sm text-gray-500 dark:text-neutral-500 mt-0.5">
                                                {new Date(job.start_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                                {' - '}
                                                {job.current ? 'Present' : new Date(job.end_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                            </p>
                                            <p className="mt-2 text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
                                                {decryptData(job.enc_description as string)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Education */}
                    {(education && education.length > 0) && (
                        <div className="space-y-6 mb-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <GraduationCap size={20} /> Education
                            </h2>
                            <div className="space-y-6">
                                {education.map((edu: any) => (
                                    <div key={edu.id} className="flex gap-4">
                                        <div className="mt-1">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                <Building2 size={20} />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{decryptData(edu.enc_school as string)}</h3>
                                            <p className="text-gray-700 dark:text-neutral-300 font-medium">{decryptData(edu.enc_degree as string)}</p>
                                            <p className="text-sm text-gray-500 dark:text-neutral-500 mt-0.5">
                                                {new Date(edu.start_date).getFullYear()} - {edu.current ? 'Present' : new Date(edu.end_date).getFullYear()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Other Profiles */}
                    {(otherProfiles && otherProfiles.length > 0) && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Link2 size={20} /> Social Links
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {otherProfiles.map((prof: any) => (
                                    <a
                                        key={prof.id}
                                        href={prof.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                                            <Globe size={16} className="text-neutral-600 dark:text-neutral-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{prof.network}</p>
                                            <p className="text-xs text-gray-500 dark:text-neutral-500 truncate">{prof.url}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
