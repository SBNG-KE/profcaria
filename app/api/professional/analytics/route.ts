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

        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '7d';

        const now = new Date();
        const startDate = new Date();

        switch (range) {
            case '24h': startDate.setHours(now.getHours() - 24); break;
            case '7d': startDate.setDate(now.getDate() - 7); break;
            case '1m': startDate.setMonth(now.getMonth() - 1); break;
            case '3m': startDate.setMonth(now.getMonth() - 3); break;
            case '6m': startDate.setMonth(now.getMonth() - 6); break;
            case '12m': startDate.setFullYear(now.getFullYear() - 1); break;
            default: startDate.setDate(now.getDate() - 7);
        }

        let likesCount = 0;
        let commentsCount = 0;
        let repostsCount = 0;

        if (postIds.length > 0) {
            // Aggregate Likes (All-time)
            const { count: likes } = await supabaseAdmin
                .schema('professional')
                .from('post_likes')
                .select('*', { count: 'exact', head: true })
                .in('post_id', postIds);
            likesCount = likes || 0;

            // Aggregate Comments (All-time)
            const { count: comments } = await supabaseAdmin
                .schema('professional')
                .from('post_comments')
                .select('*', { count: 'exact', head: true })
                .in('post_id', postIds);
            commentsCount = comments || 0;

            // Reposts by Professionals (All-time)
            const { count: profReposts } = await supabaseAdmin
                .schema('professional')
                .from('post_reposts')
                .select('*', { count: 'exact', head: true })
                .in('original_post_id', postIds);

            // Reposts by Employers (All-time)
            const { count: empReposts } = await supabaseAdmin
                .schema('employer')
                .from('post_reposts')
                .select('*', { count: 'exact', head: true })
                .in('original_post_id', postIds);

            repostsCount = (profReposts || 0) + (empReposts || 0);
        }

        // 3. Fetch Recent Followers based on range
        const { data: recentFollows } = await supabaseAdmin
            .schema('professional')
            .from('user_follows')
            .select('follower_id, created_at')
            .eq('following_id', userId)
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false })
            .limit(10);

        const recentFollowers = [];
        if (recentFollows && recentFollows.length > 0) {
            for (const f of recentFollows) {
                // Try professional user first
                const { data: u } = await supabaseAdmin
                    .schema('professional')
                    .from('users')
                    .select('id, enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url')
                    .eq('id', f.follower_id)
                    .maybeSingle();

                if (u) {
                    recentFollowers.push({
                        id: u.id,
                        name: `${u.enc_first_name ? decryptData(u.enc_first_name) : ''} ${u.enc_last_name ? decryptData(u.enc_last_name) : ''}`.trim() || 'Professional',
                        role: u.enc_current_role ? decryptData(u.enc_current_role) : 'Professional',
                        image: u.enc_profile_image_url ? decryptData(u.enc_profile_image_url) : null,
                        time: f.created_at,
                        type: 'user'
                    });
                } else {
                    // Try employer
                    const { data: c } = await supabaseAdmin
                        .schema('employer')
                        .from('companies')
                        .select('id, enc_company_name, enc_logo_url')
                        .eq('id', f.follower_id)
                        .maybeSingle();
                    
                    if (c) {
                        recentFollowers.push({
                            id: c.id,
                            name: c.enc_company_name ? decryptData(c.enc_company_name) : 'Company',
                            role: 'Company',
                            image: c.enc_logo_url ? decryptData(c.enc_logo_url) : null,
                            time: f.created_at,
                            type: 'company'
                        });
                    }
                }
            }
        }

        // 4. Profile Views (Placeholder / 0)
        // Since we don't track this yet, we return 0.
        // If we want to simulate "Dwell > 3s", we also return 0.

        return NextResponse.json({
            followers: followersCount || 0,
            likes: likesCount,
            comments: commentsCount,
            reposts: repostsCount,
            views: 0,
            recentFollowers
        });

    } catch (error: any) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
