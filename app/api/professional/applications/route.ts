import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import { decryptData } from '@/lib/security';

export const runtime = 'nodejs';

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('profcaria_session')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secretKey);
        const { uid, schema } = payload;

        if (schema !== 'professional') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data: applications, error: appError } = await supabaseAdmin
            .schema('employer')
            .from('applications')
            .select('id, status, created_at, job_id')
            .eq('user_id', uid)
            .order('created_at', { ascending: false });

        if (appError) {
            console.error('Fetch Applications Error:', appError);
            return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
        }

        if (!applications || applications.length === 0) {
            return NextResponse.json({ applications: [] });
        }

        // Fetch Job Details
        const jobIds = [...new Set(applications.map((app: { job_id: any; }) => app.job_id))];
        const { data: jobs, error: jobError } = await supabaseAdmin
            .schema('employer')
            .from('jobs')
            .select('id, enc_title, company_id')
            .in('id', jobIds);

        if (jobError) {
            console.error('Fetch Jobs Error:', jobError);
            return NextResponse.json({ error: 'Failed to fetch job details' }, { status: 500 });
        }

        // Fetch Employer Details
        const companyIds = [...new Set(jobs?.map((job: { company_id: any; }) => job.company_id))];
        const { data: employers, error: empError } = await supabaseAdmin
            .schema('employer')
            .from('companies')
            .select('id, enc_company_name, enc_logo_url')
            .in('id', companyIds);

        if (empError) {
            console.error('Fetch Employers Error:', empError);
            return NextResponse.json({ error: 'Failed to fetch employer details' }, { status: 500 });
        }

        const formattedApps = applications.map((app: any) => {
            const job = jobs?.find((j: { id: any; }) => j.id === app.job_id);
            const employer = employers?.find((e: { id: any; }) => e.id === job?.company_id);

            return {
                id: app.id,
                status: app.status,
                createdAt: app.created_at,
                jobTitle: decryptData(job?.enc_title) || 'Unknown Position',
                companyName: decryptData(employer?.enc_company_name) || 'Secure Employer',
                companyLogoUrl: employer?.enc_logo_url ? decryptData(employer.enc_logo_url) : null,
                companyId: employer?.id || job?.company_id
            };
        });

        return NextResponse.json({ applications: formattedApps });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
