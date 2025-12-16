//app/api/security/passkey/registration/verify/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { supabaseAdmin } from '@/lib/supabase';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        const challenge = cookieStore.get('reg_challenge')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!challenge) {
            return NextResponse.json({ error: 'Challenge expired' }, { status: 400 });
        }

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        let payload;
        try {
            const verified = await jwtVerify(token, secretKey);
            payload = verified.payload as { uid: string; schema: string };
        } catch (e) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }
        const { uid, schema } = payload;
        const body = await req.json();

        const verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge: challenge,
            expectedOrigin: 'http://localhost:3000', // TODO: Use env var for origin
            expectedRPID: 'localhost',
        });

        if (verification.verified && verification.registrationInfo) {
            const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
            const credentialID = credential.id;
            const credentialPublicKey = credential.publicKey;
            const counter = credential.counter;

            // Save to DB
            const { error } = await supabaseAdmin
                .from('authenticator_credentials')
                .insert({
                    user_id: uid,
                    user_schema: schema,
                    credential_id: credentialID,
                    credential_public_key: Buffer.from(credentialPublicKey).toString('base64url'),
                    counter,
                    credential_device_type: credentialDeviceType,
                    credential_backed_up: credentialBackedUp,
                    transports: body.response.transports ? body.response.transports.join(',') : '',
                });

            if (error) {
                console.error("DB Save Error:", error);
                return NextResponse.json({ error: 'Failed to save credential', details: error }, { status: 500 });
            }

            // Also update user has_passkey capability if we want to track it on user table?
            // For now, let's just update 'has_totp' was for totp, maybe we need 'has_passkey' or just 'is_2fa_enabled' generic.
            // Let's assume we reuse 2FA enabled flags or add a new one.
            // The user wants to "add that I can use ... passkey", implying it's an alternative to TOTP.

            await supabaseAdmin
                .schema(schema)
                .from(schema === 'professional' ? 'users' : 'companies')
                .update({
                    requires_2fa: true
                }) // We don't have 'has_passkey' column yet, relying on creds table check later
                // Wait, I did NOT ask user to add 'has_passkey' column to user table, only the creds table.
                // I should probably SKIP updating the user table for 'has_passkey' unless I know it exists.
                // But I DO need to set 'requires_2fa: true' if this is their first method.
                .eq('id', uid);

            // Cleanup challenge
            const response = NextResponse.json({ success: true, verified: true });
            response.cookies.delete('reg_challenge');
            return response;
        }

        return NextResponse.json({ error: 'Verification failed', verified: false }, { status: 400 });

    } catch (error) {
        console.error("Passkey Verify Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
