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
        // Replicating the logic from follow/route.ts to avoid discrepancy
        const { data: userFollowers } = await supabaseAdmin
            .schema('professional')
            .from('user_follows')
            .select('follower_id')
            .eq('following_id', userId);

        let allFollowerIds = (userFollowers || []).map((f: any) => f.follower_id);

        // Exclude self if present incorrectly
        allFollowerIds = allFollowerIds.filter((id: string) => id !== userId);

        // Remove duplicates just in case
        allFollowerIds = Array.from(new Set(allFollowerIds));

        // Company merging logic (Employer as Professional or Founder)
        let associatedCompanyId: string | null = null;
        if (userId === '60f0f916-7b32-483f-afd6-681424a360bf') {
            associatedCompanyId = '40e5c47c-4437-4a55-8c3d-4a4cec5a288b';
        } else {
            try {
                const { data: link } = await supabaseAdmin
                    .schema('employer')
                    .from('company_users')
                    .select('company_id')
                    .eq('user_id', userId)
                    .maybeSingle();

                if (link) {
                    associatedCompanyId = link.company_id;
                }
            } catch (e) { }
        }

        if (associatedCompanyId) {
            const { data: compFollowers } = await supabaseAdmin
                .schema('professional')
                .from('company_follows')
                .select('user_id')
                .eq('company_id', associatedCompanyId);

            if (compFollowers) {
                const compFollowerIds = compFollowers.map((f: any) => f.user_id);
                for (const id of compFollowerIds) {
                    if (!allFollowerIds.includes(id) && id !== userId) {
                        allFollowerIds.push(id);
                    }
                }
            }
        }

        const followersCount = allFollowerIds.length;

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

        // 4. Fetch Profile Views
        const { data: viewsData, count: viewsCount } = await supabaseAdmin
            .schema('professional')
            .from('profile_views')
            .select('created_at', { count: 'exact' })
            .eq('viewed_professional_id', userId)
            .gte('created_at', startDate.toISOString());

        const viewDates = viewsData?.map((v: any) => v.created_at) || [];

        return NextResponse.json({
            followers: followersCount || 0,
            likes: likesCount,
            comments: commentsCount,
            reposts: repostsCount,
            views: viewsCount || 0,
            viewDates,
            recentFollowers
        });

    } catch (error: any) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
