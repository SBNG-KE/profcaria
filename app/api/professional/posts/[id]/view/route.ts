import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: postId } = await params;
        const body = await req.json().catch(() => ({}));
        const trackType = body.type || 'impression'; // 'impression' or 'dwell'

        // To avoid dropping updates we fetch the latest, add, and save.
        // For highly trafficked sites, an RPC (e.g., `increment_views`) is recommended.

        // Check professional posts
        let { data: post } = await supabaseAdmin
            .schema('professional')
            .from('posts')
            .select('views, dwell')
            .eq('id', postId)
            .single();

        let schema = 'professional';

        if (!post) {
            // Check employer
            const { data: empPost } = await supabaseAdmin
                .schema('employer')
                .from('posts')
                .select('views, dwell')
                .eq('id', postId)
                .single();
            if (empPost) {
                post = empPost;
                schema = 'employer';
            }
        }

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        const updates: any = {};
        if (trackType === 'dwell') {
            updates.dwell = (post.dwell || 0) + 1;
        } else {
            updates.views = (post.views || 0) + 1;
        }

        await supabaseAdmin
            .schema(schema as any)
            .from('posts')
            .update(updates)
            .eq('id', postId);

        return NextResponse.json({ success: true, ...updates });

    } catch (error) {
        console.error("Error updating view metrics:", error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
