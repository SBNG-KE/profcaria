
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: postId } = await params;
        const body = await request.json();
        const { type } = body; // 'professional' or 'employer'

        if (!type || !['professional', 'employer'].includes(type) || !postId) {
            return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
        }

        const postColumn = type === 'professional' ? 'professional_post_id' : 'employer_post_id';

        // Check if already saved
        const { data: existing } = await supabaseAdmin
            .from('saved_posts')
            .select('id')
            .eq('user_id', user.id)
            .eq(postColumn, postId)
            .single();

        if (existing) {
            // Unsave
            await supabaseAdmin
                .from('saved_posts')
                .delete()
                .eq('id', existing.id);

            return NextResponse.json({ saved: false });
        } else {
            // Save
            const { error } = await supabaseAdmin
                .from('saved_posts')
                .insert({
                    user_id: user.id,
                    [postColumn]: postId
                });

            if (error) throw error;
            return NextResponse.json({ saved: true });
        }

    } catch (error: any) {
        console.error('Error toggling save post:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // Check if a specific post is saved by current user
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ saved: false }); // Or 401, but UI might prefer just false
        }

        const { id: postId } = await params;
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        if (!type || !['professional', 'employer'].includes(type)) {
            return NextResponse.json({ error: 'Type required' }, { status: 400 });
        }

        const postColumn = type === 'professional' ? 'professional_post_id' : 'employer_post_id';

        const { data } = await supabaseAdmin
            .from('saved_posts')
            .select('id')
            .eq('user_id', user.id)
            .eq(postColumn, postId)
            .single();

        return NextResponse.json({ saved: !!data });

    } catch (error) {
        return NextResponse.json({ saved: false });
    }
}
