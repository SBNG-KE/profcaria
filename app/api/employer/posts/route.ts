import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';

// GET - Fetch employer posts
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyIdParam = searchParams.get('companyId');
        const type = searchParams.get('type') || 'posts'; // 'posts' | 'reposts'
        const currentUser = await getAuthenticatedUser();

        // Determine target company ID
        let targetCompanyId = companyIdParam;
        if (!targetCompanyId) {
            const user = await getAuthenticatedUser();
            if (user && user.schema === 'employer') {
                targetCompanyId = user.id;
            } else {
                return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
            }
        }

        let postsData: any[] = [];
        let isRepostFlow = false;

        if (type === 'reposts') {
            isRepostFlow = true;
            console.log(`[DEBUG_REPOSTS] TargetCompany=${targetCompanyId}`);

            // 1. Fetch Reposts from Employer Schema (reposts of employer posts)
            const { data: empReposts } = await supabaseAdmin
                .schema('employer')
                .from('post_reposts')
                .select('*')
                .eq('company_id', targetCompanyId)
                .order('created_at', { ascending: false });
            console.log(`[DEBUG_REPOSTS] EmpReposts: ${empReposts?.length}`);

            // 2. Fetch Reposts from Professional Schema (reposts of professional posts)
            const { data: profReposts } = await supabaseAdmin
                .schema('professional')
                .from('post_reposts')
                .select('*')
                .eq('company_id', targetCompanyId) // Use company_id to find employer's reposts here
                .order('created_at', { ascending: false });
            console.log(`[DEBUG_REPOSTS] ProfReposts: ${profReposts?.length}`);

            const allReposts = [...(empReposts || []), ...(profReposts || [])];

            if (allReposts.length === 0) return NextResponse.json({ posts: [] });

            // Sort merged reposts by time
            allReposts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            // Extract IDs
            const empPostIds = (empReposts || []).map((r: any) => r.original_post_id);
            const profPostIds = (profReposts || []).map((r: any) => r.post_id); // Professional schema uses post_id

            // Fetch Original Posts
            const profPostsPromise = profPostIds.length > 0
                ? supabaseAdmin.schema('professional').from('posts').select('*').in('id', profPostIds)
                : Promise.resolve({ data: [] });

            const empPostsPromise = empPostIds.length > 0
                ? supabaseAdmin.schema('employer').from('posts').select('*').in('id', empPostIds).then((res: any) => ({ ...res, isEmployer: true }))
                : Promise.resolve({ data: [] });

            const [profRes, empRes] = await Promise.all([profPostsPromise, empPostsPromise]);

            let originals: any[] = [];
            if (profRes.data) originals = [...originals, ...profRes.data.map((p: any) => ({ ...p, authorType: 'professional' }))];
            if ((empRes as any).data) originals = [...originals, ...((empRes as any).data || []).map((p: any) => ({ ...p, authorType: 'employer', user_id: p.company_id }))];

            // Map back to Repost objects
            postsData = allReposts.map((r: any) => {
                // Check both ID fields as sources differ
                const targetId = r.original_post_id || r.post_id;
                const original = originals.find(o => o.id === targetId);

                if (!original) return null;
                return {
                    ...original,
                    repostCreatedAt: r.created_at,
                    repostContext: {
                        repostedBy: targetCompanyId,
                        createdAt: r.created_at
                    }
                };
            }).filter(Boolean);

        } else {
            // Normal Posts
            const { data: posts, error } = await supabaseAdmin
                .schema('employer')
                .from('posts')
                .select('*')
                .eq('company_id', targetCompanyId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            postsData = (posts || []).map((p: any) => ({ ...p, authorType: 'employer', user_id: p.company_id }));
        }

        const formattedPosts = await Promise.all(postsData.map(async (post: any) => {
            const postSchema = post.authorType === 'employer' ? 'employer' : 'professional';
            const repostFk = postSchema === 'professional' ? 'post_id' : 'original_post_id';

            // Like count
            const { count: likesCount } = await supabaseAdmin
                .schema(postSchema)
                .from('post_likes')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

            // Comments count
            const { count: commentsCount } = await supabaseAdmin
                .schema(postSchema)
                .from('post_comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

            // Reposts count
            const { count: repostsCount } = await supabaseAdmin
                .schema(postSchema)
                .from('post_reposts')
                .select('*', { count: 'exact', head: true })
                .eq(repostFk, post.id);

            // Check User Interaction Status
            let isLiked = false;
            let isReposted = false;

            if (currentUser) {
                // Like Status
                let likeQuery = supabaseAdmin.schema(postSchema).from('post_likes').select('id').eq('post_id', post.id);
                if (currentUser.schema === 'employer') {
                    likeQuery = likeQuery.eq('company_id', currentUser.id);
                } else {
                    likeQuery = likeQuery.eq('user_id', currentUser.id);
                }
                const { data: userLike } = await likeQuery.single();
                isLiked = !!userLike;

                // Repost Status
                let repostQuery = supabaseAdmin.schema(postSchema).from('post_reposts').select('id').eq(repostFk, post.id);
                if (currentUser.schema === 'employer') {
                    repostQuery = repostQuery.eq('company_id', currentUser.id);
                } else {
                    repostQuery = repostQuery.eq('user_id', currentUser.id);
                }

                const { data: userReposts } = await repostQuery.limit(1);
                isReposted = !!(userReposts && userReposts.length > 0);
            }

            // Fetch Author
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
                try {
                    const { data: comp } = await supabaseAdmin
                        .schema('employer')
                        .from('companies')
                        .select('id, enc_company_name, enc_logo_url')
                        .eq('id', post.user_id)
                        .single();

                    if (comp) {
                        authorData = {
                            ...authorData,
                            name: decryptData(comp.enc_company_name) || 'Company',
                            profileImage: comp.enc_logo_url ? decryptData(comp.enc_logo_url) : '/default-logo.png',
                            role: 'Company',
                            type: 'employer'
                        };
                        const { count: followerCount } = await supabaseAdmin
                            .schema('professional')
                            .from('company_follows')
                            .select('*', { count: 'exact', head: true })
                            .eq('company_id', post.user_id);
                        authorData.followerCount = followerCount || 0;
                    }
                } catch (e) { console.error(e); }
            } else {
                const { data: profUser } = await supabaseAdmin
                    .schema('professional')
                    .from('users')
                    .select('id, enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url')
                    .eq('id', post.user_id)
                    .single();

                if (profUser) {
                    authorData = {
                        ...authorData,
                        name: `${decryptData(profUser.enc_first_name)} ${decryptData(profUser.enc_last_name)}`.trim(),
                        profileImage: profUser.enc_profile_image_url ? decryptData(profUser.enc_profile_image_url) : '/default-avatar.png',
                        role: decryptData(profUser.enc_current_role) || '',
                    };
                    const { count: followerCount } = await supabaseAdmin
                        .schema('professional')
                        .from('user_follows')
                        .select('*', { count: 'exact', head: true })
                        .eq('following_id', post.user_id);
                    authorData.followerCount = followerCount || 0;
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
                timestamp: formatTimestamp(post.repostCreatedAt || post.created_at),
                likesCount: likesCount || 0,
                commentsCount: commentsCount || 0,
                repostsCount: repostsCount || 0,
                isLiked: isLiked,
                isReposted: isReposted,
                repostContext: post.repostContext || null,
                author: authorData
            };
        }));

        return NextResponse.json({ posts: formattedPosts });

    } catch (error: any) {
        console.error('Error fetching employer posts:', error);
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
