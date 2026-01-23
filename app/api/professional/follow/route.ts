import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';

// POST - Toggle follow a user or company
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, type = 'user' } = body; // type: 'user' | 'company'
        const targetId = userId; // Alias for clarity

        if (!targetId) {
            return NextResponse.json({ error: 'Target ID required' }, { status: 400 });
        }

        if (type === 'user' && targetId === user.id) {
            return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
        }

        const table = type === 'company' ? 'company_follows' : 'user_follows';
        const targetColumn = type === 'company' ? 'company_id' : 'following_id';

        // Check if already following
        const { data: existingFollow } = await supabaseAdmin
            .schema('professional')
            .from(table)
            .select('id')
            .eq('user_id', user.id) // Paradox: user_follows schema uses follower_id. company_follows uses user_id.
            // I need to check the schema of user_follows again.
            // Migration says: follower_id UUID NOT NULL REFERENCES professional.users(id)
            // post_likes says: user_id UUID NOT NULL
            // company_follows says: user_id UUID NOT NULL
            // So: user_follows -> follower_id. company_follows -> user_id.
            .eq(type === 'company' ? 'user_id' : 'follower_id', user.id)
            .eq(targetColumn, targetId)
            .single();

        if (existingFollow) {
            // Unfollow
            const { error } = await supabaseAdmin
                .schema('professional')
                .from(table)
                .delete()
                .eq('id', existingFollow.id);

            if (error) throw error;
            return NextResponse.json({ following: false, message: 'Unfollowed' });
        } else {
            // Follow
            const insertData: any = {};
            if (type === 'company') {
                insertData.user_id = user.id;
                insertData.company_id = targetId;
            } else {
                insertData.follower_id = user.id;
                insertData.following_id = targetId;
            }

            const { error } = await supabaseAdmin
                .schema('professional')
                .from(table)
                .insert(insertData);

            if (error) throw error;
            return NextResponse.json({ following: true, message: 'Now following' });
        }
    } catch (error: any) {
        console.error('Error toggling follow:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET - Get following/followers lists
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'following';
        const targetUserId = searchParams.get('userId') || user.id;

        if (type === 'followers') {
            const { data: followers, error } = await supabaseAdmin
                .schema('professional')
                .from('user_follows')
                .select('follower_id')
                .eq('following_id', targetUserId);

            if (error) throw error;

            const formattedFollowers = await Promise.all((followers || []).map(async (f: any) => {
                const { data: u } = await supabaseAdmin
                    .schema('professional')
                    .from('users')
                    .select('id, first_name, last_name, profile_image, primary_role')
                    .eq('id', f.follower_id)
                    .single();

                return {
                    id: u?.id,
                    name: `${u?.first_name || ''} ${u?.last_name || ''}`.trim(),
                    profileImage: u?.profile_image,
                    role: u?.primary_role
                };
            }));

            return NextResponse.json({ followers: formattedFollowers });
        } else {
            const { data: following, error } = await supabaseAdmin
                .schema('professional')
                .from('user_follows')
                .select('following_id')
                .eq('follower_id', targetUserId);

            if (error) throw error;

            const formattedFollowing = await Promise.all((following || []).map(async (f: any) => {
                const { data: u } = await supabaseAdmin
                    .schema('professional')
                    .from('users')
                    .select('id, first_name, last_name, profile_image, primary_role')
                    .eq('id', f.following_id)
                    .single();

                return {
                    id: u?.id,
                    name: `${u?.first_name || ''} ${u?.last_name || ''}`.trim(),
                    profileImage: u?.profile_image,
                    role: u?.primary_role
                };
            }));

            return NextResponse.json({ following: formattedFollowing });
        }
    } catch (error: any) {
        console.error('Error fetching follow data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
