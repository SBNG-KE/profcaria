
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // --- STALE SESSION CHECK ---
        // Verify if user still exists in Auth (handles "Ghost Session" issue)
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(user.id);
        if (authError || !authUser.user) {
            console.error('User not found in Auth, forcing logout:', user.id);
            const response = NextResponse.json({ error: 'Session invalid. Please login again.' }, { status: 401 });
            response.cookies.delete('profcaria_session');
            return response;
        }
        // ---------------------------

        const { id: postId } = await params;
        const body = await request.json();
        const { type } = body; // 'professional' or 'employer'

        if (!type || !['professional', 'employer'].includes(type) || !postId) {
            return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
        }

        const postColumn = type === 'professional' ? 'professional_post_id' : 'employer_post_id';
        const targetSchema = type === 'professional' ? 'professional' : 'employer';

        // 1. Verify Post Exists (Prevent FK Violation 500s)
        const { data: targetPost } = await supabaseAdmin
            .schema(targetSchema)
            .from('posts')
            .select('id')
            .eq('id', postId)
            .single();

        if (!targetPost) {
            return NextResponse.json({ error: 'Post not found or unavailable' }, { status: 404 });
        }

        // Check if already saved (Handle duplicates safely)
        const { data: existing } = await supabaseAdmin
            .schema('public')
            .from('saved_posts')
            .select('id')
            .eq('user_id', user.id)
            .eq(postColumn, postId)
            .maybeSingle();

        if (existing) {
            // Unsave
            await supabaseAdmin
                .schema('public')
                .from('saved_posts')
                .delete()
                .eq('id', existing.id);

            return NextResponse.json({ saved: false });
        } else {
            // Save
            const { error } = await supabaseAdmin
                .schema('public')
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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    // Check if a specific post is saved by current user
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ saved: false });
        }

        const { id: postId } = await params;
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        if (!type || !['professional', 'employer'].includes(type)) {
            return NextResponse.json({ error: 'Type required' }, { status: 400 });
        }

        const postColumn = type === 'professional' ? 'professional_post_id' : 'employer_post_id';

        const { data } = await supabaseAdmin
            .from('saved_posts') // Implicitly public
            .select('id')
            .eq('user_id', user.id)
            .eq(postColumn, postId)
            .maybeSingle();

        return NextResponse.json({ saved: !!data });

    } catch (error) {
        return NextResponse.json({ saved: false });
    }
}
