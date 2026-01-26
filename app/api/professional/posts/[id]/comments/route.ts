import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';

// GET - Fetch comments for a post
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params;
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Determine schema based on post origin
        let schema = 'professional';
        let table = 'post_comments';

        const { data: profPost } = await supabaseAdmin.schema('professional').from('posts').select('id').eq('id', postId).single();

        if (!profPost) {
            const { data: empPost } = await supabaseAdmin.schema('employer').from('posts').select('id').eq('id', postId).single();
            if (empPost) {
                schema = 'employer';
                table = 'post_comments';
            } else {
                return NextResponse.json({ error: 'Post not found' }, { status: 404 });
            }
        }

        const { data: comments, error } = await supabaseAdmin
            .schema(schema)
            .from(table)
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Get author info for each comment (check both schemas)
        const formattedComments = await Promise.all((comments || []).map(async (c: any) => {
            // Try professional.users first
            let { data: author } = await supabaseAdmin
                .schema('professional')
                .from('users')
                .select('id, enc_first_name, enc_last_name, enc_profile_image_url')
                .eq('id', c.user_id)
                .single();

            if (author) {
                const firstName = decryptData(author.enc_first_name);
                const lastName = decryptData(author.enc_last_name);
                const profileImage = decryptData(author.enc_profile_image_url);

                author = {
                    id: author.id,
                    first_name: firstName,
                    last_name: lastName,
                    profile_image: profileImage || '/default-avatar.png'
                };
            }

            // If not found, try employer schema
            if (!author) {
                const { data: employerAuthor } = await supabaseAdmin
                    .schema('employer')
                    .from('companies')
                    .select('id, enc_company_name, enc_logo_url')
                    .eq('id', c.user_id)
                    .single();

                if (employerAuthor) {
                    const companyName = decryptData(employerAuthor.enc_company_name);
                    const logoUrl = employerAuthor.enc_logo_url ? decryptData(employerAuthor.enc_logo_url) : null;

                    author = {
                        id: employerAuthor.id,
                        first_name: companyName || 'Company',
                        last_name: '',
                        profile_image: logoUrl || '/default-logo.png'
                    };
                }
            }

            return {
                id: c.id,
                content: c.content,
                createdAt: c.created_at,
                author: {
                    id: author?.id || c.user_id,
                    name: `${author?.first_name || ''} ${author?.last_name || ''}`.trim() || 'Anonymous',
                    profileImage: author?.profile_image || '/default-avatar.png'
                }
            };
        }));

        return NextResponse.json({ comments: formattedComments });
    } catch (error: any) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Add a comment to a post
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

        const body = await request.json();
        const { content } = body;

        if (!content?.trim()) {
            return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
        }

        // Determine schema based on post origin
        let schema = 'professional';
        let table = 'post_comments';

        const { data: profPost } = await supabaseAdmin.schema('professional').from('posts').select('id').eq('id', postId).single();

        if (!profPost) {
            const { data: empPost } = await supabaseAdmin.schema('employer').from('posts').select('id').eq('id', postId).single();
            if (empPost) {
                schema = 'employer';
                table = 'post_comments';
            } else {
                return NextResponse.json({ error: 'Post not found' }, { status: 404 });
            }
        }

        const userField = user.schema === 'employer' ? 'company_id' : 'user_id';

        const { data: comment, error } = await supabaseAdmin
            .schema(schema)
            .from(table)
            .insert({
                post_id: postId,
                [userField]: user.id,
                content: content.trim()
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ comment, message: 'Comment added' });
    } catch (error: any) {
        console.error('Error adding comment:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Remove a comment
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const commentId = searchParams.get('commentId');

        if (!commentId) {
            return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
        }

        const userField = user.schema === 'employer' ? 'company_id' : 'user_id';

        // Try deleting from professional schema (Post owned by Professional)
        let { count: profCount, error: profError } = await supabaseAdmin
            .schema('professional')
            .from('post_comments')
            .delete({ count: 'exact' })
            .eq('id', commentId)
            .eq(userField, user.id);

        // Try deleting from employer schema (Post owned by Employer)
        let { count: empCount, error: empError } = await supabaseAdmin
            .schema('employer')
            .from('post_comments')
            .delete({ count: 'exact' })
            .eq('id', commentId)
            .eq(userField, user.id);

        if (((profCount || 0) === 0) && ((empCount || 0) === 0)) {
            // If neither found/deleted, and we had an error, throw it.
            if (profError) throw profError;
            if (empError) throw empError;
            return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 });
        }

        if (error) throw error;

        return NextResponse.json({ message: 'Comment deleted' });
    } catch (error: any) {
        console.error('Error deleting comment:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
