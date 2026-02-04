import React from 'react';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { Building2, Globe, MapPin, Mail, Link2, Copy, MessageSquare } from 'lucide-react';
import FollowButton from '@/app/components/network/FollowButton';
import CompanyPostsSection from '@/app/components/company/CompanyPostsSection';
import VerificationBadge from '@/app/components/VerificationBadge';
import ContactInfoCard from '@/app/components/company/ContactInfoCard';
import { formatDistanceToNow } from 'date-fns';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function PublicCompanyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Check Viewer (to hide Follow button if owner)
    const cookieStore = await cookies();
    const session = cookieStore.get('profcaria_session')?.value;
    let viewerId = '';
    if (session) {
        try {
            const payload = JSON.parse(atob(session.split('.')[1]));
            viewerId = payload.uid || payload.id;
        } catch (e) { }
    }

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

    const { data: otherProfilesRaw } = await supabaseAdmin
        .schema('employer')
        .from('other_profiles')
        .select('*')
        .eq('company_id', id);

    const isDark = false; // Static for now, or match system theme if possible? Server component.

    // Decrypt Data
    const companyName = profile.enc_company_name ? decryptData(profile.enc_company_name) : 'N/A';
    const website = profile.enc_website ? decryptData(profile.enc_website) : '';
    const email = profile.enc_work_email ? decryptData(profile.enc_work_email) : '';
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

    // Decrypt Other Profiles
    const otherProfiles = (otherProfilesRaw || []).map((p: any) => ({
        id: p.id,
        network: decryptData(p.enc_network),
        url: decryptData(p.enc_url),
        description: decryptData(p.enc_description),
    }));

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
                enc_first_name,
                enc_last_name, 
                enc_current_role, 
                enc_profile_image_url,
                enc_company_name, 
                user_type,
                enc_logo_url
            )
        `)
        .eq('author_id', id)
        .order('created_at', { ascending: false })
        .limit(5) as any;

    const formattedPosts = latestPosts?.map((p: any) => {
        const authorType = p.author?.user_type;
        let name = 'Unknown';
        let role = '';
        let image = '';

        if (authorType === 'employer') {
            name = (p.author?.enc_company_name ? decryptData(p.author.enc_company_name) : 'Company') || 'Company';
            role = 'Company'; // Or from industry?
            image = (p.author?.enc_logo_url ? decryptData(p.author.enc_logo_url) : '') || '';
        } else {
            const fName = (p.author?.enc_first_name ? decryptData(p.author.enc_first_name) : '') || '';
            const lName = (p.author?.enc_last_name ? decryptData(p.author.enc_last_name) : '') || '';
            name = `${fName} ${lName}`.trim() || 'User';
            role = (p.author?.enc_current_role ? decryptData(p.author.enc_current_role) : '') || '';
            image = (p.author?.enc_profile_image_url ? decryptData(p.author.enc_profile_image_url) : '') || '';
        }

        return {
            id: p.id,
            content: decryptData(p.enc_content) || '',
            media: p.media_urls?.map((url: string) => ({ url, type: url.match(/\.(mp4|webm)$/) ? 'video' : 'image' })),
            timestamp: formatDistanceToNow(new Date(p.created_at), { addSuffix: true }),
            likesCount: p.post_likes?.[0]?.count || 0,
            commentsCount: p.post_comments?.[0]?.count || 0,
            author: {
                id: p.author?.id,
                name,
                role,
                image,
                type: authorType
            }
        };
    }) || [];


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 transition-colors p-6 pb-20">
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">

                {/* Header Card with Logo (Matches Employer Dashboard Static View) */}
                <div className="rounded-2xl border overflow-hidden bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
                    <div className="h-32 bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-700" />
                    <div className="px-6 pb-6">
                        <div className="flex items-end gap-4 -mt-12">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-2xl border-4 overflow-hidden flex items-center justify-center bg-white dark:bg-neutral-900 border-white dark:border-neutral-900 shadow-lg">
                                    {logoUrl ? (
                                        <img
                                            src={logoUrl || ''}
                                            alt="Logo"
                                            className="w-full h-full object-cover"
                                            style={{ objectPosition: imagePosition }}
                                        />
                                    ) : (
                                        <Building2 size={40} className="text-neutral-300 dark:text-neutral-600" />
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 pb-2 flex flex-col md:flex-row justify-between items-end md:items-end gap-4">
                                <div>
                                    {/* Empty space or badges like 'Pro Plan' if we had that data */}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
                                    <a
                                        href={`/professional/notifications?recipientId=${id}&recipientType=employer&recipientName=${encodeURIComponent(companyName || 'Company')}&recipientImage=${encodeURIComponent(logoUrl || '')}`}
                                        className="h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-all shadow-sm"
                                    >
                                        <MessageSquare size={14} />
                                        <span>Message</span>
                                    </a>
                                    {viewerId !== id && (
                                        <FollowButton targetId={id} type="company" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 1. Identity Card */}
                <div className="p-8 rounded-[40px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Left: Company Logo (Read Only) */}
                        <div className="flex-shrink-0 relative">
                            <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2rem] overflow-hidden border-4 flex items-center justify-center bg-white dark:bg-neutral-900 border-white dark:border-neutral-800 shadow-lg">
                                {logoUrl ? (
                                    <img
                                        src={logoUrl || ''}
                                        alt="Company Logo"
                                        className="w-full h-full object-cover select-none"
                                        style={{ objectPosition: imagePosition }}
                                    />
                                ) : (
                                    <Building2 size={48} className="text-neutral-300 dark:text-neutral-600" />
                                )}
                            </div>
                        </div>

                        {/* Right: Details */}
                        <div className="flex-1 w-full space-y-6">
                            {/* Name & Founded */}
                            <div className="space-y-2">
                                <h1 className="text-4xl md:text-5xl font-black text-black dark:text-white flex items-center gap-3">
                                    {companyName}
                                    <VerificationBadge tier={profile.badge_type} size={32} />
                                </h1>
                                {foundedYear && (
                                    <p className="text-xl font-medium text-neutral-500 dark:text-neutral-400">
                                        Founded {foundedYear}
                                    </p>
                                )}
                            </div>

                            {/* Industry if available */}
                            {industry && (
                                <div className="flex items-center gap-2 text-lg font-medium text-neutral-500 dark:text-neutral-400">
                                    <Building2 size={20} className="text-blue-500" />
                                    {industry}
                                </div>
                            )}

                            <div className="h-px w-full bg-neutral-100 dark:bg-neutral-800"></div>

                            {/* Contact Info (Interactivity handled by Client Component) */}
                            <ContactInfoCard
                                email={email}
                                website={website}
                                city={city || undefined}
                                country={country || undefined}
                                profileLink={`${process.env.NEXT_PUBLIC_APP_URL || 'https://www.profcaria.com'}/public/companies/${id}`}
                            />

                        </div>
                    </div>
                </div>


                {/* Company Posts Section (Moved Up to match Private Profile structure) */}
                <div className="pt-4 max-w-2xl mx-auto">
                    <CompanyPostsSection
                        companyId={id}
                        latestPost={formattedPosts[0] || null}
                    />
                </div>

                {/* 3. About Section */}
                <div className="p-8 rounded-[40px] space-y-4 border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-black dark:text-white">About</h3>
                    <p className="leading-relaxed whitespace-pre-wrap text-neutral-800 dark:text-neutral-300">
                        {about || "No company description provided."}
                    </p>
                </div>

                {/* 4. Other Profiles */}
                <div className="p-8 rounded-[40px] border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-black dark:text-white mb-6">
                        <Link2 size={20} /> Other Profiles
                    </h3>
                    <div className="space-y-4">
                        {(!otherProfiles || otherProfiles.length === 0) && (
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">No other profiles linked.</p>
                        )}
                        {otherProfiles?.map((prof: any) => (
                            <div key={prof.id} className="flex items-center justify-between p-4 rounded-2xl border bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
                                <div className="flex items-center gap-4">
                                    <Link2 size={20} className="text-neutral-500 dark:text-neutral-400" />
                                    <div>
                                        <h4 className="font-bold text-black dark:text-white">{prof.network}</h4>
                                        <a href={prof.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white">{prof.url}</a>
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
