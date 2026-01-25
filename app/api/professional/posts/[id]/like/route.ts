import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// POST - Toggle like on a post
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params;
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Determine Post Type
        // We first check where the post exists.
        // Optimization: Could pass ?type=employer to skip one check, but robust check is safer.
        let schema = 'professional';
        let table = 'post_likes';

        const { data: profPost } = await supabaseAdmin.schema('professional').from('posts').select('id').eq('id', postId).single();

        if (!profPost) {
            const { data: empPost } = await supabaseAdmin.schema('employer').from('posts').select('id').eq('id', postId).single();
            if (empPost) {
                schema = 'employer';
                table = 'post_likes';
            } else {
                return NextResponse.json({ error: 'Post not found' }, { status: 404 });
            }
        }

        // Check if already liked
        let query = supabaseAdmin
            .schema(schema)
            .from(table)
            .select('id')
            .eq('post_id', postId);

        if (user.schema === 'employer') {
            query = query.eq('company_id', user.id);
        } else {
            query = query.eq('user_id', user.id);
        }

        const { data: existingLike } = await query.single();

        if (existingLike) {
            // Unlike
            const { error } = await supabaseAdmin
                .schema(schema)
                .from(table)
                .delete()
                .eq('id', existingLike.id);

            if (error) throw error;
            return NextResponse.json({ liked: false, message: 'Post unliked' });
        } else {
            // Like
            const likeData: any = { post_id: postId };
            // Check if user is an employer or professional
            if (user.schema === 'employer') {
                likeData.company_id = user.id; // user.id is company_id for employers
            } else {
                likeData.user_id = user.id;
            }

            const { error } = await supabaseAdmin
                .schema(schema)
                .from(table)
                .insert(likeData);

            if (error) throw error;
            return NextResponse.json({ liked: true, message: 'Post liked' });
        }
    } catch (error: any) {
        console.error('Error toggling like:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
