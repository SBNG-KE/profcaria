import React from 'react';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { Briefcase, MapPin, Link2 } from 'lucide-react';
import FollowButton from '@/app/components/network/FollowButton';
import ProfileInfoSection from '@/app/components/professional/ProfileInfoSection';
import PostsPreview from '@/app/components/professional/PostsPreview';
import PostCard from '@/app/components/professional/PostCard';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch User Profile
    const { data: profile, error } = await supabaseAdmin
        .schema('professional')
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !profile) {
        return notFound();
    }

    const isDark = false;

    // Decrypt Data
    const firstName = profile.first_name;
    const lastName = profile.last_name;
    const role = profile.role;
    const about = profile.about;
    const country = profile.country;
    const city = profile.city;
    const profileImageUrl = profile.profile_image_url;
    const imagePosition = profile.image_position || '50% 50%';

    // Fetch Sections
    const { data: employment } = await supabaseAdmin.schema('professional').from('employment_history').select('*').eq('user_id', profile.user_id).order('start_date', { ascending: false });
    const { data: education } = await supabaseAdmin.schema('professional').from('education').select('*').eq('user_id', profile.user_id).order('start_date', { ascending: false });
    const { data: skills } = await supabaseAdmin.schema('professional').from('skills').select('*').eq('user_id', profile.user_id);
    const { data: certifications } = await supabaseAdmin.schema('professional').from('certifications').select('*').eq('user_id', profile.user_id);
    const { data: awards } = await supabaseAdmin.schema('professional').from('awards').select('*').eq('user_id', profile.user_id);
    const { data: otherProfiles } = await supabaseAdmin.schema('professional').from('other_profiles').select('*').eq('user_id', profile.user_id);

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
        .eq('author_id', profile.user_id)
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
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-6 pb-20">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header Card */}
                <div className="rounded-2xl border overflow-hidden bg-white border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                    <div className="h-32 bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900" />
                    <div className="px-6 pb-6">
                        <div className="flex items-end gap-4 -mt-12">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full border-4 overflow-hidden flex items-center justify-center bg-white border-white shadow-lg dark:bg-neutral-800 dark:border-neutral-900">
                                    {profileImageUrl ? (
                                        <img
                                            src={profileImageUrl}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            style={{ objectPosition: imagePosition }}
                                        />
                                    ) : (
                                        <div className="text-3xl font-black text-neutral-300">{firstName?.[0]}</div>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 pb-2 flex justify-between items-end">
                                <div>
                                    <h1 className="text-3xl font-black text-black dark:text-white">{firstName} {lastName}</h1>
                                    <p className="font-medium text-lg text-neutral-600 dark:text-neutral-400">{role}</p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                                        {city && <span className="flex items-center gap-1"><MapPin size={14} /> {city}{country ? `, ${country}` : ''}</span>}
                                    </div>
                                </div>
                                <div>
                                    <FollowButton targetId={profile.user_id || profile.id} type="user" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* About */}
                {about && (
                    <div className="p-8 rounded-[40px] border bg-white border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                        <h3 className="text-xl font-bold mb-4">About</h3>
                        <p className="whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">{about}</p>
                    </div>
                )}

                {/* Profile Sections (Read Only) */}
                <ProfileInfoSection
                    isDark={isDark}
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
                <div className="space-y-6">
                    <h3 className="text-xl font-bold px-4">Latest Activity</h3>
                    {formattedPosts.length > 0 ? (
                        formattedPosts.map((post: any) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                isDark={isDark}
                                currentUserId="" // Read only
                                onLike={() => { }}
                            />
                        ))
                    ) : (
                        <p className="text-center text-neutral-500 py-10">No recent activity.</p>
                    )}
                </div>

            </div>
        </div>
    );
}
