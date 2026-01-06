import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

async function getUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('profcaria_session')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        if (payload.schema !== 'professional') return null;
        return payload.uid as string;
    } catch {
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query, filters } = await req.json();

        if (!query && (!filters || Object.keys(filters).length === 0)) {
            return NextResponse.json({ success: true }); // No-op
        }

        await supabaseAdmin
            .schema('professional')
            .from('search_history')
            .insert({
                user_id: userId,
                query: query || '',
                filters: filters || {}
            });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Search Log Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
