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
        const { count: subscribersCount, data: follows } = await supabaseAdmin
            .schema('professional')
            .from('company_follows')
            .select('created_at')
            .eq('company_id', employerId);

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const newSubscribersThisWeek = (follows || []).filter((f: any) => new Date(f.created_at) > oneWeekAgo).length;

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
            // Aggregate Likes
            const { count: likes } = await supabaseAdmin
                .schema('employer')
                .from('post_likes')
                .select('*', { count: 'exact', head: true })
                .in('post_id', postIds)
                .gte('created_at', startDate.toISOString());
            likesCount = likes || 0;

            // Aggregate Comments
            const { count: comments } = await supabaseAdmin
                .schema('employer')
                .from('post_comments')
                .select('*', { count: 'exact', head: true })
                .in('post_id', postIds)
                .gte('created_at', startDate.toISOString());
            commentsCount = comments || 0;

            // Aggregate Reposts
            const { count: profReposts } = await supabaseAdmin
                .schema('professional')
                .from('post_reposts')
                .select('*', { count: 'exact', head: true })
                .in('original_post_id', postIds)
                .gte('created_at', startDate.toISOString());

            const { count: empReposts } = await supabaseAdmin
                .schema('employer')
                .from('post_reposts')
                .select('*', { count: 'exact', head: true })
                .in('original_post_id', postIds)
                .gte('created_at', startDate.toISOString());

            repostsCount = (profReposts || 0) + (empReposts || 0);
        }

        return NextResponse.json({
            subscribers: subscribersCount || 0,
            likes: likesCount,
            comments: commentsCount,
            reposts: repostsCount,
            views: 0,
            dwell: 0,
            industryActivity
        });

    } catch (error: any) {
        console.error('Error fetching employer analytics:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
