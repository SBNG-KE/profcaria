import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { encryptData } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/analytics/job-event
 * Records job engagement events for analytics tracking
 * 
 * Event types:
 * - impression: Job card was displayed in feed
 * - view: Professional clicked to view job details
 * - apply_start: Professional started application form
 * - apply_abandon: Professional left without completing application
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { jobId, eventType, country, metadata } = body;

        if (!jobId || !eventType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const validEvents = ['impression', 'view', 'apply_start', 'apply_abandon'];
        if (!validEvents.includes(eventType)) {
            return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
        }

        // Optional: Get user ID if authenticated (for more detailed analytics)
        let userId: string | null = null;
        try {
            const cookieStore = await cookies();
            const token = cookieStore.get('profcaria_session')?.value;
            if (token) {
                const secret = new TextEncoder().encode(process.env.JWT_SECRET);
                const { payload } = await jwtVerify(token, secret);
                if (payload.schema === 'professional') {
                    userId = payload.uid as string;
                }
            }
        } catch {
            // User not authenticated - still allow anonymous tracking
        }

        // Encrypt country if provided
        const encCountry = country ? encryptData(country) : null;

        // Insert the event
        const { error } = await supabaseAdmin
            .schema('employer')
            .from('job_events')
            .insert({
                job_id: jobId,
                user_id: userId,
                event_type: eventType,
                enc_country: encCountry,
                metadata: metadata || {}
            });

        if (error) {
            console.error('Error inserting job event:', error);
            return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Job event API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * POST /api/analytics/job-event/batch
 * Records multiple job events at once (for batch impression tracking)
 */
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { events } = body;

        if (!events || !Array.isArray(events) || events.length === 0) {
            return NextResponse.json({ error: 'No events provided' }, { status: 400 });
        }

        // Limit batch size
        if (events.length > 50) {
            return NextResponse.json({ error: 'Too many events (max 50)' }, { status: 400 });
        }

        // Optional: Get user ID if authenticated
        let userId: string | null = null;
        try {
            const cookieStore = await cookies();
            const token = cookieStore.get('profcaria_session')?.value;
            if (token) {
                const secret = new TextEncoder().encode(process.env.JWT_SECRET);
                const { payload } = await jwtVerify(token, secret);
                if (payload.schema === 'professional') {
                    userId = payload.uid as string;
                }
            }
        } catch { }

        const validEvents = ['impression', 'view', 'apply_start', 'apply_abandon'];
        const rows = events
            .filter((e: any) => e.jobId && validEvents.includes(e.eventType))
            .map((e: any) => ({
                job_id: e.jobId,
                user_id: userId,
                event_type: e.eventType,
                enc_country: e.country ? encryptData(e.country) : null,
                metadata: e.metadata || {}
            }));

        if (rows.length === 0) {
            return NextResponse.json({ error: 'No valid events' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .schema('employer')
            .from('job_events')
            .insert(rows);

        if (error) {
            console.error('Error inserting batch job events:', error);
            return NextResponse.json({ error: 'Failed to record events' }, { status: 500 });
        }

        return NextResponse.json({ success: true, count: rows.length });

    } catch (error) {
        console.error('Job event batch API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
