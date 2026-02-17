import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Count followers who I haven't followed back
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get Last Viewed Time
        const { data: prefs } = await supabaseAdmin
            .schema('professional')
            .from('preferences')
            .select('last_viewed_followers_at')
            .eq('user_id', user.id)
            .single();

        const lastViewed = prefs?.last_viewed_followers_at || '1970-01-01T00:00:00Z';

        // 2. Count new followers since last view
        const { count, error } = await supabaseAdmin
            .schema('professional')
            .from('user_follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', user.id)
            .gt('created_at', lastViewed);

        if (error) throw error;

        return NextResponse.json({ count: count || 0 });
    } catch (error: any) {
        console.error('Error fetching follow-back count:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
