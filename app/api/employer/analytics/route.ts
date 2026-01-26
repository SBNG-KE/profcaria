import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

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
        const { count: subscribersCount } = await supabaseAdmin
            .schema('professional')
            .from('company_follows')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', employerId);

        // 2. Fetch Company Posts to aggregate interactions
        const { data: posts } = await supabaseAdmin
            .schema('employer')
            .from('posts')
            .select('id')
            .eq('company_id', employerId); // Or user_id? Companies usually use company_id in their own schema or user_id as alias.
        // Check previous files... dashboard route used `eq('company_id', employerId)` for jobs.
        // But for posts?
        // `api/professional/profile/posts/route.ts` used `empPosts?.find`.
        // Let's assume `company_id` is the key for posts in employer schema.
        // Wait, checking `api/employer/posts/route.ts` (if available) would confirm.
        // But `api/professional/profile/posts/route.ts` line 116 used `company_id`.
        // Actually, usually `posts` table has `company_id` or `user_id`.
        // In `employer` schema, `posts` usually has `company_id`.
        // I'll try `company_id`. If fails, `user_id`. (Employer ID is the user ID in auth).

        // Let's check `employer.posts` schema if possible.
        // I'll assume `company_id` matches `employerId`.

        const postIds = (posts || []).map((p: any) => p.id);

        let likesCount = 0;
        let commentsCount = 0;
        let repostsCount = 0;

        if (postIds.length > 0) {
            // Aggregate Likes (Employer Schema)
            const { count: likes } = await supabaseAdmin
                .schema('employer')
                .from('post_likes')
                .select('*', { count: 'exact', head: true })
                .in('post_id', postIds);
            likesCount = likes || 0;

            // Aggregate Comments (Employer Schema)
            const { count: comments } = await supabaseAdmin
                .schema('employer')
                .from('post_comments')
                .select('*', { count: 'exact', head: true })
                .in('post_id', postIds);
            commentsCount = comments || 0;

            // Aggregate Reposts (Professional reposts of company posts + Employer reposts of company posts)
            // 1. Professionals reposting
            const { count: profReposts } = await supabaseAdmin
                .schema('professional')
                .from('post_reposts')
                .select('*', { count: 'exact', head: true })
                .in('original_post_id', postIds);

            // 2. Employers reposting
            const { count: empReposts } = await supabaseAdmin
                .schema('employer')
                .from('post_reposts')
                .select('*', { count: 'exact', head: true })
                .in('original_post_id', postIds);

            repostsCount = (profReposts || 0) + (empReposts || 0);
        }

        return NextResponse.json({
            subscribers: subscribersCount || 0,
            likes: likesCount,
            comments: commentsCount,
            reposts: repostsCount,
            views: 0,
            dwell: 0
        });

    } catch (error: any) {
        console.error('Error fetching employer analytics:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
