/**
 * API Route: Saved Jobs
 * Allows professionals to save/unsave jobs for later review
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

async function getUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('profcaria_session')?.value;
    if (!token) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return { uid: payload.uid as string, schema: payload.schema as string };
    } catch {
        return null;
    }
}

/**
 * GET /api/professional/saved-jobs
 * Returns all saved jobs for the current user
 */
export async function GET() {
    try {
        const auth = await getUserId();
        if (!auth || auth.schema !== 'professional') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: savedJobs, error } = await supabaseAdmin
            .schema('professional')
            .from('saved_jobs')
            .select(`
                id,
                job_id,
                created_at,
                job:employer.jobs(
                    id,
                    enc_title,
                    enc_description,
                    enc_location,
                    role_category,
                    employment_type,
                    location_type,
                    is_active,
                    created_at,
                    company:employer.companies(
                        enc_company_name,
                        enc_logo_url
                    )
                )
            `)
            .eq('user_id', auth.uid)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching saved jobs:', error);
            return NextResponse.json({ error: 'Failed to fetch saved jobs' }, { status: 500 });
        }

        return NextResponse.json({ savedJobs: savedJobs || [] });

    } catch (error) {
        console.error('Saved jobs error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/professional/saved-jobs
 * Save a job - Body: { jobId: string }
 */
export async function POST(req: Request) {
    try {
        const auth = await getUserId();
        if (!auth || auth.schema !== 'professional') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { jobId } = body;

        if (!jobId) {
            return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
        }

        // Check if already saved
        const { data: existing } = await supabaseAdmin
            .schema('professional')
            .from('saved_jobs')
            .select('id')
            .eq('user_id', auth.uid)
            .eq('job_id', jobId)
            .single();

        if (existing) {
            return NextResponse.json({ message: 'Job already saved', id: existing.id });
        }

        // Save the job
        const { data, error } = await supabaseAdmin
            .schema('professional')
            .from('saved_jobs')
            .insert({ user_id: auth.uid, job_id: jobId })
            .select()
            .single();

        if (error) {
            console.error('Error saving job:', error);
            return NextResponse.json({ error: 'Failed to save job' }, { status: 500 });
        }

        return NextResponse.json({ success: true, id: data.id });

    } catch (error) {
        console.error('Save job error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/professional/saved-jobs
 * Unsave a job - Body: { jobId: string }
 */
export async function DELETE(req: Request) {
    try {
        const auth = await getUserId();
        if (!auth || auth.schema !== 'professional') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { jobId } = body;

        if (!jobId) {
            return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .schema('professional')
            .from('saved_jobs')
            .delete()
            .eq('user_id', auth.uid)
            .eq('job_id', jobId);

        if (error) {
            console.error('Error unsaving job:', error);
            return NextResponse.json({ error: 'Failed to unsave job' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Unsave job error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
