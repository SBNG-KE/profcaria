import ProfessionalPostsSection from '@/app/components/professional/ProfessionalPostsSection';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { Briefcase, MapPin, Link2, MessageSquare, Mail, Phone, ArrowRight } from 'lucide-react';
import FollowButton from '@/app/components/network/FollowButton';
import ProfileInfoSection from '@/app/components/professional/ProfileInfoSection';
import VerificationBadge from '@/app/components/VerificationBadge';
import PostsPreview from '@/app/components/professional/PostsPreview';
import PostCard from '@/app/components/professional/PostCard';
import ContactInfoCard from '@/app/components/company/ContactInfoCard';
import { formatDistanceToNow } from 'date-fns';
import { cookies } from 'next/headers';
import React from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: rawId } = await params;
    // Fix: Handle cases where ID in URL might have spaces or be malformed
    // Robust cleanup: Remove non-hex, check length, reconstruct UUID if possible.
    let id = rawId;
    const cleanHex = rawId.replace(/[^a-fA-F0-9]/g, '');
    if (cleanHex.length === 32) {
        // Reconstruct UUID: 8-4-4-4-12
        id = `${cleanHex.slice(0, 8)}-${cleanHex.slice(8, 12)}-${cleanHex.slice(12, 16)}-${cleanHex.slice(16, 20)}-${cleanHex.slice(20)}`;
    } else {
        // Fallback or use standard sanitization if not exactly 32 hex chars (e.g. short IDs?) 
        // Although Supabase/Postgres IDs are usually UUIDs.
        id = rawId.trim().replace(/%20/g, '-').replace(/ /g, '-').replace(/[^a-f0-9-]/gi, '');
    }

    // Check Viewer Type
    const cookieStore = await cookies();
    const session = cookieStore.get('profcaria_session')?.value;
    let viewerType = 'visitor'; // visitor, professional, employer

    if (session) {
        try {
            // Decoding or verifying session logic if needed
        } catch (e) { }
    }

    let isViewerProfessional = false;
    let isViewerEmployer = false;
    let viewerId = '';

    if (session && typeof session === 'string') {
        try {
            const parts = session.split('.');
            if (parts.length > 1) {
                const payload = JSON.parse(atob(parts[1]));
                viewerId = payload.uid || payload.id;
                if (payload.schema === 'professional') {
                    isViewerProfessional = true;
                } else if (payload.schema === 'employer') {
                    isViewerEmployer = true;
                }
            }
        } catch (e) { }
    }

    // Fetch User Profile from 'users' table (Encrypted)
    const { data: profile, error } = await supabaseAdmin
        .schema('professional')
        .from('users')
        .select('*') // Includes enc_email, enc_phone_number
        .eq('id', id)
        .single();

    if (error || !profile) {
        return notFound();
    }

    // Decrypt Data
    const firstName = profile.enc_first_name ? decryptData(profile.enc_first_name) : 'User';
    const lastName = profile.enc_last_name ? decryptData(profile.enc_last_name) : '';
    const role = profile.enc_current_role ? decryptData(profile.enc_current_role) : 'Professional';
    const about = profile.enc_about ? decryptData(profile.enc_about) : '';
    // Location handling
    const city = profile.enc_city ? decryptData(profile.enc_city) : '';
    const country = profile.enc_location ? decryptData(profile.enc_location) : '';
    const email = profile.enc_email ? decryptData(profile.enc_email) : '';
    const phone = profile.enc_phone_number ? decryptData(profile.enc_phone_number) : '';
    const profileImageUrl = profile.enc_profile_image_url ? decryptData(profile.enc_profile_image_url) : '';
    const imagePosition = profile.image_position || '50% 50%';

    // Fetch Sections
    // Fetch Sections
    const { data: employmentRaw } = await supabaseAdmin.schema('professional').from('employment_history').select('*').eq('user_id', id);
    const { data: educationRaw } = await supabaseAdmin.schema('professional').from('education').select('*').eq('user_id', id);
    const { data: skillsRaw } = await supabaseAdmin.schema('professional').from('skills').select('*').eq('user_id', id);
    const { data: certificationsRaw } = await supabaseAdmin.schema('professional').from('certifications').select('*').eq('user_id', id);
    const { data: awardsRaw } = await supabaseAdmin.schema('professional').from('awards').select('*').eq('user_id', id);
    const { data: otherProfilesRaw } = await supabaseAdmin.schema('professional').from('other_profiles').select('*').eq('user_id', id);

    // Decrypt Sections
    // 1. Manual Employment
    const manualEmployment = (employmentRaw || []).map((e: any) => ({
        id: e.id,
        source: 'manual',
        title: decryptData(e.enc_title),
        company: decryptData(e.enc_company),
        location: decryptData(e.enc_location),
        type: decryptData(e.enc_type),
        description: decryptData(e.enc_description),
        startDate: decryptData(e.enc_start_date),
        endDate: decryptData(e.enc_end_date),
        isCurrent: e.is_current,
    }));

    // 2. Verified Employment (Automatic from Applications)
    const { data: autoData } = await supabaseAdmin
        .schema('employer')
        .from('applications')
        .select('*, jobs(id, enc_title, company_id)')
        .eq('user_id', id)
        .in('status', ['hired', 'employed', 'terminated', 'resigned', 'pending_termination']);

    const safeAutoData = autoData || [];
    const companyIds = [...new Set(safeAutoData.map((a: any) => a.jobs?.company_id).filter(Boolean))];

    const { data: companies } = await supabaseAdmin
        .schema('employer')
        .from('companies')
        .select('id, enc_company_name, enc_logo_url')
        .in('id', companyIds);

    const autoEmployment = safeAutoData.map((app: any) => {
        const job = app.jobs;
        const company = companies?.find((c: any) => c.id === job?.company_id);
        // Determine explicit dates if available, otherwise use created_at
        let startDate = 'N/A';
        try {
            if (app.created_at) {
                startDate = new Date(app.created_at).toISOString().split('T')[0];
            }
        } catch (e) { }

        let endDate = null;
        if (app.terminated_at) {
            try {
                endDate = new Date(app.terminated_at).toISOString().split('T')[0];
            } catch (e) { }
        }

        const isCurrent = ['hired', 'employed', 'pending_termination'].includes(app.status);

        return {
            id: app.id,
            source: 'automatic',
            title: job ? decryptData(job.enc_title) : 'Verified Role',
            company: company ? decryptData(company.enc_company_name) : 'Verified Company',
            location: 'Remote', // Default for now
            type: 'Full-time', // Default for now
            description: 'Verified Employment via Profcaria',
            startDate: startDate,
            endDate: endDate,
            isCurrent: isCurrent,
        };
    });

    // 3. Merge & Sort
    const employment = [...manualEmployment, ...autoEmployment].sort((a, b) => {
        const dateA = new Date(a.startDate || '1900-01-01').getTime();
        const dateB = new Date(b.startDate || '1900-01-01').getTime();
        return dateB - dateA;
    });

    const education = (educationRaw || []).map((e: any) => ({
        id: e.id,
        school: decryptData(e.enc_school),
        degree: decryptData(e.enc_degree),
        fieldOfStudy: decryptData(e.enc_field_of_study),
        description: decryptData(e.enc_description),
        startDate: decryptData(e.enc_start_date),
        endDate: decryptData(e.enc_end_date),
        grade: decryptData(e.enc_grade),
        isCurrent: e.is_current,
    }));

    const skills = (skillsRaw || []).map((s: any) => ({
        id: s.id,
        name: decryptData(s.enc_name),
        endorsementCount: s.endorsement_count
    }));

    const certifications = (certificationsRaw || []).map((c: any) => ({
        id: c.id,
        name: decryptData(c.enc_name),
        issuer: decryptData(c.enc_issuer),
        issueDate: decryptData(c.enc_issue_date),
        expirationDate: decryptData(c.enc_expiration_date),
        credentialId: decryptData(c.enc_credential_id),
        credentialUrl: decryptData(c.enc_credential_url),
    }));

    const awards = (awardsRaw || []).map((a: any) => ({
        id: a.id,
        title: decryptData(a.enc_title),
        issuer: decryptData(a.enc_issuer),
        date: decryptData(a.enc_date),
        description: decryptData(a.enc_description),
    }));

    const otherProfiles = (otherProfilesRaw || []).map((p: any) => ({
        id: p.id,
        network: decryptData(p.enc_network),
        url: decryptData(p.enc_url),
        description: decryptData(p.enc_description),
    }));

    // Fetch Latest Post
    // This requires a similar query to `api/professional/profile/posts` but for a specific user.
    // Fetch Latest Post with Safety
    let formattedPosts = [];
    try {
        const { data: latestPosts, error: postsError } = await supabaseAdmin
            .schema('professional')
            .from('posts')
            .select(`
                *,
                post_likes (count),
                post_comments (count),
                author:users!user_id (
                    id,
                    enc_first_name,
                    enc_last_name,
                    enc_current_role,
                    enc_profile_image_url,
                    follower_count
                )
            `)
            .eq('user_id', id)
            .order('created_at', { ascending: false })
            .limit(5) as any;

        if (!postsError && latestPosts) {
            formattedPosts = latestPosts.map((p: any) => {
                const author = p.author || {};
                return {
                    id: p.id,
                    content: decryptData(p.enc_content),
                    media: p.media_urls?.map((url: string) => ({ url, type: url.match(/\.(mp4|webm)$/) ? 'video' : 'image' })),
                    timestamp: formatDistanceToNow(new Date(p.created_at), { addSuffix: true }),
                    likesCount: p.post_likes?.[0]?.count || 0,
                    commentsCount: p.post_comments?.[0]?.count || 0,
                    author: {
                        id: author.id || p.user_id, // Fallback if join empty
                        name: author.enc_first_name ? `${decryptData(author.enc_first_name)} ${decryptData(author.enc_last_name)}` : 'User',
                        followerCount: author.follower_count || 0,
                        role: author.enc_current_role ? decryptData(author.enc_current_role) : '',
                        profileImage: decryptData(author.enc_profile_image_url) || ''
                    }
                };
            });
        }
    } catch (e) {
        console.error("Error fetching posts for public profile:", e);
        // Fail silently for posts, don't crash the page
    }


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 transition-colors p-6 pb-20">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">

                {/* 1. Identity Card (Exact Copy of Private Profile Design) */}
                <div className="p-5 md:p-8 rounded-[32px] md:rounded-[40px] border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
                    <div className="flex flex-col md:flex-row gap-8 items-start">

                        {/* Left: Profile Image */}
                        <div className="flex-shrink-0 relative group">
                            <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2rem] overflow-hidden border-4 flex items-center justify-center bg-white dark:bg-neutral-900 border-white dark:border-neutral-800 shadow-lg">
                                {profileImageUrl ? (
                                    <img
                                        src={profileImageUrl}
                                        alt="Profile"
                                        className="w-full h-full object-cover transition-none select-none"
                                        style={{ objectPosition: imagePosition }}
                                        draggable={false}
                                    />
                                ) : (
                                    <div className="font-black text-6xl text-neutral-300 dark:text-neutral-700">
                                        {firstName?.[0]}{lastName?.[0]}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Details */}
                        <div className="flex-1 w-full space-y-6">

                            {/* Name & Role Section */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-black dark:text-white flex items-center gap-3">
                                        {firstName} {lastName}
                                        <VerificationBadge tier={profile.badge_type} size={32} />
                                    </h1>
                                </div>

                                <div className="flex items-center gap-3">
                                    <p className="text-xl font-medium text-neutral-600 dark:text-neutral-400">
                                        {role}
                                    </p>
                                </div>
                            </div>

                            {/* Content Section: Contact & Links */}
                            <div className="space-y-6 pt-2">
                                <div className="flex flex-col md:flex-row gap-8">

                                    {/* Contact Info Column */}
                                    <div className="space-y-4 flex-1 min-w-0 w-full max-w-full">
                                        <ContactInfoCard
                                            email={email}
                                            emailLabel="Email"
                                            phone={phone}
                                            city={city}
                                            country={country}
                                            profileLink={`${process.env.NEXT_PUBLIC_APP_URL || 'https://profcaria.com'}/public/people/${id}`}
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 md:mt-0 md:absolute md:top-8 md:right-8 flex flex-wrap gap-2">
                        {/* Hide Follow/Subscribe if viewer is Company or Self */}
                        {(!isViewerEmployer && viewerId !== id) && (
                            <FollowButton targetId={id} type="user" />
                        )}

                        {isViewerProfessional && viewerId !== id && (
                            <Link
                                href={`/professional/messages?recipientId=${id}&recipientName=${encodeURIComponent(firstName + ' ' + lastName)}`}
                                className="h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-all shadow-sm"
                            >
                                <MessageSquare size={14} />
                                <span>Message</span>
                            </Link>
                        )}
                        {isViewerEmployer && viewerId !== id && (
                            <Link
                                href={`/employer/messages?recipientId=${id}&recipientName=${encodeURIComponent(firstName + ' ' + lastName)}`}
                                className="h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-all shadow-sm"
                            >
                                <MessageSquare size={14} />
                                <span>Message</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* About Section */}
                {about && (
                    <div className="p-5 md:p-8 rounded-[32px] md:rounded-[40px] border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-black dark:text-white">
                                <Briefcase size={20} className="text-neutral-600 dark:text-neutral-400" /> About
                            </h3>
                        </div>
                        <p className="text-lg leading-relaxed whitespace-pre-wrap text-neutral-600 dark:text-neutral-300">
                            {about}
                        </p>
                    </div>
                )}

                {/* Profile Sections (Read Only) */}
                <ProfileInfoSection
                    readOnly={true}
                    employmentHistory={employment}
                    education={education}
                    skills={skills}
                    certifications={certifications}
                    awards={awards}
                    otherProfiles={otherProfiles}
                />

                {/* Posts */}
                <div className="pt-4 max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-black dark:text-white">
                            <Briefcase size={20} className="text-neutral-600 dark:text-neutral-400" /> Posts
                        </h3>
                    </div>

                    <ProfessionalPostsSection
                        userId={id}
                        initialPosts={formattedPosts}
                    />
                </div>

            </div>
        </div>
    );
}
