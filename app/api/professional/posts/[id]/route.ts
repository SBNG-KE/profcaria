import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export const runtime = 'nodejs';
import { decryptData } from '@/lib/security';

function formatTimestamp(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// GET - Fetch single post
export async function GET(
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

        // Try Professional table first
        let { data: profPost } = await supabaseAdmin
            .schema('professional')
            .from('posts')
            .select('*')
            .eq('id', postId)
            .single();

        // Try Employer table
        let empPost = null;
        if (!profPost) {
            let res = await supabaseAdmin
                .schema('employer')
                .from('posts')
                .select('*')
                .eq('id', postId)
                .single();
            empPost = res.data;
        }

        if (!profPost && !empPost) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        const basePost = profPost ? { ...profPost, authorType: 'professional' } : { ...empPost, authorType: 'employer', user_id: empPost.company_id };

        // Hydrate stats (copied from main route)
        const post = basePost;
        const postSchema = post.authorType === 'employer' ? 'employer' : 'professional';

        // Like count
        const { count: likesCount } = await supabaseAdmin
            .schema(postSchema)
            .from('post_likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

        // User Like Status
        let likeQuery = supabaseAdmin
            .schema(postSchema)
            .from('post_likes')
            .select('id')
            .eq('post_id', post.id);

        if (user.schema === 'employer') {
            likeQuery = likeQuery.eq('company_id', user.id);
        } else {
            likeQuery = likeQuery.eq('user_id', user.id);
        }
        const { data: userLike } = await likeQuery.single();

        // Comments count
        const { count: commentsCount } = await supabaseAdmin
            .schema(postSchema)
            .from('post_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

        // Reposts count
        const { count: repostsCount } = await supabaseAdmin
            .schema(postSchema)
            .from('post_reposts')
            .select('*', { count: 'exact', head: true })
            .eq('original_post_id', post.id);

        let repostQuery = supabaseAdmin
            .schema(postSchema)
            .from('post_reposts')
            .select('id')
            .eq('original_post_id', post.id);

        if (user.schema === 'employer') {
            repostQuery = repostQuery.eq('company_id', user.id);
        } else {
            repostQuery = repostQuery.eq('user_id', user.id);
        }

        let userRepost = null;
        try {
            const { data } = await repostQuery.single();
            userRepost = data;
        } catch (ignore) { }

        // Get author info
        let authorData: any = {
            id: post.user_id,
            type: post.authorType || 'professional',
            name: 'User',
            profileImage: '/default-avatar.png',
            role: '',
            followerCount: 0,
            isFollowing: false
        };

        if (post.authorType === 'employer') {
            try {
                const { data: comp } = await supabaseAdmin
                    .schema('employer')
                    .from('companies')
                    .select('id, enc_company_name, enc_logo_url')
                    .eq('id', post.user_id)
                    .single();

                if (comp) {
                    const companyName = decryptData(comp.enc_company_name);
                    const logoUrl = comp.enc_logo_url ? decryptData(comp.enc_logo_url) : null;

                    authorData = {
                        ...authorData,
                        name: companyName || 'Company',
                        profileImage: logoUrl || '/default-logo.png',
                        role: 'Company',
                        type: 'employer'
                    };

                    const { count: followerCount } = await supabaseAdmin
                        .schema('professional')
                        .from('company_follows')
                        .select('*', { count: 'exact', head: true })
                        .eq('company_id', post.user_id);

                    authorData.followerCount = followerCount || 0;

                    const { data: isFollowing } = await supabaseAdmin
                        .schema('professional')
                        .from('company_follows')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('company_id', post.user_id)
                        .single();

                    authorData.isFollowing = !!isFollowing;
                } else {
                    authorData.name = 'Employer (Unknown)';
                }
            } catch (e) { console.error('Error fetching company details:', e); }
        } else {
            const { data: profUser } = await supabaseAdmin
                .schema('professional')
                .from('users')
                .select('id, enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url')
                .eq('id', post.user_id)
                .single();

            if (profUser) {
                const firstName = decryptData(profUser.enc_first_name) || '';
                const lastName = decryptData(profUser.enc_last_name) || '';
                const role = decryptData(profUser.enc_current_role) || '';
                const profileImage = decryptData(profUser.enc_profile_image_url) || '/default-avatar.png';

                const { count: followerCount } = await supabaseAdmin
                    .schema('professional')
                    .from('user_follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('following_id', post.user_id);

                const { data: following } = await supabaseAdmin
                    .schema('professional')
                    .from('user_follows')
                    .select('id')
                    .eq('follower_id', user.id)
                    .eq('following_id', post.user_id)
                    .single();

                const fullName = `${firstName} ${lastName}`.trim();

                authorData = {
                    ...authorData,
                    name: fullName || 'User',
                    profileImage: profileImage,
                    role: role,
                    followerCount: followerCount || 0,
                    isFollowing: !!following || post.user_id === user.id
                };
            }
        }

        const finalPost = {
            id: post.id,
            content: post.content,
            media: (post.media_urls || []).map((url: string) => ({
                type: url.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image',
                url
            })),
            linkPreview: post.link_preview,
            timestamp: formatTimestamp(post.created_at),
            likesCount: likesCount || 0,
            commentsCount: commentsCount || 0,
            repostsCount: repostsCount || 0,
            isLiked: !!userLike,
            isReposted: !!userRepost,
            author: authorData
        };

        return NextResponse.json({ post: finalPost });

    } catch (error: any) {
        console.error('Error fetching post:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

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
