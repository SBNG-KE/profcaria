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

        // Get everyone who follows me
        const { data: myFollowers, error: followersError } = await supabaseAdmin
            .schema('professional')
            .from('user_follows')
            .select('follower_id')
            .eq('following_id', user.id);

        if (followersError) throw followersError;

        if (!myFollowers || myFollowers.length === 0) {
            return NextResponse.json({ count: 0 });
        }

        const followerIds = myFollowers.map((f: any) => f.follower_id);

        // Get everyone I follow
        const { data: myFollowing, error: followingError } = await supabaseAdmin
            .schema('professional')
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', user.id);

        if (followingError) throw followingError;

        const followingIds = new Set((myFollowing || []).map((f: any) => f.following_id));

        // Count followers I haven't followed back
        const followBackCount = followerIds.filter((id: string) => !followingIds.has(id)).length;

        return NextResponse.json({ count: followBackCount });
    } catch (error: any) {
        console.error('Error fetching follow-back count:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
