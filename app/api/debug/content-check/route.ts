
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return NextResponse.json({ status: 'AUTH_FAILED' }, { status: 401 });

        // 1. Total Counts
        const { count: profPosts } = await supabaseAdmin.schema('professional').from('posts').select('*', { count: 'exact', head: true });
        const { count: empPosts } = await supabaseAdmin.schema('employer').from('posts').select('*', { count: 'exact', head: true });

        // 2. "Other" Counts (Not me)
        let otherProfQuery = supabaseAdmin.schema('professional').from('posts').select('*', { count: 'exact', head: true });
        if (user.schema === 'professional') otherProfQuery = otherProfQuery.neq('user_id', user.id);
        const { count: otherProf } = await otherProfQuery;

        let otherEmpQuery = supabaseAdmin.schema('employer').from('posts').select('*', { count: 'exact', head: true });
        if (user.schema === 'employer') otherEmpQuery = otherEmpQuery.neq('company_id', user.id);
        const { count: otherEmp } = await otherEmpQuery;

        return NextResponse.json({
            me: { id: user.id, schema: user.schema },
            stats: {
                total_professional_posts: profPosts,
                total_employer_posts: empPosts,
                other_people_professional_posts: otherProf,
                other_people_employer_posts: otherEmp
            }
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
