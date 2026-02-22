import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { getFollowerCount } from '@/lib/followers';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const followerCount = await getFollowerCount(user.id, 'professional');

        // Get current badge from DB
        const { data: profile } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('badge_type')
            .eq('id', user.id)
            .single();

        return NextResponse.json({
            followerCount: followerCount || 0,
            badgeType: profile?.badge_type || 'none'
        });

    } catch (error: any) {
        console.error('Badge progress API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
