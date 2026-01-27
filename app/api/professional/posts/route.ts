import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';

// ... imports

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

        const targetUserId = searchParams.get('userId');
        const type = searchParams.get('type') || 'posts'; // 'posts' | 'reposts'

        // --- CASE 1: FETCH REPOSTS for a specific user ---
        if (targetUserId && type === 'reposts') {
            // we need to know if target is user or company to query correct schema?
            // Actually post_reposts exists in both schemas.
            // We'll try fetching from both or guess based on target?
            // Let's assume we query based on the authenticated user's ability to see? 
            // No, we need to know where the reposts are stored. 
            // Usually: professional users -> professional.post_reposts. Employers -> employer.post_reposts.
            // We can check both or just Query 1 if we knew the target type. 
            // Since we don't have targetType, we'll try both `professional` and `employer` schemas for the reposts table
            // WHERE user_id/company_id = targetUserId.

            // 1. Fetch Reposts from Professional Schema (reposts of professional posts)
            const { data: profReposts } = await supabaseAdmin
                .schema('professional')
                .from('post_reposts')
                .select('*')
                .eq('user_id', targetUserId)
                .order('created_at', { ascending: false });

            // 2. Fetch Reposts from Employer Schema (reposts of employer posts)
            const { data: empReposts } = await supabaseAdmin
                .schema('employer')
                .from('post_reposts')
                .select('*')
                .eq('user_id', targetUserId)
                .order('created_at', { ascending: false });

            console.log(`[DEBUG_PROF_REPOSTS] TargetUser=${targetUserId}`);
            console.log(`[DEBUG_PROF_REPOSTS] ProfReposts=${profReposts?.length}`);
            console.log(`[DEBUG_PROF_REPOSTS] EmpReposts=${empReposts?.length}`);

            let reposts = [...(profReposts || []), ...(empReposts || [])];

            if (!reposts || reposts.length === 0) {
                return NextResponse.json({ posts: [] });
            }

            // Extract IDs
            const postIds = reposts.map((r: any) => r.original_post_id || r.post_id);

            // Fetch Original Posts from both schemas
            const profPostsPromise = supabaseAdmin.schema('professional').from('posts').select('*').in('id', postIds);
            const empPostsPromise = supabaseAdmin.schema('employer').from('posts').select('*').in('id', postIds).then((res: any) => ({ ...res, isEmployer: true })).catch(() => ({ data: [], error: null }));

            const [profRes, empRes] = await Promise.all([profPostsPromise, empPostsPromise]);

            let originals: any[] = [];
            if (profRes.data) originals = [...originals, ...profRes.data.map((p: any) => ({ ...p, authorType: 'professional' }))];
            if ((empRes as any).data) originals = [...originals, ...((empRes as any).data || []).map((p: any) => ({ ...p, authorType: 'employer', user_id: p.company_id }))];

            // Re-order based on repost time
            const orderedPosts = reposts.map((r: any) => {
                const original = originals.find(o => o.id === (r.original_post_id || r.post_id));
                if (!original) return null;
                return {
                    ...original,
                    repostId: r.id,
                    repostCreatedAt: r.created_at, // Use repost time for sorting/display
                    repostContext: {
                        repostedBy: targetUserId, // We could fetch name, but frontend knows whose profile it is
                        createdAt: r.created_at
                    }
                };
            }).filter(Boolean);

            // Process Stats (Reuse existing logic)
            // Function extraction would be better but inline for now to save complexity
            const processed = await processPosts(orderedPosts, user);
            return NextResponse.json({ posts: processed });
        }


        // --- CASE 2: FETCH POSTS (Filtered or Feed) ---

        // If specific user targeted (Profile View), stick to simple query
        if (targetUserId) {
            // Fetch professional posts
            let profQuery = supabaseAdmin
                .schema('professional')
                .from('posts')
                .select('*')
                .eq('user_id', targetUserId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            // Fetch employer posts
            let empQuery = supabaseAdmin
                .schema('employer')
                .from('posts')
                .select('*')
                .eq('company_id', targetUserId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1)
                .then((res: any) => ({ ...res, isEmployer: true }))
                .catch(() => ({ data: [], error: null }));

            const [profRes, empRes] = await Promise.all([profQuery, empQuery]);

            // Merge and Sort
            let allPosts: any[] = [];
            if (profRes.data) allPosts = [...allPosts, ...profRes.data.map((p: any) => ({ ...p, authorType: 'professional' }))];
            if ((empRes as any).data) allPosts = [...allPosts, ...((empRes as any).data || []).map((p: any) => ({ ...p, authorType: 'employer', user_id: p.company_id }))];

            allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            const processed = await processPosts(allPosts, user);
            return NextResponse.json({ posts: processed });
        }

        // MAIN FEED: Use AI Ranking RPC
        const { data: rankedPosts, error: rpcError } = await supabaseAdmin.rpc('get_ranked_feed', {
            p_user_id: user.id,
            p_limit: limit,
            p_offset: offset
        });

        if (rpcError) {
            console.error('Feed RPC Error:', rpcError);
            // Fallback to simple query if RPC fails (or migration not applied yet)
            let profQuery = supabaseAdmin
                .schema('professional')
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            const { data: fallback } = await profQuery;

            const processed = await processPosts(fallback || [], user);
            return NextResponse.json({ posts: processed });
        }

        const postsWithStats = await processPosts(rankedPosts || [], user);
        return NextResponse.json({ posts: postsWithStats });

    } catch (error: any) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Helper: Process stats
async function processPosts(posts: any[], user: any) {
    return Promise.all(posts.map(async (post: any) => {
        // Normalization: RPC returns snake_case, manual queries return mapped camelCase
        const authorType = post.authorType || post.author_type || 'professional';
        const postAuthorId = authorType === 'employer' ? (post.company_id || post.user_id) : post.user_id;

        const postSchema = authorType === 'employer' ? 'employer' : 'professional';

        // Like count
        const { count: likesCount } = await supabaseAdmin
            .schema(postSchema)
            .from('post_likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

        // User Like Status
        let likeQuery = supabaseAdmin
            .schema(postSchema)
            .from('post_likes')
            .select('id')
            .eq('post_id', post.id);

        if (user.schema === 'employer') {
            likeQuery = likeQuery.eq('company_id', user.id);
        } else {
            likeQuery = likeQuery.eq('user_id', user.id);
        }
        const { data: userLike } = await likeQuery.single();

        // Comments count
        const { count: commentsCount } = await supabaseAdmin
            .schema(postSchema)
            .from('post_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

        // Reposts count
        const repostFk = postSchema === 'professional' ? 'post_id' : 'original_post_id';

        const { count: repostsCount } = await supabaseAdmin
            .schema(postSchema)
            .from('post_reposts')
            .select('*', { count: 'exact', head: true })
            .eq(repostFk, post.id);

        let repostQuery = supabaseAdmin
            .schema(postSchema)
            .from('post_reposts')
            .select('id')
            .eq(repostFk, post.id);

        if (user.schema === 'employer') {
            repostQuery = repostQuery.eq('company_id', user.id);
        } else {
            repostQuery = repostQuery.eq('user_id', user.id);
        }

        let userRepost = null;
        try {
            const { data } = await repostQuery.limit(1);
            if (data && data.length > 0) userRepost = data[0];
        } catch (ignore) { }

        // Get author info
        let authorData: any = {
            id: postAuthorId,
            type: authorType,
            // Default placeholders
            name: 'User',
            profileImage: '/default-avatar.png',
            role: '',
            followerCount: 0,
            isFollowing: false,
            badgeType: null
        };

        if (authorType === 'employer' && postAuthorId) {
            try {
                const { data: comp } = await supabaseAdmin
                    .schema('employer')
                    .from('companies')
                    .select('id, enc_company_name, enc_logo_url, badge_type')
                    .eq('id', postAuthorId)
                    .single();

                if (comp) {
                    const companyName = decryptData(comp.enc_company_name);
                    const logoUrl = comp.enc_logo_url ? decryptData(comp.enc_logo_url) : null;

                    authorData = {
                        ...authorData,
                        name: companyName || 'Company',
                        profileImage: logoUrl || '/default-logo.png',
                        role: 'Company',
                        type: 'employer',
                        badgeType: comp.badge_type
                    };

                    const { count: followerCount } = await supabaseAdmin
                        .schema('professional')
                        .from('company_follows')
                        .select('*', { count: 'exact', head: true })
                        .eq('company_id', postAuthorId);

                    authorData.followerCount = followerCount || 0;

                    const { data: isFollowing } = await supabaseAdmin
                        .schema('professional')
                        .from('company_follows')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('company_id', postAuthorId)
                        .single();

                    authorData.isFollowing = !!isFollowing;
                }
            } catch (e) { console.error('Error fetching company details:', e); }
        } else if (postAuthorId) {
            const { data: profUser } = await supabaseAdmin
                .schema('professional')
                .from('users')
                .select('id, enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url, badge_type')
                .eq('id', postAuthorId)
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
                    .eq('following_id', postAuthorId);

                const { data: following } = await supabaseAdmin
                    .schema('professional')
                    .from('user_follows')
                    .select('id')
                    .eq('follower_id', user.id)
                    .eq('following_id', postAuthorId)
                    .single();

                authorData = {
                    ...authorData,
                    name: `${firstName} ${lastName}`.trim() || 'User',
                    profileImage: profileImage,
                    role: role,
                    followerCount: followerCount || 0,
                    isFollowing: !!following || postAuthorId === user.id,
                    badgeType: profUser.badge_type
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
            timestamp: formatTimestamp(post.repostCreatedAt || post.created_at), // Use repost time if available
            likesCount: likesCount || 0,
            commentsCount: commentsCount || 0,
            repostsCount: repostsCount || 0,
            isLiked: !!userLike,
            isReposted: !!userRepost,
            repostContext: post.repostContext || null,
            author: authorData
        };
    }));
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
                .select('id, content, created_at, user_id, media_urls, link_preview')
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
