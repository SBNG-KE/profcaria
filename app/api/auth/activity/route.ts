import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('profcaria_session')?.value;
    if (!token) return null;

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    try {
        const { payload } = await jwtVerify(token, secretKey);
        return payload;
    } catch (e) {
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const table = session.schema === 'professional' ? 'users' : 'companies';

        // Update last_active_at
        const { error } = await supabaseAdmin
            .schema(session.schema)
            .from(table)
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', session.uid);

        if (error) {
            console.error('Activity Update Error:', error);
            // Don't fail the request, largely silent failure is okay here
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
