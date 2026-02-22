import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { getFollowerCount } from '@/lib/followers';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user || user.schema !== 'employer') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Employer follower count is from company_follows
        const followerCount = await getFollowerCount(user.id, 'employer');

        // Get current badge from DB
        const { data: company } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('badge_type')
            .eq('id', user.id)
            .single();

        return NextResponse.json({
            followerCount: followerCount || 0,
            badgeType: company?.badge_type || 'none'
        });

    } catch (error: any) {
        console.error('Employer badge progress API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
