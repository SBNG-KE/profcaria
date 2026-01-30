
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';

// --- CACHING HELPERS ---
const getCachedPostCounts = unstable_cache(
    async (postId: string, schema: string) => {
        // Like count
        const { count: likesCount } = await supabaseAdmin
            .schema(schema)
            .from('post_likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

        // Comments count
        const { count: commentsCount } = await supabaseAdmin
            .schema(schema)
            .from('post_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

        // Reposts count
        const repostFk = schema === 'professional' ? 'post_id' : 'original_post_id';
        const { count: repostsCount } = await supabaseAdmin
            .schema(schema)
            .from('post_reposts')
            .select('*', { count: 'exact', head: true })
            .eq(repostFk, postId);

        return {
            likesCount: likesCount || 0,
            commentsCount: commentsCount || 0,
            repostsCount: repostsCount || 0
        };
    },
    ['post-counts-v1'], // Cache Key
    { revalidate: 60, tags: ['post_stats'] } // Cache for 60 seconds
);

const getCachedAuthorProfile = unstable_cache(
    async (authorId: string, authorType: string) => {
        let authorData: any = {
            id: authorId,
            type: authorType,
            name: 'User',
            profileImage: '/default-avatar.png',
            role: '',
            followerCount: 0,
            badgeType: null
        };

        try {
            if (authorType === 'employer') {
                const { data: comp } = await supabaseAdmin
                    .schema('employer')
                    .from('companies')
                    .select('id, enc_company_name, enc_logo_url, badge_type')
                    .eq('id', authorId)
                    .single();

                if (comp) {
                    const companyName = decryptData(comp.enc_company_name);
                    const logoUrl = comp.enc_logo_url ? decryptData(comp.enc_logo_url) : null;

                    // Fetch follower count
                    const { count: followerCount } = await supabaseAdmin
                        .schema('professional')
                        .from('company_follows')
                        .select('*', { count: 'exact', head: true })
                        .eq('company_id', authorId);

                    authorData = {
                        ...authorData,
                        name: companyName || 'Company',
                        profileImage: logoUrl || '/default-logo.png',
                        role: 'Company',
                        badgeType: comp.badge_type,
                        followerCount: followerCount || 0
                    };
                }
            } else {
                const { data: profUser } = await supabaseAdmin
                    .schema('professional')
                    .from('users')
                    .select('id, enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url, badge_type')
                    .eq('id', authorId)
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
                        .eq('following_id', authorId);

                    authorData = {
                        ...authorData,
                        name: `${firstName} ${lastName}`.trim() || 'User',
                        profileImage: profileImage,
                        role: role,
                        badgeType: profUser.badge_type,
                        followerCount: followerCount || 0
                    };
                }
            }
        } catch (e) {
            console.error('Error in cached author profile:', e);
        }

        return authorData;
    },
    ['author-profile-v1'],
    { revalidate: 300, tags: ['author_profiles'] } // Cache for 5 minutes
);

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
            const { data: profReposts } = await supabaseAdmin
                .schema('professional')
                .from('post_reposts')
                .select('*')
                .eq('user_id', targetUserId)
                .order('created_at', { ascending: false });

            const { data: empReposts } = await supabaseAdmin
                .schema('employer')
                .from('post_reposts')
                .select('*')
                .eq('user_id', targetUserId)
                .order('created_at', { ascending: false });

            let reposts = [...(profReposts || []), ...(empReposts || [])];

            if (!reposts || reposts.length === 0) {
                return NextResponse.json({ posts: [] });
            }

            const postIds = reposts.map((r: any) => r.original_post_id || r.post_id);

            const profPostsPromise = supabaseAdmin.schema('professional').from('posts').select('*').in('id', postIds);
            const empPostsPromise = supabaseAdmin.schema('employer').from('posts').select('*').in('id', postIds).then((res: any) => ({ ...res, isEmployer: true })).catch(() => ({ data: [], error: null }));

            const [profRes, empRes] = await Promise.all([profPostsPromise, empPostsPromise]);

            let originals: any[] = [];
            if (profRes.data) originals = [...originals, ...profRes.data.map((p: any) => ({ ...p, authorType: 'professional' }))];
            if ((empRes as any).data) originals = [...originals, ...((empRes as any).data || []).map((p: any) => ({ ...p, authorType: 'employer', user_id: p.company_id }))];

            const orderedPosts = reposts.map((r: any) => {
                const original = originals.find(o => o.id === (r.original_post_id || r.post_id));
                if (!original) return null;
                return {
                    ...original,
                    repostId: r.id,
                    repostCreatedAt: r.created_at,
                    repostContext: {
                        repostedBy: targetUserId,
                        createdAt: r.created_at
                    }
                };
            }).filter(Boolean);

            const processed = await processPosts(orderedPosts, user);
            return NextResponse.json({ posts: processed });
        }


        // --- CASE 2: FETCH POSTS (Filtered or Feed) ---

        // If specific user targeted (Profile View)
        if (targetUserId) {
            let profQuery = supabaseAdmin
                .schema('professional')
                .from('posts')
                .select('*')
                .eq('user_id', targetUserId)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

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

            let allPosts: any[] = [];
            if (profRes.data) allPosts = [...allPosts, ...profRes.data.map((p: any) => ({ ...p, authorType: 'professional' }))];
            if ((empRes as any).data) allPosts = [...allPosts, ...((empRes as any).data || []).map((p: any) => ({ ...p, authorType: 'employer', user_id: p.company_id }))];

            allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            const processed = await processPosts(allPosts, user);
            return NextResponse.json({ posts: processed });
        }

        // --- CASE 3: HASHTAG FILTERING ---
        const hashtag = searchParams.get('hashtag');
        if (hashtag) {
            const tagPattern = `%#${hashtag}%`;

            let profQuery = supabaseAdmin
                .schema('professional')
                .from('posts')
                .select('*')
                .ilike('content', tagPattern)
                .order('created_at', { ascending: false })
                .limit(limit);

            let empQuery = supabaseAdmin
                .schema('employer')
                .from('posts')
                .select('*')
                .ilike('content', tagPattern)
                .order('created_at', { ascending: false })
                .limit(limit)
                .then((res: any) => ({ ...res, isEmployer: true }))
                .catch(() => ({ data: [], error: null }));

            const [profRes, empRes] = await Promise.all([profQuery, empQuery]);

            let allPosts: any[] = [];
            if (profRes.data) allPosts = [...allPosts, ...profRes.data.map((p: any) => ({ ...p, authorType: 'professional' }))];
            if ((empRes as any).data) allPosts = [...allPosts, ...((empRes as any).data || []).map((p: any) => ({ ...p, authorType: 'employer', user_id: p.company_id }))];

            allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            allPosts = allPosts.slice(0, limit);

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
            // Fallback to simple query (Combine Prof + Emp)
            let profQuery = supabaseAdmin
                .schema('professional')
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            let empQuery = supabaseAdmin
                .schema('employer')
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit)
                .then((res: any) => ({ ...res, isEmployer: true }))
                .catch(() => ({ data: [], error: null }));

            const [profRes, empRes] = await Promise.all([profQuery, empQuery]);

            let allFallback: any[] = [];
            if (profRes.data) allFallback = [...allFallback, ...profRes.data.map((p: any) => ({ ...p, authorType: 'professional' }))];
            if ((empRes as any).data) allFallback = [...allFallback, ...((empRes as any).data || []).map((p: any) => ({ ...p, authorType: 'employer', user_id: p.company_id }))];

            // Sort combined
            allFallback.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            allFallback = allFallback.slice(0, limit);

            const processed = await processPosts(allFallback, user);
            return NextResponse.json({ posts: processed });
        }

        const postsWithStats = await processPosts(rankedPosts || [], user);
        return NextResponse.json({ posts: postsWithStats });

    } catch (error: any) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Optimized Helper: Process stats with caching
async function processPosts(posts: any[], user: any) {
    return Promise.all(posts.map(async (post: any) => {
        // Normalization
        const authorType = post.authorType || post.author_type || 'professional';
        const postAuthorId = authorType === 'employer' ? (post.company_id || post.user_id) : post.user_id;
        const postSchema = authorType === 'employer' ? 'employer' : 'professional';

        // 1. Get Cached Public Stats (Counts)
        const counts = await getCachedPostCounts(post.id, postSchema);

        // 2. Get Cached Author Profile
        let authorData = await getCachedAuthorProfile(postAuthorId, authorType);

        // 3. Get User-Specific State (Real-time, Uncached)

        // Is Liked?
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

        // Is Reposted?
        const repostFk = postSchema === 'professional' ? 'post_id' : 'original_post_id';
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
        const { data: userReposts } = await repostQuery.limit(1);
        const isReposted = !!(userReposts && userReposts.length > 0);

        // Is Following Author?
        let isFollowing = false;
        if (authorData.id !== user.id) {
            if (authorType === 'employer') {
                const { data } = await supabaseAdmin
                    .schema('professional')
                    .from('company_follows')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('company_id', authorData.id)
                    .single();
                isFollowing = !!data;
            } else {
                const { data } = await supabaseAdmin
                    .schema('professional')
                    .from('user_follows')
                    .select('id')
                    .eq('follower_id', user.id)
                    .eq('following_id', authorData.id)
                    .single();
                isFollowing = !!data;
            }
        }

        // Is Saved?
        const { data: savedPost } = await supabaseAdmin
            .schema('public')
            .from('saved_posts')
            .select('id')
            .eq('user_id', user.id)
            .eq(postSchema === 'professional' ? 'professional_post_id' : 'employer_post_id', post.id)
            .single();


        // Enrich Author Data with dynamic 'isFollowing'
        authorData = { ...authorData, isFollowing };

        // Construct Repost Context if applicable
        // Construct Repost Context if applicable
        let repostContext = post.repostContext || null;
        if (post.is_repost && post.reposted_by) {
            let reposterProfile = await getCachedAuthorProfile(post.reposted_by, 'professional');
            if (reposterProfile.name === 'User') {
                const empProfile = await getCachedAuthorProfile(post.reposted_by, 'employer');
                if (empProfile.name !== 'Company') {
                    reposterProfile = empProfile;
                }
            }

            repostContext = {
                repostedBy: post.reposted_by,
                reposterName: reposterProfile.name,
                createdAt: post.created_at // Repost time
            };
        }

        return {
            id: post.id,
            repostId: post.repost_id || post.repostId,
            content: post.content,
            media: (post.media_urls || []).map((url: string) => ({
                type: url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image',
                url
            })),
            linkPreview: post.link_preview,
            timestamp: formatTimestamp(post.created_at), // This is already the repost time because of the SQL Union
            likesCount: counts.likesCount,
            commentsCount: counts.commentsCount,
            repostsCount: counts.repostsCount,
            isLiked: !!userLike,
            isSaved: !!savedPost,
            isReposted: isReposted,
            repostContext: repostContext,
            isOwnPost: authorData.id === user.id,
            currentUserType: user.schema, // Pass current user type to frontend
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

        const wordCount = content.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
        if (wordCount > 500) {
            return NextResponse.json({ error: 'Post exceeds 500 word limit' }, { status: 400 });
        }

        let linkPreview = null;
        if (linkMedia) {
            try {
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
                if (error.code === '42P01') {
                    return NextResponse.json({ error: 'Employer posting is not yet enabled (Migration pending).' }, { status: 503 });
                }
                throw error;
            }

            return NextResponse.json({ post, message: 'Post created successfully' });
        } else {
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
