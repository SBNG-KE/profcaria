import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';

// GET - Fetch posts feed
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        // Fetch posts
        // Fetch professional posts
        const profPromise = supabaseAdmin
            .schema('professional')
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Fetch employer posts (Try/Catch in case table doesn't exist yet)
        const empPromise = supabaseAdmin
            .schema('employer')
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)
            .then((res: any) => ({ ...res, isEmployer: true }))
            .catch(() => ({ data: [], error: null }));

        const [profRes, empRes] = await Promise.all([profPromise, empPromise]);

        // Merge and Sort
        let allPosts: any[] = [];
        if (profRes.data) allPosts = [...allPosts, ...profRes.data.map((p: any) => ({ ...p, authorType: 'professional' }))];
        if ((empRes as any).data) allPosts = [...allPosts, ...((empRes as any).data || []).map((p: any) => ({ ...p, authorType: 'employer', user_id: p.company_id }))];

        allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const slicedPosts = allPosts.slice(0, limit);

        // Get stats for each post
        const postsWithStats = await Promise.all(slicedPosts.map(async (post: any) => {
            // Like count and user's like status (Assumes shared likes table or separate? For MVP, assume shared or check both)
            // simplified for robustness: checking professional likes for now. 
            // TODO: Employer likes table support
            const { count: likesCount } = await supabaseAdmin
                .schema('professional')
                .from('post_likes')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

            const { data: userLike } = await supabaseAdmin
                .schema('professional')
                .from('post_likes')
                .select('id')
                .eq('post_id', post.id)
                .eq('user_id', user.id)
                .single();

            // Comments count
            const { count: commentsCount } = await supabaseAdmin
                .schema('professional')
                .from('post_comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

            // Reposts count
            const { count: repostsCount } = await supabaseAdmin
                .schema('professional')
                .from('post_reposts')
                .select('*', { count: 'exact', head: true })
                .eq('original_post_id', post.id);

            const { data: userRepost } = await supabaseAdmin
                .schema('professional')
                .from('post_reposts')
                .select('id')
                .eq('original_post_id', post.id)
                .eq('user_id', user.id)
                .single();

            // Get author info
            let authorData: any = {
                id: post.user_id,
                type: post.authorType || 'professional',
                name: 'User',
                profileImage: '/default-avatar.png',
                role: '',
                followerCount: 0,
                isFollowing: false
            };

            if (post.authorType === 'employer') {
                // Fetch Employer Details (Assuming company_id)
                // We try to fetch from employer.companies if possible, or jobs metadata?
                // Since we don't know the exact employer table structure, we'll try 'companies' or fallback
                /*
                   NOTE: Using a heuristic here. Often employer info is in 'companies'.
                */
                try {
                    // Fetch Company Profile
                    const { data: comp } = await supabaseAdmin
                        .schema('employer')
                        .from('companies')
                        .select('id, enc_company_name, enc_logo_url')
                        .eq('id', post.user_id)
                        .single();

                    if (comp) {
                        const companyName = decryptData(comp.enc_company_name);
                        const logoUrl = comp.enc_logo_url ? decryptData(comp.enc_logo_url) : null;

                        authorData = {
                            ...authorData,
                            name: companyName || 'Company',
                            profileImage: logoUrl || '/default-logo.png',
                            role: 'Company',
                            type: 'employer'
                        };

                        // Get follower count for company
                        const { count: followerCount } = await supabaseAdmin
                            .schema('professional')
                            .from('company_follows')
                            .select('*', { count: 'exact', head: true })
                            .eq('company_id', post.user_id);

                        authorData.followerCount = followerCount || 0;

                        // Check if current user follows company
                        const { data: isFollowing } = await supabaseAdmin
                            .schema('professional')
                            .from('company_follows')
                            .select('id')
                            .eq('user_id', user.id)
                            .eq('company_id', post.user_id)
                            .single();

                        authorData.isFollowing = !!isFollowing;

                    } else {
                        authorData.name = 'Employer (Unknown)';
                    }
                } catch (e) {
                    console.error('Error fetching company details:', e);
                }
            } else {
                // Fetch Professional Details (Existing logic)
                const { data: profUser } = await supabaseAdmin
                    .schema('professional')
                    .from('users')
                    .select('id, enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url')
                    .eq('id', post.user_id)
                    .single();

                if (profUser) {
                    const firstName = decryptData(profUser.enc_first_name) || '';
                    const lastName = decryptData(profUser.enc_last_name) || '';
                    const role = decryptData(profUser.enc_current_role) || '';
                    const profileImage = decryptData(profUser.enc_profile_image_url) || '/default-avatar.png';

                    const { count: followerCount } = await supabaseAdmin
                        .schema('professional')
                        .from('user_follows')
                        .select('*', { count: 'exact', head: true })
                        .eq('following_id', post.user_id);

                    const { data: following } = await supabaseAdmin
                        .schema('professional')
                        .from('user_follows')
                        .select('id')
                        .eq('follower_id', user.id)
                        .eq('following_id', post.user_id)
                        .single();

                    const fullName = `${firstName} ${lastName}`.trim();

                    authorData = {
                        ...authorData,
                        name: fullName || 'User',
                        profileImage: profileImage,
                        role: role,
                        followerCount: followerCount || 0,
                        isFollowing: !!following || post.user_id === user.id
                    };
                }
            }

            return {
                id: post.id,
                content: post.content,
                media: (post.media_urls || []).map((url: string) => ({
                    type: url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image',
                    url
                })),
                linkPreview: post.link_preview,
                timestamp: formatTimestamp(post.created_at),
                likesCount: likesCount || 0,
                commentsCount: commentsCount || 0,
                repostsCount: repostsCount || 0,
                isLiked: !!userLike,
                isReposted: !!userRepost,
                author: authorData
            };
        }));

        return NextResponse.json({ posts: postsWithStats });
    } catch (error: any) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Create new post
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { content, mediaUrls, linkMedia } = body;

        if (!content?.trim()) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        // Word count validation
        const wordCount = content.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
        if (wordCount > 500) {
            return NextResponse.json({ error: 'Post exceeds 500 word limit' }, { status: 400 });
        }

        // Prepare link preview if linkMedia provided
        let linkPreview = null;
        if (linkMedia) {
            try {
                // Determine base URL dynamically for server-side fetch
                const protocol = request.headers.get('x-forwarded-proto') || 'http';
                const host = request.headers.get('host') || 'localhost:3000';
                const baseUrl = `${protocol}://${host}`;

                const previewRes = await fetch(`${baseUrl}/api/link-preview?url=${encodeURIComponent(linkMedia)}`);
                if (previewRes.ok) {
                    linkPreview = await previewRes.json();
                } else {
                    throw new Error('Preview fetch failed');
                }
            } catch (e) {
                console.error('Link preview generation failed, using fallback:', e);
                // Fallback: Create a basic preview object so the link is still clickable
                // Ensure protocol exists
                const safeUrl = linkMedia.match(/^https?:\/\//i) ? linkMedia : `https://${linkMedia}`;
                try {
                    const urlObj = new URL(safeUrl);
                    linkPreview = {
                        url: safeUrl,
                        title: urlObj.hostname,
                        siteName: urlObj.hostname,
                        description: '',
                        image: ''
                    };
                } catch (err) {
                    // If URL is completely invalid, we can't do much
                    linkPreview = null;
                }
            }
        }

        if (user.schema === 'employer') {
            const { data: post, error } = await supabaseAdmin
                .schema('employer')
                .from('posts')
                .insert({
                    company_id: user.id,
                    content: content.trim(),
                    media_urls: mediaUrls || [],
                    link_preview: linkPreview
                })
                .select()
                .single();

            if (error) {
                if (error.code === '42P01') { // Undefined Table
                    return NextResponse.json({ error: 'Employer posting is not yet enabled (Migration pending).' }, { status: 503 });
                }
                throw error;
            }

            return NextResponse.json({ post, message: 'Post created successfully' });
        } else {
            // Professional Posting (Existing)
            const { data: post, error } = await supabaseAdmin
                .schema('professional')
                .from('posts')
                .insert({
                    user_id: user.id,
                    content: content.trim(),
                    media_urls: mediaUrls || [],
                    link_preview: linkPreview
                })
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ post, message: 'Post created successfully' });
        }
    } catch (error: any) {
        console.error('Error creating post:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function formatTimestamp(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
