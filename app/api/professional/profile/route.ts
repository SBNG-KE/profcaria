
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';

// Force Node.js runtime
export const runtime = 'nodejs';

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
            .select('id, enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url, enc_location, enc_city')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching professional profile:', error);
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const firstName = decryptData(profUser.enc_first_name) || '';
        const lastName = decryptData(profUser.enc_last_name) || '';
        const role = decryptData(profUser.enc_current_role) || '';
        const profileImage = decryptData(profUser.enc_profile_image_url) || '/default-avatar.png';
        const location = decryptData(profUser.enc_location) || decryptData(profUser.enc_city) || '';

        const profile = {
            id: profUser.id,
            firstName,
            lastName,
            name: `${firstName} ${lastName}`.trim(),
            role,
            profileImage,
            location
        };

        return NextResponse.json({ profile });

    } catch (error: any) {
        console.error('Profile API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
