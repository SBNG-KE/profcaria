import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

// --- GET: Get document mode preference ---
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.uid as string;

        const { data, error } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .select('default_doc_mode')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Get Doc Mode Error:', error);
            return NextResponse.json({ error: 'DB Error' }, { status: 500 });
        }

        return NextResponse.json({
            mode: data?.default_doc_mode || 'writing'
        });

    } catch (err) {
        console.error('Doc Mode Load Error:', err);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

// --- PUT: Update document mode preference ---
export async function PUT(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.uid as string;

        const { mode } = await req.json();

        if (!['writing', 'upload'].includes(mode)) {
            return NextResponse.json({ error: 'Invalid mode. Use "writing" or "upload"' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .schema('professional')
            .from('users')
            .update({ default_doc_mode: mode })
            .eq('id', userId);

        if (error) {
            console.error('Update Doc Mode Error:', error);
            return NextResponse.json({ error: 'DB Error' }, { status: 500 });
        }

        return NextResponse.json({ success: true, mode });

    } catch (err) {
        console.error('Doc Mode Update Error:', err);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
