
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData, encryptData } from '@/lib/security';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch Professional Profile
        const { data: profUser, error } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('id, enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url, enc_location, enc_city, badge_type, is_available_for_hire')
            .eq('id', user.id)
            .maybeSingle();

        // --- SELF-HEALING: Create Profile if Missing ---
        if (!profUser) {
            console.warn(`Profile missing for user ${user.id}. Creating default profile.`);

            // Should get name from Auth Metadata ideally, but auth-helper might not have it.
            // Using placeholder or email parts if available.
            const name = user.email ? user.email.split('@')[0] : 'User';

            const newProfile = {
                id: user.id,
                email: user.email,
                enc_first_name: encryptData(name),
                enc_last_name: encryptData(''),
                enc_current_role: encryptData('Member'),
                onboarding_completed: false
            };

            const { error: insertError } = await supabaseAdmin
                .schema('professional')
                .from('users')
                .insert(newProfile);

            if (insertError) {
                console.error('Failed to auto-create profile:', insertError);
                return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
            }

            // Return the Default Profile
            return NextResponse.json({
                profile: {
                    id: user.id,
                    firstName: name,
                    lastName: '',
                    name: name,
                    role: 'Member',
                    profileImage: '/default-avatar.png',
                    location: ''
                }
            });
        }

        const firstName = decryptData(profUser.enc_first_name) || '';
        const lastName = decryptData(profUser.enc_last_name) || '';
        const role = decryptData(profUser.enc_current_role) || '';
        const profileImage = decryptData(profUser.enc_profile_image_url) || '/default-avatar.png';

        // Fetch latest location from Activity Logs (Dynamic Location)
        const { data: latestLog } = await supabaseAdmin
            .schema('professional')
            .from('activity_logs')
            .select('enc_location_details')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        let activityLocation = '';
        if (latestLog && latestLog.enc_location_details) {
            const dec = decryptData(latestLog.enc_location_details);
            if (dec) {
                try {
                    // Try parsing JSON if stored as such
                    const jsonObj = JSON.parse(dec);
                    const parts = [];
                    if (jsonObj.city) parts.push(jsonObj.city);
                    if (jsonObj.country) parts.push(jsonObj.country);
                    activityLocation = parts.join(', ');
                } catch (e) {
                    // Plain string
                    activityLocation = dec;
                }
            }
        }

        // Use Profile Location if set, otherwise use latest Activity Log location
        const location = decryptData(profUser.enc_location) || decryptData(profUser.enc_city) || activityLocation || '';

        const profile = {
            id: profUser.id,
            firstName,
            lastName,
            name: `${firstName} ${lastName}`.trim(),
            role,
            profileImage,
            location,
            badgeType: profUser.badge_type || 'none',
            isAvailableForHire: profUser.is_available_for_hire !== false // Default true
        };

        const res = NextResponse.json({ profile });
        res.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=300');
        return res;

    } catch (error: any) {
        console.error('Profile API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
