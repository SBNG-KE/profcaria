import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;

        // 1. Fetch Follower Count
        const { count: followersCount } = await supabaseAdmin
            .schema('professional')
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId);

        // 2. Fetch User's Posts to aggregate interactions
        const { data: posts } = await supabaseAdmin
            .schema('professional')
            .from('posts')
            .select('id')
            .eq('user_id', userId);

        const postIds = (posts || []).map((p: any) => p.id);

        let likesCount = 0;
        let commentsCount = 0;
        let repostsCount = 0;

        if (postIds.length > 0) {
            // Aggregate Likes
            const { count: likes } = await supabaseAdmin
                .schema('professional')
                .from('post_likes')
                .select('*', { count: 'exact', head: true })
                .in('post_id', postIds);
            likesCount = likes || 0;

            // Aggregate Comments
            const { count: comments } = await supabaseAdmin
                .schema('professional')
                .from('post_comments')
                .select('*', { count: 'exact', head: true })
                .in('post_id', postIds);
            commentsCount = comments || 0;

            // Aggregate Reposts (of my posts)
            // Note: Reposts of my posts are in `professional.post_reposts` (if reposted by pro)
            // OR `employer.post_reposts` (if reposted by employer)
            // AND the table column is `original_post_id` (employer) or `post_id` (professional) or `original_post_id` (professional)?
            // Let's check `professional.post_reposts` schema earlier...
            // It has `original_post_id`. API used it.

            // Reposts by Professionals
            const { count: profReposts } = await supabaseAdmin
                .schema('professional')
                .from('post_reposts')
                .select('*', { count: 'exact', head: true })
                .in('original_post_id', postIds); // Assuming original_post_id is the FK to my post

            // Reposts by Employers
            const { count: empReposts } = await supabaseAdmin
                .schema('employer')
                .from('post_reposts')
                .select('*', { count: 'exact', head: true })
                .in('original_post_id', postIds);

            repostsCount = (profReposts || 0) + (empReposts || 0);
        }

        // 3. Profile Views (Placeholder / 0)
        // Since we don't track this yet, we return 0.
        // If we want to simulate "Dwell > 3s", we also return 0.

        return NextResponse.json({
            followers: followersCount || 0,
            likes: likesCount,
            comments: commentsCount,
            reposts: repostsCount,
            views: 0,
            dwell: 0
        });

    } catch (error: any) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
