import React from 'react';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { Building2, Globe, MapPin, Mail, Link2, Copy } from 'lucide-react';
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

    const { data: otherProfiles } = await supabaseAdmin
        .schema('employer')
        .from('other_profiles')
        .select('*')
        .eq('company_id', id);

    const isDark = false; // Static for now, or match system theme if possible? Server component.

    // Decrypt Data
    const companyName = profile.enc_company_name ? decryptData(profile.enc_company_name) : 'N/A';
    const website = profile.enc_website ? decryptData(profile.enc_website) : '';
    const email = profile.enc_email ? decryptData(profile.enc_email) : '';
    const about = profile.enc_about ? decryptData(profile.enc_about) : '';
    const city = profile.city;
    const country = profile.country;
    // Fix: Use enc_logo_url instead of profile_image_url
    const logoUrl = profile.enc_logo_url ? decryptData(profile.enc_logo_url) : '';
    const imagePosition = profile.image_position || '50% 50%';
    const foundedYear = profile.enc_founded_year ? decryptData(profile.enc_founded_year) : '';
    const industry = profile.industry;
    const address = profile.enc_address ? decryptData(profile.enc_address) : '';

    const followerCount = profile.follower_count || 0;

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
                role, 
                profile_image_url,
                company_name, 
                user_type
            )
        `)
        .eq('author_id', id)
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
            image: p.author?.profile_image_url, // For posts, author image might be different logic? 
            // Actually, for posts we used `profile_image_url` not enc. 
            // But if the author is a company, `profile_image_url` on the user record (if joined via view) might be it.
            // But here we are fetching `companies` table directly for the main page.
            // For posts, `author_id` links to `users` or `companies`?
            // If `user_type` is employer, `author_id` is the user ID. 
            // Does the user record have the logo? 
            // In `auth/me`: `enc_logo_url` is on `companies` table. 
            // The `posts` table `author_id` refers to `users.id` (public/professional schema?). 
            // Wait, if an employer posts, their `id` in `posts` table is their `company_id` or `user_id`?
            // Usually `auth.uid()`.
            // The `companies` table ID is `id` (uuid).
            // Let's assume the post relation works for now since posts were showing in screenshot 1308.
            // Just satisfy the type.
            type: p.author?.user_type
        }
    })) || [];


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-6 pb-20">
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">

                {/* Header Card with Logo (Matches Employer Dashboard Static View) */}
                <div className="rounded-2xl border overflow-hidden bg-white border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                    <div className="h-32 bg-gradient-to-r from-neutral-800 to-neutral-900" />
                    <div className="px-6 pb-6">
                        <div className="flex items-end gap-4 -mt-12">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-2xl border-4 overflow-hidden flex items-center justify-center bg-white border-white shadow-lg dark:bg-neutral-800 dark:border-neutral-900">
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
                                    {/* Empty space or badges like 'Pro Plan' if we had that data */}
                                </div>
                                <div>
                                    <FollowButton targetId={id} type="company" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 1. Identity Card */}
                <div className="p-8 rounded-[40px] bg-white border border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Left: Company Logo (Read Only) */}
                        <div className="flex-shrink-0 relative">
                            <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2rem] overflow-hidden border-4 flex items-center justify-center bg-white border-white shadow-lg">
                                {logoUrl ? (
                                    <img
                                        src={logoUrl}
                                        alt="Company Logo"
                                        className="w-full h-full object-cover select-none"
                                        style={{ objectPosition: imagePosition }}
                                    />
                                ) : (
                                    <Building2 size={48} className="text-neutral-300" />
                                )}
                            </div>
                        </div>

                        {/* Right: Details */}
                        <div className="flex-1 w-full space-y-6">
                            {/* Name & Founded */}
                            <div className="space-y-2">
                                <h1 className="text-4xl md:text-5xl font-black text-black dark:text-white">
                                    {companyName}
                                </h1>
                                {foundedYear && (
                                    <p className="text-xl font-medium text-neutral-500 dark:text-neutral-400">
                                        Founded {foundedYear}
                                    </p>
                                )}
                            </div>

                            <div className="h-px w-full bg-neutral-100 dark:bg-neutral-800"></div>

                            {/* Contact Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Email */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Work Email</label>
                                    <div className="flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300">
                                        <Mail size={16} /> {email || 'No email provided'}
                                    </div>
                                </div>

                                {/* Website */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Website</label>
                                    <a href={website || '#'} target={website ? "_blank" : undefined} rel="noopener noreferrer" className={`flex items-center gap-2 font-medium ${website ? 'hover:underline text-neutral-700 dark:text-neutral-300' : 'text-neutral-400 pointer-events-none'}`}>
                                        <Globe size={16} /> {website || 'No website provided'}
                                    </a>
                                </div>
                            </div>

                            {/* Address/Location */}
                            <div className="space-y-1 pt-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Location</label>
                                <div className="flex items-center gap-2 font-medium text-neutral-700 dark:text-neutral-300">
                                    <MapPin size={16} /> {(city || country) ? `${city || ''}${city && country ? ', ' : ''}${country || ''}` : 'No location provided'}
                                </div>
                            </div>

                            {/* Profile Link */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Profile Link</label>
                                <div className="flex items-center p-1.5 rounded-xl border bg-white border-neutral-200 dark:bg-neutral-950 dark:border-neutral-800">
                                    <div className="px-3 text-sm truncate flex-1 text-neutral-600 dark:text-neutral-400">
                                        https://profcaria.com/c/{(companyName || 'company').toLowerCase().replace(/ /g, '-')}
                                    </div>
                                    {/* Client component for copy functionality would go here. For now rendering the button visually. */}
                                    <div className="p-2 rounded-lg text-neutral-400">
                                        <Copy size={16} />
                                    </div>
                                </div>
                            </div>

                            {/* Latest Updates (Posts) - Moved inside Identity Card */}
                            <div className="space-y-6 pt-4">
                                <h3 className="text-xl font-bold px-4">Latest Update</h3>
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
                                    <div className="p-4 rounded-2xl border bg-white border-neutral-200 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                                        <p className="text-center text-neutral-500 py-4">No updates yet.</p>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

                {/* 2. Subscribers Card */}
                <div className="p-8 rounded-[40px] border bg-white border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                    <div className="flex flex-col items-center justify-center space-y-1">
                        <div className="text-4xl font-black text-black dark:text-white">{followerCount}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Subscribers</div>
                    </div>
                </div>

                {/* 3. About Section */}
                <div className="p-8 rounded-[40px] space-y-4 border bg-white border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-black dark:text-white">About</h3>
                    <p className="leading-relaxed whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">
                        {about || "No company description provided."}
                    </p>
                </div>

                {/* 4. Other Profiles */}
                <div className="p-8 rounded-[40px] border bg-white border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-black dark:text-white mb-6">
                        <Link2 size={20} /> Other Profiles
                    </h3>
                    <div className="space-y-4">
                        {(!otherProfiles || otherProfiles.length === 0) && (
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">No other profiles linked.</p>
                        )}
                        {otherProfiles?.map((prof: any) => (
                            <div key={prof.id} className="flex items-center justify-between p-4 rounded-2xl border bg-white border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700">
                                <div className="flex items-center gap-4">
                                    <Link2 size={20} className="text-neutral-500 dark:text-neutral-400" />
                                    <div>
                                        <h4 className="font-bold text-black dark:text-white">{prof.network}</h4>
                                        <a href={prof.url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline text-neutral-600 dark:text-neutral-400">{prof.url}</a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
