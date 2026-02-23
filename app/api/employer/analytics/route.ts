import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { decryptData } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        let auth;
        try {
            const { payload } = await jwtVerify(token, secret);
            auth = payload;
        } catch {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        if (auth.schema !== 'employer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const employerId = auth.uid;

        // 1. Fetch Subscriber Count (Followers)
        const { data: follows } = await supabaseAdmin
            .schema('professional')
            .from('company_follows')
            .select('user_id, created_at')
            .eq('company_id', employerId);

        const uniqueSubscribers = new Set((follows || []).map((f: any) => f.user_id));
        const subscribersCount = uniqueSubscribers.size;

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const newSubscribersThisWeek = Array.from(new Set(
            (follows || [])
                .filter((f: any) => new Date(f.created_at) > oneWeekAgo)
                .map((f: any) => f.user_id)
        )).length;

        // 2. Fetch Industry Activity (Posts from OTHER companies)
        // We'll fetch the last 3 posts from anyone NOT this company.
        // Also need company details.
        const { data: industryPosts } = await supabaseAdmin
            .schema('employer')
            .from('posts')
            .select(`
                id,
                created_at,
                enc_content,
                company_id,
                companies:company_id ( enc_company_name )
            `)
            .neq('company_id', employerId)
            .order('created_at', { ascending: false })
            .limit(3);

        const industryActivity = (industryPosts || []).map((p: any) => ({
            id: p.id,
            company: p.companies?.enc_company_name ? (decryptData(p.companies.enc_company_name) || 'Unknown') : 'Unknown',
            action: 'posted a new update',
            time: p.created_at // Frontend should format this
        }));

        // 3. Aggregate Interactions for THIS Company's posts
        const { data: posts } = await supabaseAdmin
            .schema('employer')
            .from('posts')
            .select('id')
            .eq('company_id', employerId);

        const postIds = (posts || []).map((p: any) => p.id);

        const { searchParams } = new URL(req.url);
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
                .schema('employer')
                .from('post_likes')
                .select('*', { count: 'exact', head: true })
                .in('post_id', postIds);
            likesCount = likes || 0;

            // Aggregate Comments (All-time)
            const { count: comments } = await supabaseAdmin
                .schema('employer')
                .from('post_comments')
                .select('*', { count: 'exact', head: true })
                .in('post_id', postIds);
            commentsCount = comments || 0;

            // Aggregate Reposts (All-time)
            const { count: profReposts } = await supabaseAdmin
                .schema('professional')
                .from('post_reposts')
                .select('*', { count: 'exact', head: true })
                .in('original_post_id', postIds);

            const { count: empReposts } = await supabaseAdmin
                .schema('employer')
                .from('post_reposts')
                .select('*', { count: 'exact', head: true })
                .in('original_post_id', postIds);

            repostsCount = (profReposts || 0) + (empReposts || 0);
        }

        // 4. Fetch Recent Subscribers
        const { data: recentSubs } = await supabaseAdmin
            .schema('professional')
            .from('company_follows')
            .select('user_id, created_at')
            .eq('company_id', employerId)
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: false })
            .limit(10);

        const recentSubscribers = [];
        if (recentSubs && recentSubs.length > 0) {
            for (const sub of recentSubs) {
                const { data: u } = await supabaseAdmin
                    .schema('professional')
                    .from('users')
                    .select('id, enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url')
                    .eq('id', sub.user_id)
                    .maybeSingle();

                if (u) {
                    recentSubscribers.push({
                        id: u.id,
                        name: `${u.enc_first_name ? decryptData(u.enc_first_name) : ''} ${u.enc_last_name ? decryptData(u.enc_last_name) : ''}`.trim() || 'Professional',
                        role: u.enc_current_role ? decryptData(u.enc_current_role) : 'Professional',
                        image: u.enc_profile_image_url ? decryptData(u.enc_profile_image_url) : null,
                        time: sub.created_at,
                        type: 'user'
                    });
                }
            }
        }

        // 5. Fetch Profile Views
        const { data: viewsData, count: viewsCount } = await supabaseAdmin
            .schema('professional')
            .from('profile_views')
            .select('created_at', { count: 'exact' })
            .eq('viewed_company_id', employerId)
            .gte('created_at', startDate.toISOString());

        const viewDates = viewsData?.map((v: any) => v.created_at) || [];

        return NextResponse.json({
            subscribers: subscribersCount || 0,
            likes: likesCount,
            comments: commentsCount,
            reposts: repostsCount,
            views: viewsCount || 0,
            viewDates,
            industryActivity,
            recentSubscribers
        });

    } catch (error: any) {
        console.error('Error fetching employer analytics:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
