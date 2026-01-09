
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { Paystack } from '@/lib/paystack';

export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        if (payload.schema !== 'employer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { active } = await req.json(); // true = auto-renew, false = manual (cancel at period end)
        const companyId = payload.uid as string;

        // 1. Get Subscription
        const { data: sub } = await supabaseAdmin
            .schema('employer')
            .from('subscriptions')
            .select('*')
            .eq('company_id', companyId)
            .eq('status', 'active')
            .single();

        if (!sub) {
            return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
        }

        // 2. Handle Paystack Logic
        // If switching to MANUAL (active=false), we basically "disable" the subscription in Paystack
        // so it doesn't charge again, but we keep the local status as 'active' until 'current_period_end'.
        // OR Paystack "disable" cancels immediately?
        // Paystack `subscription/disable` stops future charges. The current period remains valid functionality-wise usually.
        // If switching to AUTO (active=true), we can't easily "enable" a disabled sub in Paystack usually.
        // Users typically have to re-subscribe if they fully cancelled.
        // HOWEVER, if 'active' means "Don't Cancel Yet", and we only call disable when they say "Stop".

        // Strategy:
        // If user wants MANUAL (active = false): Call Paystack disable. Mark DB as cancel_at_period_end = true.
        // If user wants AUTO (active = true): Correct way is complex if already disabled.
        // Paystack typically requires a NEW authorization to re-enable.
        // So simply toggling "On" might not work if the token is invalidated.
        // We will assume "Manual" -> "Disable Auto Charge". "Enable" -> "Please Pay again/Update Card to reactivate".

        // For this iteration, let's implement DISABLE (Switch to Manual).
        // If they want to re-enable, they usually just start a new plan flow?
        // Or if we just store the intent locally and don't disable at Paystack until the very last minute? No, risky.

        if (active === false) {
            // Disable at Paystack
            if (sub.paystack_subscription_code && sub.paystack_email_token) {
                const res = await Paystack.disableSubscription(sub.paystack_subscription_code, sub.paystack_email_token);
                if (!res.status) {
                    return NextResponse.json({ error: 'Failed to update Paystack: ' + res.message }, { status: 400 });
                }
            }

            // Update DB
            await supabaseAdmin
                .schema('employer')
                .from('subscriptions')
                .update({ cancel_at_period_end: true })
                .eq('id', sub.id);
        } else {
            // Enable Auto-Renew
            // If it was previously set to cancel, can we re-enable?
            // If Paystack subscription was disabled, we CANNOT re-enable via API usually.
            // Check Paystack docs mental model: "Enable Subscription" endpoint exists: https://api.paystack.co/subscription/enable
            // Let's add that to our lib!

            if (sub.paystack_subscription_code && sub.paystack_email_token) {
                const res = await Paystack.enableSubscription(sub.paystack_subscription_code, sub.paystack_email_token);
                if (!res.status) {
                    return NextResponse.json({ error: 'Failed to re-enable Paystack: ' + res.message }, { status: 400 });
                }
            }

            await supabaseAdmin
                .schema('employer')
                .from('subscriptions')
                .update({ cancel_at_period_end: false })
                .eq('id', sub.id);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('AutoRenew Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
