//app/api/security/phone/setup/route.ts

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        let payload;
        try {
            const { payload: verified } = await jwtVerify(token, secretKey);
            payload = verified as { uid: string; schema: string };
        } catch (e) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const { uid, schema } = payload;

        // 1. Fetch User Email (Need to decode because it's encrypted? 
        // PRO TIP: We store encrypted but we might not have the plain email in the session.
        // Let's fetch the encrypted email and decrypt it.
        const table = schema === 'professional' ? 'users' : 'companies';
        const col = schema === 'professional' ? 'enc_email' : 'enc_work_email';

        const { data: user, error } = await supabaseAdmin
            .schema(schema)
            .from(table)
            .select(col)
            .eq('id', uid)
            .single();

        if (error || !user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { decryptData } = await import('@/lib/security');
        const { sendEmailOTP } = await import('@/lib/email');

        const encryptedEmail = user[col as keyof typeof user];
        const email = decryptData(encryptedEmail);

        if (!email) {
            return NextResponse.json({ error: 'Email decryption failed' }, { status: 500 });
        }

        // 2. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // 3. Send Email OTP
        await sendEmailOTP(email, otp);

        // 4. Return response with Cookie
        const response = NextResponse.json({
            message: 'OTP sent to email'
        });

        // Set HttpOnly cookie valid for 5 mins
        response.cookies.set('auth_otp_temp', otp, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 10, // 10 minutes
            path: '/',
        });

        return response;

    } catch (e: any) {
        console.error('OTP Setup Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
