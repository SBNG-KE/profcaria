import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// POST - Toggle like on a comment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string, commentId: string }> }
) {
    try {
        const { id: postId, commentId } = await params;
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Determine Post Type to find correct schema
        let schema = 'professional';
        const { data: profPost } = await supabaseAdmin.schema('professional').from('posts').select('id').eq('id', postId).single();

        if (!profPost) {
            const { data: empPost } = await supabaseAdmin.schema('employer').from('posts').select('id').eq('id', postId).single();
            if (empPost) {
                schema = 'employer';
            } else {
                return NextResponse.json({ error: 'Post not found' }, { status: 404 });
            }
        }

        // Check if already liked
        let query = supabaseAdmin
            .schema(schema)
            .from('post_comment_likes')
            .select('id')
            .eq('comment_id', commentId);

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
                .from('post_comment_likes')
                .delete()
                .eq('id', existingLike.id);

            if (error) throw error;
            return NextResponse.json({ liked: false, message: 'Comment unliked' });
        } else {
            // Like
            const likeData: any = { comment_id: commentId };

            if (user.schema === 'employer') {
                likeData.company_id = user.id;
            } else {
                likeData.user_id = user.id;
            }

            const { error } = await supabaseAdmin
                .schema(schema)
                .from('post_comment_likes')
                .insert(likeData);

            if (error) throw error;
            return NextResponse.json({ liked: true, message: 'Comment liked' });
        }
    } catch (error: any) {
        console.error('Error toggling comment like:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
