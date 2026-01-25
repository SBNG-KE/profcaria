import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const tab = searchParams.get('tab') || 'posts'; // 'posts' or 'reposts'
        const userId = searchParams.get('userId') || user.id; // Defaults to current user

        let postsData: any[] = [];

        if (tab === 'reposts') {
            // Fetch Reposts
            const { data: reposts, error } = await supabaseAdmin
                .schema('professional')
                .from('post_reposts')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (reposts && reposts.length > 0) {
                // Resolve original posts
                const originalPostIds = reposts.map((r: any) => r.original_post_id);

                // Try fetching from Professional posts
                const { data: profPosts } = await supabaseAdmin
                    .schema('professional')
                    .from('posts')
                    .select('*')
                    .in('id', originalPostIds);

                // Try fetching from Employer posts
                const { data: empPosts } = await supabaseAdmin
                    .schema('employer')
                    .from('posts')
                    .select('*')
                    .in('id', originalPostIds);

                // Map back to reposts to preserve order and structure
                postsData = reposts.map((repost: any) => {
                    let original = profPosts?.find((p: any) => p.id === repost.original_post_id);
                    let authorType = 'professional';

                    if (!original) {
                        original = empPosts?.find((p: any) => p.id === repost.original_post_id);
                        authorType = 'employer';
                    }

                    if (!original) return null; // Post might be deleted

                    return {
                        ...original,
                        authorType,
                        repostContext: {
                            repostedAt: repost.created_at,
                            repostId: repost.id // We need this ID to delete the repost
                        }
                    };
                }).filter(Boolean);
            }

        } else {
            // Fetch Own Posts (Professional Schema only for now? Do pros have employer posts? No.)
            // But if userId is passed, we assume we are fetching that professional's posts.
            // If we ever wanted to fetch an employer's posts via this route, we'd need to know the schema.
            // For now assume Professional Profile -> Professional Schema.

            const { data: posts, error } = await supabaseAdmin
                .schema('professional')
                .from('posts')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            postsData = (posts || []).map((p: any) => ({ ...p, authorType: 'professional' }));
        }

        // Enrich with Stats & Author Info (Duplicated/Shared logic)
        const enrichedPosts = await Promise.all(postsData.map(async (post: any) => {
            // Like count
            const { count: likesCount } = await supabaseAdmin.schema('professional').from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
            // User like status
            const { data: userLike } = await supabaseAdmin.schema('professional').from('post_likes').select('id').eq('post_id', post.id).eq('user_id', user.id).single();
            // Comments count
            const { count: commentsCount } = await supabaseAdmin.schema('professional').from('post_comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id);
            // Reposts count
            const { count: repostsCount } = await supabaseAdmin.schema('professional').from('post_reposts').select('*', { count: 'exact', head: true }).eq('original_post_id', post.id);
            // User repost status
            const { data: userRepost } = await supabaseAdmin.schema('professional').from('post_reposts').select('id').eq('original_post_id', post.id).eq('user_id', user.id).single();

            // Author Info
            let authorData: any = {
                id: post.user_id,
                type: post.authorType,
                name: 'User',
                profileImage: '/default-avatar.png',
                role: '',
                followerCount: 0,
                isFollowing: false
            };

            if (post.authorType === 'employer') {
                // Fetch Employer
                const { data: comp } = await supabaseAdmin.schema('employer').from('companies').select('id, enc_company_name, enc_logo_url').eq('id', post.user_id || post.company_id).single(); // emp posts might use company_id
                if (comp) {
                    authorData.name = decryptData(comp.enc_company_name) || 'Company';
                    authorData.profileImage = decryptData(comp.enc_logo_url) || '/default-logo.png';
                    authorData.role = 'Company';
                    authorData.type = 'employer';
                }
            } else {
                // Fetch Professional
                const { data: profUser } = await supabaseAdmin.schema('professional').from('users').select('id, enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url').eq('id', post.user_id).single();
                if (profUser) {
                    authorData.name = `${decryptData(profUser.enc_first_name)} ${decryptData(profUser.enc_last_name)}`.trim();
                    authorData.profileImage = decryptData(profUser.enc_profile_image_url) || '/default-avatar.png';
                    authorData.role = decryptData(profUser.enc_current_role) || '';

                    const { count: fCount } = await supabaseAdmin.schema('professional').from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', post.user_id);
                    authorData.followerCount = fCount || 0;
                }
            }

            return {
                id: post.id,
                repostId: post.repostContext?.repostId, // IMPORTANT for deleting repost
                content: post.content,
                media: (post.media_urls || []).map((url: string) => ({
                    type: url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image',
                    url
                })),
                linkPreview: post.link_preview,
                timestamp: new Date(post.created_at).toLocaleDateString(),
                likesCount: likesCount || 0,
                commentsCount: commentsCount || 0,
                repostsCount: repostsCount || 0,
                isLiked: !!userLike,
                isReposted: !!userRepost,
                author: authorData
            };
        }));

        return NextResponse.json({ posts: enrichedPosts });

    } catch (error: any) {
        console.error('Error fetching profile posts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
