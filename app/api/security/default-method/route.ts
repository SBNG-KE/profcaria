
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';

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
            const { payload: verified } = await jwtVerify(token, secretKey);
            payload = verified;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const { uid, schema } = payload as { uid: string; schema: string };
        const body = await req.json();
        const { method } = body; // 'passkey', 'totp', 'phone', or null

        // Validate method
        const validMethods = ['passkey', 'totp', 'phone', null];
        if (!validMethods.includes(method)) {
            return NextResponse.json({ error: 'Invalid method' }, { status: 400 });
        }

        const table = schema === 'professional' ? 'users' : 'companies';

        const { error } = await supabaseAdmin
            .schema(schema)
            .from(table)
            .update({ default_2fa_method: method })
            .eq('id', uid);

        if (error) {
            console.error('Update Default Method Error:', error);
            throw error;
        }

        return NextResponse.json({ success: true });

    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}
