import React from 'react';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { Building2, Globe, MapPin, Mail } from 'lucide-react';
import FollowButton from '@/app/components/network/FollowButton';
import PostCard from '@/app/components/professional/PostCard';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function PublicCompanyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch Company Profile
    const { data: profile, error } = await supabaseAdmin
        .schema('employer')
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !profile) {
        return notFound();
    }

    const isDark = false;

    // Decrypt Data
    const companyName = profile.enc_company_name ? decryptData(profile.enc_company_name) : 'N/A';
    const website = profile.enc_website ? decryptData(profile.enc_website) : '';
    const about = profile.enc_about ? decryptData(profile.enc_about) : '';
    const city = profile.city;
    const country = profile.country;
    const logoUrl = profile.profile_image_url;
    const imagePosition = profile.image_position || '50% 50%';
    const foundedYear = profile.enc_founded_year ? decryptData(profile.enc_founded_year) : '';
    const industry = profile.industry;

    // Fetch Latest Posts
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
                role, /* role might be nil for company */
                profile_image_url,
                company_name, /* Extra field if author is company */
                user_type
            )
        `)
        .eq('author_id', id) // profile.id
        .order('created_at', { ascending: false })
        .limit(5) as any;

    const formattedPosts = latestPosts?.map((p: any) => ({
        id: p.id,
        content: decryptData(p.enc_content),
        media: p.media_urls?.map((url: string) => ({ url, type: url.match(/\.(mp4|webm)$/) ? 'video' : 'image' })),
        timestamp: formatDistanceToNow(new Date(p.created_at), { addSuffix: true }),
        likesCount: p.post_likes?.[0]?.count || 0,
        commentsCount: p.post_comments?.[0]?.count || 0,
        author: {
            id: p.author?.id,
            name: p.author?.company_name || `${p.author?.first_name} ${p.author?.last_name}`,
            role: p.author?.user_type === 'employer' ? 'Company' : p.author?.role,
            image: p.author?.profile_image_url,
            type: p.author?.user_type
        }
    })) || [];


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-6 pb-20">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header Card */}
                <div className="rounded-2xl border overflow-hidden bg-white border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                    <div className="h-32 bg-gradient-to-r from-neutral-800 to-neutral-900" />
                    <div className="px-6 pb-6">
                        <div className="flex items-end gap-4 -mt-12">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-2xl border-4 overflow-hidden flex items-center justify-center bg-white border-white shadow-lg dark:bg-neutral-800 dark:border-neutral-900">
                                    {logoUrl ? (
                                        <img
                                            src={logoUrl}
                                            alt="Logo"
                                            className="w-full h-full object-cover"
                                            style={{ objectPosition: imagePosition }}
                                        />
                                    ) : (
                                        <Building2 size={40} className="text-neutral-300" />
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 pb-2 flex justify-between items-end">
                                <div>
                                    <h1 className="text-3xl font-black text-black dark:text-white">{companyName}</h1>
                                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-neutral-500">
                                        {industry && <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 font-medium">{industry}</span>}
                                        {foundedYear && <span>Founded {foundedYear}</span>}
                                        {(city || country) && <span className="flex items-center gap-1"><MapPin size={14} /> {city}{country ? `, ${country}` : ''}</span>}
                                        {website && <a href={website} target="_blank" rel="noopener" className="flex items-center gap-1 hover:underline"><Globe size={14} /> Website</a>}
                                    </div>
                                </div>
                                <div>
                                    <FollowButton targetId={id} type="company" />
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

                {/* Posts */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold px-4">Latest Updates</h3>
                    {formattedPosts.length > 0 ? (
                        formattedPosts.map((post: any) => (
                            <PostCard
                                key={post.id}
                                post={post}
                                isDark={isDark}
                                currentUserId=""
                                onLike={() => { }}
                            />
                        ))
                    ) : (
                        <p className="text-center text-neutral-500 py-10">No updates yet.</p>
                    )}
                </div>

            </div>
        </div>
    );
}
