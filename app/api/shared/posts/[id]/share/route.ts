import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { createShortLink } from '@/lib/shortener';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: postId } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Authenticate user
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        await jwtVerify(token, secret);

        // Construct Long URL
        // Assumes universal feed route where ?postId opens the post or /posts/[id]
        const origin = new URL(req.url).origin;
        // Determine if it's professional or employer? Actually postId is UUID, so /feed?post=ID works if UI supports it.
        // Or if we have dedicated post pages: /professional/post/[id] or /employer/post/[id].
        // For now, let's point to a generic view or assume /professional/post/[id] as default or query logic.
        // Let's assume a universal viewer or just direct to professional feed with anchor?
        // User asked "like how share for jobs works".
        // Jobs link to: /professional/jobs/[id] usually.
        // Let's assume /post/[id] or /feed?postId=[id].
        const longLink = `${origin}/professional/feed?post=${postId}`;

        // Generate Short Link
        const link = await createShortLink(longLink);

        return NextResponse.json({ link });
    } catch (error) {
        console.error('Share Link Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
