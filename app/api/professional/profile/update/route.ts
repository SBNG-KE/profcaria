import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, hashForIndex } from '@/lib/security';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function PUT(req: Request) {
    try {
        // 1. Auth Check
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.uid as string;

        // 2. Parse Body
        const body = await req.json();
        const {
            firstName,
            lastName,
            role,
            email,
            phone,
            country,
            city,
            address
        } = body;

        // 3. Update User Table (Name, Role, Email, Phone)
        const userUpdates: any = {};
        if (firstName) userUpdates.enc_first_name = encryptData(firstName);
        if (lastName) userUpdates.enc_last_name = encryptData(lastName);
        if (role) userUpdates.enc_current_role = encryptData(role);
        if (email) {
            userUpdates.enc_email = encryptData(email);
            userUpdates.email_index = hashForIndex(email);
        }
        if (phone) {
            userUpdates.enc_phone_number = encryptData(phone);
            userUpdates.phone_index = hashForIndex(phone);
        }

        if (Object.keys(userUpdates).length > 0) {
            const { error: userError } = await supabaseAdmin
                .schema('professional')
                .from('users')
                .update(userUpdates)
                .eq('id', userId);

            if (userError) throw userError;
        }

        // 4. Handle Location Update (via Activity Log)
        // Only log if location data is provided
        if (country || city || address) {
            const locationObj = {
                country: country || '',
                city: city || '',
                address: address || '',
                timestamp: new Date().toISOString()
            };

            const ip = req.headers.get('x-forwarded-for') || 'Unknown IP';
            const userAgent = req.headers.get('user-agent') || 'Unknown UA';

            const { error: logError } = await supabaseAdmin
                .schema('professional')
                .from('activity_logs')
                .insert([{
                    user_id: userId,
                    enc_action: encryptData('LOCATION_UPDATE'),
                    enc_ip_address: encryptData(ip),
                    user_agent: userAgent,
                    enc_location_details: encryptData(JSON.stringify(locationObj))
                }]);

            if (logError) throw logError;
        }

        // 5. Log General Profile Update (if name/role changed but no location)
        if (Object.keys(userUpdates).length > 0 && !(country || city || address)) {
            const ip = req.headers.get('x-forwarded-for') || 'Unknown IP';
            const userAgent = req.headers.get('user-agent') || 'Unknown UA';
            await supabaseAdmin
                .schema('professional')
                .from('activity_logs')
                .insert([{
                    user_id: userId,
                    enc_action: encryptData('PROFILE_UPDATE'),
                    enc_ip_address: encryptData(ip),
                    user_agent: userAgent,
                    enc_location_details: null
                }]);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Profile Update API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
