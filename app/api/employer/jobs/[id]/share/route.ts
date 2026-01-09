
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getJobShareLink } from '@/lib/sharing';
import { createShortLink } from '@/lib/shortener';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(token, secret);

        // Verify Job Ownership
        // (Optional for just getting a public link, but good for security context)

        const origin = new URL(req.url).origin;
        const longLink = getJobShareLink(id, origin);

        // Generate Short Link
        const link = await createShortLink(longLink);

        return NextResponse.json({ link });
    } catch (error) {
        console.error('Share Link Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
