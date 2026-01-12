/**
 * API Route: Saved Jobs
 * Allows professionals to save/unsave jobs for later review
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { decryptData } from '@/lib/security';

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

        // Step 1: Get saved job records
        const { data: savedRecords, error: savedError } = await supabaseAdmin
            .schema('professional')
            .from('saved_jobs')
            .select('id, job_id, created_at')
            .eq('user_id', auth.uid)
            .order('created_at', { ascending: false });

        if (savedError) {
            console.error('Error fetching saved jobs:', savedError);
            return NextResponse.json({ error: 'Failed to fetch saved jobs' }, { status: 500 });
        }

        if (!savedRecords || savedRecords.length === 0) {
            return NextResponse.json({ savedJobs: [] });
        }

        // Step 2: Get job details from employer schema
        const jobIds = savedRecords.map((r: { job_id: string }) => r.job_id);
        const { data: jobs, error: jobsError } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('id, enc_title, enc_description, enc_location, role_category, employment_type, location_type, is_active, created_at, company_id')
            .in('id', jobIds);

        if (jobsError) {
            console.error('Error fetching job details:', jobsError);
            return NextResponse.json({ error: 'Failed to fetch job details' }, { status: 500 });
        }

        // Step 3: Get company details
        const companyIds = [...new Set((jobs || []).map((j: { company_id: string }) => j.company_id).filter(Boolean))];
        let companies: any[] = [];

        if (companyIds.length > 0) {
            const { data: companyData } = await supabaseAdmin
                .schema('employer')
                .from('companies')
                .select('id, enc_company_name, enc_logo_url')
                .in('id', companyIds);
            companies = companyData || [];
        }

        // Step 4: Combine and decrypt
        const savedJobs = savedRecords.map((saved: { id: string; job_id: string; created_at: string }) => {
            const job = jobs?.find((j: { id: string; company_id: string }) => j.id === saved.job_id);
            const company = companies.find(c => c.id === job?.company_id);

            return {
                id: saved.id,
                job_id: saved.job_id,
                created_at: saved.created_at,
                job: job ? {
                    id: job.id,
                    title: job.enc_title ? decryptData(job.enc_title) : 'Unknown',
                    description: job.enc_description ? decryptData(job.enc_description) : '',
                    location: job.enc_location ? decryptData(job.enc_location) : null,
                    role_category: job.role_category,
                    employment_type: job.employment_type,
                    location_type: job.location_type,
                    is_active: job.is_active,
                    createdAt: job.created_at,
                    company: company ? {
                        name: company.enc_company_name ? decryptData(company.enc_company_name) : 'Unknown',
                        logoUrl: company.enc_logo_url ? decryptData(company.enc_logo_url) : null
                    } : { name: 'Unknown', logoUrl: null }
                } : null
            };
        });

        return NextResponse.json({ savedJobs });

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
