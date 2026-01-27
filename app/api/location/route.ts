
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        // 1. Get User IP
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0] : null;

        let url = 'https://ipapi.co/json/';

        // If we have a real user IP (not localhost), strictly query that IP
        // filtering out localhost/private IPs happens naturally as ipapi returns error or fallback for them, 
        // but explicit check is better.
        // For simplicity in this iteration:
        // - If running locally (no forwarded headers usually), ipapi sees developer's IP. Correct.
        // - If running on Vercel, we have forwarded header. Use it.

        if (ip && ip !== '::1' && ip !== '127.0.0.1' && !ip.startsWith('192.168.')) {
            url = `https://ipapi.co/${ip}/json/`;
        }

        const res = await fetch(url);
        // If rate limited or error, fallback
        if (!res.ok) {
            return NextResponse.json({ currency: 'USD' });
        }

        const data = await res.json();
        return NextResponse.json({ currency: data.currency || 'USD' });

    } catch (error) {
        console.error('Location API Error:', error);
        return NextResponse.json({ currency: 'USD' });
    }
}
