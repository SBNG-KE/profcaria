import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    const postId = '4763452d-4381-4a43-8b93-1bbaae23ab4f'; // The failing Professional Post
    const employerId = '40e5c47c-4437-4a55-8c3d-4a4cec5a288b'; // The Employer

    // Schema: Professional (since it's a professional post)
    const schema = 'professional';
    const table = 'post_reposts';
    const fkColumn = 'post_id';

    // 1. Verify existence before
    const { data: before } = await supabaseAdmin
        .schema(schema)
        .from(table)
        .select('*')
        .eq(fkColumn, postId)
        .eq('company_id', employerId);

    // 2. Attempt DELETE
    const { error, count, data: deletedData } = await supabaseAdmin
        .schema(schema)
        .from(table)
        .delete()
        .eq(fkColumn, postId)
        .eq('company_id', employerId)
        .select();

    // 3. Verify existence after
    const { data: after } = await supabaseAdmin
        .schema(schema)
        .from(table)
        .select('*')
        .eq(fkColumn, postId)
        .eq('company_id', employerId);

    return NextResponse.json({
        check: { schema, table, fkColumn, postId, employerId },
        before,
        deleteResult: { error, count, deletedData },
        after
    });
}
