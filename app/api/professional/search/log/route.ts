import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { logSearch } from '@/lib/search-logger';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { query, filters } = body;

        // Fire and forget logging
        logSearch(user.id, query || '', filters || {});

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Error logging' }, { status: 500 });
    }
}
