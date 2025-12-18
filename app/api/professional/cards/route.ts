import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { encryptData, decryptData } from '@/lib/security';

export const runtime = 'nodejs';

// --- GET: Fetch Custom Cards ---
export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.uid as string;

        const { data, error } = await supabaseAdmin
            .schema('professional')
            .from('custom_cards')
            .select('enc_title')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Fetch Cards Error:', error);
            return NextResponse.json({ error: 'DB Error' }, { status: 500 });
        }

        // Default cards
        const baseCards = ['RESUME', 'CV', 'CERTIFICATES'];

        // Decrypt DB cards
        const dbCards = data.map(c => decryptData(c.enc_title)).filter(Boolean) as string[];

        // De-duplicate if necessary
        const allCards = Array.from(new Set([...baseCards, ...dbCards]));

        return NextResponse.json({ cards: allCards });

    } catch (err) {
        console.error('Cards Load Error:', err);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

// --- POST: Create Custom Card ---
export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.uid as string;

        const { title } = await req.json();
        if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

        // Use encryption for titles as requested
        const encryptedTitle = encryptData(title.toUpperCase());

        const { error } = await supabaseAdmin
            .schema('professional')
            .from('custom_cards')
            .insert({
                user_id: userId,
                enc_title: encryptedTitle
            });

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error('Card Save Error:', err);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
