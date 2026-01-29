import ProfessionalPostsSection from '@/app/components/professional/ProfessionalPostsSection';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { Briefcase, MapPin, Link2, MessageSquare } from 'lucide-react';
import FollowButton from '@/app/components/network/FollowButton';
import ProfileInfoSection from '@/app/components/professional/ProfileInfoSection';
import PostsPreview from '@/app/components/professional/PostsPreview';
import PostCard from '@/app/components/professional/PostCard';
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

    if (session) {
        try {
            const payload = JSON.parse(atob(session.split('.')[1]));
            viewerId = payload.uid || payload.id;
            if (payload.schema === 'professional') {
                isViewerProfessional = true;
            } else if (payload.schema === 'employer') {
                isViewerEmployer = true;
            }
        } catch (e) { }
    }

    // Fetch User Profile from 'users' table (Encrypted)
    const { data: profile, error } = await supabaseAdmin
        .schema('professional')
        .from('users')
        .select('*')
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
    const profileImageUrl = profile.enc_profile_image_url ? decryptData(profile.enc_profile_image_url) : '';
    const imagePosition = profile.image_position || '50% 50%';

    // Fetch Sections
    const { data: employment } = await supabaseAdmin.schema('professional').from('employment_history').select('*').eq('user_id', id).order('start_date', { ascending: false });
    const { data: education } = await supabaseAdmin.schema('professional').from('education').select('*').eq('user_id', id).order('start_date', { ascending: false });
    const { data: skills } = await supabaseAdmin.schema('professional').from('skills').select('*').eq('user_id', id);
    const { data: certifications } = await supabaseAdmin.schema('professional').from('certifications').select('*').eq('user_id', id);
    const { data: awards } = await supabaseAdmin.schema('professional').from('awards').select('*').eq('user_id', id);
    const { data: otherProfiles } = await supabaseAdmin.schema('professional').from('other_profiles').select('*').eq('user_id', id);

    // Fetch Latest Post
    // This requires a similar query to `api/professional/profile/posts` but for a specific user.
    const { data: latestPosts } = await supabaseAdmin
        .schema('professional')
        .from('posts')
        .select(`
            *,
            post_likes (count),
            post_comments (count),
            author:author_id (
                id,
                first_name,
                last_name,
                role,
                profile_image_url
            )
        `)
        .eq('author_id', id)
        .order('created_at', { ascending: false })
        .limit(3) as any;

    const formattedPosts = latestPosts?.map((p: any) => ({
        id: p.id,
        content: decryptData(p.enc_content),
        media: p.media_urls?.map((url: string) => ({ url, type: url.match(/\.(mp4|webm)$/) ? 'video' : 'image' })),
        timestamp: formatDistanceToNow(new Date(p.created_at), { addSuffix: true }),
        likesCount: p.post_likes?.[0]?.count || 0,
        commentsCount: p.post_comments?.[0]?.count || 0,
        author: {
            id: p.author?.id,
            name: `${p.author?.first_name} ${p.author?.last_name}`,
            role: p.author?.role,
            image: p.author?.profile_image_url
        }
    })) || [];


    return (
        <div className="min-h-screen bg-gray-50 p-6 pb-20">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header Card */}
                <div className="rounded-2xl border overflow-hidden bg-white border-neutral-200 shadow-sm transition-colors">
                    <div className="h-32 bg-gradient-to-r from-neutral-200 to-neutral-300" />
                    <div className="px-6 pb-6">
                        <div className="flex items-end gap-4 -mt-12">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full border-4 overflow-hidden flex items-center justify-center bg-white border-white shadow-lg">
                                    {profileImageUrl ? (
                                        <img
                                            src={profileImageUrl}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            style={{ objectPosition: imagePosition }}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-3xl font-black text-neutral-300">
                                            {firstName?.[0]}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 pb-2 flex flex-col md:flex-row justify-between items-end md:items-end gap-4">
                                <div>
                                    <h1 className="text-3xl font-black text-black">{firstName} {lastName}</h1>
                                    <p className="font-medium text-lg text-neutral-600">{role}</p>
                                    <div className="flex flex-col gap-1 mt-2 text-sm text-neutral-500">
                                        {city && <span className="flex items-center gap-1"><MapPin size={14} /> {city}{country ? `, ${country}` : ''}</span>}
                                        {/* Show Email if needed or requested? Typically professional emails are private unless shared. 
                                            User asked for "email" and "profile link". 
                                            We'll add a section for Contact/Link below or here. 
                                        */}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
                                    {/* Hide Follow/Subscribe if viewer is Company or Self */}
                                    {(!isViewerEmployer && viewerId !== id) && (
                                        <FollowButton targetId={id} type="user" />
                                    )}

                                    {isViewerProfessional && viewerId !== id && (
                                        <Link
                                            href={`/professional/notifications?chat=${id}`}
                                            className="ml-3 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center gap-2"
                                        >
                                            <MessageSquare size={14} />
                                            <span>Message</span>
                                        </Link>
                                    )}

                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Extra Contact Bar for Link/Email if requested */}
                    <div className="px-8 pb-8 pt-2 flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2 text-neutral-600 bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
                            <Link2 size={14} />
                            <span className="font-mono text-xs select-all">
                                {process.env.NEXT_PUBLIC_APP_URL || 'profcaria.com'}/public/people/{id}
                            </span>
                        </div>
                        {/* Only show email if allowed? User complained "no email". We'll try to decrypt email if we have it? 
                            We didn't fetch enc_email in the query above. Fix that.
                        */}
                    </div>

                </div >

                {/* Connections Card (Renamed from Followers) */}
                < div className="p-8 rounded-[40px] border bg-white border-neutral-200 shadow-sm" >
                    <div className="flex flex-col items-center justify-center space-y-1">
                        <div className="text-4xl font-black text-black">{profile.follower_count || 0}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">Connections</div>
                    </div>
                </div >

                {/* About */}
                {
                    about && (
                        <div className="p-8 rounded-[40px] border bg-white border-neutral-200 shadow-sm">
                            <h3 className="text-xl font-bold mb-4 text-black">About</h3>
                            <p className="whitespace-pre-wrap text-neutral-600">{about}</p>
                        </div>
                    )
                }

                {/* Profile Sections (Read Only) */}
                <ProfileInfoSection
                    readOnly={true}
                    employmentHistory={employment?.map((e: any) => ({
                        ...e,
                        startDate: e.start_date,
                        endDate: e.end_date,
                        isCurrent: e.is_current,
                        source: e.source
                    })) || []}
                    education={education?.map((e: any) => ({
                        ...e,
                        startDate: e.start_date,
                        endDate: e.end_date,
                        isCurrent: e.is_current,
                        fieldOfStudy: e.field_of_study
                    })) || []}
                    skills={skills || []}
                    certifications={certifications?.map((c: any) => ({
                        ...c,
                        issueDate: c.issue_date
                    })) || []}
                    awards={awards || []}
                    otherProfiles={otherProfiles || []}
                />

                {/* Posts */}
                <div className="pt-4">
                    <ProfessionalPostsSection
                        userId={id}
                        latestPost={formattedPosts[0] || null}
                    />
                </div>

            </div >
        </div >
    );
}
