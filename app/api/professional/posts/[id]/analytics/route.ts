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

        // Verify ownership
        let isOwner = false;
        let postRecord = null;
        if (user.schema === 'professional') {
            const { data: profPost } = await supabaseAdmin
                .schema('professional')
                .from('posts')
                .select('id, views, dwell')
                .eq('id', postId)
                .eq('user_id', user.id)
                .single();
            isOwner = !!profPost;
            postRecord = profPost;
        } else {
            const { data: compPost } = await supabaseAdmin
                .schema('employer')
                .from('posts')
                .select('id, views, dwell')
                .eq('id', postId)
                .eq('company_id', user.id)
                .single();
            isOwner = !!compPost;
            postRecord = compPost;
        }

        if (!isOwner) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const schema = user.schema;

        // Fetch Interaction Counts
        const repostFk = schema === 'professional' ? 'post_id' : 'original_post_id';
        const [likesRes, commentsRes, repostsRes] = await Promise.all([
            supabaseAdmin.schema(schema).from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', postId),
            supabaseAdmin.schema(schema).from('post_comments').select('*', { count: 'exact', head: true }).eq('post_id', postId),
            supabaseAdmin.schema(schema).from('post_reposts').select('*', { count: 'exact', head: true }).eq(repostFk, postId)
        ]);

        const likes = likesRes.count || 0;
        const comments = commentsRes.count || 0;
        const reposts = repostsRes.count || 0;

        const dwell = postRecord?.dwell || 0;
        const views = postRecord?.views || 0;

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
