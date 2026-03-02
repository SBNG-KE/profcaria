import ProfessionalPostsSection from '@/app/components/professional/ProfessionalPostsSection';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { getFollowerCount } from '@/lib/followers';
import { Briefcase, MapPin, Link2, MessageSquare, Mail, Phone, ArrowRight, Eye, Rocket, Code2, Handshake, XCircle, CheckCircle2, AlertCircle, Shield, User, GraduationCap, Award, Lock, TrendingUp, Trophy } from 'lucide-react';
import FollowButton from '@/app/components/network/FollowButton';
import ProfileInfoSection from '@/app/components/professional/ProfileInfoSection';
import VerificationBadge from '@/app/components/VerificationBadge';
import PostsPreview from '@/app/components/professional/PostsPreview';
import PostCard from '@/app/components/professional/PostCard';
import ContactInfoCard from '@/app/components/company/ContactInfoCard';
import InviteButton from '@/app/components/employer/InviteButton';
import { formatDistanceToNow } from 'date-fns';
import ProfileViewTracker from '@/app/components/shared/ProfileViewTracker';
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
    const intentMode = profile.intent_mode || 'open_to_offers';

    // Fetch intent headline from preferences
    const { data: prefsData } = await supabaseAdmin
        .schema('professional')
        .from('preferences')
        .select('enc_intent_headline')
        .eq('user_id', id)
        .maybeSingle();
    const intentHeadline = prefsData?.enc_intent_headline ? decryptData(prefsData.enc_intent_headline) : '';

    // Fetch verification graph
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let verificationGraph: any = null;
    try {
        const vRes = await fetch(`${baseUrl}/api/professional/verification?userId=${id}`, { cache: 'no-store' });
        if (vRes.ok) {
            const vData = await vRes.json();
            verificationGraph = vData.graph;
        }
    } catch (e) {
        console.error('Error fetching verification graph:', e);
    }

    // Fetch career score
    let careerScore: any = null;
    try {
        const csRes = await fetch(`${baseUrl}/api/professional/career-score?userId=${id}`, { cache: 'no-store' });
        if (csRes.ok) {
            const csData = await csRes.json();
            careerScore = csData.score;
        }
    } catch (e) {
        console.error('Error fetching career score:', e);
    }

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
                    enc_profile_image_url
                )
            `)
            .eq('user_id', id)
            .order('created_at', { ascending: false })
            .limit(5) as any;

        if (!postsError && latestPosts) {
            const accurateFollowerCount = await getFollowerCount(id, 'professional');

            // Pre-fetch likes ifviewer is authenticated
            let userLikes = new Set();
            if (viewerId) {
                let likeQuery = supabaseAdmin
                    .schema('professional')
                    .from('post_likes')
                    .select('post_id')
                    .in('post_id', latestPosts.map((p: any) => p.id));

                if (isViewerEmployer) {
                    likeQuery = likeQuery.eq('company_id', viewerId);
                } else {
                    likeQuery = likeQuery.eq('user_id', viewerId);
                }

                const { data: likesResult } = await likeQuery;
                if (likesResult) {
                    likesResult.forEach((l: any) => userLikes.add(l.post_id));
                }
            }

            formattedPosts = latestPosts.map((p: any) => {
                const author = p.author || {};
                return {
                    id: p.id,
                    content: decryptData(p.enc_content),
                    media: p.media_urls?.map((url: string) => ({ url, type: url.match(/\.(mp4|webm)$/) ? 'video' : 'image' })),
                    timestamp: formatDistanceToNow(new Date(p.created_at), { addSuffix: true }),
                    likesCount: p.post_likes?.[0]?.count || 0,
                    commentsCount: p.post_comments?.[0]?.count || 0,
                    isLiked: userLikes.has(p.id),
                    author: {
                        id: author.id || p.user_id, // Fallback if join empty
                        name: author.enc_first_name ? `${decryptData(author.enc_first_name)} ${decryptData(author.enc_last_name)}` : 'User',
                        followerCount: accurateFollowerCount || 0,
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
            <ProfileViewTracker targetId={id} targetType="professional" />
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">

                {/* Header Card Redesign (Matching Employer/Company Static View) */}
                <div className="rounded-2xl border overflow-hidden bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
                    {/* Banner Area (Gradient) */}
                    <div className="h-32 bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-700" />

                    <div className="px-6 pb-6">
                        <div className="flex items-end gap-4 -mt-12">
                            {/* Overlapping Profile Image */}
                            <div className="relative">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 overflow-hidden flex items-center justify-center bg-white dark:bg-neutral-900 border-white dark:border-neutral-900 shadow-lg">
                                    {profileImageUrl ? (
                                        <img
                                            src={profileImageUrl}
                                            alt="Profile"
                                            className="w-full h-full object-cover transition-none select-none"
                                            style={{ objectPosition: imagePosition }}
                                            draggable={false}
                                        />
                                    ) : (
                                        <div className="font-black text-4xl text-neutral-300 dark:text-neutral-700">
                                            {firstName?.[0]}{lastName?.[0]}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info & Actions */}
                            <div className="flex-1 pb-1 flex flex-col md:flex-row justify-between items-end md:items-end gap-4 min-w-0">
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-black dark:text-white flex items-center gap-2 truncate">
                                        {firstName} {lastName}
                                        <VerificationBadge tier={profile.badge_type} size={24} />
                                    </h1>
                                    <p className="text-sm md:text-base font-medium text-neutral-600 dark:text-neutral-400 truncate">
                                        {role}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                                        {city && country && <span className="flex items-center gap-1"><MapPin size={12} /> {city}, {country}</span>}
                                    </div>
                                    {/* Intent Mode Badge */}
                                    {intentMode && intentMode !== 'not_looking' && (
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${intentMode === 'actively_looking' ? 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400' :
                                                intentMode === 'open_to_freelance' ? 'border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-800 dark:bg-purple-950/50 dark:text-purple-400' :
                                                    intentMode === 'open_to_cofounder' ? 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400' :
                                                        'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400'
                                                }`}>
                                                {intentMode === 'actively_looking' && <Rocket size={11} />}
                                                {intentMode === 'open_to_offers' && <Eye size={11} />}
                                                {intentMode === 'open_to_freelance' && <Code2 size={11} />}
                                                {intentMode === 'open_to_cofounder' && <Handshake size={11} />}
                                                {intentMode === 'actively_looking' ? 'Actively Looking' :
                                                    intentMode === 'open_to_freelance' ? 'Open to Freelance' :
                                                        intentMode === 'open_to_cofounder' ? 'Open to Co-found' :
                                                            'Open to Offers'}
                                            </span>
                                            {intentHeadline && (
                                                <span className="text-xs text-neutral-500 dark:text-neutral-400 italic">
                                                    {intentHeadline}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons Row */}
                                <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
                                    {/* Additional Contact Info handled in its own card below, but we can put buttons here */}

                                    {/* Message Button */}
                                    {isViewerProfessional && viewerId !== id && (
                                        <Link
                                            href={`/professional/notifications?recipientId=${id}&recipientType=professional&recipientName=${encodeURIComponent(firstName + ' ' + lastName)}&recipientImage=${encodeURIComponent(profileImageUrl || '')}`}
                                            className="h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-all shadow-sm"
                                        >
                                            <MessageSquare size={14} />
                                            <span>Message</span>
                                        </Link>
                                    )}
                                    {isViewerEmployer && viewerId !== id && (
                                        <>
                                            <InviteButton professionalId={id} professionalName={`${firstName} ${lastName}`} />
                                            <Link
                                                href={`/employer/messages?recipientId=${id}&recipientName=${encodeURIComponent(firstName + ' ' + lastName)}&recipientImage=${encodeURIComponent(profileImageUrl || '')}`}
                                                className="h-9 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 transition-all shadow-sm"
                                            >
                                                <MessageSquare size={14} />
                                                <span>Message</span>
                                            </Link>
                                        </>
                                    )}

                                    {/* Follow Button */}
                                    {(!isViewerEmployer && viewerId !== id) && (
                                        <FollowButton targetId={id} type="user" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Additional Contact Info Details (Hidden mostly, passed to ContactCard in body) */}
                    </div>
                </div>

                {/* About Section & Contact Card Container */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Contact Info Card (Full Width) */}
                    <div className="p-5 md:p-6 rounded-[32px] border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
                        <ContactInfoCard
                            email={email}
                            emailLabel="Email"
                            phone={phone}
                            city={city}
                            country={country}
                            profileLink={`${process.env.NEXT_PUBLIC_APP_URL || 'https://profcaria.com'}/public/people/${id}`}
                        />
                    </div>
                </div>

                {/* Verified Career Graph (Compact) */}
                {verificationGraph && (
                    <div className="p-5 md:p-6 rounded-[32px] border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
                        <div className="flex flex-col md:flex-row items-center gap-5">
                            {/* Score Ring */}
                            <div className="relative w-20 h-20 shrink-0">
                                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                    <circle cx="50" cy="50" r="42" fill="none" className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="42" fill="none" stroke={verificationGraph.overallTier === 'gold' ? '#f59e0b' : verificationGraph.overallTier === 'blue' ? '#3b82f6' : '#9ca3af'} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${verificationGraph.overallScore * 2.64} 264`} />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-xl font-black text-black dark:text-white">{verificationGraph.overallScore}</span>
                                    <span className="text-[7px] font-bold uppercase tracking-widest text-neutral-400">Score</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
                                    <Shield size={16} className="text-emerald-500" />
                                    Verified Career Graph
                                </h3>
                                <div className="grid grid-cols-4 gap-2 mt-3">
                                    {verificationGraph.nodes.slice(0, 8).map((node: any) => (
                                        <div key={node.id} className="flex flex-col items-center gap-1">
                                            {node.status === 'verified' ? <CheckCircle2 size={14} className="text-emerald-500" /> : node.status === 'partial' ? <AlertCircle size={14} className="text-amber-500" /> : <XCircle size={14} className="text-neutral-400 dark:text-neutral-600" />}
                                            <span className="text-[9px] font-bold text-neutral-500 dark:text-neutral-400 text-center leading-tight">{node.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Career Score Badge */}
                {careerScore && (
                    <div className="p-5 md:p-6 rounded-[32px] border bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 shrink-0">
                                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                    <circle cx="50" cy="50" r="42" fill="none" className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="8" />
                                    <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${careerScore.overall * 2.64} 264`} style={{ stroke: 'url(#csGrad)' }} />
                                    <defs><linearGradient id="csGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#8b5cf6" /></linearGradient></defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-lg font-black text-black dark:text-white">{careerScore.overall}</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
                                    <Trophy size={16} className="text-amber-500" />
                                    Career Score
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${careerScore.tier === 'legendary' ? 'bg-amber-500/20 text-amber-500' :
                                        careerScore.tier === 'elite' ? 'bg-indigo-500/20 text-indigo-500' :
                                            careerScore.tier === 'rising' ? 'bg-emerald-500/20 text-emerald-500' :
                                                careerScore.tier === 'emerging' ? 'bg-lime-500/20 text-lime-500' :
                                                    'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                                        }`}>{careerScore.tier}</span>
                                </h3>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {careerScore.pillars?.map((p: any) => (
                                        <span key={p.id} className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${p.score >= 70 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : p.score >= 40 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'}`}>
                                            {p.label} {p.score}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
