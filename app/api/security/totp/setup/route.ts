//app/api/security/totp/setup/route.ts

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);

        let payload;
        try {
            const { payload: verifiedPayload } = await jwtVerify(token, secretKey);
            payload = verifiedPayload;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const { uid, schema } = payload as { uid: string; schema: string };

        // 1. Generate TOTP Secret
        const secret = authenticator.generateSecret();

        // 2. Generate OTPAuth URL
        // user: Get email? or just use a generic label
        const userLabel = `Profcaria:${uid.toString().substring(0, 8)}...`; // Ideally we fetch email
        const otpauth = authenticator.keyuri(userLabel, 'Profcaria', secret);

        // 3. Generate QR Code
        const qrCode = await QRCode.toDataURL(otpauth);

        // 4. Encrypt Secret
        const encryptedSecret = encryptData(secret);

        // 5. Store in DB (has_totp stays false until verified)
        const { error } = await supabaseAdmin
            .schema(schema as string)
            .from(schema === 'professional' ? 'users' : 'companies')
            .update({
                two_factor_secret: encryptedSecret,
                has_totp: false
            })
            .eq('id', uid);

        if (error) {
            console.error("DB Error", error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            secret, // Send raw secret for manual entry
            qrCode
        });

    } catch (error) {
        console.error('TOTP Setup Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
