import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json(
        { success: true },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
    response.cookies.set('profcaria_session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0),
        maxAge: 0,
        path: '/',
    });
    return response;
}
