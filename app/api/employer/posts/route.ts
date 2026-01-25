import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';

// GET - Fetch employer posts
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyIdParam = searchParams.get('companyId');

        // Determine target company ID
        let targetCompanyId = companyIdParam;

        // If no param, try current user
        if (!targetCompanyId) {
            const user = await getAuthenticatedUser();
            if (user && user.schema === 'employer') {
                targetCompanyId = user.id;
            } else {
                return NextResponse.json({ error: 'Company ID required' }, { status: 400 });
            }
        }

        // Fetch posts for this company
        const { data: posts, error } = await supabaseAdmin
            .schema('employer')
            .from('posts')
            .select('*')
            .eq('company_id', targetCompanyId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Get stats and Author info (similar to professional feed)
        // Since we are fetching for ONE company, we can fetch author info ONCE.

        let authorData: any = null;

        // Fetch Company Details
        const { data: comp } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('id, enc_company_name, enc_logo_url')
            .eq('id', targetCompanyId)
            .single();

        if (comp) {
            const companyName = decryptData(comp.enc_company_name);
            const logoUrl = comp.enc_logo_url ? decryptData(comp.enc_logo_url) : null;
            // Get follower count for company
            const { count: followerCount } = await supabaseAdmin
                .schema('professional')
                .from('company_follows')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', targetCompanyId);

            authorData = {
                id: targetCompanyId,
                type: 'employer',
                name: companyName || 'Company',
                profileImage: logoUrl || '/default-logo.png',
                role: 'Company',
                followerCount: followerCount || 0,
                // We don't check 'isFollowing' here as it depends on the viewer (currentUser), 
                // which might be null (public view) or professional. 
                // For simplicity in this profile view, we can skip or implement if needed.
                isFollowing: false
            };
        } else {
            authorData = {
                id: targetCompanyId,
                type: 'employer',
                name: 'Employer',
                profileImage: '/default-logo.png',
                role: 'Company',
                followerCount: 0,
                isFollowing: false
            };
        }

        const formattedPosts = await Promise.all((posts || []).map(async (post: any) => {
            // Like count
            const { count: likesCount } = await supabaseAdmin
                .schema('professional')
                .from('post_likes')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

            // Comments count
            const { count: commentsCount } = await supabaseAdmin
                .schema('professional')
                .from('post_comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

            // Reposts count
            const { count: repostsCount } = await supabaseAdmin
                .schema('professional')
                .from('post_reposts')
                .select('*', { count: 'exact', head: true })
                .eq('original_post_id', post.id);

            return {
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
                isLiked: false, // Viewer logic omitted for profile view efficiency
                isReposted: false,
                author: authorData
            };
        }));

        return NextResponse.json({ posts: formattedPosts });

    } catch (error: any) {
        console.error('Error fetching employer posts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

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
