import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    // Paystack doesn't have a self-serve portal link API like Stripe.
    // Management is usually done via email links sent by Paystack "Manage Subscription".
    // Or we can implement Cancel button via API.

    // For now, redirect back with message
    return NextResponse.json({
        url: `${process.env.NEXT_PUBLIC_APP_URL}/employer/settings/billing?message=manage_via_email`
    });
}
