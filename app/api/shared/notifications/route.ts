import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        let payload;
        try {
            const { payload: verifiedPayload } = await jwtVerify(token, secretKey);
            payload = verifiedPayload;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }

        const { uid, schema } = payload;
        const schemaName = schema === 'professional' ? 'professional' : 'employer';
        const userField = schema === 'professional' ? 'user_id' : 'company_id';

        const { data: notifications, error } = await supabaseAdmin
            .schema(schemaName)
            .from('notifications')
            .select('*')
            .eq(userField, uid)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Fetch Notifications Error:', error);
            return NextResponse.json({ error: 'Failed' }, { status: 500 });
        }

        const decryptedNotifications = (notifications || []).map(notif => ({
            ...notif,
            message: decryptData(notif.enc_message)
        }));

        return NextResponse.json({ notifications: decryptedNotifications });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
