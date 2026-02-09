import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/employer/applications/[id]/references
 * 
 * Fetches verified employment history from OTHER companies (previous employers)
 * that are registered in Profcaria for the professional in this application.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.schema !== 'employer') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id: applicationId } = await params;

        // 1. Get the target application to find the professional's user_id
        const { data: application, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('user_id, job_id')
            .eq('id', applicationId)
            .single();

        if (appError || !application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        const professionalId = application.user_id;

        // 2. Get the current employer's company_id to exclude from results
        const { data: currentJob } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('company_id')
            .eq('id', application.job_id)
            .single();

        const currentCompanyId = currentJob?.company_id;

        // 3. Find all jobs across the entire system
        const { data: allJobs, error: allJobsError } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('id, company_id, enc_title');

        if (allJobsError) throw allJobsError;

        // 4. Get all terminated/resigned applications for this professional from OTHER companies
        const { data: pastEmployments, error: pastError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('*, jobs(id, company_id, enc_title)')
            .eq('user_id', professionalId)
            .in('status', ['terminated', 'resigned'])
            .order('terminated_at', { ascending: false });

        if (pastError) throw pastError;

        // 5. Filter out current company and get company details for each
        const verifiedEmployments = [];

        for (const emp of pastEmployments || []) {
            const job = emp.jobs;
            if (!job || job.company_id === currentCompanyId) continue;

            // Fetch company details
            const { data: company } = await supabaseAdmin
                .schema('employer')
                .from('companies')
                .select('id, enc_company_name, enc_logo_url, enc_work_email')
                .eq('id', job.company_id)
                .single();

            if (!company) continue;

            // Fetch company auth user for phone number (if available)
            const { data: { user: companyAuthUser } } = await supabaseAdmin.auth.admin.getUserById(job.company_id);

            verifiedEmployments.push({
                id: emp.id,
                companyId: job.company_id,
                companyName: decryptData(company.enc_company_name) || 'Unknown Company',
                companyLogo: company.enc_logo_url ? decryptData(company.enc_logo_url) : null,
                companyEmail: company.enc_work_email ? decryptData(company.enc_work_email) : null,
                companyPhone: companyAuthUser?.phone || null,
                jobTitle: decryptData(job.enc_title) || 'Unknown Position',
                startDate: emp.created_at,
                endDate: emp.terminated_at,
                terminationType: emp.termination_type, // 'involuntary', 'resignation', 'mutual'
                terminationReason: emp.enc_termination_reason ? decryptData(emp.enc_termination_reason) : null,
                status: emp.status
            });
        }

        return NextResponse.json({
            verifiedEmployments,
            message: 'References are from companies registered in Profcaria that verified this professional\'s employment.'
        });

    } catch (error: any) {
        console.error('References API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
