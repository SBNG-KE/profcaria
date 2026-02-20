import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/auth-helper";

export const runtime = 'nodejs';

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const params = await props.params;
        const postId = params.id;

        if (!postId) {
            return NextResponse.json({ error: "Missing post ID parameter" }, { status: 400 });
        }

        // Verify ownership (or allow if needed, but let's verify ownership for privacy)
        let isOwner = false;
        if (user.schema === 'professional') {
            const { data: profPost } = await supabaseAdmin
                .schema('professional')
                .from('posts')
                .select('id')
                .eq('id', postId)
                .eq('author_id', user.id)
                .single();
            isOwner = !!profPost;
        } else {
            const { data: compPost } = await supabaseAdmin
                .schema('employer')
                .from('posts')
                .select('id')
                .eq('id', postId)
                .eq('company_id', user.id)
                .single();
            isOwner = !!compPost;
        }

        if (!isOwner) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const schema = user.schema;

        // Fetch Interaction Counts
        const [likesRes, commentsRes, repostsProfRes, repostsEmpRes] = await Promise.all([
            supabaseAdmin.schema(schema).from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', postId),
            supabaseAdmin.schema(schema).from('post_comments').select('*', { count: 'exact', head: true }).eq('post_id', postId),
            supabaseAdmin.schema('professional').from('post_reposts').select('*', { count: 'exact', head: true }).eq('original_post_id', postId),
            supabaseAdmin.schema('employer').from('post_reposts').select('*', { count: 'exact', head: true }).eq('original_post_id', postId)
        ]);

        const likes = likesRes.count || 0;
        const comments = commentsRes.count || 0;
        const reposts = (repostsProfRes.count || 0) + (repostsEmpRes.count || 0);

        // Fetch Post Views (Placeholder if we don't have a post_views table, but we can return 0 or random for now until a post_views table is made)
        // Since the requirement didn't specify creating a post_views table (only profile views), we will return 0 for dwell/views
        const dwell = 0;
        const views = 0;

        return NextResponse.json({
            likes,
            comments,
            reposts,
            views,
            dwell
        });

    } catch (error) {
        console.error("Error fetching post analytics:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
