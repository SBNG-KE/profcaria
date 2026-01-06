import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData } from '@/lib/security';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import * as argon2 from 'argon2';

// Force Node.js runtime for Argon2 support
export const runtime = 'nodejs';

export async function POST(req: Request) {
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
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // 3. Get Current Hash
        const { data: user, error: fetchError } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('password_hash')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 4. Verify Old
        const isValid = await argon2.verify(user.password_hash, currentPassword);
        if (!isValid) {
            return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
        }

        // 5. Hash New
        const newHash = await argon2.hash(newPassword, {
            type: argon2.argon2id,
            memoryCost: 65536,
            timeCost: 3,
        });

        // 6. Update
        const { error: updateError } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .update({ password_hash: newHash })
            .eq('id', userId);

        if (updateError) {
            throw updateError;
        }

        // 7. Log
        const ip = req.headers.get('x-forwarded-for') || 'Unknown IP';
        await supabaseAdmin.schema('professional').from('activity_logs').insert([{
            user_id: userId,
            enc_action: encryptData('PASSWORD_CHANGE'),
            enc_ip_address: encryptData(ip)
        }]);

        return NextResponse.json({ success: true, message: 'Password updated successfully' });

    } catch (error) {
        console.error('Password API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
