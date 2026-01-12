import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { generateSmartLinkToken } from '@/lib/sharing';

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload: user } = await jwtVerify(token, secret);

        const { docType, source, id } = await req.json();

        // Create a signed token with source details
        const payload: any = {
            uid: user.uid,
            exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hour expiry
        };

        if (source === 'connection') {
            payload.sourceType = 'connection';
            payload.sourceId = id;
            payload.docType = 'Reason for Leaving'; // Display title
        } else {
            payload.sourceType = 'document'; // default
            payload.docType = docType;
        }

        const shareToken = generateSmartLinkToken(payload);

        const origin = new URL(req.url).origin;
        const link = `${origin}/share/doc/${shareToken}`;

        return NextResponse.json({ link });
    } catch (error) {
        console.error('Share Link Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
