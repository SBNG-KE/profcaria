
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        // Fetch saved posts IDs
        const { data: savedItems, error } = await supabaseAdmin
            .from('saved_posts')
            .select('professional_post_id, employer_post_id, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        if (!savedItems || savedItems.length === 0) return NextResponse.json({ posts: [] });

        const profIds = savedItems.map((s: any) => s.professional_post_id).filter(Boolean);
        const empIds = savedItems.map((s: any) => s.employer_post_id).filter(Boolean);

        // Fetch actual posts
        const profPostsPromise = profIds.length > 0 ? supabaseAdmin.schema('professional').from('posts').select('*').in('id', profIds) : Promise.resolve({ data: [] });
        const empPostsPromise = empIds.length > 0 ? supabaseAdmin.schema('employer').from('posts').select('*').in('id', empIds).then((res: any) => ({ ...res, isEmployer: true })) : Promise.resolve({ data: [] });

        const [profRes, empRes] = await Promise.all([profPostsPromise, empPostsPromise]);

        let allPosts: any[] = [];
        if (profRes.data) allPosts = [...allPosts, ...profRes.data.map((p: any) => ({ ...p, authorType: 'professional' }))];
        // @ts-ignore
        if (empRes.data) allPosts = [...allPosts, ...empRes.data.map((p: any) => ({ ...p, authorType: 'employer', user_id: p.company_id }))];

        // Enrich with authors
        // Reuse similar logic from feed or simplified
        const processed = await Promise.all(allPosts.map(async (post) => {
            const authorId = post.authorType === 'employer' ? post.user_id : post.user_id; // For employer post, user_id is company_id mapping

            // Basic Author Info
            let author = { name: 'User', profileImage: '/default-avatar.png', type: post.authorType, id: authorId };

            // Simplification: We really should share the `processPosts` logic or import it.
            // For now, doing a lightweight fetch
            if (post.authorType === 'employer') {
                const { data: comp } = await supabaseAdmin.schema('employer').from('companies').select('enc_company_name, enc_logo_url').eq('id', authorId).single();
                if (comp) {
                    if (comp) {
                        author.name = decryptData(comp.enc_company_name) || 'Company';
                        author.profileImage = decryptData(comp.enc_logo_url) || '/default-logo.png';
                    }
                }
            } else {
                const { data: u } = await supabaseAdmin.schema('professional').from('users').select('enc_first_name, enc_last_name, enc_profile_image_url').eq('id', authorId).single();
                if (u) {
                    const fname = decryptData(u.enc_first_name) || '';
                    const lname = decryptData(u.enc_last_name) || '';
                    author.name = `${fname} ${lname}`.trim() || 'User';
                    author.profileImage = decryptData(u.enc_profile_image_url) || '/default-avatar.png';
                }
            }

            return {
                ...post,
                author,
                media: post.media_urls?.map((url: string) => ({ type: url.match(/\.(mp4|mov)$/i) ? 'video' : 'image', url })),
                isSaved: true
            };
        }));

        // Sort by saved date to maintain order
        // We need to map back to the 'savedItems' order
        const ordered = savedItems.map((item: any) => {
            const targetId = item.professional_post_id || item.employer_post_id;
            const post = processed.find(p => p.id === targetId);
            return post ? { ...post, savedAt: item.created_at } : null;
        }).filter(Boolean);

        return NextResponse.json({ posts: ordered });

    } catch (error: any) {
        console.error('Error fetching saved posts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
