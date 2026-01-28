import React from 'react';
import ProfessionalPostsSection from '@/app/components/professional/ProfessionalPostsSection';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { User, MapPin, Briefcase, GraduationCap, Link2, Download, Building2, Calendar, Award, Globe, Mail, MessageSquare } from 'lucide-react';
import ProfileInfoSection from '@/app/components/professional/ProfileInfoSection';

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
    const location = decryptData(user.enc_location as string) || decryptData(user.enc_city as string);
    const email = decryptData(user.enc_email as string);
    const phone = decryptData(user.enc_phone_number as string);

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

    // Clean data for component
    const employmentHistory = employment?.map((e: any) => ({
        ...e,
        startDate: e.start_date,
        endDate: e.end_date,
        isCurrent: e.is_current,
        source: e.source
    })) || [];

    const educationHistory = education?.map((e: any) => ({
        ...e,
        startDate: e.start_date,
        endDate: e.end_date,
        isCurrent: e.is_current,
        fieldOfStudy: e.field_of_study
    })) || [];

    return (

        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 pb-20">
            {/* Header / Cover */}
            <div className="h-48 bg-neutral-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-neutral-800 to-neutral-900 opacity-80" />
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 relative -mt-20 space-y-8">
                {/* Profile Card */}
                <div className="bg-white dark:bg-neutral-900 rounded-[40px] shadow-xl border border-neutral-200 dark:border-neutral-800 p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Avatar */}
                        <div className="flex-shrink-0 relative">
                            <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2rem] border-4 border-white dark:border-neutral-900 overflow-hidden bg-white dark:bg-neutral-800 shadow-lg flex items-center justify-center">
                                {profileImage ? (
                                    <img src={profileImage} alt={fullName} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={64} className="text-neutral-300" />
                                )}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 w-full space-y-6">
                            {/* Name & Role */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h1 className="text-4xl font-black text-gray-900 dark:text-white">{fullName}</h1>
                                        <p className="text-xl font-medium text-blue-600 dark:text-blue-400 mt-1">{headline || role}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <a
                                            href={`/employer/notifications?candidateId=${id}`}
                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-xl font-bold text-sm hover:bg-neutral-50 transition-colors dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-700"
                                        >
                                            <MessageSquare size={18} />
                                            <span className="hidden sm:inline">Message</span>
                                        </a>
                                        {cvUrl && (
                                            <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
                                                <Download size={18} />
                                                <span className="hidden sm:inline">Download CV</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="h-px w-full bg-neutral-100 dark:bg-neutral-800"></div>

                            {/* Contact Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Email */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Email</label>
                                    <div className="flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300">
                                        <Mail size={16} /> {email || 'No email provided'}
                                    </div>
                                </div>
                                {/* Phone */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Phone</label>
                                    <div className="flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300">
                                        {phone || 'No phone provided'}
                                    </div>
                                </div>
                            </div>

                            {/* Location & Profile Link */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Location */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Location</label>
                                    <div className="flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300">
                                        <MapPin size={16} /> {location || 'No location provided'}
                                    </div>
                                </div>

                                {/* Profile Link */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Profile Link</label>
                                    <div className="flex items-center p-1.5 rounded-xl border bg-white border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800">
                                        <div className="px-3 text-sm truncate flex-1 text-neutral-600 dark:text-neutral-400">
                                            https://profcaria.com/p/{(firstName || 'user').toLowerCase()}-{(lastName || '').toLowerCase()}
                                        </div>
                                        <div className="p-2 rounded-lg text-neutral-400">
                                            <Link2 size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Followers Card */}
            <div className="p-8 rounded-[40px] border bg-white border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                <div className="flex flex-col items-center justify-center space-y-1">
                    <div className="text-4xl font-black text-black dark:text-white">{user.follower_count || 0}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Followers</div>
                </div>
            </div>

            {/* About Section */}
            {bio && (
                <div className="p-8 rounded-[40px] border bg-white border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About</h2>
                    <p className="whitespace-pre-wrap text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {bio}
                    </p>
                </div>
            )}

            {/* Posts Section */}
            <div className="pt-4">
                <ProfessionalPostsSection
                    userId={id}
                    latestPost={null} // Will fetch
                />
            </div>

            {/* Reusable Profile Sections */}
            <ProfileInfoSection
                readOnly={true}
                employmentHistory={employmentHistory}
                education={educationHistory}
                skills={skills || []}
                certifications={[]}
                awards={[]}
                otherProfiles={otherProfiles || []}
            />
        </div>
    );
}
