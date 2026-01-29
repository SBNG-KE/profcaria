import ProfessionalPostsSection from '@/app/components/professional/ProfessionalPostsSection';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';
import { Briefcase, MapPin, Link2, MessageSquare, Mail, Phone, ArrowRight } from 'lucide-react';
import FollowButton from '@/app/components/network/FollowButton';
import ProfileInfoSection from '@/app/components/professional/ProfileInfoSection';
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
    const { data: employmentRaw } = await supabaseAdmin.schema('professional').from('employment_history').select('*').eq('user_id', id).order('start_date', { ascending: false });
    const { data: educationRaw } = await supabaseAdmin.schema('professional').from('education').select('*').eq('user_id', id).order('start_date', { ascending: false });
    const { data: skillsRaw } = await supabaseAdmin.schema('professional').from('skills').select('*').eq('user_id', id);
    const { data: certificationsRaw } = await supabaseAdmin.schema('professional').from('certifications').select('*').eq('user_id', id);
    const { data: awardsRaw } = await supabaseAdmin.schema('professional').from('awards').select('*').eq('user_id', id);
    const { data: otherProfilesRaw } = await supabaseAdmin.schema('professional').from('other_profiles').select('*').eq('user_id', id);

    // Decrypt Sections
    const employment = (employmentRaw || []).map((e: any) => ({
        id: e.id,
        title: decryptData(e.enc_title),
        company: decryptData(e.enc_company),
        location: decryptData(e.enc_location),
        type: decryptData(e.enc_type),
        description: decryptData(e.enc_description),
        startDate: decryptData(e.enc_start_date),
        endDate: decryptData(e.enc_end_date),
        isCurrent: e.is_current,
    }));

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
            <div className="max-w-7xl mx-auto space-y-8">

                {/* 1. Identity Card (Exact Copy of Private Profile Design) */}
                <div className="p-5 md:p-8 rounded-[32px] md:rounded-[40px] border bg-white border-neutral-200 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-8 items-start">

                        {/* Left: Profile Image */}
                        <div className="flex-shrink-0 relative group">
                            <div className="w-40 h-40 md:w-48 md:h-48 rounded-[2rem] overflow-hidden border-4 flex items-center justify-center bg-white border-white shadow-lg">
                                {profileImageUrl ? (
                                    <img
                                        src={profileImageUrl}
                                        alt="Profile"
                                        className="w-full h-full object-cover transition-none select-none"
                                        style={{ objectPosition: imagePosition }}
                                        draggable={false}
                                    />
                                ) : (
                                    <div className="font-black text-6xl text-neutral-300">
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
                                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-black">
                                        {firstName} {lastName}
                                    </h1>
                                </div>

                                <div className="flex items-center gap-3">
                                    <p className="text-xl font-medium text-neutral-600">
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
                                            phone={phone}
                                            city={city}
                                            country={country}
                                            profileLink={`${process.env.NEXT_PUBLIC_APP_URL || 'https://profcaria.com'}/public/people/${id}`}
                                            isDark={false}
                                        />
                                    </div>

                                    {/* Action Buttons (Follow/Message) can go here or top right. Private Profile has them top right or not at all (editing). 
                                We should keep the Follow/Message logic. Let's place it nicely.
                                In Private Profile, there are no action buttons. 
                                In Public, we need them. Let's put them absolute top right or in a flex column on the far right.
                                The private profile "Right: Details" (line 1513) takes full width. 
                                I'll add a separate column or just put it below Details? 
                                Let's put it top-right relative to the card.
                            */}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons (Absolute Positioned for Desktop, or Flex for Mobile) */}
                    <div className="mt-6 md:mt-0 md:absolute md:top-8 md:right-8 flex flex-wrap gap-2">
                        {/* Hide Follow/Subscribe if viewer is Company or Self */}
                        {(!isViewerEmployer && viewerId !== id) && (
                            <FollowButton targetId={id} type="user" />
                        )}

                        {isViewerProfessional && viewerId !== id && (
                            <Link
                                href={`/professional/notifications?chat=${id}`}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                <MessageSquare size={14} />
                                <span>Message</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Connections (Renamed from Followers) - Private Profile DOES NOT show this prominently as a card.
                    Wait, private profile has "Follower Count" in settings? 
                    The user previously asked to rename "Connections" to "Followers".
                    The private profile screenshot didn't show a big followers card.
                    BUT user "make it an exact copy... what will not be shown... is analytics".
                    Does private profile show followers? I didn't see it in the snippet.
                    I saw `const [followerCount, setFollowerCount] = useState(0);` in Private Profile.
                    But I didn't see it rendered in the main view.
                    If the user wants EXACT copy, and private doesn't have it, maybe remove it?
                    However, Public Profiles usually show social proof.
                    I will KEEP it but style it to match or integrate it. 
                    Actually, let's look at the Private Profile code again. 
                    Ah, I don't see it rendered in the "Identity Card" or "About Card".
                    MAYBE it is in "Profile Info Section"? No.
                    I will HIDE the Big Followers Card to stick to "Exact Copy" request unless I see it in screenshots.
                    Screenshots: The 1st screenshot provided by user SHOWS "0 CONNECTIONS" big card. 
                    Wait, that's the PUBLIC profile screenshot the user provided ("uploaded_media_0...").
                    Wait, User said: "make it an exact copy of the profile page of that person let me give you images to see how the profile page of someone looks like".
                    User uploaded 5 images. Those images likely show the PRIVATE profile (with "Updates", "Suggestions" sidebar etc.).
                    Therefore, if the Private Profile (images) DOES NOT have a big "0 Connections" card, I should REMOVE it.
                    I will remove the Big Connections Card.
                */}

                {/* About Section */}
                {about && (
                    <div className="p-5 md:p-8 rounded-[32px] md:rounded-[40px] border bg-white border-neutral-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-black">
                                <Briefcase size={20} className="text-neutral-600" /> About
                            </h3>
                        </div>
                        <p className="text-lg leading-relaxed whitespace-pre-wrap text-neutral-600">
                            {about}
                        </p>
                    </div>
                )}

                {/* Profile Sections (Read Only) */}
                {/* Note: ProfileInfoSection handles Experience, Education, etc. */}
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
                <div className="pt-4">
                    {/* Match Private Profile Posts Header */}
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-black">
                            <Briefcase size={20} className="text-neutral-600" /> Posts
                        </h3>
                    </div>

                    <ProfessionalPostsSection
                        userId={id}
                        latestPost={formattedPosts[0] || null}
                    />
                </div>

            </div>
        </div>
    );
}
