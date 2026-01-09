
import { NextResponse } from 'next/server';
import { getOriginalUrl } from '@/lib/shortener';

export const runtime = 'nodejs';

export async function GET(req: Request, props: { params: Promise<{ code: string }> }) {
    const params = await props.params;
    const { code } = params;

    if (!code) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    const originalUrl = await getOriginalUrl(code);

    if (originalUrl) {
        return NextResponse.redirect(originalUrl);
    }

    // 404 or redirect home if not found
    return NextResponse.redirect(new URL('/', req.url));
}
