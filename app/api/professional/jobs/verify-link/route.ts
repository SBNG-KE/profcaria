
import { NextResponse } from 'next/server';
import { verifySmartLinkToken } from '@/lib/sharing';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const { token } = await req.json();
        if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

        const payload = verifySmartLinkToken<{ jobId: string }>(token);

        if (!payload || !payload.jobId) {
            return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 });
        }

        return NextResponse.json({ jobId: payload.jobId });
    } catch (error) {
        console.error('Verify Link Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
