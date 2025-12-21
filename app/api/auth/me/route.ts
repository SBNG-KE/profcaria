//app/api/auth/me/route.ts

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function GET(req: Request) {
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

        const { uid, schema } = payload;

        // Fetch Security Flags and Profile Data
        const isProfessional = schema === 'professional';
        const userTable = isProfessional ? 'users' : 'companies';
        const emailField = isProfessional ? 'email_index' : 'work_email_index';

        let selectFields = `has_passkey, has_totp, has_phone_otp, requires_2fa, created_at, ${emailField}`;

        if (isProfessional) {
            selectFields += `, enc_first_name, enc_last_name, enc_current_role, enc_profile_image_url`;
        } else {
            selectFields += `, enc_company_name, enc_logo_url`; // Add employer fields
        }

        const { data: user, error } = await supabaseAdmin
            .schema(schema as string)
            .from(userTable)
            .select(selectFields)
            .eq('id', uid)
            .single() as any;

        if (error || !user) {
            console.error('Fetch User Error:', error);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let profile: any = {};
        if (isProfessional) {
            profile = {
                firstName: decryptData(user.enc_first_name),
                lastName: decryptData(user.enc_last_name),
                role: decryptData(user.enc_current_role),
                profileImageUrl: decryptData(user.enc_profile_image_url)
            };
        } else {
            profile = {
                companyName: decryptData(user.enc_company_name),
                logoUrl: decryptData(user.enc_logo_url)
            };
        }

        return NextResponse.json({
            id: uid,
            schema: schema,
            profile,
            security: {
                hasPasskey: user.has_passkey,
                hasTotp: user.has_totp,
                hasPhone: user.has_phone_otp,
                is2faEnabled: user.requires_2fa
            }
        });

    } catch (error) {
        console.error('Auth Me Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
