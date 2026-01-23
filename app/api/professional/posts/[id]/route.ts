import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// DELETE - Delete a post
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const postId = params.id;
        if (!postId) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        // We need to check if the post exists and belongs to the user
        // Try Professional table first
        let { data: profPost } = await supabaseAdmin
            .schema('professional')
            .from('posts')
            .select('user_id')
            .eq('id', postId)
            .single();

        if (profPost) {
            // It's a professional post
            if (profPost.user_id !== user.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            // Delete specific related data first (optional if cascade is set, but safer to be explicit)
            // supabase cascade usually handles it if set up, but let's delete the post directly
            const { error } = await supabaseAdmin
                .schema('professional')
                .from('posts')
                .delete()
                .eq('id', postId);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        // Try Employer table
        let { data: empPost } = await supabaseAdmin
            .schema('employer')
            .from('posts')
            .select('company_id')
            .eq('id', postId)
            .single();

        if (empPost) {
            // It's an employer post
            // For employers, user.id is the company_id (from our session logic)
            if (empPost.company_id !== user.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            const { error } = await supabaseAdmin
                .schema('employer')
                .from('posts')
                .delete()
                .eq('id', postId);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    } catch (error: any) {
        console.error('Error deleting post:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT - Update a post
export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const postId = params.id;
        if (!postId) {
            return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
        }

        const body = await request.json();
        const { content, mediaUrls, linkMedia } = body;

        // Validation
        if (!content?.trim()) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 });
        }

        let linkPreview = null;
        if (linkMedia) {
            try {
                const protocol = request.headers.get('x-forwarded-proto') || 'http';
                const host = request.headers.get('host') || 'localhost:3000';
                const baseUrl = `${protocol}://${host}`;

                const previewRes = await fetch(`${baseUrl}/api/link-preview?url=${encodeURIComponent(linkMedia)}`);
                if (previewRes.ok) {
                    linkPreview = await previewRes.json();
                } else {
                    throw new Error('Preview fetch failed');
                }
            } catch (e) {
                // Fallback
                const safeUrl = linkMedia.match(/^https?:\/\//i) ? linkMedia : `https://${linkMedia}`;
                try {
                    const urlObj = new URL(safeUrl);
                    linkPreview = {
                        url: safeUrl,
                        title: urlObj.hostname,
                        siteName: urlObj.hostname,
                        description: '',
                        image: ''
                    };
                } catch (err) { linkPreview = null; }
            }
        }

        // Check ownership and update
        // Professional
        let { data: profPost } = await supabaseAdmin
            .schema('professional')
            .from('posts')
            .select('user_id')
            .eq('id', postId)
            .single();

        if (profPost) {
            if (profPost.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

            const { data: updated, error } = await supabaseAdmin
                .schema('professional')
                .from('posts')
                .update({
                    content: content.trim(),
                    media_urls: mediaUrls || [],
                    link_preview: linkPreview,
                    updated_at: new Date().toISOString()
                })
                .eq('id', postId)
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ post: updated, success: true });
        }

        // Employer
        let { data: empPost } = await supabaseAdmin
            .schema('employer')
            .from('posts')
            .select('company_id')
            .eq('id', postId)
            .single();

        if (empPost) {
            if (empPost.company_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

            const { data: updated, error } = await supabaseAdmin
                .schema('employer')
                .from('posts')
                .update({
                    content: content.trim(),
                    media_urls: mediaUrls || [],
                    link_preview: linkPreview,
                    updated_at: new Date().toISOString()
                })
                .eq('id', postId)
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ post: updated, success: true });
        }

        return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    } catch (error: any) {
        console.error('Error updating post:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
