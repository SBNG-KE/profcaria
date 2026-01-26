import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) return NextResponse.json({ error: 'postId needed' });

    const user = await getAuthenticatedUser();
    // We allow running even if not logged in for the dump, or just require generic auth
    const userId = user?.id || 'anon';

    // 1. Professional Schema (post_id)
    const { data: profByUser } = await supabaseAdmin.schema('professional').from('post_reposts').select('*').eq('post_id', postId).eq('user_id', userId);

    // 2. Employer Schema Dump (original_post_id) - DUMP ALL
    const { data: allEmpReposts, error: empError } = await supabaseAdmin
        .schema('employer')
        .from('post_reposts')
        .select('*')
        .eq('original_post_id', postId);

    return NextResponse.json({
        user: { id: userId, schema: user?.schema },
        targetPostId: postId,
        results: {
            professional_schema_check: profByUser,
            employer_schema_dump: allEmpReposts,
            employer_error: empError
        }
    });
}
