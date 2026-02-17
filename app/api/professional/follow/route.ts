import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';
import { sendNewFollowerNotification } from '@/lib/email';

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

            // Send Email Notification (Async - non-blocking)
            (async () => {
                try {
                    // 1. Get Target Email from custom schema (not Supabase Auth)
                    let targetEmail = null;
                    if (type === 'user') {
                        const { data: targetUser } = await supabaseAdmin
                            .schema('professional')
                            .from('users')
                            .select('enc_email')
                            .eq('id', targetId)
                            .single();
                        if (targetUser?.enc_email) targetEmail = decryptData(targetUser.enc_email);
                    } else {
                        // Following a Company - Get Company Email
                        const { data: company } = await supabaseAdmin
                            .schema('employer')
                            .from('companies')
                            .select('enc_work_email')
                            .eq('id', targetId)
                            .single();
                        if (company?.enc_work_email) targetEmail = decryptData(company.enc_work_email);
                    }

                    if (targetEmail) {
                        // 2. Get Follower Name/Details (Current User)
                        let followerName = 'Someone';
                        if (user.schema === 'professional') {
                            const { data: prof } = await supabaseAdmin.schema('professional').from('users').select('enc_first_name, enc_last_name').eq('id', user.id).single();
                            if (prof) {
                                followerName = `${decryptData(prof.enc_first_name)} ${decryptData(prof.enc_last_name)}`.trim();
                            }
                        } else {
                            const { data: comp } = await supabaseAdmin.schema('employer').from('companies').select('enc_company_name').eq('id', user.id).single();
                            if (comp) followerName = decryptData(comp.enc_company_name) || 'A Company';
                        }

                        // 3. Send Email
                        const followerLink = user.schema === 'employer'
                            ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://profcaria.com'}/professional/companies/${user.id}`
                            : `${process.env.NEXT_PUBLIC_APP_URL || 'https://profcaria.com'}/professional/people/${user.id}`;

                        await sendNewFollowerNotification(targetEmail, followerName, type === 'company' ? 'user' : 'user', followerLink);
                    }
                } catch (err) {
                    console.error('Failed to send follow notification:', err);
                }
            })();

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

                const formattedFollowers = (await Promise.all((followers || []).map(async (f: any) => {
                    const { data: u } = await supabaseAdmin
                        .schema('professional')
                        .from('users')
                        .select('id, enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url, primary_role, badge_type')
                        .eq('id', f.user_id)
                        .single();

                    if (!u) return null;

                    const fName = u.enc_first_name ? decryptData(u.enc_first_name) : '';
                    const lName = u.enc_last_name ? decryptData(u.enc_last_name) : '';
                    const role = u.primary_role || (u.enc_current_role ? decryptData(u.enc_current_role) : null);

                    return {
                        id: u.id,
                        name: `${fName} ${lName}`.trim() || 'Professional',
                        profileImage: u.enc_profile_image_url ? decryptData(u.enc_profile_image_url) : null,
                        role: role || 'Professional',
                        type: 'user',
                        isFollowing: false,
                        badgeType: u.badge_type || 'none'
                    };
                }))).filter(Boolean); // Remove null entries
                return NextResponse.json({ followers: formattedFollowers });

            } else {
                // Fetch user followers
                const { data: followers, error } = await supabaseAdmin
                    .schema('professional')
                    .from('user_follows')
                    .select('follower_id')
                    .eq('following_id', targetUserId);

                if (error) throw error;

                const formattedFollowers = (await Promise.all((followers || []).map(async (f: any) => {
                    const { data: u } = await supabaseAdmin
                        .schema('professional') /* Fetching follower (user) info */
                        .from('users')
                        .select('id, enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url, primary_role, badge_type')
                        .eq('id', f.follower_id)
                        .single();

                    if (!u) return null; // Skip if user not found

                    const fName = u.enc_first_name ? decryptData(u.enc_first_name) : '';
                    const lName = u.enc_last_name ? decryptData(u.enc_last_name) : '';
                    const role = u.primary_role || (u.enc_current_role ? decryptData(u.enc_current_role) : null);

                    // Check if I follow them back
                    const { data: amIFollowing } = await supabaseAdmin
                        .schema('professional')
                        .from('user_follows')
                        .select('id')
                        .eq('follower_id', user.id)
                        .eq('following_id', f.follower_id)
                        .single();

                    return {
                        id: u.id,
                        name: `${fName} ${lName}`.trim() || 'Professional',
                        profileImage: u.enc_profile_image_url ? decryptData(u.enc_profile_image_url) : null,
                        role: role || 'Professional',
                        type: 'user',
                        isFollowing: !!amIFollowing,
                        badgeType: u.badge_type || 'none'
                    };
                }))).filter(Boolean); // Remove null entries

                return NextResponse.json({ followers: formattedFollowers });
            }

        } else if (type === 'following_companies') {
            // Get companies I follow
            const { data: following, error } = await supabaseAdmin
                .schema('professional')
                .from('company_follows')
                .select('company_id')
                .eq('user_id', targetUserId);

            if (error) throw error;
            if (!following || following.length === 0) {
                return NextResponse.json({ following: [] });
            }

            const companyIds = following.map((f: any) => f.company_id);

            // Fetch all companies in one go
            const { data: companies, error: companiesError } = await supabaseAdmin
                .schema('employer')
                .from('companies')
                .select('id, enc_company_name, enc_logo_url, badge_type')
                .in('id', companyIds);

            if (companiesError) throw companiesError;

            const formattedCompanies = (companies || []).map((c: any) => {
                const decryptedName = c.enc_company_name ? decryptData(c.enc_company_name) : null;
                const decryptedLogo = c.enc_logo_url ? decryptData(c.enc_logo_url) : null;

                return {
                    id: c.id,
                    name: decryptedName || 'Unnamed Company',
                    profileImage: decryptedLogo,
                    role: 'Company',
                    type: 'company',
                    badgeType: c.badge_type || 'none'
                };
            });

            return NextResponse.json({ following: formattedCompanies });

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
                    .select('id, enc_first_name, enc_last_name, enc_profile_image_url, primary_role, badge_type')
                    .eq('id', f.following_id)
                    .single();

                const fName = u?.enc_first_name ? decryptData(u.enc_first_name) : '';
                const lName = u?.enc_last_name ? decryptData(u.enc_last_name) : '';

                return {
                    id: u?.id,
                    name: `${fName} ${lName}`.trim(),
                    profileImage: u?.enc_profile_image_url ? decryptData(u.enc_profile_image_url) : null,
                    role: u?.primary_role,
                    type: 'user',
                    badgeType: u?.badge_type || 'none'
                };
            }));

            return NextResponse.json({ following: formattedFollowing });
        }

    } catch (error: any) {
        console.error('Error fetching follow data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
