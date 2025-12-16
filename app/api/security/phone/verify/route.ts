//app/api/security/phone/verify/route.ts

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        const { code, expectedCode } = await req.json(); // expectedCode coming from client is INSECURE.
        // But I don't have a DB column. 
        // Strategy switch: The SETUP endpoint should set a cookie "phone_verification_otp".

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Validate Session
        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        let payload;
        try {
            const { payload: verified } = await jwtVerify(token, secretKey);
            payload = verified;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        // Retrieve OTP from cookie (set by setup route? No, setup route can't set cookie easily in nextjs app router unless middleware or response manipulation).
        // Actually, I didn't set the cookie in the previous file. Let's fix that.
        // Wait, for this specific turn, I'll rely on the client sending back the "debugCode" it received? 
        // No, that's too hacky.
        // Let's UPDATE the setup route to set a cookie AND this route to read it.

        // RE-READING: I just wrote the setup route. I should rewrite it to set a cookie.
        // But for this 'verify' file:

        const storedOtpCookie = cookieStore.get('phone_otp_temp');
        if (!storedOtpCookie) {
            return NextResponse.json({ error: 'OTP expired or not found' }, { status: 400 });
        }

        if (storedOtpCookie.value !== code) {
            return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
        }

        const { uid, schema } = payload;
        const table = schema === 'professional' ? 'users' : 'companies';

        // Update DB
        const { error } = await supabaseAdmin
            .schema(schema as string)
            .from(table)
            .update({ has_phone_otp: true })
            .eq('id', uid);

        if (error) throw error;

        // Clear cookie
        // (We can't easily clear it here without returning it in header, handled by NextResponse)
        const response = NextResponse.json({ verified: true });
        response.cookies.delete('phone_otp_temp');

        return response;

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
