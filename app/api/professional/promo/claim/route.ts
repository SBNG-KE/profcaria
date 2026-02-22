import { NextRequest, NextResponse } from 'next/server';

// Professional early adopter promotion is no longer active.
// Badges are earned via follower count, not subscriptions.
// Post boosting is always paid. No special gifts.

export async function POST(req: NextRequest) {
    return NextResponse.json({
        eligible: false,
        reason: 'Professional promotions are no longer active. Badges are earned through followers.'
    });
}

export async function GET(req: NextRequest) {
    return NextResponse.json({
        eligible: false,
        reason: 'Professional promotions are no longer active. Badges are earned through followers.'
    });
}
