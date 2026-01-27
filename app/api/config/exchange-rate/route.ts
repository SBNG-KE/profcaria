import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
    // Return the fixed exchange rate from env, defaulting to 1 (USD)
    const rate = parseFloat(process.env.USD_EXCHANGE_RATE || '1');
    return NextResponse.json({ rate });
}
