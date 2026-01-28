import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
    // Return the fixed exchange rate from env, defaulting to 1 (USD)
    // Return the fixed exchange rate from env, defaulting to 1 (USD)
    // Ensure it's a valid number
    const rateEnv = process.env.USD_EXCHANGE_RATE;
    const rate = rateEnv && !isNaN(parseFloat(rateEnv)) ? parseFloat(rateEnv) : 1;

    return NextResponse.json({ rate });
}
