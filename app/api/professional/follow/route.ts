import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
        const type = searchParams.get('type') || 'following_users';
        const targetUserId = searchParams.get('userId') || user.id;

        if (type === 'followers') {
            const isTargetCompany = user.schema === 'employer' && targetUserId === user.id;

            if (isTargetCompany) {
                // Fetch company subscribers
                const { data: followers, error } = await supabaseAdmin
                    .schema('professional')
                    .from('company_follows')
                    .select('user_id')
                    .eq('company_id', targetUserId);

                if (error) throw error;

                const formattedFollowers = await Promise.all((followers || []).map(async (f: any) => {
                    const { data: u } = await supabaseAdmin
                        .schema('professional')
                        .from('users')
                        .select('id, enc_first_name, enc_last_name, enc_profile_image_url, primary_role')
                        .eq('id', f.user_id)
                        .single();

                    const fName = u?.enc_first_name ? decryptData(u.enc_first_name) : '';
                    const lName = u?.enc_last_name ? decryptData(u.enc_last_name) : '';

                    return {
                        id: u?.id,
                        name: `${fName} ${lName}`.trim(),
                        profileImage: u?.enc_profile_image_url ? decryptData(u.enc_profile_image_url) : null,
                        role: u?.primary_role,
                        type: 'user',
                        isFollowing: false // Valid assumption: Companies don't "follow" users back in the same way, or we'd need a separate check.
                    };
                }));
                return NextResponse.json({ followers: formattedFollowers });

            } else {
                // Fetch user followers
                const { data: followers, error } = await supabaseAdmin
                    .schema('professional')
                    .from('user_follows')
                    .select('follower_id')
                    .eq('following_id', targetUserId);

                if (error) throw error;

                const formattedFollowers = await Promise.all((followers || []).map(async (f: any) => {
                    const { data: u } = await supabaseAdmin
                        .schema('professional') /* Fetching follower (user) info */
                        .from('users')
                        .select('id, enc_first_name, enc_last_name, enc_profile_image_url, primary_role')
                        .eq('id', f.follower_id)
                        .single();

                    const fName = u?.enc_first_name ? decryptData(u.enc_first_name) : '';
                    const lName = u?.enc_last_name ? decryptData(u.enc_last_name) : '';

                    // Check if I follow them back
                    const { data: amIFollowing } = await supabaseAdmin
                        .schema('professional')
                        .from('user_follows')
                        .select('id')
                        .eq('follower_id', user.id)
                        .eq('following_id', f.follower_id)
                        .single();

                    return {
                        id: u?.id,
                        name: `${fName} ${lName}`.trim(),
                        profileImage: u?.enc_profile_image_url ? decryptData(u.enc_profile_image_url) : null,
                        role: u?.primary_role,
                        type: 'user',
                        isFollowing: !!amIFollowing
                    };
                }));

                return NextResponse.json({ followers: formattedFollowers });
            }

        } else if (type === 'following_companies') {
            // Get companies I follow
            const { data: following, error } = await supabaseAdmin
                .schema('professional')
                .from('company_follows')
                .select('company_id')
                .eq('user_id', targetUserId); // company_follows uses user_id

            if (error) throw error;

            const formattedCompanies = await Promise.all((following || []).map(async (f: any) => {
                const { data: c } = await supabaseAdmin
                    .schema('employer')
                    .from('companies')
                    .select('id, enc_company_name, enc_logo_url, industry')
                    .eq('id', f.company_id)
                    .single();

                console.log(`Following Company: ID=${c?.id}, EncName=${c?.enc_company_name ? 'Present' : 'Missing'}, Industry=${c?.industry}`);
                const decryptedName = c?.enc_company_name ? decryptData(c.enc_company_name) : null;
                console.log(`Decrypted Name: ${decryptedName}`);

                return {
                    id: c?.id,
                    name: decryptedName || 'Unknown Company',
                    profileImage: c?.enc_logo_url ? decryptData(c.enc_logo_url) : null,
                    role: c?.industry || 'Company',
                    type: 'company'
                };
            }));

            // Filter out invalid/unknown companies to clean up the view
            const validCompanies = formattedCompanies.filter((c: any) => c.name && c.name !== 'Unknown Company');

            return NextResponse.json({ following: validCompanies });

        } else if (type === 'check') {
            // Check if following specific user/company
            let isFollowing = false;

            if (searchParams.get('entityType') === 'company') {
                const targetId = searchParams.get('targetId');
                if (targetId) {
                    const { data } = await supabaseAdmin
                        .schema('professional')
                        .from('company_follows')
                        .select('id')
                        .eq('user_id', user.id)
                        .eq('company_id', targetId)
                        .single();
                    isFollowing = !!data;
                }
            } else {
                // User
                const targetId = searchParams.get('targetId');
                if (targetId) {
                    const { data } = await supabaseAdmin
                        .schema('professional')
                        .from('user_follows')
                        .select('id')
                        .eq('follower_id', user.id)
                        .eq('following_id', targetId)
                        .single();
                    isFollowing = !!data;
                }
            }
            return NextResponse.json({ isFollowing });

        } else {
            // Default: 'following_users'
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
                    .select('id, enc_first_name, enc_last_name, enc_profile_image_url, primary_role')
                    .eq('id', f.following_id)
                    .single();

                const fName = u?.enc_first_name ? decryptData(u.enc_first_name) : '';
                const lName = u?.enc_last_name ? decryptData(u.enc_last_name) : '';

                return {
                    id: u?.id,
                    name: `${fName} ${lName}`.trim(),
                    profileImage: u?.enc_profile_image_url ? decryptData(u.enc_profile_image_url) : null,
                    role: u?.primary_role,
                    type: 'user'
                };
            }));

            return NextResponse.json({ following: formattedFollowing });
        }

    } catch (error: any) {
        console.error('Error fetching follow data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
