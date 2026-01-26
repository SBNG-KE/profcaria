import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// POST - Repost with optional comment
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
        const { comment } = body;

        // Determine schema and FK column based on post origin
        let schema = 'professional';
        let table = 'post_reposts';
        let fkColumn = 'post_id'; // Default for professional

        const { data: profPost } = await supabaseAdmin.schema('professional').from('posts').select('id, user_id').eq('id', postId).single();

        let originalAuthorId = '';

        if (!profPost) {
            const { data: empPost } = await supabaseAdmin.schema('employer').from('posts').select('id, company_id').eq('id', postId).single();
            if (empPost) {
                schema = 'employer';
                table = 'post_reposts';
                fkColumn = 'original_post_id'; // Employer schema uses original_post_id
                originalAuthorId = empPost.company_id;
            } else {
                return NextResponse.json({ error: 'Post not found' }, { status: 404 });
            }
        } else {
            originalAuthorId = profPost.user_id;
        }

        if (originalAuthorId === user.id) {
            return NextResponse.json({ error: 'You cannot repost your own post' }, { status: 400 });
        }

        // Determine user identity field
        const userField = user.schema === 'employer' ? 'company_id' : 'user_id';

        // Check if already reposted
        const { data: existingRepost } = await supabaseAdmin
            .schema(schema)
            .from(table)
            .select('id')
            .eq(fkColumn, postId)
            .eq(userField, user.id)
            .single();

        if (existingRepost) {
            return NextResponse.json({ error: 'You have already reposted this.' }, { status: 409 });
        }

        // Create repost
        const insertData: any = {
            [fkColumn]: postId,
            [userField]: user.id
        };
        if (schema === 'professional') {
            insertData.comment = comment?.trim() || null;
        }

        const { data: repost, error } = await supabaseAdmin
            .schema(schema)
            .from(table)
            .insert(insertData)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ reposted: true, repost, message: 'Post reposted' });

    } catch (error: any) {
        console.error('Error reposting:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE - Remove Repost
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: postId } = await params;
        const user = await getAuthenticatedUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Determine schema
        let schema = 'professional';
        let table = 'post_reposts';
        let fkColumn = 'post_id';

        const { data: profPost } = await supabaseAdmin.schema('professional').from('posts').select('id').eq('id', postId).single();
        if (!profPost) {
            const { data: empPost } = await supabaseAdmin.schema('employer').from('posts').select('id').eq('id', postId).single();
            if (empPost) {
                schema = 'employer';
                fkColumn = 'original_post_id';
            } else {
                return NextResponse.json({ error: 'Post not found' }, { status: 404 });
            }
        }

        const { error } = await supabaseAdmin
            .schema(schema)
            .from(table)
            .delete()
            .eq(fkColumn, postId)
            .eq(user.schema === 'employer' ? 'company_id' : 'user_id', user.id);

        if (error) throw error;
        return NextResponse.json({ message: 'Repost removed' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
